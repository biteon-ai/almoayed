# UI Component Contracts: PROFILE-002

## Routes

| Route | Chrome | Purpose |
|-------|--------|---------|
| `/onboarding` | Minimal (no bottom nav) | 3-step first onboarding |
| `/profile/complete` | Minimal full page | Mandatory required profile |
| `/settings` | Student shell | Edit demographics |
| `/quiz/[id]` | Student shell | Gate redirect when blocked |

---

## `OnboardingWizard`

- Steps: (1) education stage chips/cards (2) referral source (3) primary subject presets + free text.
- RTL, Tajawal, `h-11`+ controls.
- Spekit: `data-spekit="student-onboarding"`.
- On success → `/dashboard`.

---

## `ProfileCompletionForm` (full page)

- Banner copy: «بقي خطوة واحدة لاستكمال حسابك ومتابعة الاختبارات».
- Fields: full name, birth date (D/M/Y), province select, city, education stage; optional email, address.
- Spekit root: `data-spekit="profile-completion-modal"`.
- Submit Spekit: `profile-completion-submit`.
- Links to dashboard/results allowed; cannot open blocked quiz until success.
- After success → `from` query or `/dashboard`.

---

## Settings demographics block

- Same fields as completion (minus forcing gate UX).
- Clearing required fields: Arabic validation and/or `profile_completed` → false.
- Spekit: `student-demographics-settings`.

---

## Teacher student detail

- Compact read-only section: stage, province, city, subject, referral, birth date, email (if set).
- Hidden/empty when no data yet.
- No cross-teacher leak (data only if action allowed).

---

## Quiz page behavior

```text
if shouldBlockNewQuiz(...):
  redirect(`/profile/complete?from=/quiz/${id}`)
else:
  existing quiz runner / results
```
