# Quickstart: AUTH-007 Block Inactive Login

## Prerequisites

- Branch `020-block-inactive-login`
- No migration required
- Demo / admin access to mark teacher inactive and student link deactivated

## Teacher QA

1. As admin, set a teacher to **معطّل** (`teacher_account_status = inactive`).
2. Attempt WhatsApp OTP login for that teacher → expect Arabic inactive message; no dashboard access.
3. Attempt emergency / email (if provisioned) / demo teacher → same refusal.
4. Re-activate teacher → login succeeds; AUTH-003 device lock still works for a second device.

## Student QA

1. Teacher deactivates the student’s **only** active link → student login (OTP/demo) shows inactive message; no session.
2. Student with **two** teachers: deactivate current only → mid-session navigation keeps student logged in under the other teacher (data scoped to new active teacher).
3. Pending-only new registrant → still completes AUTH-002 limited session (no inactive message).
4. Mid-session: deactivate last active link while student is on `/dashboard` → next navigation → `/login?error=account_inactive` with Arabic copy.

## Automated

```bash
npx vitest run tests/features/auth-007-inactive-login.test.ts
npm run build
```

## Registry

- `.speckit/spec.yaml` → `AUTH-007` (note `FIX-AUTH-002`)
- Error code: `ACCOUNT_INACTIVE` / query `account_inactive`
