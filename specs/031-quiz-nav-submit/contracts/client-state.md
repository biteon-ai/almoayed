# Contracts: Client state helpers (UI-017)

Pure functions in `src/lib/quiz-player.ts`. Vitest `[UI-017]`.

## `isQuizComplete(args): boolean`

```ts
{
  answers: Record<string, string>;
  questionIds: string[];
}
```

- `false` when `questionIds.length === 0`
- `true` iff every id has `String(answers[id] ?? "").trim() !== ""`
- Extra keys in `answers` MUST NOT make an incomplete quiz look complete
- MUST NOT read correct-answer fields

## `remainingUnanswered(args): number`

Same args. Count of question ids that fail the non-empty check. `0` when complete.

## `stepNavState(args): { canPrev: boolean; canNext: boolean }`

```ts
{ activeIndex: number; questionCount: number }
```

- `canPrev` ⇔ `questionCount > 0 && activeIndex > 0`
- `canNext` ⇔ `questionCount > 0 && activeIndex < questionCount - 1`
- Clamp assumptions: caller keeps `activeIndex` in range; helpers still treat `activeIndex <= 0` as no prev

## Manual vs auto submit (component contract)

| Trigger | Opens `quiz-submit-confirm` | Calls `submitAttempt` |
|---------|----------------------------|------------------------|
| Primary submit click, complete | yes | after confirm only |
| Primary submit click, incomplete | no (button disabled) | no |
| Expiry `forceTimedExpiry: true` | no | yes immediately |
| Exit confirm | no | no (`saveInProgress` only) |
