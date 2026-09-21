# Contracts: Client state helpers (UI-016)

Pure functions in `src/lib/quiz-player.ts`. No I/O. Vitest `[UI-016]`.

## `optionLetter(index: number): string`

- `0 → "A"`, `1 → "B"`, … (`String.fromCharCode(65 + index)`).
- Invalid index (`< 0`) is not used by UI; tests cover `0..3` at minimum.

## `answeredProgress(answeredCount: number, total: number): { percent: number; label: string }`

- `percent` is `0` when `total === 0`; otherwise `round(100 * answeredCount / total)` clamped 0–100.
- `label` Arabic: `{answeredCount} من {total}`.

## `questionNavStatus(args): QuestionNavStatus`

Same semantics as today’s grid:

- `active` if `index === activeIndex`
- else if submitted + results: `correct` | `wrong` | `unanswered-review`
- else if `answers[questionId]`: `answered`
- else `default`

MUST NOT inspect correct keys when `!isSubmitted`.

## `shouldConfirmQuizExit(args): boolean`

```ts
{
  isSubmitted: boolean;
  pendingSync: boolean;
  questionCount: number;
  timeExpiredNotice: boolean;
}
```

Returns true only when the student would lose an in-progress canvas: not submitted, not pending-sync, `questionCount > 0`, and not in the expiry auto-submit notice.

## History guard (component behavior, not a server contract)

When `shouldConfirmQuizExit` is true:

1. On mount, `history.pushState({ quizPlayerGuard: true }, "", url)`.
2. On `popstate`, if still armed, `history.pushState` again and open `quiz-exit-dialog`.
3. On unmount or when the predicate becomes false, do not intercept.

Confirm path: `saveInProgress` then `router.push("/quizzes")`. Never `submitQuiz` on exit.

## Timer

No new helpers. Import `formatRemainingMmSs` and `isWarningRemaining` from `src/lib/quiz-timer.ts`. Untimed quizzes pass `timer == null` into the header.

## Gatekeeper

`QuestionCard` taking props MUST NOT include `correctAnswer` / explanation fields until `isSubmitted`. This is a call-site contract in `QuizRunner`; unit tests assert the helper never requires those fields for taking statuses.
