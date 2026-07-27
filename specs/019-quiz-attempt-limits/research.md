# Research: Quiz Attempt Limits & Category (QUIZ-005)

**Date**: 2026-07-27  
**Status**: Complete — all Technical Context items resolved

## 1. Column naming vs existing `quiz_type`

**Decision**: Add `quizzes.assessment_category` enum (`practice` | `evaluation` | `challenge`) and `quizzes.max_attempts` integer. Keep existing `quiz_type` (`regular` | `session_group`) unchanged for audience/access (MT-002 group gating).

**Rationale**: Spec Assumptions explicitly separate «نوع الاختبار» (pedagogical) from audience type. Renaming `quiz_type` would break TEACH-003, tier gating, and migrations.

**Alternatives considered**:
- Reuse `quiz_type` enum with new values — rejected; breaks session_group semantics and all existing queries.
- JSON settings blob on quiz — rejected; harder to validate, index, and display in lists.

## 2. Encoding unlimited attempts

**Decision**: `max_attempts INTEGER NOT NULL DEFAULT 0` with CHECK `(max_attempts = 0 OR (max_attempts BETWEEN 1 AND 10))`. **0 = unlimited**.

**Rationale**: Spec Assumptions; compact; easy SQL for `used < max OR max = 0`.

**Alternatives considered**:
- NULL = unlimited — rejected; ambiguous vs unset during migration.
- Separate `is_unlimited` boolean — rejected; redundant with sentinel 0.

## 3. Multiple submissions per student/quiz

**Decision**: **Drop** constraint `exam_submissions_student_quiz_unique`. Add index `idx_exam_submissions_student_quiz_submitted ON (student_id, quiz_id, submitted_at DESC)`. Each successful `submitQuiz` INSERTs a new row. Attempt number = count of rows for pair (or `ROW_NUMBER` by `submitted_at`).

**Rationale**: Spec FR-005–FR-007 require counting discrete graded attempts and retaining history for tie-breaks. Upsert-single-row loses audit trail and complicates leaderboard ordering.

**Alternatives considered**:
- Upsert same row on retake — rejected; loses submit-time tie-break and attempt history.
- Separate `quiz_attempts` table + 1:1 submission — rejected; extra join with no benefit over multiple submission rows.

## 4. Category defaults (teacher UX + migration)

**Decision**:

| Context | `assessment_category` | `max_attempts` |
|---------|----------------------|----------------|
| New quiz (create form) | `practice` | `0` (unlimited) |
| Legacy rows (migration) | `evaluation` | `1` |
| Teacher picks Evaluation | `evaluation` | default `1` |
| Teacher picks Challenge | `challenge` | default `1` |
| Teacher picks Practice | `practice` | default `0` |

When teacher switches category, apply category default **only if** they have not toggled «custom attempts» (track via client `attemptsCustomized` flag; server validates range regardless).

**Rationale**: Spec FR-003 + Assumptions (legacy = 1 attempt preserves production behavior; new quizzes favor practice/unlimited).

## 5. `submitQuiz` guard

**Decision**: Before insert, `countUsedAttempts(studentId, quizId)`; load `quiz.max_attempts`; if `max_attempts > 0 && count >= max_attempts`, throw Arabic `ErrorCode.QUIZ_ATTEMPTS_EXHAUSTED` (new). Remove early-return that treats any existing submission as terminal (lines ~342–352 in current `submitQuiz`).

**Rationale**: Spec FR-007; server is source of truth for bypass attempts.

**Alternatives considered**:
- Client-only disable — rejected; fails SC-002.

## 6. Student entry / review vs retake

**Decision**: Extend `getQuizForStudent` return with:

```ts
attemptState: {
  usedAttempts: number;
  maxAttempts: number;       // 0 = unlimited
  canStartNewAttempt: boolean;
  bestScore: number | null;
  latestSubmissionId: string | null;  // most recent graded attempt
  reviewSubmissionId: string | null; // same as latest when exhausted or for review CTA
}
```

- **Fresh attempt**: `canStartNewAttempt=true`, `initialResults=null`, runner active.
- **Review only**: `canStartNewAttempt=false`, pass `initialResults` from `latestSubmissionId`.
- **In progress between attempts** (timed): no submission yet for current session — `canStartNewAttempt` still true until submit.

**Rationale**: Spec FR-008/FR-009; replaces misleading «إعادة الاختبار» when `canStartNewAttempt=false`.

## 7. QUIZ-004 timed session on retake

**Decision**: When student opens quiz for a **new** attempt (`canStartNewAttempt && no in-flight unsubmitted session`):
1. If prior `quiz_timed_sessions` row exists → **DELETE** it.
2. If quiz `is_timed` → INSERT fresh session (existing `ensureTimedQuizSession` logic).

After successful submit with **no** remaining attempts, retain session row for audit (QUIZ-004). After submit with retakes left, delete session so next open gets fresh clock.

**Rationale**: Spec US2 scenario 7; one clock per attempt, not one endless session.

**Alternatives considered**:
- Multiple session rows per attempt — rejected; would require schema change to timed_sessions unique key.

## 8. Gamification (GAMIF-001)

**Decision**: No schema change. Feed all submission rows into existing `aggregateSubmissionStats` — already picks **best score per quizId** and counts **distinct quizzes**. Update list queries that assumed `maybeSingle()` on submissions to use best/latest helpers.

**Rationale**: Spec FR-011; research in GAMIF-001 anticipated retakes.

## 9. Challenge leaderboard

**Decision**: Server action `getChallengeLeaderboard(quizId)`:
- Verify quiz `assessment_category = 'challenge'` and student access (same gates as `getQuizForStudent`).
- Query submissions for `quiz_id`; aggregate **best score per student**; rank DESC score, ASC earliest `submitted_at` of best-scoring row; join `profiles.display_name` (or existing safe name field).
- Return `{ rank, studentId, displayName, score, submittedAt }[]` plus optional `viewerRank` if viewer submitted.

No websocket; refresh on navigation (Spec Assumptions).

**Rationale**: Spec FR-010, SC-004; P2 slice shippable after P1 enforcement.

**Alternatives considered**:
- Materialized view — rejected for v1 class sizes.
- Latest attempt only for rank — rejected when challenge allows >1 attempt; best score is fairer.

## 10. Teacher UI placement

**Decision**: New section «نوع الاختبار و المحاولات» in `QuizCreateForm` and quiz edit metadata UI (same pattern as QUIZ-004 timer card / `QuizTimerSettings`):
- Segmented control or radio: Practice / Evaluation / Challenge (Arabic labels).
- Toggle «غير محدود» + number input 1–10 when off.
- Spekit: `quiz-attempt-settings`.

**Rationale**: Spec US1; matches existing teacher form patterns; avoids raw native controls.

## 11. Offline sync

**Decision**: On `submitQuiz` failure with `QUIZ_ATTEMPTS_EXHAUSTED`, sync processor marks item failed with Arabic message; student sees review of last valid submission. Do not drop queue item silently.

**Rationale**: Spec edge case; aligns with OFFLINE-001 error surfacing.

## 12. Tests & registry

**Decision**: Vitest `tests/features/quiz-005-attempt-limits.test.ts` for:
- `validateMaxAttempts`, category defaults, `canStartNewAttempt` helper
- `aggregateSubmissionStats` with multiple rows same quiz (regression)
- Leaderboard sort (unit pure function)

Update `.speckit/spec.yaml` QUIZ-005 + Spekit hooks. `npm run build`.
