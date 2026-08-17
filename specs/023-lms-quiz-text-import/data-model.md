# Data Model: Structured LMS Quiz Text Import (TEACH-014)

**Date**: 2026-08-13  
**Migration**: None — reuse `questions` insert + `quizzes` settings columns

## Persistent entities (unchanged schema)

### `questions` (via paste import)

Same as TEACH-013: `quiz_id`, `question_text`, `options` (2–4 for Arabic; **exactly 4** for LMS blocks), `correct_answer` as **option text**, `explanation_text`, `category_tag`, `sort_order`.

### `quizzes` (settings apply)

| Field | From header |
|-------|-------------|
| `assessment_category` | Quiz Type mapping |
| `max_attempts` | Number of Attempts (`0` = unlimited) |
| `is_timed` | Enable Timer |
| `duration_minutes` | Quiz Duration (null when not timed) |

Applied only for **valid** fields after ≥1 question imported.

## Ephemeral entities

### `ParsedQuizSettings`

| Field | Notes |
|-------|-------|
| `present` | Header detected |
| `assessment_category` | `'practice' \| 'evaluation' \| 'challenge' \| null` |
| `assessment_category_error` | Arabic warning or null |
| `max_attempts` | number \| null |
| `max_attempts_error` | Arabic warning or null |
| `is_timed` | boolean \| null (null = do not touch) |
| `duration_minutes` | number \| null |
| `timer_error` | Arabic warning when Yes without valid duration |
| `warnings` | string[] aggregate for toast |

### `QuickPasteDraft`

Existing TEACH-013 shape; add optional `format: 'lms' | 'arabic'` for preview badges.

### `QuickPasteDocument`

`{ settings: ParsedQuizSettings \| null, drafts: QuickPasteDraft[] }`

## Validation rules

1. LMS block: non-empty stem, **4** non-empty options A–D, resolvable `Answer:` letter → `correct_answer` = option text.
2. Arabic block: TEACH-013 rules (≥2 options).
3. Settings: per-field; timer Yes requires duration ∈ [1, 180].
4. Cap 50 valid questions per confirm.
5. Settings write only if imported ≥ 1.

## State transitions

```text
[paste] → parse document → [preview settings + drafts]
[confirm] → insert valid questions
         → if imported≥1 and settings present → update valid quiz flags
         → close + toast
```
