# Quickstart: BiteonSwitch OTP Auth & Admin Fallback

Manual verification after implementation.

## Prerequisites

```bash
cp .env.example .env   # fill Supabase + new auth keys
npx supabase db push               # includes auth_otp_states if added
npm run dev
```

Demo identities (when `AUTH_DEMO_BYPASS=true`):

| Role | WhatsApp | Notes |
|------|----------|-------|
| Teacher | `963912345678` | Code `AlMoayed-DEMO` |
| Student | `963987654321` | Linked to demo teacher |

Admin fallback test: put demo teacher WhatsApp in `ADMIN_WHATSAPP_ALLOWLIST` and set `ADMIN_FALLBACK_SECRET`.

Branch: `005-biteonswitch-otp-auth`

## 1. Registration-first `/login` (AUTH-002)

1. Open `/login` (and `/register` alias).
2. Confirm primary form is name + WhatsApp + teacher code (not “password login”).
3. Confirm OTP CTA visible for existing users; **no** admin secret fields.
4. Register a **new** WhatsApp with `AlMoayed-DEMO`.
5. Expect success guidance to complete WhatsApp OTP — confirm you are **not** on `/dashboard` yet.
6. In Supabase: profile row + `student_teachers` link exist.
7. Re-submit same WhatsApp → steered to OTP (no duplicate profile).

## 2. BiteonSwitch OTP sign-in (AUTH-001)

1. Click OTP CTA (or post-register CTA).
2. Complete hosted OTP (or mock verify in test env).
3. Land on `/dashboard` (student) or `/teacher/dashboard` (teacher).
4. Repeat OTP on a second browser → first session rejected on next protected navigation (`?reason=device_lock` or equivalent) — AUTH-003.
5. Call callback twice with same `state` → second attempt errors; session not corrupted.

## 3. Provider outage (FR-015)

1. Break BiteonSwitch config or simulate network failure on start/verify.
2. Student/teacher see Arabic outage/retry — **no** emergency password on `/login`.
3. Admin still uses `/admin/login` successfully (section 4).

## 4. Admin fallback (AUTH-005)

1. Open `/admin/login` directly (not linked from student UI).
2. Wrong secret or non-allowlisted WhatsApp → denied, no session.
3. Allowlisted teacher WhatsApp + correct secret → `/teacher/dashboard`.
4. Fallback on device B invalidates device A session (AUTH-003).

## 5. Demo bypass (FR-012)

1. With bypass enabled: demo student/teacher buttons still mint sessions.
2. With bypass disabled in a prod-like env: demo path unavailable; OTP/admin paths unchanged.

## 6. Regression

```bash
npm run lint && npm run typecheck && npm run test
npm run build
```

Confirm `.speckit/spec.yaml` lists updated AUTH-001/002 and new AUTH-005.
