# Quickstart: TEACH-004 Import Instruction Template

Manual verification after implementation.

## Prerequisites

- Dev server: `npm run dev`
- Demo teacher: WhatsApp `963912345678`, code `AlMoayed-DEMO`
- Existing quiz with edit access, or create new quiz → lands on `?setup=import`
- Branch: `003-import-instruction-template` (optional)

## 1. Instruction panel layout (FR-001, FR-006)

1. Log in as demo teacher → open any quiz edit page `/teacher/quizzes/[id]`.
2. In **استيراد أسئلة بالجملة** card, confirm order top-to-bottom:
   - Format tabs (Excel / CSV selected by default)
   - Tab-specific instructions
   - Validation hint box (`data-spekit="import-validation-tips"`)
   - File dropzone
   - Import / Skip buttons
3. DevTools → verify `[data-spekit="import-validation-tips"]` exists.

## 2. Excel / CSV tab (FR-002, FR-003)

1. Confirm column table shows 8 friendly English headers.
2. Click **تحميل نموذج Excel** → file `almoayed-import-template.xlsx` downloads.
3. Open file → row 1 = parser field names; row 2 = sample Arabic question.
4. Upload file unchanged → import succeeds (1 question added).
5. Delete sample row in Excel, add your own row, re-upload → import succeeds.

## 3. Word / Text tab (FR-004)

1. Switch to **Word / Text (.docx / .txt)** tab.
2. Confirm plain-text block shows `الشرح:` and `التصنيف:` labels.
3. Confirm `.docx` callout mentions numbered `(1)` questions and a–d tables.
4. Create `.txt` file using UI format with `الشرح:` / `التصنيف:` → import succeeds.
5. Create `.txt` with legacy `شرح:` / `قسم:` → import still succeeds (SC-004).

## 4. DOCX flow unchanged (FR-007)

1. Upload valid `.docx` → instruction panel hides; staging preview appears.
2. Confirm and save → toast / redirect behavior unchanged.
3. Cancel preview → instruction panel + dropzone return.

## 5. Regression

```bash
npm run lint && npm run typecheck && npm run test -- tests/features/teach-004-import.test.ts
```

## 6. Mobile smoke

1. Viewport 390×844 → tabs wrap/readable; table scrolls horizontally if needed.
2. Validation hint and dropzone visible without overlapping.
