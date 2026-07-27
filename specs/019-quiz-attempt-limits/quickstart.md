# Quickstart: QUIZ-005 Quiz Attempt Limits & Category

## Prerequisites

- Branch `019-quiz-attempt-limits`
- Apply migration: `npx supabase db push` (`014_quiz_attempt_limits.sql`)
- Demo teacher + two student accounts (for leaderboard)

## Teacher QA

1. Login teacher → create quiz
2. Set «نوع الاختبار» = «تدريب / واجب» → confirm «غير محدود» default
3. Save; reopen — settings persist
4. Change to «اختبار تقييمي / نصفي» → confirm default **1** attempt
5. Toggle custom **3** attempts on practice quiz → save
6. Try invalid attempt count `0` (non-unlimited) / `11` — Arabic validation blocks save

## Student QA — enforcement

1. **Evaluation (1 attempt)**: Submit once → card shows «مراجعة النتيجة» → direct URL cannot submit again
2. **Practice (3 attempts)**: Submit 3 times → 4th blocked; after 2nd, card shows «إعادة الاختبار» + «محاولة 3 من 3»
3. **Unlimited practice**: Submit twice → can still start fresh attempt
4. **Timed + retake**: Timed quiz with 2 attempts — confirm new timer on second attempt (QUIZ-004)
5. Confirm correct answers hidden on fresh attempts (QUIZ-001)

## Student QA — challenge leaderboard (P2)

1. Teacher publishes challenge quiz (1 attempt)
2. Student A scores 80%, Student B scores 90%
3. Both see leaderboard: B rank 1, A rank 2
4. Non-challenge quiz — no leaderboard section

## Automated

```bash
npx vitest run tests/features/quiz-005-attempt-limits.test.ts
npm run build
```

## Registry

- `.speckit/spec.yaml` → `QUIZ-005`
- Spekit: `quiz-attempt-settings`, `challenge-leaderboard`
