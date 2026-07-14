# Quickstart: PROFILE-001 User Profile & Settings

Manual verification after implementation.

## Prerequisites

- Dev server: `npm run dev`
- Demo accounts (from `.speckit/spec.yaml`):
  - Student: WhatsApp `963987654321`
  - Teacher: WhatsApp `963912345678`, code `AlMoayed-DEMO`

## 1. Student settings smoke

1. Log in as demo student → open `/settings` (or nav link from dashboard).
2. Confirm: Arabic RTL layout, name editable, WhatsApp disabled/read-only.
3. Confirm: active teacher code visible, Free/Pro badge with `data-spekit="profile-tier-info"`.
4. If Free: tap **طلب الترقية** → success/pending message.
5. Edit name → Save → refresh → name persists on settings and dashboard welcome.
6. Active Sessions card shows current session active (`data-spekit="profile-session-management"`).
7. Tap Logout → confirm dialog → lands on `/login`.

## 2. Teacher settings smoke

1. Log in as demo teacher → open `/teacher/settings`.
2. Confirm: teacher code with copy button (`data-spekit="profile-teacher-code"`).
3. Confirm: no student Pro upgrade block.
4. Copy code → paste elsewhere → matches `AlMoayed-DEMO`.
5. Save name change → verify teacher dashboard greeting updates.

## 3. Device session (AUTH-003)

1. Log in as student in Browser A.
2. Log in as same student in Browser B (invalidates A per login policy).
3. In Browser B settings → **Log out other devices** (if A somehow still had cookie, it should fail on next action).
4. Browser B remains logged in after action.

## 4. Auth guards

1. Visit `/settings` logged out → redirect to `/login?from=...`
2. Visit `/teacher/settings` as student → redirect to `/dashboard`

## 5. Automated tests

```bash
npm run test -- tests/features/profile-001-settings.test.ts
npm run test:e2e -- e2e/profile-settings.spec.ts
npm run lint && npm run typecheck
```

## 6. Registry sync

- `.speckit/spec.yaml`: add `PROFILE-001` implemented
- `.speckit/spekit-targets.yaml`: three new profile hooks documented
