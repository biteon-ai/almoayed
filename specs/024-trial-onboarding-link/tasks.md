---
description: "Task list for AUTH-008 / TEACH-015 Fast Student Trial Onboarding Link"
---

# Tasks: Fast Student Trial Onboarding Link (AUTH-008 / TEACH-015)

**Input**: Design documents from `/specs/024-trial-onboarding-link/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — plan requires Vitest for AUTH-008 hijack rule, TEACH-015 URL/share helpers, and AUTH-002/007/PROFILE-002 regression.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js app: `src/`, `tests/`, `supabase/migrations/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema + Spekit + registry scaffolding for AUTH-008 / TEACH-015

- [x] T001 Create migration `supabase/migrations/016_trial_join_otp_code.sql` adding nullable `join_teacher_code` to `auth_otp_states`
- [x] T002 [P] Add join + invite SPEKIT keys (`joinForm`, `joinFirstName`, `joinLastName`, `joinClassLevel`, `joinBirthDate`, `joinWhatsapp`, `joinSubmit`, `trialInviteCopy`, `trialInviteWhatsapp`) in `src/lib/spekit-targets.ts`
- [x] T003 [P] Register AUTH-008 / TEACH-015 Spekit targets in `.speckit/spekit-targets.yaml`
- [x] T004 [P] Add draft `AUTH-008` and `TEACH-015` feature entries (status `pending`) in `.speckit/spec.yaml` with routes and planned file paths from `specs/024-trial-onboarding-link/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure join helpers, teacher resolution, and validation shared by all user stories

**⚠️ CRITICAL**: No user story UI/action work until this phase is complete

- [x] T005 Implement `src/lib/trial-join.ts` with `normalizeTeacherJoinCode`, `buildTrialJoinPath`, `buildTrialJoinAbsoluteUrl`, `buildTrialInviteShareUrl`, `canSkipOtp`, and `validateTrialJoinForm` per `specs/024-trial-onboarding-link/contracts/server-actions.md`
- [x] T006 Implement `resolveTeacherForJoinCode` in `src/lib/trial-join.ts` (trim + case-insensitive lookup, `role = TEACHER`, `isTeacherAccountActive` from `src/lib/account-access.ts`)
- [x] T007 [P] Add Arabic join error copy map (invalid link, inactive teacher, existing account needs OTP, teacher WhatsApp) in `src/lib/trial-join-messages.ts`
- [x] T008 [P] Add `[AUTH-008]` / `[TEACH-015]` foundation Vitest for URL builders, validation, and `canSkipOtp` in `tests/features/auth-008-trial-join.test.ts` and `tests/features/teach-015-invite-link.test.ts`

**Checkpoint**: Foundation ready — US1–US4 can proceed

---

## Phase 3: User Story 1 — Teacher copies and shares trial invite link (Priority: P1) 🎯 MVP

**Goal**: Teacher portal shows full join URL with copy + WhatsApp share on dashboard and students hub.

**Independent Test**: Sign in as demo teacher → dashboard shows `/join/AlMoayed-DEMO` → copy places full URL on clipboard → WhatsApp opens preset Arabic text with link.

### Implementation for User Story 1

- [x] T009 [P] [US1] Create `src/components/teacher/TrialInviteCard.tsx` with full join URL display, copy (clipboard + Arabic confirmation), and WhatsApp share via `buildTrialInviteShareUrl` (`h-12` touch targets)
- [x] T010 [US1] Replace dashboard teacher-code card with `TrialInviteCard` while keeping `data-spekit={SPEKIT.teacherCodeCard}` in `src/app/teacher/(portal)/dashboard/page.tsx`
- [x] T011 [US1] Add compact `TrialInviteCard` at top of `src/app/teacher/(portal)/students/page.tsx` (pass `teacherName` from session/profile)
- [x] T012 [P] [US1] Extend `[TEACH-015]` Vitest in `tests/features/teach-015-invite-link.test.ts` for distinct URLs per teacher code and WhatsApp href encoding

**Checkpoint**: Teachers can copy/share invite links before student join route ships

---

## Phase 4: User Story 2 — New student joins from link without OTP (Priority: P1)

**Goal**: Anonymous visitor with new WhatsApp submits join form → active student profile + active/free link + session → `/dashboard` with Free quizzes available.

**Independent Test**: Open `/join/AlMoayed-DEMO` signed out → submit new WhatsApp + valid fields → land on `/dashboard` without BiteonSwitch → Free exams startable, Pro locked → student appears active on teacher roster.

### Implementation for User Story 2

- [x] T013 [US2] Implement `joinTrialStudent` new-student path in `src/actions/join.ts` (profile insert with `onboarding_completed: true`, `profile_completed: false`, `referral_source: whatsapp`; `student_teachers` `active`/`free`; `establishSession` with referring `currentTeacherId`)
- [x] T014 [US2] Implement `linkSignedInStudentToJoinCode` in `src/actions/join.ts` for signed-in student opening another teacher's link (upsert active/free, set `currentTeacherId`, redirect `/dashboard`)
- [x] T015 [US2] Create public RSC page `src/app/join/[code]/page.tsx` outside `(student)` layouts — resolve teacher, inactive/invalid states, signed-in student/teacher branches per `specs/024-trial-onboarding-link/contracts/routes.md`
- [x] T016 [US2] Create client form `src/app/join/[code]/join-form.tsx` with first/last name, education stage, birth date, WhatsApp; wire to `joinTrialStudent`; redirect `/dashboard` on success; disable + spinner on submit
- [x] T017 [P] [US2] Add `[AUTH-008]` action tests for new-student insert shape (active link, `onboarding_completed`, no OTP mint) in `tests/features/auth-008-trial-join.test.ts`

**Checkpoint**: Core trial join works for brand-new WhatsApp identities

---

## Phase 5: User Story 3 — Logout ends trial shortcut; return requires OTP (Priority: P1)

**Goal**: Existing WhatsApp on join form never mints session; OTP handoff links referring teacher after verification; AUTH-002 `/login` unchanged.

**Independent Test**: Complete trial join → logout → resubmit same number on join link → hosted OTP (no dashboard) → after OTP, signed in and linked; `/login` still requires OTP.

### Implementation for User Story 3

- [x] T018 [US3] Extend `joinTrialStudent` in `src/actions/join.ts` for existing STUDENT (→ OTP redirect, no mint), TEACHER number (Arabic error), deactivated student (`ACCOUNT_INACTIVE`), and unique-violation race → OTP path
- [x] T019 [US3] Extend `startBiteonSwitchOtp` in `src/actions/biteonswitch.ts` to read optional `join_teacher_code` from FormData and persist on `auth_otp_states` insert
- [x] T020 [US3] Extend `finishLogin` in `src/app/api/auth/biteonswitch/callback/route.ts` to upsert active/free link from consumed `join_teacher_code` (preserve existing `pro` tier) then `establishSession` with referring teacher
- [x] T021 [P] [US3] Add `[AUTH-008]` hijack + OTP handoff tests (existing number no mint, post-OTP multi-teacher link) in `tests/features/auth-008-trial-join.test.ts`; confirm AUTH-002 register path unchanged in `tests/features/auth-002-register.test.ts`

**Checkpoint**: Anti-hijack rule enforced; multi-teacher join after OTP works

---

## Phase 6: User Story 4 — Arabic mobile join experience (Priority: P2)

**Goal**: Join page and invite card are fully RTL, Arabic, and touch-friendly on phone-sized screens.

**Independent Test**: Complete join on mobile viewport — Arabic labels, RTL layout, no cramped native `<select>`, full-width invite CTAs.

### Implementation for User Story 4

- [x] T022 [P] [US4] Replace education stage control with touch-friendly Shadcn list/button-group using `EDUCATION_STAGE_LABELS` from `src/lib/student-profile.ts` in `src/app/join/[code]/join-form.tsx` (no raw native select)
- [x] T023 [P] [US4] Align WhatsApp input with login dial-code UX (`WhatsAppField` pattern or shared extract) and ensure all primary actions are `h-12` in `src/app/join/[code]/join-form.tsx`
- [x] T024 [US4] Polish mobile layout for `src/components/teacher/TrialInviteCard.tsx` (full-width copy/WhatsApp on narrow screens, `dir="ltr"` URL block, Arabic captions)

**Checkpoint**: Join + invite surfaces meet RTL mobile UX acceptance

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Spekit wiring, registry, verification, regression

- [x] T025 [P] Wire `data-spekit` hooks on join form fields/submit and invite copy/WhatsApp in `src/app/join/[code]/join-form.tsx` and `src/components/teacher/TrialInviteCard.tsx`
- [x] T026 Update `AUTH-008` and `TEACH-015` to `implemented` with acceptance criteria in `.speckit/spec.yaml`
- [x] T027 Run `specs/024-trial-onboarding-link/quickstart.md` validation (`npx supabase db push`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:unit`)
- [x] T028 [P] Add Playwright RTL smoke `e2e/auth-008-join.spec.ts` (public join page loads, Arabic labels visible, inactive/invalid code message)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 (migration) for OTP column; T005–T008 can start after T001
- **US1 (Phase 3)**: Depends on T005 (URL/share helpers) — can ship before US2
- **US2 (Phase 4)**: Depends on Phase 2 — core student join
- **US3 (Phase 5)**: Depends on US2 (`joinTrialStudent` shell) + T001 + T019–T020
- **US4 (Phase 6)**: Depends on US1 + US2 UI shells — polish only
- **Polish (Phase 7)**: Depends on desired user stories complete

### User Story Dependencies

| Story | Depends on | Independent test |
|-------|------------|------------------|
| **US1** | Phase 2 (URL helpers) | Teacher copy/share link from portal |
| **US2** | Phase 2 | New WhatsApp → dashboard without OTP |
| **US3** | US2 + migration | Logout → join resubmit requires OTP |
| **US4** | US1 + US2 UI | Mobile RTL join + invite |

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 in parallel after T001
- **Phase 2**: T007, T008 in parallel after T005 starts
- **Phase 3**: T009, T012 in parallel; T010–T011 sequential on pages
- **Phase 4**: T017 in parallel with T015–T016 once T013 exists
- **Phase 5**: T021 in parallel with T019–T020 once T018 exists
- **Phase 6**: T022, T023 in parallel
- **Phase 7**: T025, T028 in parallel

### Parallel Example: User Story 1

```bash
# After Phase 2 completes:
Task T009: "Create TrialInviteCard in src/components/teacher/TrialInviteCard.tsx"
Task T012: "Extend TEACH-015 Vitest in tests/features/teach-015-invite-link.test.ts"
# Then sequentially wire dashboard + students pages (T010, T011)
```

### Parallel Example: User Story 2 + US1 overlap

```bash
# Developer A — US1 invite card (T009–T011)
# Developer B — US2 join action + page (T013–T016) after Phase 2
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Complete Phase 1 + Phase 2
2. Complete Phase 3 (US1) — teachers can share links
3. Complete Phase 4 (US2) — new students can join without OTP
4. **STOP and VALIDATE** against quickstart "New student" section
5. Add Phase 5 (US3) before any production deploy — hijack rule is mandatory

### Incremental Delivery

1. Setup + Foundational → helpers and migration ready
2. US1 → teachers share links (join page may still be building)
3. US2 → new student OTP-free join (MVP product value)
4. US3 → security gate (required for production)
5. US4 → mobile polish
6. Polish → registry, Spekit, CI green

### Suggested MVP Scope

**Minimum shippable slice**: Phase 1 + 2 + 3 + 4 + 5 (US1–US3). US4 and e2e (T022–T024, T028) can follow in a polish pass.

---

## Notes

- Do **not** modify `registerStudentAndRequestOTP` in `src/actions/login.ts` (AUTH-002 stays OTP-required)
- Trial links use `student_teachers.status = active` (not AUTH-002 `pending`)
- Do **not** add `/join` to `src/middleware.ts` matchers — page stays public like `/login`
- Registry IDs are **AUTH-008** / **TEACH-015** — do not overwrite AUTH-007 or TEACH-012
- Verify `npm run build` after each phase checkpoint
