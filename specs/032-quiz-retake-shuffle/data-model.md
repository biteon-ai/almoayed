# Data Model: Quiz Retake Reset & Shuffle

**Feature**: QUIZ-006  
**Persistence**: New migration `021_quiz_attempt_presentation.sql` + IDB draft fields (no store version bump required).

Authored `questions` rows are **never** reordered. Teacher edit screens keep `sort_order` and authored `options[]`.

## Entity: Live attempt presentation (`quiz_attempt_presentations`)

One in-flight layout per student per quiz. Created when `getQuizForStudent` serves a **taking** session. Deleted after a successful submit (so the next open mints a new shuffle). Unique `(student_id, quiz_id)`.

| Field | Type | Rules |
|-------|------|--------|
| `student_id` | uuid | Session `profileId`; PK part |
| `quiz_id` | uuid | PK part; quiz the student is allowed to take |
| `question_ids` | uuid[] | Permutation of **current** published question IDs; each id exactly once |
| `option_orders` | jsonb | Map `questionId → string[]`; each array is a permutation of that question’s authored option texts |
| `created_at` | timestamptz | Audit |

### Validation

- `question_ids` length equals live question count; set equality with live IDs.
- Every `option_orders[id]` is a permutation of that question’s current options (same texts, no drop/duplicate).
- Questions with `< 2` options: array copied as-authored.
- Payload MUST NOT include `correct_answer` or explanations (gatekeeper).

### State transitions

```text
[no row]
  getQuizForStudent (taking, access OK)
    → INSERT shuffled layout (avoid previous submission snapshot)
[row exists] + live bank still matches
  getQuizForStudent (taking)
    → REUSE (FR-009)
[row exists] + live bank diverged (IDs or option texts)
  → DELETE + INSERT new shuffle; client must wipe answers
submitQuiz success
  → COPY onto exam_submissions + DELETE live row
review-only / ?review=
  → do not create or reuse live row; use submission snapshot
```

## Entity: Submission presentation (extends `exam_submissions`)

Snapshot of what the student saw on **that** graded attempt.

| Field | Type | Rules |
|-------|------|--------|
| `question_order` | uuid[] NULL | NULL = legacy; review uses authored `sort_order` |
| `option_orders` | jsonb NULL | Same shape as live presentation; NULL = authored option order |

Copied from the live presentation at insert time. Never updated later. Starting a retake MUST NOT UPDATE or DELETE prior submission rows (FR-011).

## Entity: Previous-attempt reference (derived)

For FR-008, “immediately previous” = the student’s latest `exam_submissions` row for that quiz by `submitted_at DESC`.

| Field | Source |
|-------|--------|
| `previousQuestionIds` | `question_order` or authored `sort_order` if NULL |
| `previousOptionOrders` | `option_orders` or authored options if NULL |

Used only when minting a **new** live presentation.

## Entity: Device draft (extends IDB `inProgress`)

Existing store key `quizId`. Extra fields are optional on old records.

| Field | Type | Rules |
|-------|------|--------|
| `quizId` | string | PK (unchanged) |
| `answers` | `Record<questionId, optionText>` | Empty object on a new attempt |
| `activeIndex` | number | `0` on a new attempt |
| `usedAttemptsAtStart` | number | Must equal `attemptState.usedAttempts` or the draft is **stale** |
| `updatedAt` | ISO timestamp | Unchanged meaning |

### Restore vs wipe

```text
pending submission for quizId     → restore pending; no retake; no wipe of queue
draft.usedAttemptsAtStart === used → resume (same attempt)
else (missing stamp, or mismatch) → clearInProgress; answers={}; activeIndex=0
submitQuiz success (online)       → clearInProgress
enqueuePendingSubmission          → clearInProgress (already)
```

`quizPackages` cache: after an online taking load, `saveQuizPackage` overwrites questions with the **current** presentation (already gatekeeper-stripped).

## Entity: Presented exam question (view)

`ExamQuestion` with `options` in attempt order; array order of the parent list is `question_ids`. `sort_order` remains the authored index (unused for student navigation). Letters A, B, C, D come from display index, not authored index.

## Relationships

```text
Quiz (authored questions, sort_order)
  │
  ├── Teacher edit  → authored order only
  │
  ├── quiz_attempt_presentations (0..1 live taking layout)
  │       └── applied to ExamQuestion[] for QuizRunner taking
  │
  └── exam_submissions 1──* student_answers
          └── question_order + option_orders → review ExamQuestion[]
```

## Validation rules (shared)

- Shuffle is a **permutation**: no missing, extra, or duplicated question IDs.
- Grading identity = option **text** against authored `correct_answer` (resolved), never displayed letter.
- QUIZ-001: taking payloads stay `EXAM_QUESTION_SELECT_FIELDS` only.
- QUIZ-005: presentation minting does not bypass `canStartNewAttempt`.
- MT-002: quiz load still filters `created_by = currentTeacherId`; presentation rows are student-owned and only read in `requireStudent` actions.
