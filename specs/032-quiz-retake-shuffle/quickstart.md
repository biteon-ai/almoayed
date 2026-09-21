# Quickstart: Quiz Retake Reset & Shuffle

**Feature**: QUIZ-006  
**Branch**: `032-quiz-retake-shuffle`

## Prerequisites

- `npm run dev` at `http://localhost:3000`
- Demo student `963987654321`
- A **practice** quiz with ≥4 MCQs, ≥4 options each, unlimited or ≥2 attempts, assigned to the demo teacher
- Phone viewport ~390×844

## P1 — Blank retake

1. Take the quiz; answer with a recognizable pattern (e.g. always first shown option). Submit.
2. From `/results`, tap «إعادة المحاولة» (`quiz-retake-cta`).
3. First question has **no** selection; progress is `0 من N`; pager shows nothing answered.
4. If timed: remaining time is a full duration, not leftover from the first attempt.

## P1 — Shuffle

1. During attempt 1, note question-1 stem and the option text under A/B/C/D.
2. Retake (or compare two fresh attempts).
3. Question order differs from attempt 1 (when N≥2).
4. For each question with ≥2 options, option texts under A/B/C/D differ from attempt 1.
5. Letters are still A, B, C, D in display order (RTL start = A).
6. Pick the option **text** that was correct on attempt 1 (possibly under a new letter) → still scores correct.

## P2 — Resume vs retake

1. Start a retake, answer two questions, leave via exit confirm.
2. Reopen the same quiz: same order, same two answers, timer continued if timed.
3. Submit, then retake again: blank + a **new** shuffle.

## P2 — History

1. After two submits, open «مراجعة الإجابات» for attempt 1 (`/results/{id}` → `?review=`).
2. Attempt 1 order/options match what you saw then; solutions visible (gatekeeper after submit).
3. Teacher quiz edit still lists authored order.

## Offline / gates

- Pending-sync quiz: retake does not delete the queued submit.
- Exhausted attempts: no `quiz-retake-cta`; review-only.
- Profile gate still blocks a new attempt when required.

## Automated

```bash
npm run test:unit -- tests/features/quiz-006-retake-shuffle.test.ts tests/features/quiz-001-gatekeeper.test.ts tests/features/quiz-004-countdown-timer.test.ts tests/features/quiz-005-attempt-limits.test.ts
npm run test:e2e -- e2e/quiz-006-retake-shuffle.spec.ts
npm run lint && npm run typecheck && npm run build
```
