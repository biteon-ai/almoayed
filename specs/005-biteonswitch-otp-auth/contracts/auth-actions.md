# Contract: Auth Server Actions & Admin Fallback

**Features**: AUTH-002, AUTH-005, AUTH-003, demo  
**Date**: 2026-07-21

## `registerStudent` (AUTH-002)

**Module**: `src/actions/login.ts` (or `auth.ts` if consolidated)  
**Type**: Server Action (`"use server"`)

**Input** (`FormData`):

| Field | Required | Rules |
|-------|----------|-------|
| `full_name` | yes | trimmed non-empty |
| `whatsapp_number` | yes | normalize; 10–15 digits |
| `teacher_code` | yes | must match existing `TEACHER.teacher_code` |

**Success** (`LoginState`-like or dedicated type):

```ts
{ status: "registered"; next: "otp" }
```

UI then shows success Arabic copy + primary CTA to start OTP (does not set `isLoggedIn`).

**Errors** (reuse `AuthErrorCode` where possible):

| Case | Behavior |
|------|----------|
| Invalid WhatsApp | field error |
| Invalid teacher code | field error; no profile insert |
| WhatsApp already registered | steer to OTP CTA (`already_registered`) |
| Supabase failures | generic Arabic + logged `SERVER_AUTH_FAILURE` |

**Must not**: call `establishSession`.

---

## `startBiteonSwitchOtp` (AUTH-001)

See [biteonswitch-otp.md](./biteonswitch-otp.md).

---

## `loginAdminFallback` (AUTH-005)

**Module**: `src/actions/auth.ts`  
**Route UI**: `/admin/login` only

**Input** (`FormData`):

| Field | Required |
|-------|----------|
| `whatsapp_number` | yes |
| `admin_secret` | yes |

**Server checks** (order):
1. Normalize WhatsApp
2. `ADMIN_FALLBACK_SECRET` configured; timing-safe compare with submitted secret
3. Profile exists, `role === 'TEACHER'`
4. WhatsApp ∈ `ADMIN_WHATSAPP_ALLOWLIST`
5. `establishSession(profile, null)` — AUTH-003 updates `last_session_id`
6. Return `{ status: "success", role: "TEACHER" }` → client redirect `/teacher/dashboard`

**Failures**: Generic Arabic “تعذر تسجيل الدخول” (do not reveal whether allowlist vs secret vs role failed). Log detailed reason server-side only.

**Must not**: Appear on `/login` UI.

---

## Demo bypass (FR-012)

**Gating**: `AUTH_DEMO_BYPASS=true` or non-production.

**Behavior**: Existing demo buttons on `/login` may call a narrowed path that mints session for seeded demo WhatsApps only (`963912345678`, `963987654321`) without BiteonSwitch.

**Production**: Demo buttons hidden or no-op when bypass disabled.

---

## `logout` (AUTH-004)

Unchanged: clear `last_session_id`, destroy iron-session, redirect `/login`.

---

## UI contracts (Arabic / RTL)

| Surface | Must include |
|---------|--------------|
| `/login` | Registration fields + submit “إنشاء حساب”; distinct OTP CTA “تسجيل الدخول عبر واتساب”; no admin fields |
| `/register` | Same as `/login` (alias) |
| `/admin/login` | WhatsApp + secret; not linked from student registration |
| OTP errors | Arabic messages for outage / invalid / register_required |

Spekit: reuse `loginWhatsappField` / `loginSubmit` where applicable; add `loginOtpCta` and `adminLoginForm` if new distinct hooks are required.
