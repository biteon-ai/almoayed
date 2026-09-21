# Quickstart: Quiz Navigation and Safe Submit

**Feature**: UI-017  
**Branch**: `031-quiz-nav-submit`

## Prerequisites

- `npm run dev` at `http://localhost:3000`
- Demo student `963987654321`
- Phone viewport ~390×844
- A multi-question quiz the demo student can still take

## P1 — السابق / التالي

1. Open a 3+ question quiz. Under the card: «التالي» on the right (RTL start), «السابق» on the left.
2. Question 1: السابق disabled; التالي enabled. Tap التالي → «السؤال 2».
3. Last question: التالي disabled; السابق goes back one.
4. Jump via pager or «كل الأسئلة»; Previous/Next match the new index.

## P1 — Gated submit + confirm

1. Leave one question blank: submit visible but disabled; hint that answers remain. Tap does not grade.
2. Answer all: submit enabled.
3. Tap submit → «هل أنت متأكد من تسليم الإجابات؟» / «لا يمكنك التراجع بعد التأكيد.»
4. إلغاء: still in the quiz, same answers.
5. تأكيد التسليم: existing review/score; solutions only after success.
6. Timed quiz at `00:00`: auto-submit without this dialog (even if it was open).

## P2 — Centered chrome + كل الأسئلة

1. «السؤال N» badge is centered on the card.
2. Timer sits in the middle of the top bar; exit on the start side; layout not lopsided.
3. «كل الأسئلة» still opens the number grid; tap jumps and closes.

## Regression

- Empty quiz: no step nav / submit.
- Offline: confirm still required before enqueue; cancel does not save a pending submission.
- QUIZ-001: no solution leak before submit.
- UI-016: exit save dialog still works.

## Automated

```bash
npm run test:unit -- tests/features/ui-017-quiz-nav-submit.test.ts tests/features/ui-016-quiz-player.test.ts tests/features/quiz-001-gatekeeper.test.ts tests/features/quiz-004-countdown-timer.test.ts
npm run test:e2e -- e2e/ui-017-quiz-nav-submit.spec.ts
npm run lint && npm run typecheck && npm run build
```
