# Quickstart: Quiz Header Polish

**Feature**: UI-018  
**Branch**: `033-quiz-header-polish`

## Prerequisites

- `npm run dev` at `http://localhost:3000`
- Demo student `963987654321`
- Phone viewport ~390×844
- A multi-question quiz the demo student can still take (one timed, one untimed if available)

## P1 — Compact submit + right stepper

1. Open a 3+ question quiz. Card header: stepper packed to the **visual right**; compact «تسليم» on the **visual left** of that row (not the long «تسليم الإجابات وإنهاء الاختبار»).
2. On question 1 with blanks remaining: «تسليم» is visible and faded; tap does nothing (no confirm, no grade).
3. Answer every question: «تسليم» enables without reload.
4. Tap → «هل أنت متأكد من تسليم الإجابات؟» / «لا يمكنك التراجع بعد التأكيد.»
5. إلغاء: still in the quiz. تأكيد التسليم: review/score; solutions only after success.
6. Timed quiz at `00:00`: auto-submit without this dialog.

## P1 — Timer countdown bar

1. Timed quiz near the start: MM:SS + «الوقت المتبقي» and a nearly full thin bar under (or immediately with) that readout.
2. Wait or resume with little time left: bar is proportionally short; within 2 minutes it shares the timer’s warning accent.
3. Untimed quiz: no countdown bar.

## P2 — كل الأسئلة

1. Header control «كل الأسئلة» looks balanced with the timer (or alone if untimed).
2. Tap opens the number grid; jump + dismiss still work.
3. On ~390px, timer, bar, and this control do not overlap.

## Regression

- Empty quiz: no successful compact submit.
- Offline: confirm still required before enqueue.
- QUIZ-001: no solution leak before submit.
- UI-016: exit save dialog still works.
- UI-017: answered-progress under the stepper still present; confirm copy unchanged.

## Automated

```bash
npm run test:unit -- tests/features/ui-018-quiz-header-polish.test.ts tests/features/ui-017-quiz-nav-submit.test.ts tests/features/ui-016-quiz-player.test.ts tests/features/quiz-001-gatekeeper.test.ts tests/features/quiz-004-countdown-timer.test.ts
npm run test:e2e -- e2e/ui-018-quiz-header-polish.spec.ts
npm run lint && npm run typecheck && npm run build
```
