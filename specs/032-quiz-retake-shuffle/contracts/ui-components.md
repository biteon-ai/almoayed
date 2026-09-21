# Contracts: UI (QUIZ-006)

No new player chrome. Existing retake and review actions keep Arabic labels.

## Retake CTA — `data-spekit="quiz-retake-cta"`

Surfaces (when `canRetake` / `canStartNewAttempt`):

- Results card «إعادة المحاولة» (`StudentResultsView`)
- Quiz grid «إعادة الاختبار» (`StudentQuizGridCard`)
- Dashboard carousel equivalent (`QuizCarouselCard`)

Behavior: `Link` to `/quiz/{quizId}` **without** `?review=`. Exhausted attempts MUST NOT render this hook (review-only stays «مراجعة النتيجة» / review URL).

Touch: existing `h-9` / card CTAs; no smaller than current.

## Taking player

`QuestionCard` unchanged: `optionLetter(optIdx)` on the **presented** `question.options` array. Selected value remains option text.

Pager / «السابق» / «التالي» / progress operate on the presented list order (already index-based). After wipe, progress is `0 من N` and index `0`.

## Review player

Same `QuestionCard` with `showResult`. Options and question sequence come from the submission snapshot (wired in page/container, not a new component).

## Teacher question manager

No shuffle. Authored order and letters أ–د stay as today.

## Empty / gated states

Empty quiz, profile gate, attempt exhaustion, and offline-unavailable copy unchanged.
