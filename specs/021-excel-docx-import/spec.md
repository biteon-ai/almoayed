# Feature Specification: Excel & Word Quiz Import Templates

**Feature Branch**: `021-excel-docx-import`

**Created**: 2026-08-04

**Status**: Draft → Implemented (2026-08-04)

**Input**: User description: "Currently import of exams and quizzes as TXT works. Need Excel and Docs (Word) file import, tested using the example templates to implement that."

**Related**: Extends TEACH-004 bulk question import (TXT already reliable; Excel/CSV path and DOCX preview exist but Word sample download is text-only and Excel/Word end-to-end reliability needs template-driven verification).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import questions from the sample Excel template (Priority: P1)

As a teacher, I download the official sample Excel template, keep or replace the sample row with my questions, upload the `.xlsx` file on the quiz import panel, and see the questions imported into the quiz without rewriting them as plain text.

**Why this priority**: Excel is the format teachers already prepare offline; closing the gap between “TXT works” and “Excel works with the published template” is the highest-value outcome.

**Independent Test**: Download the sample Excel template from the import panel → upload it unchanged → confirm questions appear on the quiz with correct text, options, answer, explanation, and category matching the sample row.

**Acceptance Scenarios**:

1. **Given** a teacher on the quiz bulk-import panel with the Excel / CSV guidance visible, **When** they download the sample Excel template, **Then** they receive an `.xlsx` file whose headers and sample row match the documented import columns.
2. **Given** the downloaded sample Excel template (sample row intact), **When** the teacher uploads it for an existing quiz, **Then** at least one question is imported with the sample question text, four options, correct answer, explanation, and category preserved.
3. **Given** the teacher replaces the sample row with their own valid Excel rows (same headers), **When** they upload the file, **Then** those questions are imported successfully.
4. **Given** TXT import already works for the same quiz, **When** Excel import succeeds, **Then** existing TXT import behavior remains unchanged.

---

### User Story 2 - Import questions from a sample Word (.docx) template (Priority: P1)

As a teacher, I download a real Word document sample (not a plain-text substitute), fill or keep the example questions, upload the `.docx` file, review the staging preview, confirm, and get questions saved to the quiz.

**Why this priority**: Teachers commonly author exams in Word; the product already advertises Word support, but the “Word template” download today is a `.txt` file, so teachers cannot reliably practice the DOCX path with an official example.

**Independent Test**: Download the sample Word template → upload the `.docx` → staging preview shows parsed questions → confirm import → quiz contains those questions.

**Acceptance Scenarios**:

1. **Given** the Word / Text guidance tab, **When** the teacher clicks the Word sample download control, **Then** the browser downloads a `.docx` file (not `.txt`) that follows the documented Word exam layout (numbered questions and a–d options).
2. **Given** the downloaded sample `.docx` (unchanged), **When** the teacher uploads it, **Then** a staging preview lists the sample questions with options visible before save.
3. **Given** the staging preview for the sample `.docx`, **When** the teacher confirms import, **Then** the questions are appended to the quiz and a success count is shown.
4. **Given** a malformed `.docx` that cannot yield any questions, **When** the teacher uploads it, **Then** they see a clear Arabic error and no empty questions are saved.

---

### User Story 3 - Template-driven verification of Excel and Word import (Priority: P2)

As the product team, we verify Excel and Word import against the same example templates teachers download, so regressions are caught before release and implementation is guided by those fixtures.

**Why this priority**: The request explicitly requires implementing and testing against example templates; automated checks lock the contract between downloadable samples and parsers.

**Independent Test**: Run the feature’s automated checks; Excel and Word sample artifacts parse to the expected question rows without manual UI steps.

**Acceptance Scenarios**:

1. **Given** the official sample Excel template content, **When** automated verification runs, **Then** it asserts the same columns and at least one valid question row that matches the published sample.
2. **Given** the official sample Word template content, **When** automated verification runs, **Then** it asserts at least one valid question with four options extractable from that document.
3. **Given** either sample template is changed, **When** verification runs, **Then** failures clearly indicate mismatch between template and expected import result.

---

### Edge Cases

- Teacher uploads `.xls` (legacy Excel) when only the modern sample is `.xlsx` — system either accepts it with the same column rules or shows a clear “use .xlsx” message; no silent partial import.
- Teacher uploads a renamed `.docx` with wrong extension — rejected with unsupported-format guidance.
- Sample Excel with formulas instead of plain values — formulas are not evaluated; empty or wrong cells produce validation feedback consistent with existing import tips.
- Sample Word with images or equations — text questions still import when structure is valid; images are not imported (teacher adds media later in the editor).
- Re-import of the same sample file on an existing quiz — questions append (no silent overwrite), matching existing TEACH-004 append behavior.
- Empty Excel sheet (headers only) or empty Word document — clear Arabic error; zero questions saved.
- Very large files — teacher sees loading feedback; failure message if the file cannot be processed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Teachers MUST be able to import multiple-choice questions into an existing quiz by uploading a valid Excel workbook (`.xlsx`) that follows the published column template.
- **FR-002**: The downloadable sample Excel template MUST remain the canonical example teachers use; uploading that template unchanged MUST successfully import its sample question(s).
- **FR-003**: Teachers MUST be able to import questions by uploading a valid Word document (`.docx`) that follows the published Word exam layout (numbered questions with a–d options), including staging preview before save.
- **FR-004**: The Word / Text guidance MUST offer a downloadable **sample `.docx` template** (real Word document) that, when uploaded unchanged, produces a successful staging preview and import of its sample question(s).
- **FR-005**: Existing plain-text (`.txt`) import MUST continue to work with no regression.
- **FR-006**: Failed Excel or Word imports MUST show clear Arabic error messages and MUST NOT create incomplete or empty question rows.
- **FR-007**: Excel and Word sample templates MUST be covered by automated verification that uses those same example artifacts (or byte-equivalent fixtures) as the source of truth.
- **FR-008**: Import of Excel and Word files MUST remain scoped to the active teacher’s quiz (no cross-teacher data leakage).
- **FR-009**: CSV import and the existing Excel column guide UI MAY remain; this feature MUST NOT remove TXT or CSV support.

### Key Entities

- **Sample Excel template**: Downloadable workbook with header row (import field names) and at least one illustrative Arabic MCQ row teachers can edit or remove.
- **Sample Word template**: Downloadable `.docx` exam document with numbered questions and a–d option structure suitable for the Word import preview path.
- **Imported question row**: Question text, four options, correct answer, optional explanation, optional category — same conceptual shape as today’s bulk import, regardless of source file type.
- **Staging preview (Word)**: Temporary review list of parsed rows before the teacher confirms save.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of P1 acceptance scenarios pass in manual QA using only the official downloadable Excel and Word sample templates (no handcrafted alternate files required for the happy path).
- **SC-002**: A teacher can complete Excel sample download → upload → import in under 2 minutes on a typical mobile or desktop browser.
- **SC-003**: A teacher can complete Word sample download → upload → preview → confirm in under 3 minutes on a typical mobile or desktop browser.
- **SC-004**: Automated template-driven checks for Excel and Word samples pass on every verification run (zero false green when sample content and expected rows diverge).
- **SC-005**: After this feature, support contacts for “Excel/Word import doesn’t work but TXT does” drop for template-following files; spot-check of 5 template-based imports succeeds on first attempt for at least 4 of 5.

## Assumptions

- “Docs” means Microsoft Word `.docx` (including files exported from Google Docs as `.docx`); live Google Docs API / Drive picker is out of scope.
- Existing bulk-import panel on the teacher quiz edit flow remains the single entry point (no new import product surface).
- Append-on-reimport behavior from TEACH-004 stays unchanged.
- The existing Excel sample template content (Arabic MCQ sample) is acceptable as the Excel fixture unless product copy updates it later.
- Word sample download currently offering a `.txt` file is insufficient; this feature replaces that with a real `.docx` sample while TXT format guidance may still be shown and downloadable separately if useful.
- Images, handwriting, and scanned PDFs remain out of scope.
- Correct-answer encoding for Word exam exports may default when the source document does not mark the key, consistent with current Word staging behavior; Excel rows must include an explicit correct option.

## Out of Scope

- PDF exam import
- Google Docs online integration (picker, OAuth, sync)
- Changing quiz grading / gatekeeper (QUIZ-001) rules
- Student-side file upload
- Auto-OCR of images inside Word or Excel
