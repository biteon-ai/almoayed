# Implementation Plan: Student Profile Onboarding & Completion Gate

**Branch**: `012-student-profile-onboarding` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/012-student-profile-onboarding/spec.md`

**Feature ID (registry)**: `PROFILE-002` — progressive first onboarding + mandatory profile completion gate before new quizzes.

## Summary

Extend `profiles` with student demographics and two flags (`onboarding_completed`, `profile_completed`). After auth, students with incomplete onboarding are routed to a 3-step `/onboarding` wizard. After **≥2 unique completed quizzes**, attempts to open **not-yet-completed** quizzes (including future retakes) redirect to a **full-page** `/profile/complete?from=…` form; completed-quiz review stays open. Profile writes go through Server Actions; linked teachers may read demographics on student detail (MT-002 scoped).

**Technical approach**: Migration `009_student_profile_demographics.sql`; pure validators/helpers in `src/lib/student-profile.ts`; actions in `src/actions/profile.ts` (extend); gate check in quiz page + shared helper; thin student-flows layout without bottom nav; settings edit surface; Spekit + `.speckit/spec.yaml`.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC, Server Actions |
| **Database** | **Supabase** PostgreSQL — migration `009_student_profile_demographics.sql` |
| **Data access** | Server Actions + `createAdminClient()` |
| **Session / auth** | iron-session — `requireStudent` / `requireTeacher`; WhatsApp identity unchanged |
| **UI** | Tailwind, Shadcn/Base UI, RTL, touch targets `h-10`–`h-12`; custom selects (no raw native selects) |
| **Testing** | Vitest (`tests/features/profile-002-*.test.ts`) |
| **Target platform** | Mobile-first PWA |
| **Spec registry** | `.speckit/spec.yaml` (+ `PROFILE-002`) |

**Feature-specific overrides**:

- **Primary Dependencies**: `zod` (already used elsewhere) for form schemas
- **Storage / tables touched**: `profiles` (new columns); read `exam_submissions` for unique completed-quiz count
- **Performance Goals**: Onboarding / gate page render &lt;1s; profile save &lt;2s; gate check on quiz open &lt;200ms of extra query work
- **Constraints**: MT-002 for teacher demographic reads; QUIZ-001 unchanged (gate only blocks incomplete quizzes); optional email is **contact**, not auth (constitution passwordless rule intact); do not mutate `currentTeacherId` on profile save
- **Scale/Scope**: ~15–20 files — migration, lib, actions, 2 flow pages, settings fields, quiz gate wire, teacher detail fields, Spekit, tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries | PASS — teacher demographic reads only via linked `student_teachers` for `session.profileId` |
| QUIZ-001 | No answer leakage pre-submit | PASS — profile gate does not expose quiz answers; completed review still uses existing submission path |
| Server layer | Privileged data via server only | PASS — all profile R/W via Server Actions + admin client |
| RTL UX | Arabic RTL, touch targets | PASS — contracts mandate RTL wizard + full-page gate |
| Minimal diff | Match existing patterns | PASS — extend `profile.ts` / settings; new thin route group for flows |
| Passwordless | No email/password auth | PASS — optional `email` is demographic contact only; login remains WhatsApp |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — account-wide unique quiz count via `exam_submissions`; onboarding vs profile flags separate; gate is full-page redirect with `from` return URL; settings invalidation clears `profile_completed`.

## Project Structure

### Documentation (this feature)

```text
specs/012-student-profile-onboarding/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md
├── contracts/
│   ├── server-actions.md
│   └── ui-components.md
└── tasks.md             # /speckit-tasks
```

### Source Code (planned touch points)

```text
supabase/migrations/
└── 009_student_profile_demographics.sql

src/
├── app/(student-flows)/                 # minimal chrome (no bottom nav)
│   ├── layout.tsx
│   ├── onboarding/page.tsx
│   └── profile/complete/page.tsx
├── app/(student)/quiz/[id]/page.tsx     # gate check + redirect
├── app/(student)/settings/page.tsx      # load extended profile
├── middleware.ts                        # protect /onboarding, /profile/complete
├── actions/profile.ts                   # extend: onboarding + complete + settings update
├── actions/teacher.ts                   # include demographics on student detail
├── lib/student-profile.ts               # enums, provinces, validators, gate predicate
├── lib/syria-provinces.ts               # Arabic province list
├── components/student/
│   ├── OnboardingWizard.tsx
│   ├── ProfileCompletionForm.tsx
│   └── StudentDemographicsFields.tsx    # shared fields for gate + settings
├── components/settings/SettingsPage.tsx # student demographic editor
├── components/teacher/StudentDetailDashboard.tsx  # show demographics (thin)
├── types/database.ts
└── lib/spekit-targets.ts

tests/features/profile-002-student-profile.test.ts
.speckit/spec.yaml
.speckit/spekit-targets.yaml
```

**Structure decision**: Separate `(student-flows)` route group avoids forcing bottom-nav chrome on mandatory full-page flows. Gate logic lives in a pure helper + quiz RSC page (not middleware DB) to keep middleware session-only.

## Complexity Tracking

> No constitution violations.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
