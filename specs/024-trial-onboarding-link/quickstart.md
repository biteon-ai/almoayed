# Quickstart: Fast Student Trial Onboarding Link

**Feature**: AUTH-008 / TEACH-015  
**Branch**: `024-trial-onboarding-link`

## Prerequisites

- App env: Supabase admin + `SESSION_SECRET` (existing `.env.example`).
- `NEXT_PUBLIC_APP_URL` set to the origin used in copied links (local: `http://localhost:3000`).
- BiteonSwitch configured **or** mock OTP for the existing-number path.
- Migration `016_trial_join_otp_code.sql` applied (`npx supabase db push` or project equivalent).

Demo teacher code: `AlMoayed-DEMO` (WhatsApp `963912345678`).

## Teacher: copy / share (TEACH-015)

1. Log in as demo teacher → `/teacher/dashboard`.
2. Invite card shows `http://localhost:3000/join/AlMoayed-DEMO` (or current `APP_URL`).
3. Copy → clipboard has the **full URL**; Arabic confirmation.
4. WhatsApp share opens `api.whatsapp.com` with Arabic text + link.
5. Same card appears at the top of `/teacher/students`.

## New student: OTP-free join (AUTH-008)

1. Sign out. Open `/join/AlMoayed-DEMO` in a private window.
2. Fill first name, last name, stage, birth date, a **new** WhatsApp (10–15 digits, not seeded).
3. Submit → land on `/dashboard` **without** BiteonSwitch.
4. Quiz list: referring teacher’s **Free** exams startable; **Pro** still locked.
5. Teacher students list shows the new student as **active** / free.
6. First-onboarding wizard (`/onboarding`) must **not** appear. After two completed quizzes, PROFILE-002 gate may still ask for province/city.

## Hijack rule (must fail closed)

1. Log out the trial student.
2. Open the same join URL, submit the **same** WhatsApp (even with matching name).
3. Expected: **no** dashboard session; hosted OTP (or Arabic “confirm via WhatsApp”).
4. `/login` with that number still requires OTP.
5. Completing OTP signs them in; they remain linked to the demo teacher (no duplicate membership).

## Existing student + second teacher

1. Student already linked to teacher A, signed out.
2. Open `/join/{teacherBCode}`, submit existing WhatsApp → OTP.
3. After OTP: linked to B as well; `currentTeacherId` is B; Free exams of B available.

## Negative cases

| Case | Expected |
|------|----------|
| `/join/not-a-code` | Arabic invalid link |
| Inactive teacher code | AUTH-007 Arabic; no session |
| Teacher WhatsApp on join form | Refuse; teacher login guidance |
| Missing fields / future birth date | Inline Arabic validation |
| AUTH-002 `/login` register | Still OTP after submit |

## Verify

```bash
npx supabase db push   # includes 016
npm run lint
npm run typecheck
npm run build
npm run test:unit      # auth-008 + teach-015 + AUTH-002/007/PROFILE-002 regression
# npm run test:e2e     # e2e/auth-008-join.spec.ts
```

## Registry / Spekit (on implement)

- Add `AUTH-008` and `TEACH-015` to `.speckit/spec.yaml` (`pending` then `implemented`).
- Add join + invite keys to `src/lib/spekit-targets.ts` and `.speckit/spekit-targets.yaml`.
- Do **not** reuse AUTH-007 or TEACH-012 IDs.
