# Research: Admin Global Platform Settings

**Date**: 2026-08-18  
**Feature**: ADMIN-002

## 1. Settings storage shape

- **Decision**: Table `platform_settings` with `key TEXT PRIMARY KEY`, `value JSONB NOT NULL`, `updated_at TIMESTAMPTZ`, `updated_by UUID NULL REFERENCES profiles(id)`. Seed three keys: `demo_mode_enabled` (`true`), `fixed_otp_enabled` (`false`), `fixed_otp_code` (`"123456"`).
- **Rationale**: Spec is a small global KV. JSONB stores booleans and the code without extra columns. One table is enough for v1 extra flags later. `updated_by` satisfies FR-014 without a separate audit viewer.
- **Alternatives considered**: Single-row `platform_config` with typed columns — less flexible, more migrations per flag. Env-only flags — cannot change without redeploy (fails the feature). `admin_audit_log` as the source of truth — not a current-value store.

RLS: `ENABLE ROW LEVEL SECURITY` + deny-all policy (same as `auth_otp_states` in `011`). App uses `service_role` admin client.

## 2. Read path and cache

- **Decision**: `getPlatformSettings()` loads all three keys in one select, parses them, memoizes with existing `requestCache()` for the current RSC/action. **No** `unstable_cache` / long TTL. Admin save is a plain upsert; the next login request reads fresh rows.
- **Rationale**: SC-002/SC-003 require the *next* login to honor the new value. A 60s cache would violate that. Three rows are cheap; request memoization avoids duplicate selects inside one login.
- **Alternatives considered**: `unstable_cache` + `revalidateTag` — easy to miss a tag and serve stale OTP policy. Edge Config / Vercel KV — extra product, out of stack defaults.

Failure: if the select throws or returns no rows, Demo Mode falls back to `isAuthDemoBypassEnabled()` (env / non-production default). Fixed OTP is **off**. Never fail open for sandbox OTP.

## 3. Demo Mode vs `AUTH_DEMO_BYPASS`

- **Decision**: After a successful settings read, **DB is source of truth** for showing «تجربة» and for `loginDemoAccount`. Env `AUTH_DEMO_BYPASS` is fallback only when the store is unavailable or unseeded.
- **Rationale**: Runtime toggle without redeploy is the point. Keeping env as a hard override would make the admin switch appear broken.
- **Alternatives considered**: Env always AND-ed with DB — operators could not enable demo in production without a deploy. Env always OR-ed — could not fully hide demo if env is true.

Production note: seed is Demo Mode **on** (spec). After first migrate, Super Admin should turn it off if public demo must stay hidden.

`loginDemoAccount` must call `isDemoModeEnabled()` (async) so a hidden tab cannot still mint a demo session.

## 4. Fixed OTP vs BiteonSwitch hosted login

- **Decision**: When Fixed OTP is on **and** a valid code is stored, `startBiteonSwitchOtp` still inserts `auth_otp_states` (reuse TTL + `join_teacher_code`) but **does not** build a BiteonSwitch URL. It returns `{ status: "fixed_otp_required", stateId }`. Login UI shows an in-app numeric OTP field. `verifyFixedOtp` compares the submitted code with `timingSafeEqual` against the stored code, then completes login via a shared `completeWhatsAppLogin` helper extracted from the existing callback.
- **Rationale**: Today AUTH-001 never collects a 6-digit code in-app (hosted provider does). Skipping the provider with no UI would make login impossible. Reusing `auth_otp_states` keeps AUTH-008 join-code handoff. Timing-safe compare matches admin fallback secret style.
- **Alternatives considered**: Bounce through mock `token=mock:whatsapp` without a code — would accept any continuation and ignore the configured code (fails US3.2). Keep sending BiteonSwitch and also accept 123456 — still dispatches WhatsApp (fails FR-006). Duplicate finishLogin in a new action — drift from AUTH-007 / join-link behavior.

When Fixed OTP is on but the stored code is missing/invalid: return `OTP_UNAVAILABLE` (Arabic). Do **not** fall through to live BiteonSwitch (spec edge case).

When Fixed OTP is off: current BiteonSwitch (live or `BITEONSWITCH_MOCK`) unchanged. Mock env is independent of the admin flag.

Wrong test code: existing Arabic OTP error treatment; do not mint; do not consume the OTP state until success (or consume on success only, matching callback).

## 5. Who may read which fields

- **Decision**: Server may read all keys. Client login form receives only booleans: `demoEnabled`, `fixedOtpEnabled`. Admin settings form (after `requireSuperAdmin`) may receive the current code. No public Route Handler lists keys.
- **Rationale**: FR-002 / US5.4 — test code is a sandbox secret. Demo visibility does not require exposing the code.
- **Alternatives considered**: Public `/api/platform-settings` — unnecessary surface. Putting the code in a `NEXT_PUBLIC_` env — cannot rotate from admin UI.

## 6. Admin UI and guards

- **Decision**: Page `src/app/admin/(portal)/settings/page.tsx` under the existing portal layout (already `requireSuperAdmin()`, which rejects impersonation). Mutations via Server Action `updatePlatformSettings`, also calling `requireSuperAdmin()`. Nav item «إعدادات المنصة» next to students. Client form: Shadcn `Switch`, `Input`, Card, reuse `HubToast` (or equivalent) for Arabic success/error. Switches save immediately (per-flag) or a single save of all three — **per-flag save on toggle** plus an explicit save for the code field, both using the same action to keep one code path.
- **Rationale**: Matches ADMIN-001 shell and UI-009 timer-card Switch+toast pattern. Layout guard + action guard is defense in depth. Middleware already treats `/admin/*` as Super Admin–only.
- **Alternatives considered**: New `/api/admin/settings` Route Handler — works (ADMIN-001 style) but the spec/constitution prefer Server Actions for this write. One giant form submit only — slower for a single switch (SC-001).

Validation: `fixed_otp_code` must be 4–8 digits (`/^\d{4,8}$/`). Empty/invalid → Arabic error, previous code unchanged.

## 7. AUTH-008 interaction

- **Decision**: First-time trial join (no profile) still skips OTP. Existing-number join still calls `startBiteonSwitchOtp`. If Fixed OTP is on, that call returns `fixed_otp_required` instead of a hosted URL; join form (or a shared OTP step) must collect the test code the same way as `/login`.
- **Rationale**: FR-008. Do not weaken the hijack rule; only replace provider send/verify when OTP is already required.
- **Alternatives considered**: Leave join on BiteonSwitch while login uses Fixed OTP — inconsistent and still sends WhatsApp from the join path.

## 8. Spekit / registry

- **Decision**: New hooks: `admin-nav-settings`, `admin-platform-settings`, `admin-demo-mode-switch`, `admin-fixed-otp-switch`, `admin-fixed-otp-code`, `admin-settings-save`, `login-fixed-otp-field`. Add `ADMIN-002` to `.speckit/spec.yaml` as pending until implement, then implemented.
- **Rationale**: ENABLE-001; do not overwrite ADMIN-001 ids.
