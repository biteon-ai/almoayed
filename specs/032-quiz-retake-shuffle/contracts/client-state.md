# Contracts: Client draft reset (QUIZ-006)

IndexedDB `inProgress` + `QuizRunner` hydration. Vitest `[QUIZ-006]` for the pure predicate; runner wiring is the integration.

## `isStaleInProgressDraft(args): boolean`

```ts
{
  usedAttempts: number;
  draftUsedAttemptsAtStart: number | undefined;
  hasPendingSubmission: boolean;
}
```

- `true` when `hasPendingSubmission` is false AND (`draftUsedAttemptsAtStart` is not a finite number OR `draftUsedAttemptsAtStart !== usedAttempts`).
- `false` when `hasPendingSubmission` (leave the queued attempt alone).
- `false` when stamp matches `usedAttempts` (resume this attempt).

`QuizRunner` / container MUST pass `attemptState.usedAttempts` into restore. Today the runner does not receive `attemptState`; thread it from `QuizRunnerContainer`.

## `saveInProgress` (extend)

Persist `usedAttemptsAtStart` alongside `answers` and `activeIndex`. Saves during an attempt use the stamp from restore (or `usedAttempts` at first blank start). Do not update the stamp when answers change.

## Restore sequence (`QuizRunner` mount)

1. `getPendingForQuiz` → if present, existing pending-sync behavior (no wipe of queue).
2. Else `getInProgress`.
3. If stale → `clearInProgress(quizId)`; `setAnswers({})`; `setActiveIndex(0)`.
4. Else restore answers + `activeIndex` as today.
5. `setDraftReady(true)` only after the wipe/restore decision (so the debounce writer cannot re-save a stale draft).

## Submit success

After online `submitQuiz` resolves, `clearInProgress(quizId)` before or as results are shown. Offline enqueue already clears.

## Offline cache

`saveQuizPackage` after a successful **taking** load already overwrites questions. Do not write a package during explicit review (avoid caching review-only payloads that include solution fields — review data is not in `ExamQuestion`; still skip package save when `initialResults` is set to avoid clobbering an in-progress taking cache with review order).

## Pending retake block

If pending exists, UI stays on pending-sync; no new presentation is requested beyond whatever the page already loaded. Do not clear the pending record on «إعادة المحاولة».
