# Contracts: Routes (ADMIN-002)

## `GET /admin/settings`

- **Auth**: Super Admin session; impersonation redirected to `/admin/login` (existing portal layout).
- **Response**: Arabic RTL settings page. Current parsed flags + test code (admin-only).
- **Errors**: Unauthenticated / non-admin → `/admin/login`. Settings load failure → Arabic error on the page, switches disabled (do not show a fake saved state).

## `GET /login`

- **Auth**: Public.
- **Behavior**: RSC calls `isDemoModeEnabled()` and `isFixedOtpUsable()` (boolean only). Passes `demoEnabled` and `fixedOtpEnabled` into `LoginForm`. **Must not** pass `fixedOtpCode`.
- **Demo**: `demoEnabled === false` → no «تجربة» tab; `loginDemoAccount` also refuses.

## WhatsApp OTP start (existing form → Server Action)

Unchanged URL. Return shape of `startBiteonSwitchOtp` gains `fixed_otp_required` (see server-actions.md). Client stays on `/login` (or join page) and shows the OTP field.

## `POST` Server Action verify (no new public URL)

`verifyFixedOtp` mints session then redirects to `/dashboard` or `/teacher/dashboard` (same as BiteonSwitch callback). Failure stays on `/login?error=…` or returns a Flight error state.

## Unchanged

| Route | Note |
|-------|------|
| `/admin/login`, `/admin/dashboard`, `/admin/teachers`, `/admin/students` | ADMIN-001 |
| `/teacher/login` | Email/password — not Fixed OTP |
| `/join/[code]` | AUTH-008 first visit still OTP-free; existing number uses Fixed OTP when that flag is on |
| `/api/auth/biteonswitch/callback` | Live/mock BiteonSwitch only; unused while Fixed OTP is usable |
