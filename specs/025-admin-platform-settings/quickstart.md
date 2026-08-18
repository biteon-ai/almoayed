# Quickstart: Admin Global Platform Settings

**Feature**: ADMIN-002  
**Branch**: `025-admin-platform-settings`

## Prerequisites

- Super Admin credentials (`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`).
- Migration `018_platform_settings.sql` applied (`npx supabase db push` or project equivalent).
- Existing WhatsApp OTP env (BiteonSwitch or `BITEONSWITCH_MOCK`) for the Fixed OTP **off** path.

## Super Admin: view and toggle

1. Sign in at `/admin/login` → open **إعدادات المنصة** (`/admin/settings`).
2. Confirm Demo Mode is on (seed) and Fixed OTP is off; code field shows `123456`.
3. Toggle Demo Mode off → Arabic success toast; switch stays off after reload.
4. In a private window open `/login` → **no** «تجربة» tab.
5. Toggle Demo Mode on → «تجربة» returns; demo student/teacher shortcuts work.

## Fixed OTP on

1. On `/admin/settings`, turn Fixed OTP on (keep code `123456` or set another 4–8 digit code and save).
2. Sign out. Open `/login`, enter a **real registered** WhatsApp (not necessarily demo), submit.
3. Expected: **no** BiteonSwitch hosted page / no WhatsApp message. In-app OTP field appears.
4. Enter the configured code → land on student or teacher home (AUTH-007 still blocks inactive accounts).
5. Repeat with a wrong code → Arabic error, still signed out.

## Fixed OTP off

1. Turn Fixed OTP off and save.
2. Start WhatsApp login again → BiteonSwitch (or mock bounce) as today.
3. Entering `123456` in any leftover UI must not mint a session.

## Access control

| Actor | `/admin/settings` | Save flags |
|-------|-------------------|------------|
| Signed out | Redirect `/admin/login` | No |
| Student / teacher | Redirect `/admin/login` | No |
| Impersonating admin | Redirect `/admin/login` | No |
| Super Admin | Page + code visible | Yes |

## Failure / fallback

- Stop the database (or break the service role) briefly: `/login` still loads; «تجربة» follows `AUTH_DEMO_BYPASS` / `NODE_ENV`; WhatsApp login uses real/mock BiteonSwitch (Fixed OTP off).
- Admin settings page shows Arabic load error, not a successful empty form.

## Automated

```bash
npx supabase db push   # or equivalent
npm run test:unit      # tests/features/admin-002-platform-settings.test.ts
npx playwright test e2e/admin-002-settings.spec.ts
```

Unit tests must cover: parse/fallback, `codesMatch`, Demo Mode gate on `loginDemoAccount`, `startBiteonSwitchOtp` returns `fixed_otp_required` when usable, usable=false does not accept the stored code.
