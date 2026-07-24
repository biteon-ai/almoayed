# Quickstart: QUIZ-004 Quiz Countdown Timer

## Prerequisites

- Branch `018-quiz-countdown-timer`
- Apply migration: `npx supabase db push` (`013_quiz_timer.sql`)
- Demo teacher + student accounts

## Teacher QA

1. Login teacher → create (or edit) quiz
2. Enable «تفعيل التوقيت», set duration `2` (or `1` for faster expiry QA)
3. Save; reopen edit — toggle + duration persist
4. Try duration `0` / `181` — Arabic validation blocks save
5. Disable toggle — duration cleared; students see no timer

## Student QA

1. Login linked student → open timed quiz
2. Confirm sticky badge `data-spekit="quiz-timer"` shows `MM:SS`
3. Refresh — remaining time continues (does not jump back to full duration)
4. When ≤ 2:00 — warning style visible
5. At `00:00` (or reopen after waiting past duration) — answers lock, Arabic expiry notice, auto-submit → results with score
6. Confirm correct answers not visible before submit (QUIZ-001)

## Automated

```bash
npx vitest run tests/features/quiz-004-countdown-timer.test.ts
npm run build
```

## Registry

- `.speckit/spec.yaml` → `QUIZ-004`
- Spekit: `quiz-timer` (+ optional `quiz-timer-settings`)
