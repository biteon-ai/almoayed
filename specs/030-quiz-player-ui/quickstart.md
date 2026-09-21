# Quickstart: Mobile Quiz Player Redesign

**Feature**: UI-016  
**Branch**: `030-quiz-player-ui`

## Prerequisites

- `npm run dev` at `http://localhost:3000`
- Demo student `963987654321`
- Phone viewport ~390×844 (DevTools Pixel 7)
- A timed quiz and an untimed quiz assigned to the demo teacher (timer 1–180 minutes via existing teacher settings)

## P1 — Header and timer

1. Open an **untimed** quiz: slim sub-header with خروج/رجوع; **no** countdown; no large title/progress/grid cards above the question.
2. Open a **timed** quiz: header shows `MM:SS` and «الوقت المتبقي».
3. With remaining time ≤ 2 minutes, timer uses a warning accent.
4. Tap exit → Arabic dialog «هل أنت متأكد أنك تريد الخروج؟» / «سيتم حفظ تقدّمك.»
5. **بقاء**: still on the same question with the same selection.
6. Choose an answer, **خروج**: land on `/quizzes`; reopen the quiz — the answer and question index are restored.
7. Phone Back / swipe-back while taking: same dialog (cancel stays).
8. At `00:00`: answers lock, expiry notice, auto-submit; header does not unlock choices.

## P1 — Question card

1. One card: badge «السؤال N», stem, large A/B/C/D rows (`min-h-11`).
2. Select B: row and badge fill `#065f46`; change to C: highlight moves.
3. Before submit: no correct mark, no explanation, no category chip.
4. Image/math stems still fully visible; last option not hidden under the submit bar.

## P1 — Pager, sheet, submit

1. Horizontal pager jumps to question 7; current chip and answered chips are distinct.
2. 10+ questions: swipe the pager to reach the last number.
3. «كل الأسئلة» opens a bottom sheet of all numbers; tap jumps and closes; tabs stay usable.
4. Action bar shows `N من M` (or percent) + «تسليم الإجابات وإنهاء الاختبار» above the student tabs.
5. Submit with a blank question: blocked, Arabic validation, still in the player.
6. Answer all → submit → existing review/score; solutions appear only after success.

## P2 — Motion and appearance

1. Pager jumps use a short fade/slide; reduced-motion: instant.
2. Dark appearance (drawer): player chrome follows tokens; selected badge still `#065f46`.
3. RTL: letters and timer sit start-side-first.

## Regression

- Empty quiz: empty message, no pager, submit not enabled.
- Offline: answer, exit, restore; pending-sync copy unchanged.
- Teacher quiz edit / student `/results` list: unchanged.
- Gatekeeper: no solution leak in the new chrome.

## Automated

```bash
npm run test:unit -- tests/features/ui-016-quiz-player.test.ts tests/features/quiz-001-gatekeeper.test.ts tests/features/quiz-004-countdown-timer.test.ts
npm run test:e2e -- e2e/ui-016-quiz-player.spec.ts
npm run lint && npm run typecheck && npm run build
```
