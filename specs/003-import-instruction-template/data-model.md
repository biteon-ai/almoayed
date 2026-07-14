# Data Model: TEACH-004 Import Instruction Template

**Date**: 2026-07-14  
**Schema source**: No database changes — UI-only feature + parser alias extension.

## Persistent entities (unchanged)

Import still maps to existing `questions` table via `importQuestions` / `importQuestionRows` Server Actions. No new tables, columns, or migrations.

## UI state (client-only)

### ImportFormatTab

| Field | Type | Notes |
|-------|------|-------|
| `activeTab` | `"excel" \| "word"` | Default `"excel"`; local component state only |

### FileUploadState (existing — unchanged)

Owned by `BulkQuestionUpload`: `parsePhase`, `stagedRows`, `docxFileName`, `error`, `isPending`.

**Rule**: When `parsePhase === "preview" \| "importing"` with staged DOCX rows, entire instruction panel + dropzone form is replaced by `DocxImportPreview` (existing behavior).

## Template artifacts (ephemeral)

### ImportColumnDefinition (TypeScript — not DB)

```typescript
interface ImportColumnDefinition {
  /** Friendly English label shown in UI table */
  label: string;
  /** Parser / XLSX header field name */
  field: keyof ImportQuestionRow;
  /** Optional hint for Correct Option column */
  hint?: string;
}
```

**Canonical columns** (order matters for UI table):

| label | field |
|-------|-------|
| Question Text | `question_text` |
| Option A | `option_a` |
| Option B | `option_b` |
| Option C | `option_c` |
| Option D | `option_d` |
| Correct Option (A, B, C, or D) | `correct_answer` |
| Explanation | `explanation_text` |
| Category | `category_tag` |

### Sample XLSX shape

| Row | Content |
|-----|---------|
| 1 | Header: parser field names (`question_text`, `option_a`, …) |
| 2 | Sample Arabic MCQ (see research.md §5) |

**Validation**: Row 2 MUST parse successfully through `parseXlsxQuestions` without modification.

## Parser extension (pure function)

### parseWordLikeText label aliases

| Semantic | Accepted prefixes |
|----------|-------------------|
| Explanation | `شرح:`, `الشرح:`, `Explanation:` |
| Category | `قسم:`, `التصنيف:`, `Category:` |

Existing prefixes for question, options, answer unchanged.

## Spekit registry

| Target ID | Element |
|-----------|---------|
| `import-validation-tips` | Validation hint container |
| `bulk-import-zone` | Existing — unchanged on form root |
| `bulk-import-submit` | Existing — unchanged |

## Relationships

```text
EditQuizBulkImportSection
  └── BulkQuestionUpload
        ├── ImportFormatTabs
        │     ├── ImportExcelGuide  (tab: excel)
        │     └── ImportWordGuide   (tab: word)
        ├── ImportValidationTips
        └── FileUploadZone → importQuestions / DOCX pipeline
```
