# Implementation Plan: Fast Student Trial Onboarding Link

**Branch**: `024-trial-onboarding-link` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/024-trial-onboarding-link/spec.md`

**Feature IDs (registry)**: `AUTH-008` (student trial join) · `TEACH-015` (teacher invite tool)  
**Extends**: `AUTH-001` · `AUTH-002` · `AUTH-003` · `AUTH-004` · `AUTH-007` · `MT-001` · `MT-002` · `PROFILE-002` · `TIER-001` · `TEACH-005`

## Summary

Teachers share a stable public join URL `/join/[teacherCode]`. A **new** WhatsApp identity fills an Arabic form (first/last name, education stage, birth date, WhatsApp) and receives an iron-session **without OTP**, with an **active + free** `student_teachers` link to that teacher. After the profile exists, the same number cannot skip OTP — join form and `/login` both start BiteonSwitch (`AUTH-001`). Free exams work immediately (`TIER-001`); Pro stays locked; `QUIZ-001` is unchanged.

**Technical approach**:
1. Pure helpers: join URL, WhatsApp invite text, teacher-code resolve (trim + case-insensitive), join-form validation.
2. New Server Action `joinTrialStudent` — create student like `createStudentManually` (`active`/`free`), then `establishSession`; existing number → OTP with `join_teacher_code` on `auth_otp_states`.
3. Public route `src/app/join/[code]/` (outside student layouts). Teacher invite card on dashboard + students hub (copy + WhatsApp).
4. PROFILE-002: set `onboarding_completed: true` on insert; leave `profile_completed: false`.
5. Vitest AUTH-008 / TEACH-015; Spekit hooks; registry pending → implemented on ship.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for Syrian Baccalaureate math

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC + client islands |
| **Database** | **Supabase** — extend `auth_otp_states` only (`join_teacher_code`) |
| **Data access** | New Server Action + admin client; reuse `establishSession` / `assertCanEstablishSession` |
| **Session / auth** | iron-session; OTP-free mint **only** when no `profiles` row exists |
| **UI** | Tailwind, Shadcn — public join page + teacher invite card |
| **Testing** | Vitest `tests/features/auth-008-*.test.ts`, `teach-015-*.test.ts`; Playwright join smoke |
| **Target platform** | Mobile-first PWA — public join + teacher portal |

**Feature-specific overrides**:

- **Primary Dependencies**: None beyond stack defaults (BiteonSwitch already used)
- **Storage / tables touched**: `profiles` insert/select; `student_teachers` insert/upsert; `auth_otp_states.join_teacher_code` (new nullable column); `profiles.last_session_id` via existing mint
- **Performance Goals**: Join submit → dashboard in one round-trip; teacher copy/share feels instant
- **Constraints**: MT-002 scope = referring teacher from URL code; AUTH-007 before mint; no QUIZ-001 change; `/login` AUTH-002 still requires OTP
- **Scale/Scope**: One public route, one teacher invite card (two placements), one join action; no rotatable tokens in v1

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries / session | PASS — `currentTeacherId` = referring teacher; quiz list already filters |
| QUIZ-001 | No answer leakage pre-submit | PASS — no exam payload changes |
| Server layer | Privileged data via Server Actions | PASS — admin client in `joinTrialStudent`; no client Supabase |
| RTL UX | Arabic RTL, touch targets | PASS — join form + invite CTAs `h-10`–`h-12` |
| Minimal diff | Match existing patterns | PASS — reuse mint, AUTH-007, copy/share, education-stage list |
| Passwordless | WhatsApp identity, no email/password | PASS — still WhatsApp identity; OTP skip is one-shot for **new** numbers only |

**Feature compliance**: **PASS** — no constitution exceptions. OTP-free first session is specified product behavior, not an email/password flow.

**Post-design re-check**: **PASS** — see Phase 1. Migration is one nullable column for OTP handoff; trial students use `active`+`free` (not AUTH-002 `pending`) so Free quizzes and roster work.

## Project Structure

### Documentation (this feature)

```text
specs/024-trial-onboarding-link/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── routes.md
│   ├── server-actions.md
│   └── ui-components.md
└── tasks.md                    # /speckit-tasks
```

### Source Code (planned touch points)

```text
src/lib/
├── trial-join.ts               # NEW — URL, invite text, code normalize, validation
├── account-access.ts           # REUSE isTeacherAccountActive / assertCanEstablishSession
├── auth-session.ts             # REUSE establishSession
├── student-profile.ts          # REUSE parseBirthDate, EDUCATION_STAGES
├── profile-name.ts             # REUSE validateDisplayName
├── constants.ts                # APP_URL; add buildTrialInviteShareUrl
└── spekit-targets.ts           # NEW join + invite hooks

src/actions/
├── join.ts                     # NEW joinTrialStudent (+ signed-in link helper)
├── biteonswitch.ts             # EXTEND optional join_teacher_code on OTP start
└── login.ts                    # UNCHANGED AUTH-002 OTP-required register

src/app/
├── join/[code]/page.tsx        # NEW public landing
├── join/[code]/join-form.tsx   # NEW client form
├── api/auth/biteonswitch/callback/route.ts  # EXTEND: apply join_teacher_code after OTP
└── teacher/(portal)/
    ├── dashboard/page.tsx      # EXTEND teacher-code-card → invite
    └── students/page.tsx       # ADD compact invite card

src/components/teacher/
└── TrialInviteCard.tsx         # NEW copy + WhatsApp share

supabase/migrations/
└── 016_trial_join_otp_code.sql # auth_otp_states.join_teacher_code

.speckit/spec.yaml              # AUTH-008 + TEACH-015
.speckit/spekit-targets.yaml

tests/features/
├── auth-008-trial-join.test.ts
└── teach-015-invite-link.test.ts
e2e/auth-008-join.spec.ts       # public join RTL smoke
```

**Structure decision**: Keep AUTH-002 `/login` registration untouched. New join module + public route. Reuse session mint and inactive checks. One small OTP-state column so existing-number join survives hosted OTP bounce.

## Complexity Tracking

> No constitution violations.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0: Research

See [research.md](./research.md). All technical unknowns resolved.

## Phase 1: Design

See [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

**Key decisions**:
1. Join URL = `${APP_URL}/join/${encodeURIComponent(teacher_code)}` — stable public classroom code, not a secret token.
2. OTP skip iff **no `profiles` row** for that WhatsApp. Existing student/teacher numbers never mint from the join form.
3. New students get `student_teachers.status = active`, `tier = free` (same as `createStudentManually`), so Free quizzes and roster work immediately. AUTH-002 stays `pending` + OTP.
4. Name = `first_name` + `last_name` → `full_name`. Class/grade = `education_stage`. Birth date = existing `birth_date`. No new profile columns.
5. `onboarding_completed = true`, `referral_source = whatsapp`, `profile_completed = false`.
6. Existing number on join → `startBiteonSwitchOtp` with `join_teacher_code`; callback upserts **active** link then `establishSession`.
7. Teacher invite: extend dashboard `teacher-code-card` + students hub; copy full URL; WhatsApp `api.whatsapp.com/send?text=` like QUIZ-003.

## Phase 2: Task planning

Deferred to `/speckit-tasks`.
