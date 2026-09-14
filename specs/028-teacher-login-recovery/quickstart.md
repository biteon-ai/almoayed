# Quickstart: Teacher Login Recovery

**Feature**: AUTH-009  
**Branch**: `028-teacher-login-recovery`

## Prerequisites

- Migration `020_teacher_login_tokens.sql` applied (`npx supabase db push`).
- `RESEND_API_KEY` set (not `re_xxxxxxxxx`).
- `RESEND_FROM_EMAIL` verified sender (e.g. `Almoayed <info@almoayed.app>`).
- `NEXT_PUBLIC_APP_URL` matches the environment (local `http://localhost:3000`, prod `https://almoayed.app`).
- An **active** teacher with a known email/password (Super Admin → teachers).
- An **inactive** teacher email for AUTH-007 checks.

## Back to main login

1. Open `/teacher/login` signed out.
2. Tap **العودة لتسجيل الدخول الرئيسي**.
3. Land on `/login` (student WhatsApp login). Teacher password form was not submitted.

## Forgot password (happy path)

1. On `/teacher/login`, tap **نسيت كلمة المرور؟**.
2. Submit the **active** teacher email.
3. See success toast within ~3s. Inbox contains a link to `/teacher/reset?token=…`.
4. Open the link, set a new password (≥ 8 chars, confirm matches), save.
5. Sign in on `/teacher/login` with the **new** password → `/teacher/dashboard`.
6. Re-open the same reset link → invalid Arabic copy; password unchanged.

## Forgot password (errors)

| Input | Expected |
|-------|----------|
| Unknown / student / Super Admin email | No mail; «لا يوجد حساب مدرس بهذا البريد.» |
| Inactive teacher email | No mail; «عذراً، هذا الحساب غير فعال. يرجى التواصل مع الإدارة» |
| Fourth send within 15 minutes | Rate-limit Arabic; no new mail |

## Magic link

1. On `/teacher/login`, tap **أرسل لي رابط دخول لمرة واحدة**, submit active teacher email.
2. Open the emailed `/teacher/magic?token=…` once → teacher dashboard without typing a password.
3. Second open of the same link → `MAGIC_INVALID` copy, signed out.
4. Inactive teacher request or consume → AUTH-007 copy, no session.

## Password login regression

Email + password **دخول المدرس** still works without using forgot/magic.

## Automated

```bash
npx supabase db push
npm run test:unit -- tests/features/auth-009-teacher-login-recovery.test.ts
npm run test:e2e -- e2e/auth-009-teacher-login.spec.ts
npm run lint && npm run typecheck && npm run build
```
