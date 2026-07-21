# Data Model: BiteonSwitch OTP Auth & Admin Fallback

**Date**: 2026-07-21  
**Schema source**: Existing `profiles` + `student_teachers`; new optional `auth_otp_states` migration.

## Persistent entities

### Profile (`profiles`) — existing

| Field | Role in this feature |
|-------|----------------------|
| `id` | Session `profileId` |
| `whatsapp_number` | Primary identity (unique); OTP verify + admin fallback lookup |
| `full_name` | Collected at registration |
| `role` | `STUDENT` \| `TEACHER` — redirect + admin gate (`TEACHER` required for fallback) |
| `last_session_id` | AUTH-003 device lock; updated on every successful mint |
| `teacher_code` | Teachers only; validated at student registration |
| `is_subscribed` / `verification_token` | Existing pending-verification behavior may still apply **after** OTP for students without active link — preserve current business rules unless product later changes them |

**Validation**:
- WhatsApp: digits only, length 10–15 (`normalizeWhatsAppNumber`)
- Registration requires non-empty `full_name` (trim) and valid teacher code for new students

**Uniqueness**: `whatsapp_number` UNIQUE — registration of existing number must not insert duplicate (FR-006).

### Teacher link (`student_teachers`) — existing

| Field | Role |
|-------|------|
| `student_id` / `teacher_id` | Link created on successful registration |
| `status` | Default `pending` for new non-demo links (match current `login.ts`) |
| `tier` | Default `free` |

**Rule**: Created at registration time; **not** created by OTP callback.

### OTP state (`auth_otp_states`) — new

| Field | Type | Notes |
|-------|------|-------|
| `id` | `uuid` PK | Used as OAuth-like `state` query param |
| `whatsapp_hint` | `text` nullable | Optional prefill / audit |
| `created_at` | `timestamptz` | TTL e.g. 15 minutes |
| `consumed_at` | `timestamptz` nullable | Set once on successful callback processing |
| `provider_ref` | `text` nullable | Optional BiteonSwitch reference after verify |

**Transitions**:

```text
[created] --callback success--> [consumed] --replay--> reject
[created] --TTL expired------> reject (treat as invalid)
```

**Indexes**: PK on `id`; optional cleanup job/cron later (out of scope v1 — delete expired opportunistically on read).

## Session entity (iron-session — not DB)

| Field | Source |
|-------|--------|
| `profileId` | `profiles.id` |
| `whatsappNumber` | `profiles.whatsapp_number` |
| `fullName` | `profiles.full_name` |
| `role` | `profiles.role` |
| `isLoggedIn` | `true` after mint |
| `sessionToken` | New token; written to `profiles.last_session_id` |
| `currentTeacherId` | Active `student_teachers` link or registration teacher |

## Admin fallback credential (config — not DB)

| Piece | Storage |
|-------|---------|
| Shared secret | `ADMIN_FALLBACK_SECRET` / `ADMIN_SECRET` env |
| Allowlist | `ADMIN_WHATSAPP_ALLOWLIST` env (comma-separated) |
| Profile | Must exist as `TEACHER` with matching WhatsApp |

## State transitions (user-facing)

### New student

```text
Anonymous → submit register → Profile+Link created (not signed in)
         → start OTP → auth_otp_states created
         → BiteonSwitch hosted UI
         → callback verify → Session minted → /dashboard
```

### Existing user

```text
Anonymous → OTP CTA → auth_otp_states → BiteonSwitch → callback → Session → role home
```

### Admin outage path

```text
Anonymous → /admin/login → WhatsApp+secret OK + allowlisted TEACHER
         → Session minted (AUTH-003) → /teacher/dashboard
```

## Out of scope for schema

- New `ADMIN` role enum
- Storing admin secrets in DB
- Storing BiteonSwitch API keys in DB
