---
description: "Task list for AUTH-009 Teacher Login Recovery"
---

# Tasks: Teacher Login Recovery (AUTH-009)

**Input**: Design documents from `/specs/028-teacher-login-recovery/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — plan + contracts require Vitest `[AUTH-009]` for hash/TTL/lookup/rate-limit/reset/magic, plus Playwright RTL smoke for back + forgot visibility.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js app: `src/`, `tests/`, `e2e/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Spekit + registry scaffolding for AUTH-009

- [x] T001 [P] Add Spekit keys `teacherLoginBack`, `teacherForgotPasswordLink`, `teacherForgotPasswordForm`, `teacherForgotPasswordSubmit`, `teacherMagicLinkCta`, `teacherMagicLinkForm`, `teacherMagicLinkSubmit`, `teacherResetForm`, `teacherResetPassword`, `teacherResetPasswordConfirm`, `teacherResetSubmit`, `teacherMagicConsume` to `SPEKIT` in `src/lib/spekit-targets.ts`
- [x] T002 [P] Mirror the AUTH-009 Spekit selectors under a new AUTH-009 section in `.speckit/spekit-targets.yaml` (bump `meta.total_targets`)
- [x] T003 [P] Add draft `AUTH-009` feature entry (status `partial`) in `.speckit/spec.yaml` linking `specs/028-teacher-login-recovery/`, routes `/teacher/login` `/teacher/reset` `/teacher/magic`, and extends `ADMIN-001` `AUTH-003` `AUTH-007`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Token table, error codes, pure recovery helpers, middleware public allowlist — shared by US2/US3 (US1 only needs login page but must wait per workflow)

**⚠️ CRITICAL**: No user-story UI/mail work until this phase is complete

- [x] T004 Create `teacher_login_tokens` (hashed secret, purpose, TTL, `consumed_at`, deny-all RLS, indexes) in `supabase/migrations/020_teacher_login_tokens.sql` per `specs/028-teacher-login-recovery/data-model.md`
- [x] T005 [P] Add `INVALID_EMAIL`, `TEACHER_NOT_FOUND`, `RECOVERY_RATE_LIMITED`, `MAIL_SEND_FAILED`, `RESET_INVALID`, `MAGIC_INVALID`, `PASSWORD_TOO_SHORT`, `PASSWORD_MISMATCH` to `AuthErrorCode` in `src/lib/auth-error-codes.ts`
- [x] T006 [P] Add Arabic request/reset/magic copy (success toasts + table from contracts) in `src/lib/teacher-login-messages.ts`
- [x] T007 Map the new `AuthErrorCode` values to Arabic in `src/lib/login-ui-messages.ts` (inactive copy stays AUTH-007)
- [x] T008 Add `TeacherLoginToken` / purpose union types in `src/types/database.ts`
- [x] T009 Implement `hashRecoverySecret`, `generateRecoverySecret`, `resetExpiresAt`, `magicExpiresAt`, and teacher-email lookup types in `src/lib/teacher-login-recovery.ts` (pure; SHA-256 hex; 60 min / 15 min TTLs)
- [x] T010 Extend `src/middleware.ts` so `/teacher/login`, `/teacher/reset`, and `/teacher/magic` (and subpaths) are public teacher-auth paths; keep `/teacher/dashboard` gated
- [x] T011 [P] Add failing `[AUTH-009]` unit tests for hash round-trip, TTL helpers, and format validation in `tests/features/auth-009-teacher-login-recovery.test.ts`

**Checkpoint**: Foundation ready — migration + helpers + public routes exist; US1–US4 can proceed

---

## Phase 3: User Story 1 — Return to the main platform login (Priority: P1) 🎯 MVP

**Goal**: Signed-out visitors can leave `/teacher/login` via a subtle Arabic back control to `/login` without submitting the teacher form.

**Independent Test**: Open `/teacher/login`, tap «العودة لتسجيل الدخول الرئيسي», land on `/login`; password login still works if the control is ignored.

### Tests for User Story 1

- [x] T012 [P] [US1] Add Playwright coverage that the back control is visible, RTL start-side, and navigates to `/login` in `e2e/auth-009-teacher-login.spec.ts`

### Implementation for User Story 1

- [x] T013 [US1] Add muted start-side back link «العودة لتسجيل الدخول الرئيسي» (`href="/login"`, Spekit `teacher-login-back`, not `variant="brand"`) on `src/app/teacher/login/page.tsx` per `specs/028-teacher-login-recovery/contracts/ui-components.md`

**Checkpoint**: MVP — wrong-door visitors can reach main login in one tap

---

## Phase 4: User Story 2 — Reset a forgotten password by email (Priority: P1)

**Goal**: Active teachers request a 60-minute single-use reset mail; unknown emails get not-found and no mail; inactive get AUTH-007; valid link sets a new password (≥ 8) then they sign in on Teacher Login.

**Independent Test**: Request reset for a known active teacher → mail + `/teacher/reset?token=` → new password → login; unknown email → Arabic not-found, no mail.

### Tests for User Story 2

- [x] T014 [P] [US2] Extend `[AUTH-009]` tests for teacher lookup (student/admin/unknown → not_found, inactive → inactive), rate-limit at 3/15 min, weak password does not consume token, and mail is not called on not_found in `tests/features/auth-009-teacher-login-recovery.test.ts`

### Implementation for User Story 2

- [x] T015 [US2] Implement lookup + insert + rate-limit + `sendEmail` (delete row on send failure) + `getAppUrl()` reset link HTML in `src/lib/teacher-login-recovery.ts`
- [x] T016 [US2] Implement `requestTeacherPasswordReset`, `peekTeacherResetToken`, and `completeTeacherPasswordReset` (CAS consume + `hashPassword`, no session mint) in `src/actions/teacher-login-recovery.ts`
- [x] T017 [US2] Add forgot-password mode (pre-filled email, Spekit form/submit, `HubToast` success, inline `role="alert"` errors, pending disable) on `src/app/teacher/login/page.tsx`
- [x] T018 [US2] Create reset completion UI (new + confirm password, Spekit hooks, invalid-token copy + link to `/teacher/login`) in `src/app/teacher/reset/page.tsx`

**Checkpoint**: Password recovery works end-to-end without magic link

---

## Phase 5: User Story 3 — Sign in with a one-time magic link (Priority: P2)

**Goal**: Active teachers request a 15-minute magic link and open it once to land on `/teacher/dashboard` via `establishSession` (AUTH-003 / AUTH-007).

**Independent Test**: Request magic for active teacher email → open link once → dashboard; second open and unknown/inactive emails never mint a session.

### Tests for User Story 3

- [x] T019 [P] [US3] Add `[AUTH-009]` cases for magic consume (CAS used token, inactive → ACCOUNT_INACTIVE, establishSession called on success) in `tests/features/auth-009-teacher-login-recovery.test.ts`

### Implementation for User Story 3

- [x] T020 [US3] Implement `requestTeacherMagicLink` and `consumeTeacherMagicLink` (`assertCanEstablishSession` then `establishSession`) in `src/actions/teacher-login-recovery.ts` and magic email HTML in `src/lib/teacher-login-recovery.ts`
- [x] T021 [US3] Add muted magic CTA «أرسل لي رابط دخول لمرة واحدة» and magic-request mode (Spekit, toast, loading) on `src/app/teacher/login/page.tsx`
- [x] T022 [US3] Create magic consume page (auto-consume token, Spekit `teacher-magic-consume`, redirect `/teacher/dashboard` or Arabic invalid/inactive + link to login) in `src/app/teacher/magic/page.tsx`

**Checkpoint**: Magic link sign-in works independently of password reset completion

---

## Phase 6: User Story 4 — Keep the existing Arabic teacher-login look and feel (Priority: P2)

**Goal**: Enhanced card still reads as Al-Moayed teacher login: one teal primary, quiet secondary links, Arabic feedback, LTR values in fields.

**Independent Test**: Phone-width `/teacher/login` — title «دخول المدرس», helper about Super Admin, `h-12` fields, only one full-width brand button in login mode.

### Tests for User Story 4

- [x] T023 [P] [US4] Extend `e2e/auth-009-teacher-login.spec.ts` to assert title, primary «دخول المدرس», forgot/magic are not `variant="brand"`, and password login path still reaches dashboard with demo/test teacher if available

### Implementation for User Story 4

- [x] T024 [US4] Polish `src/app/teacher/login/page.tsx` so `HubToast` does not cover the back control, forgot/magic stay muted, and login-mode primary remains the only `variant="brand"` full-width button per `specs/028-teacher-login-recovery/contracts/ui-components.md`

**Checkpoint**: Visual family match + password login regression

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Registry, verification, quickstart gates

- [x] T025 Mark `AUTH-009` `implemented` with acceptance + file list in `.speckit/spec.yaml`
- [x] T026 [P] Confirm `020_teacher_login_tokens.sql` is picked up by `scripts/verify-migrations.mjs` / `node scripts/verify-migrations.mjs`
- [x] T027 Run `npm run lint`, `npm run typecheck`, `npm run test:unit`, and AUTH-009 Playwright from `specs/028-teacher-login-recovery/quickstart.md`
- [x] T028 Walk the quickstart matrix (back, happy reset, not-found, inactive, magic once, replay) using `specs/028-teacher-login-recovery/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (P1)**: After Phase 2 — no dependency on US2–US4
- **User Story 2 (P1)**: After Phase 2 — uses tokens/mail; independent of magic
- **User Story 3 (P2)**: After Phase 2 — shares recovery lib/actions file with US2 (implement after US2 if a single agent to avoid merge conflicts on `src/actions/teacher-login-recovery.ts` and `src/app/teacher/login/page.tsx`)
- **User Story 4 (P2)**: After US1 (and ideally US2/US3 CTAs exist) so polish covers all new controls
- **Polish**: After desired stories

### User Story Dependencies

- **US1**: Independent after foundation (login page only)
- **US2**: Independent of US3; needs Phase 2 tokens
- **US3**: Same files as US2 (`teacher-login-recovery.ts`, actions, login page) — sequential if one implementer
- **US4**: Visual pass over the same login page

### Within Each User Story

- Tests marked in the story MUST be written and fail before implementation
- Helpers/actions before pages
- Story complete before next priority when files overlap

### Parallel Opportunities

- T001, T002, T003 in parallel
- T005, T006, T011 in parallel after T004/T008 types exist (T011 can start once T009 helpers are sketched)
- T012 in parallel with T013
- T014 in parallel with starting T015
- T019 in parallel with T020 once US2 actions exist

---

## Parallel Example: User Story 1

```bash
# After Phase 2:
Task: "Playwright back-link coverage in e2e/auth-009-teacher-login.spec.ts"
Task: "Back link UI in src/app/teacher/login/page.tsx"
```

## Parallel Example: Foundational codes

```bash
Task: "AuthErrorCode extras in src/lib/auth-error-codes.ts"
Task: "Arabic copy in src/lib/teacher-login-messages.ts"
Task: "Failing hash/TTL tests in tests/features/auth-009-teacher-login-recovery.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Back control → `/login`
5. Demo if ready (recovery mail can follow)

### Incremental Delivery

1. Setup + Foundational → tokens + public routes
2. US1 → back navigation (MVP)
3. US2 → forgot password (locked-out teachers unblocked)
4. US3 → magic link
5. US4 → visual polish
6. Polish → registry + CI gates

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Then:
   - Dev A: US1 login back link + e2e
   - Dev B: US2 recovery lib/actions/reset page (owns `src/actions/teacher-login-recovery.ts`)
   - Dev C: waits on B for US3 magic consume, or takes tests-only T014/T019
3. US4 after CTAs exist

---

## Notes

- `[P]` only when files do not conflict
- Do not email non-teachers; inactive → AUTH-007 copy
- Magic consume must use `establishSession` (AUTH-003)
- `www.almoayed.app` is not used in emailed links; `getAppUrl()` is
- Commit after each task or logical group if the user asks
- Next: `/speckit-implement`
