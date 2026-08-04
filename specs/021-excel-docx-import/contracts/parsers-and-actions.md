# Parsers & Server Action Contracts: TEACH-012

## Scope

Teacher-only bulk import. No new public HTTP API. Contracts are Server Actions + pure parser functions.

---

## Pure builders (client + tests)

### `buildSampleImportSheetRows()` / `downloadSampleImportXlsx()`

**Existing** in `src/lib/import-template.ts`.

| Input | Output |
|-------|--------|
| none | `string[][]` headers + sample; browser download `.xlsx` |

**Invariant**: `parseXlsxQuestions(xlsxBufferFromBuilder)` → `[SAMPLE_IMPORT_ROW]` (field-wise).

### `buildSampleImportDocxBuffer()` / `downloadSampleImportDocx()` — NEW

| Input | Output |
|-------|--------|
| none | `ArrayBuffer` / `Uint8Array` of valid OOXML; browser download `almoayed-import-template.docx` |

**Invariant**:  
`mammoth.convertToHtml({ arrayBuffer })` → HTML → `sanitizeImportRows(parseDocxHtmlQuestions(html))` → length ≥ 1, each row has non-empty `question_text` and four options; stem matches sample question.

---

## Parsers (existing; harden only if invariant fails)

| Function | File | Role |
|----------|------|------|
| `parseXlsxQuestions(buffer)` | `import-questions.ts` | Sheet → `ImportQuestionRow[]` |
| `parseCsvQuestions(text)` | `import-questions.ts` | Unchanged |
| `parseWordLikeText(text)` | `import-questions.ts` | TXT — regression guard |
| `parseDocxHtmlQuestions(html)` | `parse-docx-questions.ts` | Mammoth HTML → rows |
| `sanitizeImportRows(rows)` | `parse-docx-questions.ts` | Drop incomplete rows |

**Error policy**: Return empty array or throw Arabic `Error` messages consumed by UI; never insert empty questions.

---

## Server Actions (existing signatures)

### `parseDocxQuestions(formData: FormData)`

- Requires teacher session (as today).
- `file` must be `.docx`.
- Returns sanitized `ImportQuestionRow[]`.
- Does **not** persist.

### `importQuestions(quizId, formData)`

- `requireTeacher` + `assertQuizOwnedByTeacher(quizId, profileId)`.
- `.xlsx` / `.xls` → `parseXlsxQuestions`.
- `.csv` → `parseCsvQuestions`.
- `.txt` / `.doc` → `parseWordLikeText`.
- `.docx` → throw redirect-to-preview style Arabic error (client must use preview path).
- Persists via `importQuestionRows` (append/replace per `import_mode`).

### `importQuestionRows(quizId, rows, options)`

- Used after DOCX staging confirm.
- Same ownership checks; append-only default.

**TEACH-012**: No signature changes required unless Excel empty-file messaging needs clearer Arabic errors (allowed as additive message-only change).

---

## Multi-tenant

All persist paths MUST continue to call `assertQuizOwnedByTeacher` / equivalent quiz `created_by = session.profileId` checks. No cross-teacher quiz_id acceptance.

---

## Test naming

Vitest describes use `[TEACH-012]` prefix for new files; do not remove `[TEACH-004]` coverage.
