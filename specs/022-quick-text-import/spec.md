# Feature Specification: Quick Text Paste Bulk Question Import

**Feature ID**: TEACH-013  
**Feature Branch**: `022-quick-text-import`  
**Created**: 2026-08-13  
**Status**: Implemented  

**Input**: User description: "Implement TEACH-013 — Quick Text Paste Bulk Question Import on the quiz question management screen. Teachers paste formatted Arabic MCQ text (options أ–د, correct answer via `*ب)` or `الجواب: ب`, optional explanation/category), see live preview with validation, then save all valid questions. Entry point: button «لصق نصي سريع» next to manual add question."

**Related**: Extends TEACH-004 bulk import (file-based) with a faster paste path; must not replace file import or manual single-question entry.

## Clarifications

### Session 2026-08-13

- Q: How are multiple questions delimited in a paste, and what stem markers are required? → A: Blank-line-separated blocks; stem MAY use `س:` or plain text (no required numbering).
- Q: What is the maximum number of questions imported per confirm-save in v1? → A: Cap at 50 questions imported per confirm-save (preview may show more; save stops at 50 with clear Arabic message).
- Q: After a successful save that skipped some invalids, what happens to the dialog? → A: Always close dialog on any successful import (≥1 saved); toast reports imported + skipped counts.
- Q: How is the correct answer persisted for student grading? → A: Store the full option text of the correct letter (letter used only while parsing).
- Q: How are fewer than four options handled on save? → A: Save only provided options (2–4); no empty padding.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Paste text and save valid questions (Priority: P1)

As a teacher on a quiz’s question management screen, I open quick text paste, paste one or more Arabic multiple-choice questions in the supported format, see which ones are valid, and save all valid questions into that quiz in one action.

**Why this priority**: Fastest authoring path for teachers who already have questions in chat/notes; core value of TEACH-013.

**Independent Test**: Open `/teacher/quizzes/[id]` → click «لصق نصي سريع» → paste a valid sample block → preview shows valid question(s) → confirm save → questions appear on the quiz list with correct options and answer.

**Acceptance Scenarios**:

1. **Given** a teacher who owns the quiz is on the question management screen, **When** they tap «لصق نصي سريع», **Then** a paste dialog opens with a text area and a clear format example (Arabic RTL, mobile-friendly).
2. **Given** the paste dialog is open, **When** the teacher pastes text containing a complete MCQ (stem, at least two options among أ–د, and one correct answer), **Then** a live preview lists that question as valid before save.
3. **Given** valid questions appear in the preview, **When** the teacher confirms save, **Then** all valid questions are added to the current quiz (subject to the 50-question cap) and the dialog closes with clear success feedback (imported count; if any invalids were skipped, that count is included in the toast).
4. **Given** save succeeds, **When** the teacher views the quiz questions list, **Then** each imported question shows the stem, only the options that were present in the paste (2–4, no empty padding), and the correct answer as the option **text** of the marked letter (not a bare letter alone).

---

### User Story 2 — Live validation and error highlighting (Priority: P1)

As a teacher pasting text, I see immediately which blocks are invalid (missing options, missing correct answer, incomplete stem) so I can fix the text before saving.

**Why this priority**: Prevents silent bad imports and support load; required for safe bulk paste.

**Independent Test**: Paste a mix of one valid and one incomplete block → preview marks the incomplete block with a clear Arabic error → save only inserts the valid one (or blocks save with a clear message if none are valid).

**Acceptance Scenarios**:

1. **Given** pasted text with a question that has fewer than two options, **When** preview updates, **Then** that item is marked invalid with a clear Arabic reason.
2. **Given** pasted text with options but no correct-answer marker, **When** preview updates, **Then** that item is marked invalid until a correct answer is indicated.
3. **Given** a mix of valid and invalid questions, **When** the teacher saves, **Then** only valid questions are imported, the dialog closes, and the success toast reflects the imported count and the skipped-invalid count (invalid ones are skipped, not partially written).
4. **Given** only invalid questions in the preview, **When** the teacher tries to save, **Then** no questions are written, the dialog stays open, and an Arabic message explains that nothing valid was found.

---

### User Story 3 — Copy example format (Priority: P2)

As a teacher unfamiliar with the paste format, I can copy an official example into the clipboard (or see it in the placeholder) so I know exactly how to structure text.

**Why this priority**: Reduces first-time failure; secondary to paste/save itself.

**Independent Test**: Open dialog → tap «نسخ نموذج التنسيق» → paste into the text area → preview shows the sample as valid.

**Acceptance Scenarios**:

1. **Given** the paste dialog is open, **When** the teacher taps the copy-example control, **Then** the canonical example format is placed on the clipboard and a brief confirmation appears.
2. **Given** the text area is empty, **When** the teacher views it, **Then** a placeholder shows the same canonical example structure (stem, أ–د options, correct answer, optional explanation/category).

---

### User Story 4 — Correct-answer format variants (Priority: P2)

As a teacher, I can mark the correct option either with an asterisk on the option line (e.g. `*ب) …`) or with a separate `الجواب: ب` line, and both are accepted.

**Why this priority**: Matches real teacher notes and chat exports; increases paste success rate.

**Independent Test**: Paste one question using `*ب)` and another using `الجواب: ج` → both preview as valid with the expected correct options.

**Acceptance Scenarios**:

1. **Given** an option line marked with a leading asterisk before the letter (e.g. `*ب)`), **When** parsed, **Then** that letter is treated as the correct answer.
2. **Given** a line `الجواب: ب` (or equivalent Arabic key line) after options, **When** parsed, **Then** ب is the correct answer.
3. **Given** both markers appear and conflict, **When** parsed, **Then** behavior is deterministic and documented in Assumptions (prefer explicit `الجواب:` line over asterisk, or vice versa — see Assumptions).

---

### Edge Cases

- Empty paste or whitespace-only text — save disabled or clear “لا يوجد نص” message; no DB writes.
- Very long paste (dozens of questions) — preview remains usable on mobile; save completes with loading feedback; at most 50 valid questions are imported per confirm (excess valid candidates skipped with clear Arabic cap message); failures show Arabic error without silent partial success beyond the documented valid-subset + cap rules.
- Duplicate paste of the same text twice — questions append again (same append-only policy as TEACH-004); no duplicate detection in v1.
- Teacher does not own the quiz — cannot open save path successfully; unauthorized attempt fails safely.
- Options using Latin a–d as well as Arabic أ–د — accepted as aliases mapped to Arabic letters (Assumption).
- Fewer than four options (but ≥2) — valid; only provided options are saved (no empty ج/د padding).
- Explanation (`الشرح:`) and category (`التصنيف:` / `قسم:`) optional; missing ones use sensible defaults (empty explanation; default category as elsewhere in import).
- Closing the dialog without save discards paste draft (not persisted). Successful save (≥1 imported) also closes the dialog and discards the draft; reopen for a new paste.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Teachers MUST be able to open a quick text-paste import surface from the quiz question management screen via a control labeled **«لصق نصي سريع»** placed near the existing manual “add question” action.
- **FR-002**: The paste surface MUST provide a multi-line text input, an Arabic RTL layout suitable for mobile, a visible format example (placeholder and/or copy-example control), a live preview of parsed questions, and a confirm-save action.
- **FR-003**: The system MUST parse pasted text into candidate questions including: question stem, options أ–د (or Latin aliases), correct answer, optional explanation, optional category. Multiple questions MUST be delimited by a blank line. A stem MAY start with `س:` or be plain text; numbered markers such as `(1)` are NOT required in v1.
- **FR-003a**: The canonical format example shown in the paste surface MUST use blank-line separation and an optional `س:` stem prefix consistent with FR-003.
- **FR-004**: A candidate question MUST be considered valid only if it has a non-empty stem, at least two options among أ–د (or Latin aliases), and exactly one resolvable correct answer among the provided options. On save, the system MUST persist only the options that were present (2–4); it MUST NOT pad missing letters with empty option slots.
- **FR-004a**: A block with only one option, or with a correct letter that does not match any provided option, MUST be invalid.
- **FR-005**: The system MUST accept correct-answer indication via asterisk-on-option notation (`*ب)`) and via a `الجواب:` line (Arabic letter). At persist time, the system MUST store the **option text** corresponding to that letter as the question’s correct answer (not the letter alone), so student grading matches selected option text.
- **FR-005a**: During parse/preview, the correct letter MAY be shown for teacher clarity; the saved quiz question MUST use option text for `correct_answer` (or equivalent field).
- **FR-006**: The live preview MUST update as the teacher edits the text and MUST visually distinguish valid vs invalid candidates with Arabic status/reasons.
- **FR-007**: On confirm, the system MUST insert currently valid questions into the active quiz owned by the teacher and MUST NOT insert invalid candidates. At most **50** valid questions MUST be imported per confirm-save; if more valid candidates exist, only the first 50 (in paste order) are imported and the teacher MUST see a clear Arabic message that the cap was reached.
- **FR-007a**: The live preview MAY list more than 50 valid candidates, but confirm-save MUST still enforce the 50-question cap.
- **FR-008**: Import MUST be scoped to the teacher’s owned quiz (no cross-teacher quiz writes).
- **FR-009**: After successful import (≥1 question saved), the paste dialog MUST close and the teacher MUST see success feedback including the number of questions added and, when applicable, how many invalid candidates were skipped and/or that the 50-question cap applied. The on-screen question list MUST reflect the new questions without a full manual page reload being required beyond normal app refresh patterns.
- **FR-009a**: If save is attempted with zero valid candidates, the dialog MUST remain open and no success toast that implies import occurred may be shown.
- **FR-010**: Existing file bulk import (TEACH-004 / TEACH-012) and manual single-question add MUST remain available and unchanged in purpose.
- **FR-011**: Teachers MUST be able to copy the official example format to the clipboard from the paste surface.

### Key Entities

- **Pasted question draft**: Ephemeral parse result (stem, options, correct answer, explanation, category, validity, error reason) — not stored until save.
- **Quiz question**: Persistent MCQ belonging to a quiz (same conceptual shape as today’s teacher questions).
- **Import session (UI)**: Dialog state holding raw text + preview list until cancel or successful save.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A teacher can import at least 5 valid questions from a single paste in under 2 minutes (open dialog → paste → confirm) on a typical phone browser.
- **SC-001a**: Pasting more than 50 valid questions and confirming save imports exactly 50 and surfaces an Arabic cap/limit message.
- **SC-002**: 100% of P1 acceptance scenarios pass in manual QA on `/teacher/quizzes/[id]`.
- **SC-003**: When pasting a mix of 3 valid and 2 invalid blocks, exactly 3 questions are added and both invalid blocks show clear Arabic reasons in preview before save.
- **SC-003a**: For a saved question marked `*ب)` or `الجواب: ب`, the persisted correct answer equals option ب’s text, and a student selecting that option is graded correct.
- **SC-004**: At least 9 of 10 first-time teachers following the on-screen example produce a successful import on the first attempt in a short usability spot-check.
- **SC-005**: Unauthorized or non-owner access never adds questions to another teacher’s quiz (spot-check / QA).

## Assumptions

- Multi-question pastes are split on blank lines (one or more empty lines between blocks). Within a block, the stem is the text before the first option line; `س:` is optional and stripped if present. Numbered `(n)` markers are not required for v1 parsing.
- Per confirm-save, at most 50 valid questions are imported (first 50 in paste order); remaining valid candidates are skipped with an explicit Arabic message. Teachers can paste again for the rest.
- Append-only import (same spirit as TEACH-004): re-pasting the same text creates additional questions; no deduplication in v1.
- If both `الجواب:` and `*letter)` are present and disagree, **`الجواب:` wins**.
- On save, the resolved correct letter is mapped to that option’s text and stored as the question’s correct answer (same grading contract as TEACH-004/TEACH-012 text/Excel/DOCX paths that resolve letter → option text).
- Only options present in the paste block are persisted (2–4); missing letters are omitted rather than stored as empty strings.
- Latin option letters a–d map to أ–د.
- Optional explanation/category labels accept the same Arabic conventions teachers already use in text/file import (`الشرح:`, `التصنيف:` / legacy `قسم:`).
- Default category when omitted follows existing bulk-import default behavior (e.g. teacher default or «عام»).
- Mixed valid/invalid paste: save imports the valid subset (not all-or-nothing), then closes the dialog; toast states how many were imported and how many invalids were skipped. Zero-valid save keeps the dialog open.
- Scope is the teacher quiz question management screen for an existing quiz — not student UI, not a new standalone page.
- File upload import remains the path for Excel/Word/large files; this feature is paste-only.

## Out of Scope

- Parsing images, PDFs, or Word/Excel files inside the paste dialog
- AI generation or auto-correction of stems
- Editing individual preview rows before save (beyond editing the raw text)
- Duplicate detection / replace-mode for paste (unless reused from existing advanced import settings later)
- Changing student-facing gatekeeper or grading rules
