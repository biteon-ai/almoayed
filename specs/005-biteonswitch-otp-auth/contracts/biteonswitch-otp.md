# Contract: BiteonSwitch OTP (hosted redirect + callback)

**Feature**: AUTH-001  
**Date**: 2026-07-21

## Overview

Al-Moayed does not collect OTP codes in its own UI for production users. Users are redirected to BiteonSwitch hosted login; Al-Moayed receives a callback and **verifies** the result server-side before minting a session.

> Endpoint paths below are the **Al-Moayed side** contract plus the adapter’s expected provider shapes. Provider base URLs are env-configured until official BiteonSwitch docs are attached.

## Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `BITEONSWITCH_API_KEY` | yes (prod) | Server verify / API auth |
| `BITEONSWITCH_APP_ID` | yes (prod) | App identity on hosted login |
| `BITEONSWITCH_CALLBACK_URL` | yes | Absolute callback URL registered with provider |
| `BITEONSWITCH_HOSTED_LOGIN_URL` | recommended | Full hosted login base or template URL |
| `BITEONSWITCH_API_BASE_URL` | recommended | Base for token verification HTTP call |

## 1. Start OTP (Server Action or route)

**Name**: `startBiteonSwitchOtp`

**Input** (optional):

| Field | Type | Notes |
|-------|------|-------|
| `whatsapp_number` | string | Optional hint only; identity comes from provider verify |

**Server steps**:
1. Insert `auth_otp_states` row → `stateId`
2. Build hosted URL including `app_id`, `callback_url`, `state=stateId`
3. Return `{ redirectUrl }` or `redirect(redirectUrl)`

**Failure**: If config missing or provider URL cannot be built → Arabic outage/config error (no admin fields exposed).

## 2. Hosted login (external)

User completes WhatsApp OTP on BiteonSwitch. Provider redirects browser to:

```http
GET /api/auth/biteonswitch/callback?token=...&state=...
```

(Additional provider params allowed; ignored if unused.)

## 3. Callback Route Handler

**Path**: `GET /api/auth/biteonswitch/callback`  
**Runtime**: Node (Server)

**Steps**:
1. Read `token`, `state`
2. Load `auth_otp_states` by `state`; reject if missing, expired, or `consumed_at` set
3. `verifyCallbackToken({ token, state })` using API key → `{ whatsappNumber }`
4. Mark state consumed
5. Lookup `profiles` by `whatsapp_number`
6. If no profile → redirect `/login?error=register_required` (Arabic message on page)
7. Resolve `currentTeacherId` for students (active link preferred)
8. `establishSession(profile, teacherId)` (AUTH-003)
9. Redirect `TEACHER` → `/teacher/dashboard`, `STUDENT` → `/dashboard`

**Errors** (redirect to `/login?error=...` with mapped Arabic copy):
- `otp_invalid` — verify failed / expired token
- `otp_replay` — state already consumed
- `otp_unavailable` — provider/network failure
- `register_required` — verified WhatsApp has no profile

## 4. Adapter: `verifyCallbackToken`

**Expected provider interaction** (illustrative):

```http
POST {BITEONSWITCH_API_BASE_URL}/v1/otp/verify
Authorization: Bearer {BITEONSWITCH_API_KEY}
Content-Type: application/json

{ "token": "...", "app_id": "...", "state": "..." }
```

**Expected success body** (normalized by adapter):

```json
{ "ok": true, "whatsapp_number": "963987654321", "provider_ref": "..." }
```

**Expected failure**: non-2xx or `{ "ok": false }` → treat as `otp_invalid` / `otp_unavailable`.

If real BiteonSwitch schema differs, change **only** `src/lib/biteonswitch/client.ts` mapping — keep Route Handler steps stable.

## 5. Idempotency / security

- Callback must not trust client-supplied WhatsApp without verify
- Secrets never sent to client bundles (`NEXT_PUBLIC_*` forbidden for API key / admin secret)
- `state` single-use
- HTTPS in production (`cookieOptions.secure` already env-based)
