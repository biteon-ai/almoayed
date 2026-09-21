# Contracts: Server actions (QUIZ-006)

**Module**: `src/actions/quiz.ts`  
**Auth**: existing `requireStudent()` + teacher-scoped quiz load (MT-002).  
**Client**: no privileged Supabase.

Internal helpers may live in `src/lib/quiz-presentation.ts` (load/save/apply) calling `quiz-shuffle.ts`.

## `getQuizForStudent(quizId)` (extend)

**Signature**: unchanged.

**Taking path** (`canStartNewAttempt === true` and caller is not in explicit review):

1. Load exam questions with `EXAM_QUESTION_SELECT_FIELDS` only, authored `sort_order`.
2. Load live `quiz_attempt_presentations` for `(profileId, quizId)`.
3. If row exists and `isPermutation` matches live IDs **and** each option array matches live option texts → reuse.
4. Else mint `buildAttemptPresentation` using previous = latest submission snapshot (or authored order if snapshot NULL).
5. Upsert live presentation row.
6. Return `questions` as `applyPresentation(...)`.
7. Timed session: existing `ensureTimedQuizSession` only on taking (unchanged).

**Review-only path** (`canStartNewAttempt === false`): do not mint/reuse live presentation. Return authored questions; the page applies the review submission snapshot (below).

**MUST NOT** attach `correct_answer` / explanations to returned questions.

## Explicit review (`/quiz/[id]?review=submissionId`)

Page already loads `getSubmissionResults`. It MUST pass `QuizRunner` questions **from the snapshot**, not the live taking presentation:

- If `question_order` / `option_orders` present → `applyPresentation`.
- If NULL (legacy) → authored `sort_order` / authored options.
- MUST NOT upsert `quiz_attempt_presentations`.
- MUST NOT create a timed session (`timer` already null when `initialResults` set).

## `submitQuiz(quizId, answers)` (extend)

**Signature**: unchanged (`answers: Record<questionId, optionText>`).

After existing access / attempt-cap / `QUIZ_CHANGED` / grade logic:

1. Read live presentation for this student+quiz (may be missing for legacy clients).
2. If present, validate it is still a permutation of the **live** bank; else treat as `QUIZ_CHANGED` (same as stale offline).
3. INSERT `exam_submissions` including `question_order` and `option_orders` (from live row, or authored fallback if no row).
4. INSERT `student_answers` as today (option text, `is_correct`).
5. DELETE live presentation row (always on success — next taking mints a new shuffle even if attempts exhausted, because exhausted users are review-only and must not reuse a taking layout).
6. Existing timed-session delete when retakes remain (QUIZ-005) unchanged.

Grading MUST keep using authored options + `resolveCorrectOptionText`, never displayed letters.

Return `QuizSubmitResult.answers` **in presentation order**, each row including `options: string[]` (the order they saw) so on-page review matches FR-012 without a second fetch.

## `getSubmissionResults(submissionId)` (extend)

Return answers ordered by `question_order` when set. Each answer includes `options: string[]` from `option_orders[questionId]` or authored options if NULL.

Ownership: `student_id = session.profileId` unchanged.

## Teacher actions

No change. `src/actions/teacher.ts` question lists stay authored `sort_order`.

## Errors

No new codes required if stale presentation maps to existing `QUIZ_CHANGED`. Optional Arabic copy may stay the current “quiz updated” message.

## Security

- Presentation JSON is not a grading authority.
- Ignore any client-supplied order on submit; only the server-stored live row (or authored fallback) is copied to the submission.
- Gatekeeper tests: taking `questions` still fail `assertGatekeeperCompliance` if forbidden fields appear.
