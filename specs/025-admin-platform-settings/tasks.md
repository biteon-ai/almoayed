---
description: "Task list for ADMIN-002 Admin Global Platform Settings"
---

# Tasks: Admin Global Platform Settings (ADMIN-002)

**Input**: Design documents from `/specs/025-admin-platform-settings/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — plan requires Vitest for parse/fallback/Demo Mode/Fixed OTP and Playwright for settings + login smoke.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US5)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js app: `src/`, `tests/`, `e2e/`, `supabase/migrations/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema, Spekit, and registry scaffolding for ADMIN-002

- [x] T001 Create migration `supabase/migrations/018_platform_settings.sql` with `platform_settings` (`key`, `value jsonb`, `updated_at`, `updated_by`), deny-all RLS, and seed `demo_mode_enabled=true`, `fixed_otp_enabled=false`, `fixed_otp_code="123456"` per `specs/025-admin-platform-settings/data-model.md`
- [x] T002 [P] Add SPEKIT keys `adminNavSettings`, `adminPlatformSettings`, `adminDemoModeSwitch`, `adminFixedOtpSwitch`, `adminFixedOtpCode`, `adminSettingsSave`, `loginFixedOtpField` in `src/lib/spekit-targets.ts`
- [x] T003 [P] Register the same ADMIN-002 Spekit targets in `.speckit/spekit-targets.yaml`
- [x] T004 [P] Add draft `ADMIN-002` feature entry (status `pending`) in `.speckit/spec.yaml` with route `/admin/settings` and planned files from `specs/025-admin-platform-settings/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Settings read/parse helpers and Arabic copy shared by all stories

**⚠️ CRITICAL**: No user story UI/action work until this phase is complete

- [x] T005 Implement `getPlatformSettings`, `isDemoModeEnabled`, `isFixedOtpUsable`, `validateFixedOtpCode`, and `codesMatch` (`timingSafeEqual`) in `src/lib/platform-settings.ts` using `requestCache` and admin client per `specs/025-admin-platform-settings/contracts/server-actions.md` (env fallback for Demo Mode; fail-closed Fixed OTP)
- [x] T006 [P] Add Arabic settings/login copy (save success/error, demo helper, fixed-OTP helper, invalid code, load failure) in `src/lib/platform-settings-messages.ts`
- [x] T007 [P] Add `[ADMIN-002]` Vitest for parse, env fallback, invalid-code, and `codesMatch` in `tests/features/admin-002-platform-settings.test.ts`

**Checkpoint**: Foundation ready — US1–US5 can proceed

---

## Phase 3: User Story 1 — Super Admin views current flags (Priority: P1) 🎯 MVP

**Goal**: `/admin/settings` shows Demo Mode, Fixed OTP, and the stored test code in Arabic RTL.

**Independent Test**: Sign in as Super Admin → **إعدادات المنصة** → switches and code match seeded/saved values; phone layout is RTL and tappable.

### Implementation for User Story 1

- [x] T008 [US1] Implement `getAdminPlatformSettings` (require Super Admin, return parsed settings including code) and `updatePlatformSettings` stub that upserts provided keys with `updated_by` in `src/actions/platform-settings.ts`
- [x] T009 [US1] Create `src/components/admin/PlatformSettingsForm.tsx` with two Cards, Switch + helper text, code `Input` (`dir="ltr"`), Spekit hooks, `HubToast`, pending/disabled states per `specs/025-admin-platform-settings/contracts/ui-components.md`
- [x] T010 [US1] Create RSC page `src/app/admin/(portal)/settings/page.tsx` that loads settings and renders `PlatformSettingsForm`; Arabic load-error if select fails
- [x] T011 [US1] Add nav link «إعدادات المنصة» (`SPEKIT.adminNavSettings`) in `src/app/admin/(portal)/layout.tsx`

**Checkpoint**: Super Admin can open settings and see live flag values

---

## Phase 4: User Story 2 — Super Admin toggles Demo Mode (Priority: P1)

**Goal**: Demo Mode switch hides/shows «تجربة» and refuses demo shortcut login without a redeploy.

**Independent Test**: Toggle off → private `/login` has no «تجربة» and demo click is refused; toggle on → tab and shortcuts return; Arabic toast on save/fail.

### Implementation for User Story 2

- [x] T012 [US2] Wire Demo Mode Switch in `src/components/admin/PlatformSettingsForm.tsx` to `updatePlatformSettings({ demoModeEnabled })` with revert + Arabic toast on failure
- [x] T013 [US2] Pass `demoEnabled` from `await isDemoModeEnabled()` in `src/app/login/page.tsx` instead of `isAuthDemoBypassEnabled()`
- [x] T014 [US2] Gate `loginDemoAccount` in `src/actions/login.ts` with `await isDemoModeEnabled()` so a hidden tab cannot mint a demo session
- [x] T015 [P] [US2] Extend `[ADMIN-002]` Vitest for Demo Mode override vs env fallback in `tests/features/admin-002-platform-settings.test.ts`

**Checkpoint**: Public demo tab and shortcut honor the saved flag on the next login

---

## Phase 5: User Story 5 — Non-admins cannot view or change settings (Priority: P1)

**Goal**: Only Super Admin (not impersonation) can read the test code or upsert flags.

**Independent Test**: Signed-out / student / teacher / impersonation hitting `/admin/settings` or the save action are denied; `/login` never receives the test code.

### Implementation for User Story 5

- [x] T016 [US5] Enforce `requireSuperAdmin()` at the start of every function in `src/actions/platform-settings.ts` (impersonation must not upsert); never pass `fixedOtpCode` into `src/app/login/login-form.tsx` props
- [x] T017 [P] [US5] Add Playwright access smoke in `e2e/admin-002-settings.spec.ts`: `/admin/settings` redirects to `/admin/login` when signed out; login page HTML does not contain the stored test code

**Checkpoint**: Settings mutations are Super Admin–only

---

## Phase 6: User Story 3 — Super Admin enables Fixed OTP (Priority: P1)

**Goal**: When Fixed OTP is usable, WhatsApp login/join OTP does not call BiteonSwitch; the configured code signs the user in.

**Independent Test**: Turn flag on → WhatsApp login shows in-app OTP, no provider redirect; correct code → home; wrong code → Arabic error; turn off → BiteonSwitch resumes and `123456` is rejected.

### Implementation for User Story 3

- [x] T018 [US3] Extract `completeWhatsAppLogin` from `src/app/api/auth/biteonswitch/callback/route.ts` into `src/lib/auth-otp-complete.ts` and switch the callback to use it (AUTH-007 / AUTH-008 join-code behavior unchanged)
- [x] T019 [US3] Extend `startBiteonSwitchOtp` in `src/actions/biteonswitch.ts` to return `{ status: "fixed_otp_required", stateId }` when `isFixedOtpUsable()` (still insert `auth_otp_states`; **no** `buildHostedLoginUrl`); if enabled but code invalid return `OTP_UNAVAILABLE` without falling through to BiteonSwitch
- [x] T020 [US3] Implement `verifyFixedOtp` in `src/actions/auth-otp.ts` (or `src/actions/biteonswitch.ts`) per contracts: `codesMatch`, consume OTP state, call `completeWhatsAppLogin`
- [x] T021 [US3] Pass `fixedOtpEnabled` from `isFixedOtpUsable()` in `src/app/login/page.tsx` and add in-app OTP field (`SPEKIT.loginFixedOtpField`) in `src/app/login/login-form.tsx` when start returns `fixed_otp_required`
- [x] T022 [US3] Handle `fixed_otp_required` from `joinTrialStudent` / join client in `src/actions/join.ts` and `src/app/join/[code]/join-form.tsx` so existing-number OTP uses the same in-app code step
- [x] T023 [US3] Wire Fixed OTP Switch in `src/components/admin/PlatformSettingsForm.tsx` to `updatePlatformSettings({ fixedOtpEnabled })` with unusable-code Arabic warning
- [x] T024 [P] [US3] Extend `[ADMIN-002]` Vitest for `startBiteonSwitchOtp` / `isFixedOtpUsable` / wrong-code reject in `tests/features/admin-002-platform-settings.test.ts`

**Checkpoint**: Sandbox OTP works on login and post-trial OTP paths; live provider unused while flag is on

---

## Phase 7: User Story 4 — Super Admin sets the test verification code (Priority: P2)

**Goal**: Super Admin can rotate the 4–8 digit global test code; old code stops working while Fixed OTP stays on.

**Independent Test**: Save `654321` → old `123456` rejected, new code accepted; empty/short/non-numeric save blocked with Arabic validation; changing the code while Fixed OTP is off stores it but does not accept it until the flag is on.

### Implementation for User Story 4

- [x] T025 [US4] Wire code field + «حفظ الرمز» (`SPEKIT.adminSettingsSave`) in `src/components/admin/PlatformSettingsForm.tsx` to `updatePlatformSettings({ fixedOtpCode })` using `validateFixedOtpCode` (previous code unchanged on validation/DB error)
- [x] T026 [P] [US4] Extend `[ADMIN-002]` Vitest for code validation and rotate-then-match in `tests/features/admin-002-platform-settings.test.ts`

**Checkpoint**: Operators can rotate the sandbox secret from the admin UI

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Registry, e2e, verification, regression

- [x] T027 [P] Wire remaining `data-spekit` attributes on settings switches/code/save in `src/components/admin/PlatformSettingsForm.tsx`
- [x] T028 Update `ADMIN-002` to `implemented` with acceptance criteria in `.speckit/spec.yaml` (do not overwrite `ADMIN-001`)
- [x] T029 [P] Extend `e2e/admin-002-settings.spec.ts` for Arabic RTL settings page (or skip-authed if CI placeholder Supabase) plus public login still RTL when Demo Mode is on
- [x] T030 Run `specs/025-admin-platform-settings/quickstart.md` validation (`npx supabase db push`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:unit`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 (table exists for live reads; helpers can be unit-tested with mocks before push)
- **US1 (Phase 3)**: Depends on Phase 2 helpers + T001
- **US2 (Phase 4)**: Depends on US1 form + `isDemoModeEnabled`
- **US5 (Phase 5)**: Depends on US1 page/action existing
- **US3 (Phase 6)**: Depends on Phase 2 + AUTH-001 callback extract; can proceed in parallel with US2 after US1
- **US4 (Phase 7)**: Depends on US1 form + US3 verify path for independent test of rotation
- **Polish (Phase 8)**: Depends on desired user stories complete

### User Story Dependencies

| Story | Depends on | Independent test |
|-------|------------|------------------|
| **US1** | Phase 2 | Super Admin sees current flags on `/admin/settings` |
| **US2** | US1 | Toggle Demo Mode → «تجربة» show/hide + demo login refused |
| **US5** | US1 | Non-admin denied; code not on `/login` |
| **US3** | Phase 2 | Fixed OTP on → in-app code, no BiteonSwitch |
| **US4** | US1 + US3 | Rotate code; old code rejected |

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 in parallel after T001 starts
- **Phase 2**: T006, T007 in parallel with T005
- **Phase 3**: T009 can start after T008 types exist; T011 parallel with T010
- **Phase 4**: T013, T014, T015 in parallel after T012
- **Phase 5**: T017 parallel with T016
- **Phase 6**: T018 then T019–T020; T021–T023 after T019; T024 parallel with UI
- **Phase 7**: T026 parallel with T025
- **Phase 8**: T027, T029 in parallel; T028 then T030

### Parallel Example: User Story 1

```bash
# After Phase 2:
Task T008: "Implement get/update in src/actions/platform-settings.ts"
Task T011: "Add nav link in src/app/admin/(portal)/layout.tsx"
# Then T009 form + T010 page
```

### Parallel Example: After US1

```bash
# Developer A — US2 Demo Mode (T012–T015)
# Developer B — US5 access (T016–T017)
# Developer C — US3 Fixed OTP extract + verify (T018–T024)
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1 + Phase 2
2. Complete Phase 3 (US1) — Super Admin can see flags
3. **STOP and VALIDATE**: `/admin/settings` loads seeded values
4. Add US2 before calling Demo Mode “done”; add US3 before calling sandbox OTP “done”

### Incremental Delivery

1. Setup + Foundational → table + helpers
2. US1 → settings page (MVP visibility)
3. US2 → Demo Mode runtime switch
4. US5 → access hardening (required before production)
5. US3 → Fixed OTP sandbox (required for the OTP acceptance criteria)
6. US4 → code rotation
7. Polish → registry, e2e, CI green

### Suggested MVP Scope

**Minimum useful slice**: Phase 1–4 (US1 + US2).  
**Minimum production slice**: add Phase 5 + 6 (US5 + US3). US4 can follow immediately (same form).

---

## Notes

- Do **not** send `fixedOtpCode` to any public Client Component
- Do **not** fall through to BiteonSwitch when Fixed OTP is on but the code is invalid
- Do **not** skip AUTH-008 first-visit OTP-free join; Fixed OTP only replaces provider verify when OTP is already required
- `loginDemoAccount` must use `isDemoModeEnabled()`, not env alone
- Reuse `HubToast` and admin portal layout; do not add a new admin auth path
- Registry ID is **ADMIN-002** — do not overwrite ADMIN-001
- Verify `npm run build` after each phase checkpoint
