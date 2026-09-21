# Contracts: Client state helpers (UI-018)

## `remainingTimeFraction(remainingSeconds, durationMinutes): number`

Pure function in `src/lib/quiz-timer.ts`. Vitest `[UI-018]`.

```ts
remainingTimeFraction(
  remainingSeconds: number,
  durationMinutes: number
): number
```

- Total seconds = `durationMinutes * 60`
- If total ≤ 0, return `0`
- Return `clamp(remainingSeconds / total, 0, 1)`
- MUST NOT use answered-question count
- MUST use this attempt’s full duration (not “time already elapsed from clock now” as a separate input — remaining already encodes leftover after leave/return)

### Examples

| remainingSeconds | durationMinutes | fraction |
|------------------|-----------------|----------|
| 600 | 10 | 1 |
| 300 | 10 | 0.5 |
| 120 | 10 | 0.2 |
| 0 | 10 | 0 |
| 50 | 0 | 0 |

## Completeness (reuse UI-017)

`isQuizComplete` / `remainingUnanswered` in `src/lib/quiz-player.ts` are unchanged. Compact submit `disabled` ⇔ `!isQuizComplete || isPending`.

## Manual vs auto submit (component contract)

| Trigger | Opens `quiz-submit-confirm` | Calls `submitAttempt` |
|---------|----------------------------|------------------------|
| Compact submit click, complete | yes | after confirm only |
| Compact submit click, incomplete | no (button disabled) | no |
| Expiry `forceTimedExpiry: true` | no | yes immediately |
| Exit confirm | no | no (`saveInProgress` only) |
