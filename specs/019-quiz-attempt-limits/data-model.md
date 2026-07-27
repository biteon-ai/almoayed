# Data Model: Quiz Attempt Limits & Category (QUIZ-005)

**Date**: 2026-07-27  
**Related**: [spec.md](./spec.md) · [research.md](./research.md)

## Entities

### Quiz category & attempt settings (extends `quizzes`)

| Field | Type | Rules |
|-------|------|--------|
| `assessment_category` | enum NOT NULL DEFAULT `'evaluation'` | `practice` \| `evaluation` \| `challenge` — UI «نوع الاختبار» |
| `max_attempts` | integer NOT NULL DEFAULT `1` | `0` = unlimited; else `1–10` CHECK |

**Ownership**: `created_by` = teacher; only owning teacher mutates.

**Category defaults (teacher UX)**:

| Category | Default `max_attempts` | Leaderboard |
|----------|------------------------|-------------|
| `practice` | `0` (unlimited) | No |
| `evaluation` | `1` | No |
| `challenge` | `1` | Yes (FR-010) |

**Migration for existing rows**: `assessment_category = 'evaluation'`, `max_attempts = 1` (preserves current single-submit behavior).

**Note**: `quiz_type` (`regular` \| `session_group`) unchanged — orthogonal audience/access control.

### Exam submission (`exam_submissions`) — evolved

| Field | Type | Rules |
|-------|------|--------|
| (existing) | | `id`, `student_id`, `quiz_id`, `score`, `submitted_at` |

**Constraint change**: **Remove** `UNIQUE (student_id, quiz_id)`. Allow **multiple rows** per pair (one per graded attempt).

**New index**: `(student_id, quiz_id, submitted_at DESC)` for count, latest, and history.

**Derived (not stored)**:
- `usedAttempts = COUNT(*) WHERE student_id AND quiz_id`
- `bestScore = MAX(score)` per pair
- `latestSubmissionId = row with MAX(submitted_at)`

### Timed attempt session (`quiz_timed_sessions`) — lifecycle update

No schema change from QUIZ-004. **Behavior change**:
- Deleted when student starts a **new** attempt after a prior submit (retake path).
- Created fresh per attempt when quiz `is_timed`.
- Retained after final submit when no retakes remain (audit).

### Challenge leaderboard entry (derived view)

Not a table. Built from `exam_submissions` + `profiles` for challenge quizzes:

| Field | Source |
|-------|--------|
| `rank` | ORDER BY best score DESC, earliest best submit ASC |
| `studentId` | `exam_submissions.student_id` |
| `displayName` | `profiles` safe display field |
| `score` | Best `score` per student for quiz |
| `submittedAt` | `submitted_at` of best-scoring row (tie-break) |

Scoped to students linked to quiz’s `created_by` teacher.

## State machine (student attempts)

```text
[No submissions]
    │ open quiz (access OK, max allows)
    ▼
[Attempt in progress] ──submit──► [Graded submission N]
    │                                    │
    │                                    ├─ used < max OR max=0 ──► can retake ──► delete timed session ──► [Attempt in progress]
    │                                    │
    └─ timed: one session per attempt    └─ used >= max (finite) ──► [Review only]
```

## Validation rules

- Teacher save: `max_attempts = 0 OR (1 <= max_attempts <= 10)`.
- `submitQuiz`: reject when `max_attempts > 0 AND usedAttempts >= max_attempts`.
- Lowering `max_attempts` after students exceeded new cap: no deletion of past submissions; block **new** attempts only (FR-012).
- Leaderboard: only when `assessment_category = 'challenge'`.

## Indexes

- `exam_submissions (student_id, quiz_id, submitted_at DESC)` — attempt count + latest
- `exam_submissions (quiz_id, score DESC, submitted_at ASC)` — optional for leaderboard (evaluate at implement time)
- Existing `idx_exam_submissions_quiz_id` retained

## Migration

`supabase/migrations/014_quiz_attempt_limits.sql`:

1. `CREATE TYPE assessment_category AS ENUM ('practice', 'evaluation', 'challenge')`
2. `ALTER TABLE quizzes ADD assessment_category`, `ADD max_attempts` + CHECK
3. `UPDATE quizzes SET assessment_category = 'evaluation', max_attempts = 1` (backfill)
4. `ALTER TABLE exam_submissions DROP CONSTRAINT exam_submissions_student_quiz_unique`
5. `CREATE INDEX idx_exam_submissions_student_quiz_submitted ON exam_submissions (student_id, quiz_id, submitted_at DESC)`
