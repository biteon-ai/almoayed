# UI Component Contracts: TEACH-004 Import Instruction Template

**Route**: `/teacher/quizzes/[id]`  
**Mount point**: `BulkQuestionUpload` inside `EditQuizBulkImportSection`  
**Layout**: RTL inherited; use `text-start`, logical margins (`ms-`/`me-`).

---

## `ImportFormatTabs`

**Props**: none (self-contained client state)

**Renders**:
- `Tabs` with `defaultValue="excel"`
- Tab triggers: **Excel / CSV** | **Word / Text (.docx / .txt)**
- Tab panels mount `ImportExcelGuide` and `ImportWordGuide`

**Behavior**: Switching tabs does not reset file input or upload state.

---

## `ImportExcelGuide`

**Props**: none

**Renders**:
1. Styled HTML `<table>` (responsive, `overflow-x-auto` wrapper) with columns from `IMPORT_COLUMN_DEFINITIONS`:
   - Column 1: friendly English label
   - Column 2 (optional): parser field name in muted monospace (`question_text`)
2. Button **"تحميل نموذج Excel"** / **"Download Sample Excel Template"** (Arabic-primary label per app convention: **«تحميل نموذج Excel»**)

**On click**: Calls `downloadSampleImportXlsx()` — saves `almoayed-import-template.xlsx`.

**Spekit**: Optional `data-spekit="import-excel-template-download"` on button (register if added to yaml).

---

## `ImportWordGuide`

**Props**: none

**Renders**:
1. `<pre>` or code card with exact block format (LTR content inside RTL page is acceptable for format literal):

```text
س: [text]
أ) [option]
ب) [option]
ج) [option]
د) [option]
الجواب: [أ/ب/ج/د]
الشرح: [text]
التصنيف: [text]
```

2. Callout card (amber or slate border) summarizing `.docx` rules:
   - Numbered questions `(1)`
   - Options in a–d table grid
   - Staging preview appears after upload before save

---

## `ImportValidationTips`

**Props**: none

**Renders**: Persistent hint box **below** tab content, **above** dropzone.

**Spekit**: `data-spekit={SPEKIT.importValidationTips}` → `"import-validation-tips"`

**Copy** (Arabic bullets):
- لا تُقيَّم صيغ Excel تلقائياً — اكتب القيم كنص عادي.
- الصور لا تُستورد — أضفها من محرر الأسئلة اليدوي بعد الاستيراد.
- معادلات Word قد تحتاج مراجعة في معاينة الاستيراد قبل الحفظ.

---

## `BulkQuestionUpload` (integration contract)

**New composition order** (when not in DOCX preview mode):

```text
<form>
  <ImportFormatTabs />
  <ImportValidationTips />
  <FileUploadZone />
  …existing error + submit buttons…
</form>
```

**Unchanged**: DOCX preview branch, submit handler, skip button, spekit on form (`bulk-import-zone`).

---

## `downloadSampleImportXlsx()` (lib contract)

**Location**: `src/lib/import-template.ts`

**Signature**:
```typescript
export function downloadSampleImportXlsx(): void
```

**Output file**:
- Filename: `almoayed-import-template.xlsx`
- Sheet name: `Questions`
- Row 1: parser headers
- Row 2: sample Arabic MCQ

**Must satisfy**: `parseXlsxQuestions(buffer)` returns length ≥ 1.

---

## `parseWordLikeText` (parser contract extension)

**New accepted lines** (in addition to existing):
- `الشرح: …` → `explanation_text`
- `التصنيف: …` → `category_tag`

**Backward compatible**: `شرح:` and `قسم:` still work.
