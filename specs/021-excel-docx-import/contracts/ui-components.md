# UI Component Contracts: TEACH-012 Excel & Word Templates

**Route**: `/teacher/quizzes/[id]` (and any surface mounting `BulkQuestionUpload`)  
**Layout**: RTL inherited; `text-start`; download buttons `h-11` touch targets.

---

## `ImportExcelGuide` (existing — extend)

**Unchanged**:
- Column guide table from `IMPORT_COLUMN_DEFINITIONS`
- Primary button label: **«تحميل نموذج Excel»**
- On click: `downloadSampleImportXlsx()` → `almoayed-import-template.xlsx`

**Add**:
- `data-spekit={SPEKIT.importExcelTemplateDownload}` → `"import-excel-template-download"` on the Excel download button

**Contract**: Downloaded file MUST parse via `parseXlsxQuestions` to exactly one row matching `SAMPLE_IMPORT_ROW` (or documented sample equivalence).

---

## `ImportWordGuide` (change)

**Renders**:
1. Existing DOCX hints callout (numbered `(1)`, a–d table, staging preview).
2. Existing `<pre>` TXT block format (canonical labels `الشرح:` / `التصنيف:`).
3. **Primary button**: **«تحميل نموذج Word»** — downloads **`almoayed-import-template.docx`** via `downloadSampleImportDocx()` (NOT `.txt`).
4. **Optional secondary** outline/link control: **«تحميل نموذج نصي (.txt)»** — previous TXT blob download for plain-text authors.

**Spekit**:
- Primary: `data-spekit={SPEKIT.importDocxTemplateDownload}` → `"import-docx-template-download"`
- Secondary TXT (if kept): no new spekit required unless product wants one

**Contract**: Unchanged sample `.docx` MUST produce ≥1 staged row in `BulkQuestionUpload` preview path with four options and stem containing the sample question text.

---

## `BulkQuestionUpload` (integration — no new phases)

**Excel / CSV / TXT**: Unchanged submit → `importQuestions`.

**DOCX**: Unchanged `handleFileSelect` → `parseDocxQuestions` → `DocxImportPreview` → `importQuestionRows`.

**Composition order** (idle, non-preview): `ImportFormatTabs` → `ImportValidationTips` → `FileUploadZone` → submit (existing).

Instruction panel remains hidden during DOCX preview (existing).

---

## Spekit registry additions

| Constant | Value |
|----------|-------|
| `importExcelTemplateDownload` | `import-excel-template-download` |
| `importDocxTemplateDownload` | `import-docx-template-download` |

Existing: `import-validation-tips`, `bulk-import-zone`, `bulk-import-submit`, `docx-import-preview`, `docx-import-confirm`.

---

## Explicit non-goals (UI)

- No Google Docs picker
- No PDF upload CTA
- No change to student UI
