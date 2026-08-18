# Implementation Plan: Admin Global Platform Settings

**Branch**: `025-admin-platform-settings` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/025-admin-platform-settings/spec.md`

**Feature ID (registry)**: `ADMIN-002` — runtime Demo Mode + Fixed WhatsApp OTP  
**Extends**: `ADMIN-001` · `AUTH-001` · `AUTH-002` · `AUTH-006` · `FIX-AUTH-001`

## Summary

Super Admins get `/admin/settings` to toggle **Demo Mode** (public «تجربة» tab) and **Fixed OTP** (sandbox WhatsApp verification with a global test code) without a redeploy. Flags live in a keyed `platform_settings` table. Login reads them on each request (request-memoized, not a long-lived cache). When Fixed OTP is on, AUTH-001 **does not** call BiteonSwitch; the login UI collects the test code in-app and verifies it server-side.

**Technical approach**:
1. Migration `018_platform_settings.sql` — KV table, deny-all RLS, seed three keys.
2. Pure helpers + `getPlatformSettings()` (admin client, `requestCache`) with env fallback for Demo Mode and fail-closed Fixed OTP.
3. Server Actions `updatePlatformSettings` guarded by `requireSuperAdmin()` (blocks impersonation).
4. Admin RTL settings page (Switch + code field + Arabic toasts); nav link in admin shell.
5. Wire `isDemoModeEnabled()` into login page + `loginDemoAccount`. Wire Fixed OTP into `startBiteonSwitchOtp` + new `verifyFixedOtp` (extract shared WhatsApp session completion from the BiteonSwitch callback).

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for Syrian Baccalaureate math

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC + client islands + Server Actions |
| **Database** | **Supabase** — new table `platform_settings` |
| **Data access** | Server Actions + `createAdminClient()`; no client Supabase |
| **Session / auth** | iron-session; `requireSuperAdmin()`; WhatsApp OTP via BiteonSwitch unless Fixed OTP |
| **UI** | Tailwind, Shadcn Switch/Card, RTL, `h-10`–`h-12` |
| **Testing** | Vitest `tests/features/admin-002-*.test.ts`; Playwright `e2e/admin-002-settings.spec.ts` |
| **Target platform** | Mobile-first PWA — admin portal + public `/login` |

**Feature-specific overrides**:

- **Primary Dependencies**: None beyond stack defaults (`crypto.timingSafeEqual` already used)
- **Storage / tables touched**: new `platform_settings`; read path on login; `auth_otp_states` reused for Fixed OTP pending state
- **Performance Goals**: Settings load/save under 30s (SC-001); login adds one small KV select, memoized per request
- **Constraints**: Super Admin only (no impersonation); never expose `fixed_otp_code` on `/login`; AUTH-007 / AUTH-003 still apply after a correct test code; AUTH-008 first-visit OTP skip unchanged
- **Scale/Scope**: One admin page, three keys, two login integration points (demo tab + OTP start/verify)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries | PASS — platform flags are global, not teacher-scoped; no classroom data leaked |
| QUIZ-001 | No answer leakage pre-submit | PASS — no exam payload changes |
| Server layer | Privileged data via Server Actions | PASS — admin client only; settings mutations behind `requireSuperAdmin()` |
| RTL UX | Arabic RTL, touch targets | PASS — settings switches/fields `h-10`–`h-12`; login OTP field same |
| Minimal diff | Match existing patterns | PASS — admin layout nav, Switch, HubToast-style feedback, AUTH-001 actions |
| Passwordless | WhatsApp identity | PASS — Fixed OTP still identifies by WhatsApp; it only sandboxes **verification**. Super Admin email login remains the existing ADMIN-001 exception |

**Feature compliance**: **PASS** — no new constitution exceptions.

**Post-design re-check**: **PASS** — deny-all RLS; public login receives only booleans (`demoEnabled`, `fixedOtpEnabled`); test code stays server-side; fail-closed Fixed OTP if the store is down.

## Project Structure

### Documentation (this feature)

```text
specs/025-admin-platform-settings/
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
supabase/migrations/
└── 018_platform_settings.sql

src/lib/
├── platform-settings.ts        # NEW — keys, parse, getPlatformSettings, isDemoModeEnabled, getFixedOtp
├── platform-settings-messages.ts  # NEW — Arabic copy
├── admin-fallback.ts           # REUSE env AUTH_DEMO_BYPASS as Demo Mode fallback only
├── auth-otp-complete.ts        # NEW (extract) — completeWhatsAppLogin from callback
└── spekit-targets.ts           # NEW admin settings + login OTP hooks

src/actions/
├── platform-settings.ts        # NEW get/update for Super Admin
├── biteonswitch.ts             # EXTEND startBiteonSwitchOtp → fixed_otp_required
├── login.ts                    # EXTEND loginDemoAccount → isDemoModeEnabled()
└── auth-otp.ts                 # NEW verifyFixedOtp (or colocate in biteonswitch.ts)

src/app/admin/(portal)/
├── layout.tsx                  # ADD nav «إعدادات المنصة»
└── settings/page.tsx           # NEW RSC + client form

src/components/admin/
└── PlatformSettingsForm.tsx    # NEW switches, code field, toasts

src/app/login/
├── page.tsx                    # pass demoEnabled + fixedOtpEnabled from settings
└── login-form.tsx              # hide تجربة; in-app OTP when Fixed OTP on

src/app/api/auth/biteonswitch/callback/route.ts  # use extracted completeWhatsAppLogin

.speckit/spec.yaml              # ADMIN-002 pending → implemented on ship
.speckit/spekit-targets.yaml

tests/features/admin-002-platform-settings.test.ts
e2e/admin-002-settings.spec.ts
```

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [none] | — | — |

## Phase 0 / Phase 1

Research, data model, contracts, and quickstart are in this directory. Agent context (`.cursor/rules/specify-rules.mdc`) points here.
