# Data Model: Excel & Word Quiz Import Templates (TEACH-012)

**Date**: 2026-08-04  
**Migration**: None — reuse existing `questions` insert path from TEACH-004

## Persistent entities (unchanged)

### `questions` (via existing import)

| Field | Role |
|-------|------|
| `quiz_id` | Target quiz; ownership asserted by teacher session |
| `question_text` | From Excel column / DOCX stem |
| `option_a`–`option_d` | Four MCQ choices |
| `correct_answer` | Excel: required in row; Word: parser default or staging edit |
| `explanation_text` | Optional |
| `category_tag` | Optional; import may apply `default_category` when empty/`عام` |

No new tables, columns, or RLS policies.

## Ephemeral / application entities

### `ImportQuestionRow` (existing TypeScript shape)

Canonical row shared by CSV, XLSX, TXT, and DOCX parsers:

| Field | Required for save | Notes |
|-------|-------------------|-------|
| `question_text` | Yes | Non-empty after sanitize |
| `option_a`–`option_d` | Yes (four options) | Empty options rejected by sanitize |
| `correct_answer` | Yes for durable quiz quality | Excel sample sets `ب`; DOCX may default |
| `explanation_text` | No | |
| `category_tag` | No | Default `عام` / teacher default |

### Sample Excel template (ephemeral download)

| Aspect | Value |
|--------|-------|
| Filename | `almoayed-import-template.xlsx` |
| Sheet | `Questions` |
| Row 1 | Parser field names (`question_text`, …, `category_tag`) |
| Row 2 | `SAMPLE_IMPORT_ROW` values |
| Builder | `buildSampleImportSheetRows()` / `downloadSampleImportXlsx()` |

### Sample Word template (ephemeral download) — NEW

| Aspect | Value |
|--------|-------|
| Filename | `almoayed-import-template.docx` |
| Structure | Paragraph `(1) {question_text}` + options table (a–d / أ–د) matching mammoth→parser expectations |
| Content | Same stem/options as `SAMPLE_IMPORT_ROW` where representable |
| Builder | `buildSampleImportDocxBuffer()` / `downloadSampleImportDocx()` |

### Staging preview (Word only, existing)

Client-only list of `StagedImportRow` after `parseDocxQuestions`; confirm calls `importQuestionRows`. Not persisted until confirm.

## Validation rules

1. Excel: at least one data row with non-empty `question_text`; empty workbook → Arabic error, zero inserts.
2. Word: at least one parseable numbered question with four options after sanitize; else Arabic error, no staging confirm.
3. Failed parses never insert partial rows.
4. Re-import appends (TEACH-004); no duplicate detection.

## State transitions (Word upload)

```text
idle → (select .docx) → parsing → preview → (confirm) → importing → idle + success count
                      ↘ error → idle
preview → (cancel/reset) → idle
```

Excel/CSV/TXT: form submit → `importQuestions` → success/error (no staging).

## Relationships

```text
Teacher ──owns──► Quiz ──has many──► Question
                      ▲
                      │ importQuestions / importQuestionRows
                 Sample XLSX / DOCX / TXT
```
