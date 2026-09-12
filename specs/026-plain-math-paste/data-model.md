# Data Model: Plain Unicode Math Quick-Paste (TEACH-016)

**Date**: 2026-09-09  
**Storage**: No new Supabase tables or columns. Persistence remains existing `questions` text fields via TEACH-013/014 import.

## Entities (logical)

### PlainMathNormalizeResult

Result of converting one text field.

| Field | Type | Notes |
|-------|------|-------|
| `text` | string | Output after conservative conversion |
| `convertedCount` | number | How many known patterns were rewritten |
| `residualLatex` | boolean | True if `$`, `\(...\)`, `$$`, or `\`+command-like tokens remain |

**Validation**:
- Never throws on malformed input; empty string → empty result with zeros/false.
- Unrecognized commands left intact → `residualLatex: true`.

### QuickPasteMathNotice

Document-level aggregate attached to `QuickPasteDocument` (extend existing type).

| Field | Type | Notes |
|-------|------|-------|
| `convertedCount` | number | Sum across all draft fields |
| `residualLatex` | boolean | OR of field residuals |
| `hadLatexInput` | boolean | True if any field looked like LaTeX before normalize |

**Rules**:
- Does **not** affect `QuickPasteDraft.valid`.
- Banner shown when `hadLatexInput || residualLatex` (product copy can emphasize residual when `residualLatex`).

### QuickPasteDraft (existing — field semantics)

Unchanged shape. After TEACH-016, these string fields are **post-normalize** when produced by `parseQuickPasteDocument`:

- `question_text`
- `option_a` … `option_d`
- `explanation`
- `correct_answer` (still option **text**, which is already normalized if that option was)

### QuickPasteDocument (existing — extended)

| Field | Type | Notes |
|-------|-------|-------|
| `settings` | existing | Untouched by math normalize |
| `drafts` | `QuickPasteDraft[]` | Field texts normalized |
| `mathNotice` | `QuickPasteMathNotice` | NEW aggregate |

### Official samples (constants, not DB)

| Constant | Constraint |
|----------|------------|
| `LMS_QUICK_PASTE_SAMPLE` | Must contain **no** `$...$`, `\(...\)`, `\frac`, `\vec`, `\widehat`, or other LaTeX commands |
| `QUICK_PASTE_SAMPLE_FORMAT` | Remains LaTeX-free; keep Arabic–Latin spaces if STEM lines added later |

## State transitions

```text
Raw paste text
  → extract settings (unchanged)
  → split blocks / parse structure (unchanged)
  → for each text field: normalizeLatexToPlainMath
  → validate draft structure (unchanged)
  → aggregate mathNotice
  → preview / import rows (normalized strings)
```

No lifecycle for historical rows: existing LaTeX in DB is not migrated.

## Relationships

- `QuickPasteDocument` 1—\* `QuickPasteDraft`
- `QuickPasteMathNotice` 1—1 `QuickPasteDocument` (derived)
- Import rows ← valid drafts only (existing `toImportRowsFromValidDrafts`)
