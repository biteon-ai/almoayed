# Feature Specification: Structured LMS Quiz Text Import

**Feature ID**: TEACH-014  
**Feature Branch**: `023-lms-quiz-text-import`  
**Created**: 2026-08-13  
**Status**: Implemented  

**Input**: User description: "Educational content generator output format — optional Quiz Settings header (type, attempts, timer, duration) plus a structured Question List (`Q1:`, `A)`–`D)`, `Answer:`, optional `Explanation:`, blank line between blocks, LaTeX allowed) designed for direct programmatic parsing into the LMS."

**Related**: Extends TEACH-013 quick text paste and TEACH-003/QUIZ-004/QUIZ-005 quiz settings. Does not replace Excel/Word file import (TEACH-004/012) or Arabic paste conventions already supported in TEACH-013.

## Clarifications

### Session 2026-08-13

- Q: How are quiz settings from the paste header applied in the UI? → A: Preview parsed settings in the dialog; apply them on the same confirm-save as questions (no separate settings-only confirm).
- Q: How are invalid settings fields handled when questions are valid? → A: Per-field — apply valid settings; skip invalid fields with Arabic warnings; still import valid questions.
- Q: Can English LMS and Arabic TEACH-013 blocks appear in the same paste? → A: Per-block auto-detect — LMS (`Qn:` / `Answer:`) and Arabic TEACH-013 blocks may coexist in one paste.
- Q: Does `Qn:` start a new question without a blank line? → A: Yes — a line starting with `Q1:`, `Q2:`, … starts a new block even without a preceding blank line (like `(n)`).
- Q: Enable Timer is Yes but duration is missing/blank — what happens? → A: Skip applying timer + duration; warn in Arabic; keep existing quiz timer settings.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Paste LMS-formatted questions and save (Priority: P1)

As a teacher on a quiz’s question management screen, I paste text that follows the structured LMS question template (`Q1:` … `Answer: B`), see a live preview of valid questions, and save them into the current quiz.

**Why this priority**: Core value — AI/chat-generated quizzes in the documented English LMS template must import without reformatting by hand.

**Independent Test**: Open quick text paste on `/teacher/quizzes/[id]` → paste a two-question LMS block → preview shows two valid items → save → questions appear with four options and correct answer as option text.

**Acceptance Scenarios**:

1. **Given** the paste dialog is open, **When** the teacher pastes a block starting with `Q1:` and four choices `A)`–`D)` plus `Answer: B`, **Then** the preview marks that question valid before save.
2. **Given** multiple question blocks separated by a blank line **or** consecutive `Qn:` markers without a blank line, **When** preview updates, **Then** each `Qn:` block is listed separately.
3. **Given** valid LMS questions in preview, **When** the teacher confirms save, **Then** questions are appended to the quiz (subject to the existing paste cap) and success feedback shows the imported count.
4. **Given** save succeeds, **When** viewing the question list, **Then** each imported question has four options and the correct answer stored as the chosen option’s text (not a bare letter alone).

---

### User Story 2 — Apply optional Quiz Settings header (Priority: P1)

As a teacher pasting a full generated quiz, I include the optional `=== Quiz Settings ===` header so the current quiz’s type, attempt limit, timer on/off, and duration update to match the generated settings when I confirm import.

**Why this priority**: The generator’s header is part of the required template; applying it avoids a second trip to quiz settings after paste.

**Independent Test**: Paste header + questions → confirm → quiz settings reflect mapped type / attempts / timer / duration and questions are imported.

**Acceptance Scenarios**:

1. **Given** paste includes `=== Quiz Settings ===` with Quiz Type, Number of Attempts, Enable Timer, and Quiz Duration, **When** the text is parsed, **Then** the paste dialog shows a clear Arabic preview of the parsed settings (alongside question preview).
2. **Given** settings are shown in preview and at least one question is valid, **When** the teacher confirms save, **Then** those settings are applied to the current quiz in the same action as question import, using the product’s existing meaning of type, attempts, and timer.
3. **Given** Enable Timer is No, **When** settings apply, **Then** the quiz is not timed (duration ignored or cleared per existing product rules).
4. **Given** Number of Attempts is Unlimited, **When** settings apply, **Then** the quiz allows unlimited attempts.
5. **Given** paste has no settings header, **When** questions are saved, **Then** existing quiz settings are left unchanged and no settings preview card is required.
6. **Given** the settings header has an unrecognized Quiz Type or invalid duration, **When** preview/save runs, **Then** the invalid field is shown with a clear Arabic warning, that field is not applied, other valid settings fields still apply on successful question import, and valid questions still import.

---

### User Story 3 — Live validation for LMS markers (Priority: P2)

As a teacher, I see which `Qn:` blocks are invalid (missing choice, missing Answer, fewer than four choices) so I can fix the text before saving.

**Why this priority**: Prevents silent bad imports from AI output that almost matches the template.

**Independent Test**: Paste one complete `Q1` and one `Q2` missing `Answer:` → preview marks the second invalid → save imports only the valid one (or keeps dialog open if none valid).

**Acceptance Scenarios**:

1. **Given** a block with fewer than four `A)`–`D)` choices, **When** preview updates, **Then** that item is invalid with a clear Arabic reason.
2. **Given** choices present but no `Answer:` line, **When** preview updates, **Then** that item is invalid until an answer letter is provided.
3. **Given** a mix of valid and invalid LMS blocks, **When** the teacher saves, **Then** only valid questions are imported; toast reports imported and skipped counts; dialog closes if at least one was imported.

---

### User Story 4 — LaTeX and bilingual markers (Priority: P2)

As a teacher importing STEM quizzes, mathematical expressions written with `$...$` or `$$...$$` are preserved in stems and choices, and English LMS markers work alongside existing Arabic paste conventions without breaking either path.

**Why this priority**: Generator instructions require LaTeX; teachers also still paste Arabic `س:` / `الجواب:` content.

**Independent Test**: Paste `Q1:` with `$\\frac{1}{2}$` in the stem and `Answer: A` → preview/save keep the LaTeX characters intact; separately, an Arabic blank-line paste still validates as before.

**Acceptance Scenarios**:

1. **Given** a stem or choice containing inline or block LaTeX delimiters, **When** imported, **Then** the stored text retains those characters unchanged.
2. **Given** English `Q1:` / `A)` / `Answer:` format, **When** parsed, **Then** it is accepted as a first-class paste format.
3. **Given** existing Arabic TEACH-013 paste (blank lines / `(n)` / `*ب)` / `الجواب:`), **When** pasted, **Then** behavior remains available and regression-safe.
4. **Given** one paste containing both a `Q1:` LMS block and an Arabic `س:` / `(n)` block, **When** preview updates, **Then** each block is validated with its own format rules and valid blocks from both styles can be imported together.

---

### Edge Cases

- Missing `=== Quiz Questions ===` banner — still parse `Qn:` blocks if present.
- Settings header present but no questions — no question inserts; Arabic message; quiz settings are not changed (or only change if explicitly confirmed — see Assumptions: settings apply only with ≥1 imported question).
- Duplicate `Qn:` numbers or out-of-order numbers — still import in paste order; numbering is a marker, not a sort key requirement.
- Consecutive `Qn:` / `(n)` markers without blank lines — each marker starts a new question block.
- `Answer:` letter that does not match A–D — invalid block.
- Latin `a)`–`d)` aliases for choices — accepted as A–D.
- Timer Yes with duration outside product range (1–180 minutes) — skip applying timer/duration for that paste with clear Arabic warning; do not write invalid values; other valid settings and questions may still apply.
- Timer Yes with missing/blank duration — same as out-of-range: do not enable timer; warn; keep existing quiz timer settings.
- Very long paste — same cap as TEACH-013 (50 valid questions per confirm).
- Empty paste / whitespace — no writes.
- Teacher does not own the quiz — save fails safely.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Teachers MUST be able to paste structured LMS quiz text via the existing quick text paste entry point («لصق نصي سريع») on the quiz question management screen.
- **FR-002**: The system MUST parse question blocks that start with `Qn:` (e.g. `Q1:`, `Q2:`) and include exactly four choices labeled `A)` `B)` `C)` `D)` (Latin letter aliases allowed) plus an `Answer: [Letter]` line.
- **FR-003**: Optional `Explanation:` lines MUST be stored as the question explanation when present.
- **FR-004**: Question blocks MUST be delimited by a blank line between blocks **and/or** by a new line starting with `Qn:` (e.g. `Q1:`, `Q2:`), which MUST start a new question even when no blank line precedes it (same delimiter spirit as `(n)` numbering).
- **FR-005**: A candidate LMS question MUST be valid only if it has a non-empty stem, all four choices non-empty, and exactly one resolvable Answer letter among A–D; on save, correct answer MUST persist as that choice’s **text**.
- **FR-006**: The system MUST accept an optional header section titled `=== Quiz Settings ===` with fields: Quiz Type, Number of Attempts, Enable Timer, Quiz Duration (minutes).
- **FR-006a**: When a settings header is detected, the paste dialog MUST show a live Arabic preview of the parsed settings (type, attempts, timer, duration) before confirm-save.
- **FR-007**: Quiz Type values MUST map to existing product categories: Practice / Homework → practice; Assessment Quiz → evaluation; Challenge / Competition → challenge.
- **FR-008**: Number of Attempts MUST support Unlimited (product unlimited) or a positive finite count within existing product limits.
- **FR-009**: Enable Timer Yes/No and Quiz Duration MUST map to existing timed-quiz rules (duration only applied when timer is enabled and value is within the allowed minute range).
- **FR-009a**: If Enable Timer is Yes but duration is missing, blank, or out of range, the system MUST NOT enable/change timer settings for that paste; it MUST show an Arabic warning and leave the quiz’s existing timer fields unchanged (other valid settings and questions may still apply).
- **FR-010**: When a settings header is present and at least one question is successfully imported, the system MUST apply **valid** settings fields to the **current** quiz in the **same** confirm-save action as question import. Invalid or unrecognized settings fields MUST be skipped with Arabic warnings in preview/toast and MUST NOT overwrite existing quiz values for those fields. Valid question imports MUST NOT be blocked solely because one settings field is invalid.
- **FR-011**: Live preview MUST distinguish valid vs invalid LMS blocks with Arabic reasons, consistent with TEACH-013 UX (close on ≥1 import; toast with skip counts).
- **FR-012**: LaTeX delimiters `$...$` and `$$...$$` in stems/choices/explanations MUST be preserved as plain text content.
- **FR-013**: Existing Arabic TEACH-013 paste formats MUST continue to work in the same paste surface; file import paths remain unchanged.
- **FR-013a**: The parser MUST auto-detect format **per question block**: blocks starting with `Qn:` use LMS rules (four choices + `Answer:`); Arabic / `(n)` / `الجواب:` / `*letter)` blocks use TEACH-013 rules. Mixed pastes MUST be allowed.
- **FR-014**: Import MUST remain scoped to the teacher-owned quiz (no cross-teacher writes).

### Key Entities

- **LMS paste document**: Optional settings header + ordered question blocks.
- **Quiz settings snapshot (from header)**: Type, attempts, timer flag, duration minutes — applied to the existing quiz entity.
- **Pasted question draft**: Ephemeral parse result (stem, four options, correct letter/text, explanation, validity) — same lifecycle as TEACH-013 drafts.
- **Quiz question**: Persistent MCQ after save.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A teacher can import at least 5 valid LMS-template questions from one paste in under 2 minutes on a typical phone browser.
- **SC-002**: 100% of P1 acceptance scenarios pass in manual QA on `/teacher/quizzes/[id]`.
- **SC-003**: Pasting a document with a valid settings header + 3 valid and 1 invalid question imports exactly 3 questions, updates quiz settings to the header values, and shows clear Arabic feedback for the skipped question.
- **SC-004**: A paste with `$x^2$` in the stem stores that substring unchanged after import.
- **SC-005**: Unauthorized or non-owner access never adds questions or changes another teacher’s quiz settings.

## Assumptions

- Entry point is the TEACH-013 «لصق نصي سريع» dialog (no separate page).
- Settings header is previewed in the dialog and applied on the same confirm-save as questions (no separate settings confirm step).
- Settings from the header apply only when ≥1 question is imported in that confirm action; otherwise quiz settings stay unchanged.
- Unrecognized settings keys are ignored; known keys with invalid values are skipped **per field** with a warning in the toast/preview; other valid settings fields still apply; valid question imports still proceed.
- Finite attempt counts follow existing product max (e.g. 1–10); values above the max are **rejected for that field** with a clear message (not clamped silently).
- Timer duration must be an integer in the existing 1–180 minute product range when Enable Timer is Yes; missing, blank, or out-of-range duration skips applying timer/duration fields with a warning and leaves existing quiz timer settings unchanged.
- `=== Quiz Questions ===` is optional documentation; parsing keys off `Qn:` / blank lines / `(n)`.
- A line starting with `Qn:` starts a new question block even without a preceding blank line.
- Append-only for questions (same as TEACH-013); settings overwrite the quiz’s current settings fields when applied.
- English labels are primary for the LMS generator template; Arabic TEACH-013 markers remain supported in the same paste surface with **per-block** auto-detection (mixed pastes allowed).
- LaTeX is stored as text; student/teacher math rendering uses existing display behavior.

## Out of Scope

- Calling an external AI model to generate quizzes inside the app
- Parsing images/PDFs inside the paste dialog
- Editing individual preview rows before save
- Replacing file Excel/Word import
- Changing student gatekeeper or grading rules
- Supporting fewer than four choices in the English LMS template (Arabic TEACH-013 shorter option sets remain separate)
