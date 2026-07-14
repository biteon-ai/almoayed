# Feature Specification: TEACH-004 Import Instruction Template

**Feature ID**: TEACH-004 (UI enhancement)  
**Feature Branch**: `003-import-instruction-template` (recommended)  
**Created**: 2026-07-14  
**Status**: Draft — clarification in progress  
**Parent**: TEACH-004 Bulk Question Import (implemented)

**Input**: Add a visual instruction template section before the bulk-import file dropzone on the teacher quiz edit import panel (`BulkQuestionUpload` / `EditQuizBulkImportSection`).

## Clarifications

### Session 2026-07-14

- Q: Word/Text instruction labels vs parser — which labels should the UI show and parser accept? → A: UI shows `الشرح:` / `التصنيف:`; parser accepts both old (`شرح:` / `قسم:`) and new labels.
- Q: What should the downloaded sample `.xlsx` contain? → A: Parser field names (`question_text`, `option_a`, …) plus one sample Arabic MCQ row; UI table keeps friendly English labels.

## User Scenarios & Testing

### User Story 1 — Format guidance before upload (Priority: P1)

As a teacher preparing a bulk import, I see format-specific instructions (Excel/CSV vs Word/Text) before the dropzone so I know the expected structure and can download a starter template.

**Why this priority**: Reduces failed imports and support friction; directly addresses teacher onboarding on the edit-page import flow.

**Independent Test**: Open `/teacher/quizzes/[id]` import section → tabs, column table or text format preview, validation hint, and dropzone appear in order; sample Excel downloads with valid headers.

**Acceptance Scenarios**:

1. **Given** teacher on quiz edit import panel, **When** page loads, **Then** format switcher tabs appear **above** the file dropzone.
2. **Given** "Excel / CSV" tab selected, **When** teacher views the panel, **Then** a styled table shows expected columns and a "Download Sample Excel Template" control is visible.
3. **Given** "Word / Text" tab selected, **When** teacher views the panel, **Then** a code block / preview card shows the canonical plain-text block format:
   ```
   س: [text]
   أ) [option]
   ب) [option]
   ج) [option]
   د) [option]
   الجواب: [أ/ب/ج/د]
   الشرح: [text]
   التصنيف: [text]
   ```
4. **Given** a `.txt` file using legacy labels `شرح:` or `قسم:`, **When** imported, **Then** import still succeeds (backward compatible).
5. **Given** import panel, **When** teacher reads validation tips, **Then** hint box with `data-spekit="import-validation-tips"` appears before upload reminding about formulas/images post-import handling.

---

### User Story 2 — Sample Excel template download (Priority: P1)

As a teacher, I can download a starter `.xlsx` file with correct import headers so I can fill questions offline.

**Independent Test**: Click download → browser saves `.xlsx`; re-uploading populated file imports successfully via existing parser.

**Acceptance Scenarios**:

1. **Given** Excel/CSV tab, **When** teacher clicks download, **Then** a `.xlsx` file downloads with parser header row (`question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`, `explanation_text`, `category_tag`) and one sample Arabic MCQ row.
2. **Given** downloaded template (including the sample row), **When** uploaded, **Then** existing `importQuestions` flow succeeds.
3. **Given** teacher deletes the sample row and adds their own rows, **When** uploaded, **Then** import succeeds using the same header row.

---

## Requirements

### Functional Requirements

- **FR-001**: Import panel MUST render format switcher tabs labeled **"Excel / CSV"** and **"Word / Text (.docx / .txt)"** before `FileUploadZone`.
- **FR-002**: Excel/CSV tab MUST display a styled table of expected columns using **friendly English labels**: Question Text, Option A, Option B, Option C, Option D, Correct Option (A, B, C, or D), Explanation, Category — mapped visually to parser fields.
- **FR-003**: Excel/CSV tab MUST provide **"Download Sample Excel Template"** that downloads a `.xlsx` with parser field-name headers plus **one sample Arabic MCQ row** (teachers may delete the sample row before filling).
- **FR-004**: Word/Text tab MUST display plain-text format rules in a code block or preview card using `الشرح:` and `التصنيف:` as canonical UI labels.
- **FR-005**: `parseWordLikeText` MUST accept both canonical labels (`الشرح:`, `التصنيف:`) and legacy aliases (`شرح:`, `قسم:`) without breaking existing imports.
- **FR-006**: Panel MUST show validation hint box (`data-spekit="import-validation-tips"`) before upload about formulas/images requiring manual editor handling after import.
- **FR-007**: Enhancement MUST integrate into existing `BulkQuestionUpload` on `/teacher/quizzes/[id]` without breaking DOCX preview staging, CSV/XLSX/TXT import, or skip/manual flows.

### Key Entities

- **Import format template (UI)**: Tabbed instructional content; not persisted.
- **Sample Excel file**: Ephemeral download artifact; row 1 = parser field names; row 2 = one illustrative Arabic MCQ teachers can edit or remove.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of acceptance scenarios pass in manual QA on quiz edit import panel.
- **SC-002**: Downloaded sample `.xlsx` (with included sample row) imports successfully via existing parser without modification.
- **SC-003**: `import-validation-tips` spekit target is present and visible before dropzone on desktop and mobile.
- **SC-004**: Legacy `.txt` files using `شرح:` / `قسم:` continue to import successfully after parser alias extension.

## Assumptions

- Scope is the existing edit-page bulk import UI (`EditQuizBulkImportSection` → `BulkQuestionUpload`), not a new `/teacher/quizzes` list dialog.
- Existing parsers (`import-questions.ts`, DOCX pipeline) remain authoritative except for Word/Text label alias extension (FR-005).
- Copy is Arabic-first for teacher-facing labels; column table may use English headers as specified.

## Out of Scope

- Changing append-on-reimport behavior
- New file type support beyond existing CSV, XLSX, TXT, DOCX
- Auto-fixing formulas/images during import

## Edge Cases

- Teacher switches tabs while a file is selected — dropzone state unchanged; instructions update only.
- Teacher on DOCX preview staging screen — instruction template hidden (existing preview replaces upload form).
- Download clicked repeatedly — each click produces a fresh valid template file.
- `.txt` block uses `شرح:` or `قسم:` instead of `الشرح:` / `التصنيف:` — parser accepts both.
