# Research: Student Profile Onboarding & Completion Gate (PROFILE-002)

**Date**: 2026-07-24  
**Branch**: `012-student-profile-onboarding`

## R1 — Where to store demographics

**Decision**: Add columns on existing `profiles` (students only use the new fields). Reuse existing `email` and `address` columns; add `birth_date`, `education_stage`, `province`, `city`, `referral_source`, `primary_subject`, `onboarding_completed`, `profile_completed`.

**Rationale**: Spec assumes one student identity record; `email`/`address` already exist for teacher profiles and are unused productively for students today.

**Alternatives considered**:
- Separate `student_profiles` table — rejected (join overhead; PROFILE-001 already keyed on `profiles`).
- JSONB blob — rejected (harder validation, weaker indexing, poorer teacher filters later).

---

## R2 — Completed quiz count for the gate

**Decision**: Account-wide count of distinct `exam_submissions.quiz_id` for `student_id = session.profileId`. Threshold **≥ 2**. Does **not** filter by active teacher.

**Rationale**: Spec clarification / assumptions: account-wide unique quizzes; unique `(student_id, quiz_id)` already enforces one row per quiz today.

**Alternatives considered**:
- Per active teacher — rejected (spec assumption).
- Counting all historical retake rows — rejected (unique quizzes only).

---

## R3 — What the gate blocks

**Decision**: On `/quiz/[id]`, if gate conditions met **and** the student has **no** submission for that quiz → redirect to `/profile/complete?from=/quiz/[id]`. If a submission exists → allow existing review path (QUIZ-001 post-submit results). Retake (if/when product allows a second attempt) is treated as a new attempt and blocked while incomplete.

**Rationale**: Clarification session Q1 + Q2.

**Alternatives considered**:
- Block all quiz URLs — rejected (blocks answer review).
- Modal over quiz — rejected (clarification: full page).

---

## R4 — Onboarding enforcement point

**Decision**: After login/register success redirects, and in student shell entry (dashboard / quizzes / results layouts or a shared `requireStudentShell` helper), if `onboarding_completed = false` → `redirect('/onboarding')`. Allow `/onboarding`, `/settings`, `/profile/complete`, `/login`, logout without loop. Middleware stays session-auth only (no DB in middleware).

**Rationale**: Clarification Q4 — all incomplete accounts including teacher-created. Layout/RSC redirect avoids middleware DB latency and matches Next App Router patterns already used for auth.

**Alternatives considered**:
- Middleware + Supabase lookup — rejected (extra latency on every request; harder to test).
- Soft dismissible banner — rejected (clarification: mandatory).

---

## R5 — `profile_completed` lifecycle

**Decision**: Set `true` only when all required fields pass validation on gate (or settings) save. On settings save, recompute: if required set invalid/empty → set `false` (prefer reject empty required fields with Arabic errors; if client somehow clears them, flag must become false).

**Rationale**: Clarification Q5.

**Alternatives considered**:
- Sticky forever after first complete — rejected.
- Settings cannot edit required fields — rejected (Story 3).

---

## R6 — Education stage vocabulary

**Decision**: Store enum/text: `primary` | `preparatory` | `secondary` | `baccalaureate` | `university` | `other`. Onboarding UI maps:
- تاسع (تعليم أساسي) → `preparatory` (or `primary` if product prefers — **map تاسع → `preparatory`**)
- بكالوريا (ثانوي) → `baccalaureate`
- جامعة → `university`
- غير ذلك → `other`

Gate/settings show the full set with Arabic labels.

**Rationale**: Spec FR-002 + onboarding labels; keeps DB English-stable for filters.

**Alternatives considered**: Store Arabic labels only — rejected (fragile equality checks).

---

## R7 — Teacher visibility

**Decision**: Extend `getTeacherStudentDetail` (and optionally list row) to return demographics **only** after verifying `student_teachers` link for `(teacher_id = session.profileId, student_id)`. No dedicated teacher demographics dashboard in v1 — surface a compact card on existing student detail.

**Rationale**: Clarification Q3 + FR-019/020.

**Alternatives considered**:
- Student-only visibility — rejected.
- New teacher report page — out of scope v1.

---

## R8 — Optional email vs constitution

**Decision**: Collect optional contact email on profile; do **not** enable email login or password. Validate format when non-empty.

**Rationale**: Constitution passwordless auth; email here is CRM/contact only.

**Alternatives considered**: Omit email entirely — rejected (spec FR-008 optional field).

---

## R9 — Form UX primitives

**Decision**: Reuse Shadcn/Base UI Select / custom listboxes already in the design system; Day-Month-Year selects or a composed date control for birth date (no raw `<select>` / native date if product rule forbids — follow existing “no raw native selects” pattern with project Select).

**Rationale**: Spec FR-013 + constitution RTL touch targets.

**Alternatives considered**: Native date input only — rejected for consistency with mobile RTL rules.
