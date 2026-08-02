---
description: "Task list for Block Inactive Account Login (AUTH-007)"
---

# Tasks: Block Inactive Account Login

**Input**: Design documents from `specs/020-block-inactive-login/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Tests**: Included — spec FR-010 requires Vitest with `[AUTH-007]` describe (`tests/features/auth-007-inactive-login.test.ts`)

**Organization**: US1 (inactive teacher login block) → US2 (deactivated student login block) → US3 (mid-session logout + multi-teacher re-scope) → US4 (RTL query/error presentation). Shared foundation: `account-access` helpers + `ACCOUNT_INACTIVE` error/UI mapping.

**Feature ID**: `AUTH-007` (alias `FIX-AUTH-002`; extends `AUTH-001` · `AUTH-003` · `AUTH-004` · `AUTH-005` · `MT-001` · `MT-002` · `ADMIN-001`) — do not break QUIZ-001, PERF-001 middleware (no DB), or AUTH-002 pending-only sessions

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US4 maps to spec user stories
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Registry stub so implementers have a home for AUTH-007 acceptance

- [x] T001 [P] Draft `AUTH-007` (and note `FIX-AUTH-002`) stub entry in `.speckit/spec.yaml` with status `planned`/`partial`, personas STUDENT/TEACHER, routes `/login`, `/api/auth/biteonswitch/callback`, and planned files from `plan.md`
- [x] T002 [P] Confirm `.specify/feature.json` has `"feature_directory": "specs/020-block-inactive-login"` for downstream Spec Kit commands

**Checkpoint**: Registry stub ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure eligibility helpers + error code + Arabic/query mapping — MUST complete before wiring login paths

**⚠️ CRITICAL**: No login-path gating until helpers + `ACCOUNT_INACTIVE` exist

- [x] T003 [P] Create `src/lib/account-access.ts` with pure helpers per `contracts/server-actions.md`: `isTeacherAccountActive`, `isStudentDeactivatedForLogin`, `resolveActiveTeacherId`
- [x] T004 [P] Add `AuthErrorCode.ACCOUNT_INACTIVE` in `src/lib/auth-error-codes.ts`
- [x] T005 [P] Map Arabic canonical copy and query key `account_inactive` in `src/lib/login-ui-messages.ts` (`LOGIN_UI_AR` + `QUERY_ERROR_MAP`)
- [x] T006 Implement `assertCanEstablishSession(profileId, role, supabase?)` in `src/lib/account-access.ts` (or thin wrapper in `src/lib/auth-session.ts`) that loads `teacher_account_status` / `student_teachers` and returns `{ ok: true, teacherId }` or `{ ok: false, code: ACCOUNT_INACTIVE }` without treating pending-only as inactive
- [x] T007 [P] Scaffold `tests/features/auth-007-inactive-login.test.ts` with `describe("[AUTH-007] …")` covering pure helpers: inactive teacher, active teacher, student deactivated rule, pending-only not blocked, `resolveActiveTeacherId` preference/fallback

**Checkpoint**: Foundation ready — stories can gate mint and show Arabic errors

---

## Phase 3: User Story 1 — Inactive teacher cannot sign in (Priority: P1) 🎯 MVP

**Goal**: Inactive teachers are refused on WhatsApp OTP, email, emergency fallback, and demo login; no session / no `last_session_id` update.

**Independent Test**: Mark teacher `teacher_account_status = inactive`; attempt each teacher login path → Arabic inactive message; no dashboard; re-activate → login works.

### Tests for User Story 1

- [x] T008 [P] [US1] Extend `tests/features/auth-007-inactive-login.test.ts` with cases that `loginMessageForCode(ACCOUNT_INACTIVE)` and `loginMessageForQueryError("account_inactive")` return the canonical Arabic string

### Implementation for User Story 1

- [x] T009 [US1] Gate BiteonSwitch OTP callback before `establishSession` in `src/app/api/auth/biteonswitch/callback/route.ts`: on teacher inactive → redirect `/login?error=account_inactive` (no `last_session_id` write)
- [x] T010 [US1] Gate emergency teacher fallback in `src/actions/auth.ts` with `assertCanEstablishSession` → return `{ status: "error", code: ACCOUNT_INACTIVE }` (not generic `ADMIN_FALLBACK_DENIED`)
- [x] T011 [US1] Map `loginTeacherWithEmail` `"inactive"` result in `src/actions/auth.ts` to `AuthErrorCode.ACCOUNT_INACTIVE` (keep check in `src/lib/admin/auth.ts`)
- [x] T012 [US1] Gate demo teacher login path in `src/actions/login.ts` before `establishSession` with the same assert / error code
- [x] T013 [US1] Optionally add defense-in-depth assert inside `establishSession` in `src/lib/auth-session.ts` so any missed caller cannot mint + rotate `last_session_id`

**Checkpoint**: US1 complete — inactive teachers blocked on all in-scope teacher login paths

---

## Phase 4: User Story 2 — Deactivated student cannot sign in (Priority: P1)

**Goal**: Students with zero active links and ≥1 deactivated link cannot mint a session; pending-only AUTH-002 still works; multi-active students still log in.

**Independent Test**: Deactivate student’s only active link → OTP/demo refused with inactive message; pending-only registrant still gets limited session; student with one remaining active link still logs in.

### Tests for User Story 2

- [x] T014 [P] [US2] Extend `tests/features/auth-007-inactive-login.test.ts` with table-driven `isStudentDeactivatedForLogin` cases (all deactivated; mixed active+deactivated; pending-only; empty links)

### Implementation for User Story 2

- [x] T015 [US2] Gate BiteonSwitch OTP callback for STUDENT role in `src/app/api/auth/biteonswitch/callback/route.ts` using `assertCanEstablishSession`; redirect `/login?error=account_inactive` when deactivated; preserve pending-only / needs-teacher flows
- [x] T016 [US2] Gate demo student login in `src/actions/login.ts` before `establishSession`
- [x] T017 [US2] Gate teacher-link completion mint path in `src/actions/login.ts` (post–رمز الأستاذ) so a student who became deactivated mid-flow cannot establish a full session
- [x] T018 [US2] Confirm `savePendingTeacherLinkSession` in `src/lib/auth-session.ts` remains available for pending-only students and is **not** blocked by AUTH-007

**Checkpoint**: US2 complete — deactivated students blocked; pending-only preserved

---

## Phase 5: User Story 3 — Mid-session deactivation forces logout / re-scope (Priority: P2)

**Goal**: Next protected navigation after full deactivation clears access via redirect to `/login?error=account_inactive`; if another active teacher remains, re-scope `currentTeacherId` instead of logout.

**Independent Test**: Sign in → deactivate last link / mark teacher inactive → next hub navigation → login with inactive message; multi-teacher deactivate-current-only → stay signed in under other teacher.

### Tests for User Story 3

- [x] T019 [P] [US3] Extend `tests/features/auth-007-inactive-login.test.ts` with `resolveActiveTeacherId` scenarios: preferred still active; preferred deactivated → oldest other active; none active → null

### Implementation for User Story 3

- [x] T020 [US3] Extend `getValidatedSession` in `src/lib/auth.ts` after AUTH-003 device-lock: load eligibility; teacher inactive → `redirect("/login?error=account_inactive")`; student deactivated rule → same redirect
- [x] T021 [US3] In same `getValidatedSession` (or `requireStudent` path) in `src/lib/auth.ts`: when student has ≥1 active link and `currentTeacherId` is missing/inactive, call `resolveActiveTeacherId`, assign `session.currentTeacherId`, `await session.save()`, continue request
- [x] T022 [US3] Ensure mid-session path does **not** add Supabase lookups to `src/middleware.ts` (PERF-001); document with brief comment near the auth check if helpful
- [x] T023 [US3] Prefer combining profile/link fetch with device-lock select where practical in `src/lib/auth.ts` to avoid an extra round-trip (PERF-001)

**Checkpoint**: US3 complete — mid-session logout + multi-teacher re-scope

---

## Phase 6: User Story 4 — Clear RTL error presentation (Priority: P3)

**Goal**: Inactive refusals show canonical Arabic copy via existing login error UI with RTL alignment.

**Independent Test**: Trigger inactive login and mid-session redirect; confirm message on `/login` matches canonical Arabic and renders RTL/start-aligned.

### Implementation for User Story 4

- [x] T024 [P] [US4] Verify `src/app/login/login-form.tsx` already surfaces `loginMessageForQueryError(searchParams.get("error"))` and Server Action `code` via `loginMessageForCode`; wire any missing display for `ACCOUNT_INACTIVE` if not shown
- [x] T025 [P] [US4] Confirm RTL: error alert uses `text-start` / existing login alert classes; no LTR-only toast required for this feature (`contracts/ui-components.md`)
- [x] T026 [US4] Manually smoke `/login?error=account_inactive` renders «عذراً، هذا الحساب غير فعال. يرجى التواصل مع الإدارة» without breaking other query errors (`otp_invalid`, etc.)

**Checkpoint**: US4 complete — users see clear Arabic inactive guidance

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Registry, docs, verification

- [x] T027 [P] Finalize `.speckit/spec.yaml` `AUTH-007` / `FIX-AUTH-002` entry: status `implemented`, acceptance from spec, files list, notes on pending-only + re-scope
- [x] T028 [P] Add `AUTH-007` to implemented feature IDs in `AGENTS.md` and `.cursor/rules/almoayed-speckit.mdc` if those lists are maintained
- [x] T029 [P] Run `npx vitest run tests/features/auth-007-inactive-login.test.ts` and fix failures
- [x] T030 Run `npm run build` and fix any TypeScript / Server Action errors
- [x] T031 Walk `specs/020-block-inactive-login/quickstart.md` QA checklist (teacher + student + mid-session) and note any gaps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately
- **Foundational (Phase 2)**: After Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: After Foundational — MVP teacher block
- **US2 (Phase 4)**: After Foundational — can parallel with US1 after T006/T007 (same callback file → serialize T009/T015 carefully)
- **US3 (Phase 5)**: After Foundational; ideally after US1/US2 assert exists
- **US4 (Phase 6)**: After T005 (messages); can parallel late with US1/US2
- **Polish (Phase 7)**: After desired stories complete

### User Story Dependencies

| Story | Depends on | Notes |
|-------|------------|-------|
| US1 | Phase 2 | Teacher mint gates |
| US2 | Phase 2 | Student mint gates; shares OTP callback with US1 |
| US3 | Phase 2 (+ assert helpers) | Mid-session in `auth.ts` |
| US4 | T005 (+ login form) | Presentation only |

### Parallel Opportunities

- T001 ∥ T002 (setup docs)
- T003 ∥ T004 ∥ T005 (different files)
- T008 ∥ T014 ∥ T019 (test sections — or one author sequentially on the same test file)
- T010 ∥ T011 ∥ T012 (different action paths; T009 shares callback with T015 — do US1 callback teacher branch then US2 student branch)
- T024 ∥ T025 (UI verify)

### Parallel Example: Foundation

```bash
Task: "Create src/lib/account-access.ts pure helpers"
Task: "Add ACCOUNT_INACTIVE in src/lib/auth-error-codes.ts"
Task: "Map account_inactive in src/lib/login-ui-messages.ts"
```

### Parallel Example: After foundation (careful file ownership)

```bash
# Developer A — US1 teacher gates (auth.ts, admin/auth already)
Task: "Gate emergency + email inactive in src/actions/auth.ts"
Task: "Gate demo teacher in src/actions/login.ts"

# Developer B — US3 mid-session
Task: "Extend getValidatedSession in src/lib/auth.ts"

# Serialize OTP callback (US1 then US2):
Task: "Gate teacher in biteonswitch callback"
Task: "Gate student in biteonswitch callback"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2  
2. Phase 3 (US1) — inactive teachers blocked  
3. **STOP and VALIDATE** with quickstart teacher QA  
4. Then US2 → US3 → US4 → Polish  

### Incremental Delivery

1. Foundation → helpers + Arabic error ready  
2. US1 → teacher lockout (highest admin risk)  
3. US2 → student lockout + pending-only safe  
4. US3 → mid-session + re-scope  
5. US4 polish + registry + `npm run build`  

### Suggested MVP scope

**US1 + Phase 2** (teacher inactive on all login paths). Ship US2 in the same PR if capacity allows — both are P1.

---

## Notes

- Do **not** put inactive DB checks in `src/middleware.ts`
- Do **not** block `savePendingTeacherLinkSession` for pending-only students
- Use `/login?error=account_inactive` (not `reason=`) so `loginMessageForQueryError` works
- Canonical Arabic: «عذراً، هذا الحساب غير فعال. يرجى التواصل مع الإدارة»
- Commit after each phase checkpoint when using `/speckit.git.commit`
