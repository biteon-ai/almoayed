# Quickstart: Student Profile Onboarding (PROFILE-002)

## Prerequisites

- Branch `012-student-profile-onboarding`
- Local `.env` (Supabase + `SESSION_SECRET`)
- Demo student `963987654321` / teacher `963912345678`

```bash
npm install
npx supabase db push    # applies 009_student_profile_demographics.sql
npm run dev
```

---

## Manual QA path

### 1. First onboarding (new or legacy)

1. Ensure demo student has `onboarding_completed = false` (fresh migration default).
2. Login as student → must land on `/onboarding` before dashboard.
3. Complete 3 steps → redirected to `/dashboard`.
4. Logout / login again → onboarding must **not** reappear.

### 2. Gate after 2 quizzes

1. Complete 2 distinct quizzes while `profile_completed = false`.
2. Open a **third** new quiz → redirect to `/profile/complete` with banner copy.
3. Open a **completed** quiz → review still works (no gate).
4. Fill required fields → submit → land on the intended quiz URL.
5. Subsequent new quizzes open normally.

### 3. Settings invalidation

1. Open `/settings`, clear city or birth date → save blocked or `profile_completed` becomes false.
2. With count ≥ 2, open a new quiz → gate returns.

### 4. Multi-tenant demographics

1. As linked teacher, open student detail → demographics visible.
2. As a teacher **not** linked to that student → no access / empty denied.

### 5. Session teacher intact

1. With two teachers linked, set active teacher A.
2. Complete profile gate → `currentTeacherId` remains A.

---

## Automated checks

```bash
npx vitest run tests/features/profile-002-student-profile.test.ts
npm run build
```

Cover: `shouldBlockNewQuiz`, required-complete recompute, return-path sanitize, stage/referral maps.
