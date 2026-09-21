# Research: Quiz Retake Reset & Shuffle (QUIZ-006)

**Date**: 2026-09-21  
**Status**: Complete — all Technical Context items resolved

## 1. Where to generate and persist presentation order

**Decision**: Server generates a Fisher–Yates shuffle in `getQuizForStudent` when the student is **taking** (allowed new attempt, not explicit review). Persist the live layout in a new `quiz_attempt_presentations` row keyed by `(student_id, quiz_id)`. On successful `submitQuiz`, copy that layout onto `exam_submissions` (`question_order`, `option_orders`) and delete the live presentation so the next open creates a new shuffle.

**Rationale**: FR-009 (stable for one attempt) and FR-012 (review matches what they saw) need a durable snapshot. Client-only IDB shuffle is lost on clear-data and cannot reconstruct old reviews. Server generation also keeps classmates from sharing one canonical order (first attempts differ per student).

**Alternatives considered**:
- Client-only shuffle in IndexedDB — rejected; review of past attempts and FR-008 “differ from previous” need server history; IDB is already missing `clearInProgress` on online submit.
- Deterministic seed from `studentId+quizId+usedAttempts` without storage — rejected; teacher edits to the question bank would change the derived order mid-attempt; cannot replay a deleted question on review.
- Columns only on `exam_submissions` (no in-progress table) — rejected; submissions exist **after** grade, same reason timed sessions are a separate table (QUIZ-004).

## 2. How to wipe leftover answers on «إعادة المحاولة»

**Decision**: Treat IDB `inProgress` as valid only when `usedAttemptsAtStart === attemptState.usedAttempts` **and** there is no pending offline submission for that quiz. Otherwise `clearInProgress` and start `answers = {}`, `activeIndex = 0`. Also call `clearInProgress` immediately after successful online `submitQuiz` (today only the offline enqueue path clears it — that is the retake leak).

**Rationale**: `QuizRunner` hydrates IDB on every `/quiz/[id]` open. Retake links already go to `/quiz/{id}` with `canStartNewAttempt=true` and `initialResults=null`, so leftover drafts reappear as pre-selected answers. Stamping drafts with `usedAttempts` distinguishes resume of the current attempt from a new attempt after submit.

**Alternatives considered**:
- Query param `?fresh=1` on retake links only — rejected; dashboard «إعادة الاختبار» and direct URL would still restore drafts; easy to miss a CTA.
- Wipe all drafts whenever `usedAttempts > 0` — rejected; would destroy a legitimate in-progress retake if they leave and return before submit.

## 3. Scoring vs shuffled letters

**Decision**: Keep submitting and grading **option text** (existing `resolveCorrectOptionText` + `studentAnswer === correctAnswerText`). Display letters stay positional via existing `optionLetter(index)` (A = first **shown** row). Shuffle permutes `ExamQuestion.options` arrays only; it never remaps `correct_answer` on the client (that field is not in the exam payload).

**Rationale**: FR-006/FR-007. QuestionCard already keys selection by option string. Server already normalizes letter-or-text `correct_answer` against the **authored** options array, so a shuffled display cannot change what is correct.

**Alternatives considered**:
- Submit letter A–D as the answer — rejected; letters are display-only after shuffle; would grade the wrong option.
- Keep authored letters glued to option text (shuffled C/A/B/D labels) — rejected; spec requires sequential A, B, C, D in RTL display order.

## 4. Guaranteeing a different order than the previous attempt

**Decision**: Pure helper `shuffleDistinctFrom(items, previous, rng)`: Fisher–Yates, retry a small bounded number of times if the result equals `previous`, then swap index 0 and 1 if still equal. Apply once to question IDs (when `n >= 2`) and once per question’s option texts (when that question has `>= 2` options). Load `previous` from the student’s latest `exam_submissions` snapshot for that quiz (null on first attempt).

**Rationale**: FR-008 / SC-003. A single Fisher–Yates can collide (especially 2-option items). A swap is a guaranteed different sequence when length ≥ 2 and needs no extra entropy.

**Alternatives considered**:
- Reject equal shuffles and reshuffle unbounded — rejected; worst-case hang in tests/RNG stubs.
- Require uniqueness across all historical attempts — rejected; spec is immediately previous attempt only.

## 5. Review of completed attempts

**Decision**: Persist `question_order uuid[]` and `option_orders jsonb` on `exam_submissions`. `getSubmissionResults` and the quiz page’s explicit `?review=` path apply that snapshot to the `questions` passed into `QuizRunner`. Legacy rows with NULL snapshot keep today’s authored `sort_order` (no backfill required).

**Rationale**: FR-011/FR-012. Results already redirect to `/quiz/{id}?review={submissionId}`; that path must not call “get or create live presentation.”

**Alternatives considered**:
- Re-shuffle on review — rejected; student disputes (“I picked C”).
- Reconstruct from `student_answers` insertion order — rejected; insert order is grading map order (`sort_order`), not what they saw.

## 6. Offline + pending sync

**Decision**: If `getPendingForQuiz(quizId)` exists, do **not** wipe it, do **not** create a new presentation, and do **not** start a retake (existing pending-sync UI). Online retake after a **synced** submit: server new presentation + IDB wipe + `saveQuizPackage` overwrites the cached question list with the new order. Offline start of a quiz never opened online remains blocked (OFFLINE-001).

**Rationale**: Spec edge case; queued answers are a real attempt, not a draft to discard.

**Alternatives considered**:
- Client-generated shuffle for offline retakes of already-cached quizzes — deferred; would fork two presentation sources; v1 requires online `getQuizForStudent` to mint the layout (same as first open for offline eligibility).

## 7. Teacher-edited question bank mid-flight

**Decision**: If live question IDs or per-question option-text sets no longer match the stored live presentation, discard that presentation (and IDB answers) and mint a new one from the current published set. `submitQuiz` still rejects unknown/missing IDs (`QUIZ_CHANGED`).

**Rationale**: Aligns with OFFLINE-001 stale-quiz rules; avoids grading shuffled leftover options that the teacher replaced.

## 8. RNG and testability

**Decision**: Inject `rng: () => number` (half-open `[0, 1)`) into shuffle helpers. Production uses `crypto.getRandomValues` (Web Crypto / Node). Vitest passes a stub sequence.

**Rationale**: SC-003 needs deterministic tests for “differs from previous” and permutation completeness (FR-010).

## 9. Spekit / registry

**Decision**: Feature ID `QUIZ-006`. Add Spekit `quiz-retake-cta` on existing «إعادة المحاولة» / «إعادة الاختبار» links (results + quiz cards). Shuffle itself has no new chrome; player hooks stay UI-016/017.

**Rationale**: ENABLE-001; e2e can enter retake without brittle text-only selectors.
