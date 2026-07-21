---
description: "Task list for BiteonSwitch OTP auth, registration-first login, and admin fallback"
---

# Tasks: BiteonSwitch OTP Auth & Admin Fallback

**Input**: Design documents from `specs/005-biteonswitch-otp-auth/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Tests**: Included per plan Phase 2 outline (Vitest feature suites) — extend existing patterns in `tests/features/`, not TDD-first.

**Organization**: Stories ordered MVP-first — US1 (OTP sign-in) → US2 (registration) → US3 (admin fallback) → US4 (demo). US1 and US2 both touch `src/app/login/login-form.tsx`; complete US1 CTA wiring before/alongside US2 form rewrite carefully to avoid conflicting edits.

**Feature IDs**: AUTH-001, AUTH-002, AUTH-003, AUTH-005

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US4 maps to spec user stories
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Env documentation and library scaffolding before auth behavior changes

- [x] T001 Create `.env.local.example` documenting `BITEONSWITCH_*`, `ADMIN_FALLBACK_SECRET`, `ADMIN_WHATSAPP_ALLOWLIST`, `AUTH_DEMO_BYPASS`, and existing Supabase/`SESSION_SECRET` keys per `specs/005-biteonswitch-otp-auth/research.md`
- [x] T002 [P] Add BiteonSwitch types in `src/lib/biteonswitch/types.ts` (`VerifyResult`, hosted login params) per `specs/005-biteonswitch-otp-auth/contracts/biteonswitch-otp.md`
- [x] T003 [P] Add env config reader `getBiteonSwitchConfig()` in `src/lib/biteonswitch/config.ts` (no secrets in `NEXT_PUBLIC_*`)
- [x] T004 [P] Register spekit targets `loginOtpCta` and `adminLoginForm` in `src/lib/spekit-targets.ts` and `.speckit/spekit-targets.yaml`

**Checkpoint**: Env example exists; BiteonSwitch config/types stubs compile

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared session minting, OTP state table, and provider adapter — MUST complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Extract shared `establishSession(profile, teacherId)` from `src/actions/login.ts` into `src/lib/auth-session.ts` (updates `profiles.last_session_id` + iron-session; AUTH-003)
- [x] T006 Refactor `src/actions/login.ts` to import `establishSession` from `src/lib/auth-session.ts` without changing current demo/login behavior yet (temporary compatibility)
- [x] T007 Add Supabase migration `supabase/migrations/005_auth_otp_states.sql` for `auth_otp_states` (`id`, `whatsapp_hint`, `created_at`, `consumed_at`, `provider_ref`) per `specs/005-biteonswitch-otp-auth/data-model.md`
- [x] T008 [P] Implement `buildHostedLoginUrl` and `verifyCallbackToken` in `src/lib/biteonswitch/client.ts` (env-based HTTP; mockable failure modes for outage)
- [x] T009 [P] Add auth error codes + Arabic UI message mappings for OTP/register/admin paths in `src/lib/auth-error-codes.ts` and `src/lib/login-ui-messages.ts` (`otp_invalid`, `otp_replay`, `otp_unavailable`, `register_required`, `already_registered`, etc.)
- [x] T010 [P] Implement admin allowlist + timing-safe secret helpers in `src/lib/admin-fallback.ts` (`isAdminWhatsAppAllowed`, `verifyAdminFallbackSecret`)

**Checkpoint**: Foundation ready — session helper extracted; OTP states migratable; BiteonSwitch + admin helpers exist; stories can proceed

---

## Phase 3: User Story 1 — Existing User Signs In via External OTP (Priority: P1) 🎯 MVP

**Goal**: Existing student/teacher completes BiteonSwitch WhatsApp OTP, returns via callback, gets iron-session with AUTH-003, lands on role home. Outage shows Arabic retry (no student emergency login).

**Independent Test**: With an existing profile, start OTP → complete verify (or mock) → `/dashboard` or `/teacher/dashboard`; second device invalidates first; bad/replay state does not mint session.

### Implementation for User Story 1

- [x] T011 [US1] Add `startBiteonSwitchOtp` Server Action in `src/actions/biteonswitch.ts` (insert `auth_otp_states`, return/redirect hosted URL; Arabic error if config/provider unavailable)
- [x] T012 [US1] Implement `GET` callback Route Handler in `src/app/api/auth/biteonswitch/callback/route.ts` per `specs/005-biteonswitch-otp-auth/contracts/biteonswitch-otp.md` (verify → consume state → profile lookup → `establishSession` → role redirect)
- [x] T013 [US1] Add prominent OTP CTA on `src/app/login/login-form.tsx` calling `startBiteonSwitchOtp` with `data-spekit={SPEKIT.loginOtpCta}`; map `?error=` query params to Arabic messages
- [x] T014 [US1] Ensure callback failures redirect to `/login?error=...` with outage/invalid/replay/register_required handling (no admin fields on this page)
- [x] T015 [P] [US1] Add Vitest coverage for verify mapping, state replay rejection, and role redirect helpers in `tests/features/auth-001-biteonswitch.test.ts`

**Checkpoint**: US1 complete — existing users can OTP sign-in; AUTH-003 holds; outage messaging works

---

## Phase 4: User Story 2 — New Student Registers with Teacher Code (Priority: P1)

**Goal**: `/login` is registration-first (name + WhatsApp + teacher code); creates profile + teacher link without minting session; steers existing WhatsApp to OTP; `/register` aliases same experience.

**Independent Test**: New WhatsApp + valid teacher code → profile/link exist, not signed in, guided to OTP; invalid code fails; duplicate WhatsApp → OTP CTA.

### Implementation for User Story 2

- [x] T016 [US2] Implement `registerStudent` Server Action in `src/actions/login.ts` per `specs/005-biteonswitch-otp-auth/contracts/auth-actions.md` (create/link only; **never** call `establishSession`)
- [x] T017 [US2] Remove/replace session-minting registration path from legacy `loginWithWhatsApp` in `src/actions/login.ts` so production register/OTP flows no longer mint on form submit (keep thin wrappers only if needed for demos — see US4)
- [x] T018 [US2] Rewrite `src/app/login/login-form.tsx` primary form for registration (Arabic copy, RTL, touch targets) wired to `registerStudent`; keep OTP CTA from US1; hide admin fields
- [x] T019 [P] [US2] Add `/register` alias page in `src/app/register/page.tsx` that renders the same registration experience or redirects to `/login`
- [x] T020 [P] [US2] Update `src/app/login/page.tsx` copy/shell for registration-first landing if needed
- [x] T021 [P] [US2] Add Vitest cases for register success (no session), invalid teacher code, and duplicate WhatsApp in `tests/features/auth-002-register.test.ts`

**Checkpoint**: US2 complete — registration creates link without sign-in; OTP remains the only mint path for normal users

---

## Phase 5: User Story 3 — Admin Emergency / Fallback Sign-In (Priority: P2)

**Goal**: Dedicated `/admin/login` authenticates allowlisted teacher WhatsApp + shared secret, mints session with AUTH-003, reaches teacher dashboard when BiteonSwitch is down. Not linked from student UI.

**Independent Test**: Correct allowlisted teacher + secret → `/teacher/dashboard`; wrong secret/non-allowlisted → denied; `/login` has no admin fields.

### Implementation for User Story 3

- [x] T022 [US3] Implement `loginAdminFallback` Server Action in `src/actions/auth.ts` using `src/lib/admin-fallback.ts` + `establishSession` (generic Arabic failure; detailed server logs only)
- [x] T023 [P] [US3] Create admin login UI in `src/app/admin/login/page.tsx` and `src/app/admin/login/admin-login-form.tsx` with `data-spekit={SPEKIT.adminLoginForm}`
- [x] T024 [US3] Confirm `src/middleware.ts` leaves `/admin/login` public and still protects `/teacher/*` for signed-in teachers only
- [x] T025 [P] [US3] Add Vitest cases for secret mismatch, allowlist miss, non-teacher role, and successful mint in `tests/features/auth-005-admin-fallback.test.ts`

**Checkpoint**: US3 complete — admin fallback works independently of BiteonSwitch; student UI unchanged

---

## Phase 6: User Story 4 — Demo Accounts Remain Usable Locally (Priority: P3)

**Goal**: Seeded demo teacher/student can still obtain sessions locally without live BiteonSwitch when bypass is enabled.

**Independent Test**: With `AUTH_DEMO_BYPASS=true` (or non-production), demo buttons for `963912345678` / `963987654321` mint sessions to role homes; bypass off in prod-like env hides/no-ops demos.

### Implementation for User Story 4

- [x] T026 [US4] Gate demo session mint path in `src/actions/login.ts` (or dedicated helper) behind `AUTH_DEMO_BYPASS` / non-production; call `establishSession` only for seeded demo WhatsApps
- [x] T027 [US4] Show or hide demo controls in `src/app/login/login-form.tsx` according to bypass flag (client-safe public flag via `NEXT_PUBLIC_AUTH_DEMO_BYPASS` **only if needed**, else server-driven prop from `page.tsx`)
- [x] T028 [P] [US4] Document demo env toggle in `.env.local.example` and note in `specs/005-biteonswitch-otp-auth/quickstart.md` if any step drift

**Checkpoint**: US4 complete — local demos work; production OTP-primary preserved

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Registry sync, quality gates, manual QA

- [x] T029 [P] Update AUTH-001 / AUTH-002 acceptance + routes and add AUTH-005 in `.speckit/spec.yaml`
- [x] T030 [P] Delete or note supersession of empty orphan `specs/004-biteonswitch-otp-auth/` draft if still present
- [x] T031 Run `npm run lint && npm run typecheck && npm run test` and fix regressions from auth refactor
- [x] T032 Run `npm run build` and fix any App Router / Route Handler issues
- [x] T033 Execute manual checklist in `specs/005-biteonswitch-otp-auth/quickstart.md` (register → OTP → admin fallback → demo → device lock)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: Depends on Foundational — MVP
- **US2 (Phase 4)**: Depends on Foundational; ideally after US1 OTP CTA exists (same `login-form.tsx`)
- **US3 (Phase 5)**: Depends on Foundational (`establishSession` + admin helpers); independent of US1/US2 UI
- **US4 (Phase 6)**: Depends on Foundational session helper; coordinates with US2 login form
- **Polish (Phase 7)**: After desired stories complete

### User Story Dependencies

| Story | Can start after | Notes |
|-------|-----------------|-------|
| US1 OTP (P1) | Phase 2 | MVP — no dependency on registration rewrite |
| US2 Register (P1) | Phase 2 (+ prefer US1 CTA present) | Shares `login-form.tsx` with US1 |
| US3 Admin (P2) | Phase 2 | Parallelizable with US1/US2 (different files) |
| US4 Demo (P3) | Phase 2 | Touch `login-form.tsx` after US2 form rewrite when possible |

### Parallel Opportunities

- T002, T003, T004 in Setup
- T008, T009, T010 in Foundational (after T005–T007 as needed; T008/T009/T010 parallel once migration/helper extract underway)
- US3 (T022–T025) can run in parallel with US1/US2 if different developers
- T015, T021, T025 test files are parallel across stories
- T029, T030 in Polish

---

## Parallel Example: After Foundational

```bash
# Developer A — US1 MVP
Task: "startBiteonSwitchOtp in src/actions/biteonswitch.ts"
Task: "callback Route Handler in src/app/api/auth/biteonswitch/callback/route.ts"

# Developer B — US3 admin (parallel, different files)
Task: "loginAdminFallback in src/actions/auth.ts"
Task: "admin login UI in src/app/admin/login/"

# Then serialize US2 on login-form.tsx after US1 CTA lands
Task: "registerStudent + rewrite src/app/login/login-form.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (OTP sign-in)
4. **STOP and VALIDATE** with existing seeded profiles + mock/real callback
5. Then add US2 registration so new students can join

### Incremental Delivery

1. Setup + Foundational → shared mint + provider adapter
2. US1 → returning users on BiteonSwitch (MVP)
3. US2 → registration-first public page
4. US3 → admin outage resilience
5. US4 → local demo ergonomics
6. Polish → `.speckit/spec.yaml` + quickstart QA + build

### Suggested MVP Scope

**US1 only** (T001–T015): existing-user OTP + callback + device lock. Registration and admin can follow in the same branch before merge.

---

## Notes

- Do not put admin fallback controls on `/login` (FR-008)
- `registerStudent` must not mint sessions (clarification Q2 / FR-005)
- Admin fallback requires WhatsApp + secret + allowlisted `TEACHER` (clarification Q1)
- AUTH-003 applies to OTP and admin fallback (clarification Q4)
- Ordinary users get outage/retry only when BiteonSwitch is down (clarification Q5)
- Commit after each task or logical group; stop at checkpoints to validate independently
