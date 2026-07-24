# Data Model: Quiz Countdown Timer (QUIZ-004)

**Date**: 2026-07-24  
**Related**: [spec.md](./spec.md) · [research.md](./research.md)

## Entities

### Quiz timer settings (extends `quizzes`)

| Field | Type | Rules |
|-------|------|--------|
| `is_timed` | boolean NOT NULL DEFAULT false | Teacher toggle «تفعيل التوقيت» |
| `duration_minutes` | integer NULL | Required iff `is_timed`; CHECK 1–180; NULL when untimed |

**Ownership**: `created_by` = teacher; only owning teacher mutates.

**Transitions**:
- Untimed → Timed: set `is_timed=true`, `duration_minutes` ∈ [1,180]
- Timed → Untimed: set `is_timed=false`, `duration_minutes=NULL`
- Edit duration: only affects **new** sessions (FR-015)

### Timed attempt session (`quiz_timed_sessions`) — NEW

| Field | Type | Rules |
|-------|------|--------|
| `id` | uuid PK | |
| `student_id` | uuid → profiles CASCADE | |
| `quiz_id` | uuid → quizzes CASCADE | |
| `started_at` | timestamptz NOT NULL | Server time at first successful open |
| `duration_minutes` | int NOT NULL | Snapshot 1–180 at start |
| `created_at` | timestamptz NOT NULL DEFAULT now() | |

**Constraints**: `UNIQUE (student_id, quiz_id)`.

**Derived (not stored)**:
- `ends_at = started_at + duration_minutes * interval '1 minute'`
- `remaining_seconds = max(0, floor(extract(epoch from (ends_at - now()))))`

### Exam submission (`exam_submissions`) — unchanged shape

Still created only on successful `submitQuiz`. Unique `(student_id, quiz_id)` enforces single graded attempt.

Relationship: timed session may exist before submission; after submit, session row may remain for audit.

## State machine (student timed attempt)

```text
[No session]
    │ open timed quiz (allowed)
    ▼
[Session active] ──refresh──► recompute remaining from started_at + snapshot
    │
    ├─ remaining > 0 ──► answer UI enabled; badge MM:SS (+ warning if ≤120s)
    │
    └─ remaining = 0 OR reopen after ends_at
           │
           ▼
     [Locked + auto-submit] ──► exam_submissions row ──► results
```

## Validation rules

- Teacher save: `is_timed=false` ⇒ `duration_minutes` null; `is_timed=true` ⇒ duration integer 1–180.
- `ensureTimedQuizSession`: quiz must be timed **at ensure time** OR reuse existing session even if quiz later untimed (snapshot wins).
- After `exam_submissions` exists: no new session; no countdown UI.

## Indexes

- `quiz_timed_sessions (student_id, quiz_id)` UNIQUE (constraint index)
- Optional: `quiz_timed_sessions (quiz_id)` for teacher analytics later (not required for MVP)

## Migration

`supabase/migrations/013_quiz_timer.sql`:
1. ALTER `quizzes` add columns + CHECK
2. CREATE `quiz_timed_sessions` + FKs + UNIQUE
3. RLS: enable; policies consistent with other student tables (app uses admin client for writes — still add sensible RLS)
