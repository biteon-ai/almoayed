# Data Model: Quick Text Paste Bulk Question Import (TEACH-013)

**Date**: 2026-08-13  
**Migration**: None — reuse existing `questions` insert path from TEACH-004

## Persistent entities (unchanged)

### `questions`

| Field | Role for TEACH-013 |
|-------|--------------------|
| `quiz_id` | Target quiz; ownership asserted before insert |
| `question_text` | Stem from paste block |
| `options` | `string[]` of present options only (length 2–4) |
| `correct_answer` | **Option text** of the marked letter (not bare `أ`/`ب` alone) |
| `explanation_text` | From `الشرح:` / `شرح:` / empty |
| `category_tag` | From `التصنيف:` / `قسم:` or default `عام` |
| `sort_order` | Assigned by existing `importRowsToQuestionInserts` / import path |

No new tables, columns, or RLS policies.

## Ephemeral / application entities

### `QuickPasteDraft` (parse result — not stored)

| Field | Type | Notes |
|-------|------|-------|
| `index` | number | 0-based block order |
| `question_text` | string | Stem; `س:` stripped if present |
| `option_a`…`option_d` | string | Empty string if letter absent |
| `correct_letter` | `أ`\|`ب`\|`ج`\|`د`\|`""` | Resolved marker for preview |
| `correct_answer` | string | Option text when valid; else `""` |
| `explanation_text` | string | Optional |
| `category_tag` | string | Default `عام` |
| `valid` | boolean | FR-004 rules |
| `error_reason` | string \| null | Arabic reason when invalid |

### `ImportQuestionRow` (existing)

Paste save maps valid drafts → rows:

- Options: only non-empty a–d fields
- `correct_answer`: option text (`resolveCorrectOptionText`)
- Then `importQuestionRows(..., { mode: "append" })`

### `Import session (UI)`

| Field | Notes |
|-------|-------|
| `rawText` | Textarea contents; discarded on cancel or successful save |
| `drafts` | Live `QuickPasteDraft[]` from parser |
| `pending` | Save in flight |

## Validation rules

1. Non-empty stem; ≥2 non-empty options; exactly one resolvable correct letter among present options → `valid`.
2. Missing correct marker, wrong letter, or &lt;2 options → invalid with Arabic `error_reason`.
3. Confirm-save: insert valid drafts in order, max **50**; count skipped invalids separately; `capped` if valid.length &gt; 50.
4. Empty / whitespace paste → no DB writes.
5. Append-only; no dedupe.

## State transitions

```text
[closed] --open--> [editing]
[editing] --cancel--> [closed] (discard draft)
[editing] --save 0 valid--> [editing] (error message)
[editing] --save ≥1--> [closed] (toast; list refresh)
```

## Relationships

- Teacher owns Quiz → many Questions
- Paste drafts never relate in DB until successful insert into that quiz
