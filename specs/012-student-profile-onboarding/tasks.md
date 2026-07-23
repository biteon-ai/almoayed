---
description: "Task list for Student Profile Onboarding & Completion Gate (PROFILE-002)"
---

# Tasks: Student Profile Onboarding & Completion Gate

**Input**: Design documents from `specs/012-student-profile-onboarding/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Tests**: Included per plan/quickstart Vitest suite — pure-lib tests in foundational phase; not strict TDD-first.

**Organization**: US1 (quiz profile gate) → US2 (first onboarding) → US3 (settings edit) → US4 (teacher demographics read). Shared foundation: migration + `student-profile` lib + profile actions.

**Feature IDs**: `PROFILE-002`, PROFILE-001 (settings surface), QUIZ-001 (review path preserved), MT-002 (teacher reads), ENABLE-001 (Spekit)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US4 maps to spec user stories
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Types, constants, and Spekit IDs before schema/UI work

- [x] T001 [P] Add student demographic types (`EducationStage`, `ReferralSource`, `StudentDemographics`, gate/onboarding payloads) in `src/types/database.ts` per `specs/012-student-profile-onboarding/data-model.md`
- [x] T002 [P] Add Syria provinces list + Arabic labels in `src/lib/syria-provinces.ts`
- [x] T003 [P] Register Spekit targets `studentOnboarding`, `profileCompletionModal`, `profileCompletionSubmit`, `studentDemographicsSettings` in `src/lib/spekit-targets.ts` and `.speckit/spekit-targets.yaml` under `PROFILE-002`

**Checkpoint**: Types + Spekit IDs compile; no runtime behavior yet

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Migration, pure validators/gate predicate, core Server Actions — MUST complete before ANY user story UI

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create `supabase/migrations/009_student_profile_demographics.sql` adding `birth_date`, `education_stage`, `province`, `city`, `referral_source`, `primary_subject`, `onboarding_completed`, `profile_completed` on `profiles` (reuse existing `email`/`address`; defaults `false` for flags) per `data-model.md`
- [x] T005 Implement pure helpers in `src/lib/student-profile.ts`: stage/referral maps, Zod schemas, `isRequiredProfileComplete`, `shouldBlockNewQuiz`, `sanitizeReturnPath`, age ≥6 birth-date checks — per `contracts/server-actions.md` and `research.md`
- [x] T006 [P] Add Vitest coverage for `shouldBlockNewQuiz`, required-complete recompute, return-path sanitize, and stage/referral maps in `tests/features/profile-002-student-profile.test.ts`
- [x] T007 Extend `src/actions/profile.ts` with `getStudentProfileState`, `completeStudentOnboarding`, `completeRequiredStudentProfile`, and `updateStudentDemographics` (`requireStudent`, `createAdminClient`, Arabic `ActionResult`, never mutate `currentTeacherId`) per `contracts/server-actions.md`
- [x] T008 Protect flow routes: add `/onboarding` and `/profile/complete` to student auth paths in `src/middleware.ts`
- [x] T009 Create minimal chrome layout `src/app/(student-flows)/layout.tsx` (no bottom nav; student session required) for onboarding + profile completion pages

**Checkpoint**: Foundation ready — DB + lib + actions + flow shell; stories can proceed

---

## Phase 3: User Story 1 — Mandatory profile gate before new quizzes (Priority: P1) 🎯 MVP

**Goal**: After ≥2 unique completed quizzes, block not-yet-completed quizzes with a full-page `/profile/complete` form; allow completed-quiz review; return to intended quiz after save.

**Independent Test**: Student with ≥2 completions and `profile_completed=false` opening a new quiz → `/profile/complete`; completed quiz still reviews; after valid submit → intended quiz; teacher context unchanged.

### Implementation for User Story 1

- [x] T010 [P] [US1] Build `src/components/student/StudentDemographicsFields.tsx` (shared RTL fields: name, birth D/M/Y, province select, city, education stage, optional email/address; no raw native selects)
- [x] T011 [P] [US1] Build `src/components/student/ProfileCompletionForm.tsx` full-page form with banner «بقي خطوة واحدة لاستكمال حسابك ومتابعة الاختبارات», Spekit `profile-completion-modal` / `profile-completion-submit`, calling `completeRequiredStudentProfile`
- [x] T012 [US1] Create RSC page `src/app/(student-flows)/profile/complete/page.tsx` loading profile state, rendering `ProfileCompletionForm`, honoring sanitized `from` query
- [x] T013 [US1] Wire gate in `src/app/(student)/quiz/[id]/page.tsx`: if `shouldBlockNewQuiz` (count ≥2, profile incomplete, no submission for quiz) → `redirect(/profile/complete?from=/quiz/[id])`; else existing runner/results path (QUIZ-001 intact)
- [x] T014 [US1] Helper to count distinct completed quizzes for the student (action or lib used by quiz page / `getStudentProfileState`) reading `exam_submissions` in `src/actions/profile.ts` or `src/actions/quiz.ts` without leaking answers

**Checkpoint**: US1 complete — gate blocks new quizzes only; full-page completion works

---

## Phase 4: User Story 2 — Lightweight first onboarding after signup (Priority: P2)

**Goal**: Force 3-step `/onboarding` for any student with `onboarding_completed=false` (new, legacy, teacher-created) before main shell.

**Independent Test**: Incomplete onboarding → `/onboarding`; complete 3 steps → dashboard; subsequent logins skip wizard.

### Implementation for User Story 2

- [x] T015 [P] [US2] Build `src/components/student/OnboardingWizard.tsx` — 3 steps (stage, referral, subject presets + free text), Spekit `student-onboarding`, calls `completeStudentOnboarding`
- [x] T016 [US2] Create RSC page `src/app/(student-flows)/onboarding/page.tsx` rendering wizard; redirect to `/dashboard` if already `onboarding_completed`
- [x] T017 [US2] Enforce onboarding redirect for incomplete students entering student shell (e.g. guard in `src/app/(student)/layout.tsx` or shared helper used by dashboard/quizzes/results) allowing `/onboarding`, `/settings`, `/profile/complete` without loops
- [x] T018 [US2] After AUTH-002 register/login success paths in `src/actions/auth.ts` (or login redirect targets), send incomplete-onboarding students to `/onboarding` instead of dashboard when applicable

**Checkpoint**: US2 complete — first onboarding mandatory once for all student account types

---

## Phase 5: User Story 3 — Review and update profile later (Priority: P3)

**Goal**: Students edit demographics in settings; clearing required fields sets `profile_completed=false` (gate can return).

**Independent Test**: Edit city/subject in `/settings` persists; invalidating required fields flips completion and re-gates new quizzes when count ≥2.

### Implementation for User Story 3

- [x] T019 [US3] Extend `getSettingsProfile` / settings load in `src/actions/profile.ts` to include student demographics + completion flags for students
- [x] T020 [US3] Add demographics editor block to `src/components/settings/SettingsPage.tsx` (reuse `StudentDemographicsFields`, Spekit `student-demographics-settings`) wired to `updateStudentDemographics`
- [x] T021 [US3] Ensure WhatsApp remains read-only and `updateStudentDemographics` recomputes `profile_completed` per FR-014 in `src/actions/profile.ts`

**Checkpoint**: US3 complete — settings edit + completion lifecycle work with US1 gate

---

## Phase 6: User Story 4 — Linked teacher can see student demographics (Priority: P3)

**Goal**: Linked teachers (and admins via existing admin tools later) can read demographics on student detail; unlinked teachers cannot.

**Independent Test**: Teacher A linked to S sees demographics on student detail; Teacher B unlinked does not receive fields.

### Implementation for User Story 4

- [x] T022 [US4] Extend `TeacherStudentDetail` type in `src/types/database.ts` and `getTeacherStudentDetail` in `src/actions/teacher.ts` to return demographics only after verifying `student_teachers` link for `session.profileId`
- [x] T023 [US4] Render compact read-only demographics section in `src/components/teacher/StudentDetailDashboard.tsx` (empty/hidden when no data)

**Checkpoint**: US4 complete — MT-002-safe demographic visibility on existing student detail

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Registry, QA, build

- [x] T024 [P] Register `PROFILE-002` in `.speckit/spec.yaml` with acceptance, routes, files, Spekit hooks; update `AGENTS.md` / `.cursor/rules/almoayed-speckit.mdc` feature lists
- [x] T025 [P] Extend `tests/features/profile-002-student-profile.test.ts` for settings invalidation → `profile_completed` false and onboarding-vs-profile flag separation
- [x] T026 Run `npx supabase db push` (or document) + `npx vitest run tests/features/profile-002-student-profile.test.ts` + `npm run build`; walk `specs/012-student-profile-onboarding/quickstart.md` manual QA checklist
- [x] T027 Mark all tasks `[x]` in `specs/012-student-profile-onboarding/tasks.md` when done

**Checkpoint**: Feature ready for merge consideration

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: Depends on Foundational — **MVP**
- **US2 (Phase 4)**: Depends on Foundational (shares actions with US1; can start after T007–T009)
- **US3 (Phase 5)**: Depends on US1 shared fields component (T010) ideally; Foundational minimum
- **US4 (Phase 6)**: Depends on Foundational types + migration columns; independent of US2 UI
- **Polish (Phase 7)**: After desired stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependency on US2–US4
- **US2 (P2)**: After Foundational — independently testable without gate
- **US3 (P3)**: Best after US1 fields component; gate re-trigger validates with US1
- **US4 (P3)**: After migration + types; independent of student UI flows

### Parallel Opportunities

- T001, T002, T003 in parallel (Setup)
- T006 parallel with T007 after T005
- T010 || T011 after foundation
- US2 (T015–T016) can parallel US1 UI once T007–T009 done
- T024 || T025 in polish

---

## Parallel Example: User Story 1

```bash
# After Phase 2 checkpoint:
Task: "Build StudentDemographicsFields in src/components/student/StudentDemographicsFields.tsx"
Task: "Build ProfileCompletionForm in src/components/student/ProfileCompletionForm.tsx"
# Then sequentially:
Task: "Create profile/complete page"
Task: "Wire quiz/[id] gate redirect"
```

---

## Parallel Example: User Story 2

```bash
Task: "Build OnboardingWizard.tsx"
# Then:
Task: "Create onboarding page + shell redirects + auth redirect"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup  
2. Phase 2 Foundational  
3. Phase 3 US1 (gate + full-page complete)  
4. **STOP** — validate quickstart §2 (gate after 2 quizzes)  
5. Then US2 → US3 → US4 → polish

### Incremental Delivery

1. Setup + Foundational → foundation ready  
2. US1 → demo gate MVP  
3. US2 → onboarding for all accounts  
4. US3 → settings lifecycle  
5. US4 → teacher visibility  
6. Polish → registry + tests + build

### Parallel Team Strategy

- After Phase 2: Dev A = US1, Dev B = US2, Dev C = US4 (US3 waits on shared fields from US1)

---

## Notes

- [P] = different files, no incomplete-task dependency  
- Do not break QUIZ-001: completed quizzes must still show answers only post-submission  
- Profile saves must never clear `currentTeacherId`  
- Optional email is contact only — no email/password auth  
- Commit after each task or logical group  
- Suggested MVP: **US1 only** (Phases 1–3)
