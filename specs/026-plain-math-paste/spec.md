# Feature Specification: Plain Unicode Math for Quick-Paste Quizzes

**Feature ID**: TEACH-016  
**Feature Branch**: `026-plain-math-paste`  
**Created**: 2026-09-09  
**Status**: Implemented  

**Input**: User description: "Quiz formatting engine for an online Arabic LMS quick-paste parser — never emit raw LaTeX delimiters or commands; use plain Unicode math (fractions with /, vectors/segments as plain text or arrows, Unicode roots/symbols, trig in plain text); enforce spaces between Arabic and math/Latin; keep LMS structure `Qn:` / `A)`–`D)` / `Answer:` / `Explanation:`."

**Related**: Extends TEACH-013 (quick text paste) and TEACH-014 (structured LMS paste). Clarifies and supersedes TEACH-014’s guidance that `$...$` LaTeX is the preferred STEM paste format. Does not add a specialized formula typesetting engine. Does not change Excel/Word file import (TEACH-004/012) structure beyond shared display of stored question text.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Paste STEM questions with readable plain math (Priority: P1)

As a teacher importing math questions via «لصق نصي سريع», I paste LMS-formatted text whose formulas use plain Unicode (e.g. `7/9`, `√2`, `[AB]`, `sin(BAC)`) instead of LaTeX tags, and the live preview and saved questions show the same readable symbols without raw `\frac`, `\vec`, or `$...$`.

**Why this priority**: Teachers currently paste AI/LaTeX output that the platform stores and displays as broken raw code; plain math is the only way STEM content is readable today without a typesetting engine.

**Independent Test**: Open quick paste on a quiz → paste one `Q1:` block with Unicode fractions/vectors and no LaTeX → preview shows symbols as typed → save → question list and student-facing text match.

**Acceptance Scenarios**:

1. **Given** the paste dialog is open, **When** the teacher pastes a valid LMS block whose stem/options/explanation use only plain Unicode math and spaced Arabic/Latin boundaries, **Then** the preview marks the question valid and displays the math characters as entered (no LaTeX command strings).
2. **Given** such a paste is saved, **When** the teacher views the quiz question list (and a student later sees the question after access rules allow), **Then** the stored text still contains those Unicode symbols and still has no LaTeX delimiters/commands introduced by the product.
3. **Given** LMS structure `Qn:` / `A)`–`D)` / `Answer:` / optional `Explanation:`, **When** math is written in plain Unicode inside those fields, **Then** existing TEACH-014 validation and save behavior still apply unchanged.

---

### User Story 2 — Official samples and copy templates use plain math (Priority: P1)

As a teacher who uses «نسخ نموذج LMS» (or equivalent sample copy controls), I receive an example that demonstrates plain Unicode math and correct Arabic–math spacing so I can replace LaTeX habits without guessing.

**Why this priority**: The built-in sample is the primary teaching surface for the paste format; if it still shows `$...$`, teachers and generators will keep producing broken content.

**Independent Test**: Click copy LMS sample → paste into the dialog → preview is valid and sample math uses `/`, `√`, `[AB]`-style notation with spaces beside Arabic words.

**Acceptance Scenarios**:

1. **Given** the quick-paste dialog, **When** the teacher copies the LMS sample, **Then** the sample contains no `$...$`, `\(...\)`, `\frac`, `\vec`, `\widehat`, or similar raw LaTeX commands.
2. **Given** that sample text, **When** it is pasted into the dialog, **Then** at least one question validates and preview math is human-readable Unicode.
3. **Given** Arabic words adjacent to math in the sample, **When** inspected, **Then** a clear space separates Arabic from Latin/math tokens (e.g. `تساوي 2√2` not `تساوي2√2`).

---

### User Story 3 — LaTeX paste is normalized or clearly guided away (Priority: P2)

As a teacher who still pastes AI output that contains `$...$` or `\frac{...}{...}`, I either get automatic conversion into plain Unicode equivalents for common patterns, or I see a clear Arabic warning that raw LaTeX will display as code — so I am not surprised by broken preview text.

**Why this priority**: Real generator output still uses LaTeX; without a soft landing, US1 alone only helps teachers who already rewrote their text.

**Independent Test**: Paste a `Q1:` stem containing `$\\frac{1}{2}$` and `$\\vec{AB}$` → either preview/stored text becomes `1/2` and `AB` (or an agreed plain form) **or** the dialog shows an Arabic warning that LaTeX will appear as raw code, while structure validation still works.

**Acceptance Scenarios**:

1. **Given** pasted LMS text containing common inline LaTeX (fractions, vectors, roots, trig), **When** preview updates, **Then** the product either replaces those expressions with plain Unicode equivalents in the draft shown for import **or** keeps the text but surfaces a non-blocking Arabic notice that math tags are not rendered as symbols.
2. **Given** normalization is applied, **When** the teacher saves, **Then** the saved question text matches the normalized preview (no silent reintroduction of LaTeX).
3. **Given** unrecognized or complex LaTeX that cannot be safely converted, **When** preview updates, **Then** the product does not invent incorrect math; it leaves that fragment as-is and still allows import if LMS structure is valid, preferably with the same Arabic notice.

---

### User Story 4 — Arabic BiDi spacing stays intact after import (Priority: P2)

As a teacher pasting mixed Arabic + Latin/math lines, I keep a space between Arabic words and math/Latin expressions so RTL preview does not glue tokens together or scramble punctuation.

**Why this priority**: BiDi collisions are a primary cause of “broken” STEM paste even when characters are Unicode.

**Independent Test**: Paste `نقطة M تحقق BM - MA = 0` with required spaces → preview order remains readable; paste the same without spaces → either still imports (structure-valid) or a soft guidance note appears — structure parsing must not fail solely due to spacing.

**Acceptance Scenarios**:

1. **Given** Arabic text with a space before/after a Latin or math token, **When** imported, **Then** those spaces are preserved in stored text.
2. **Given** punctuation at the end of a mixed line, **When** previewed in RTL, **Then** the line remains readable (no requirement to reorder teacher-authored wording beyond preserving their spaces).
3. **Given** TEACH-013 Arabic paste and TEACH-014 LMS paste, **When** plain Unicode math is used inside either format, **Then** both formats remain supported in one paste session.

---

### Edge Cases

- Empty math-looking token (e.g. only `$`) — treat as ordinary text; do not crash parse.
- Nested or multi-line `$$...$$` blocks — do not require conversion; leave as-is or warn; LMS block boundaries still follow `Qn:` / blank-line rules.
- Option text that is only a Unicode fraction (e.g. `B) 1/2`) — valid choice text.
- Segment notation `[AB]` vs vector `AB` — both accepted; product does not force one style beyond sample guidance.
- Existing questions already stored with LaTeX — not bulk-migrated by this feature; only new paste/normalize path is in scope.
- Mixed paste: one block already Unicode, one still LaTeX — each block handled independently under US3 rules.
- Settings header from TEACH-014 — unaffected by math formatting rules.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST treat plain Unicode math (fractions with `/`, Unicode roots/symbols such as `√` `±` `∞`, plain segment/vector names such as `[AB]` / `BM`, plain trig such as `sin(BAC)`) as the canonical recommended content style for STEM text inside quick-paste stems, choices, and explanations.
- **FR-002**: Official LMS (and any math-bearing Arabic) quick-paste sample/copy templates MUST NOT include raw LaTeX delimiters (`$...$`, `\(...\)`, `$$...$$`) or commands such as `\frac`, `\vec`, `\widehat`, `\cos` as LaTeX control sequences.
- **FR-003**: Quick-paste structural parsing (`Qn:`, `A)`–`D)`, `Answer:`, `Explanation:`, TEACH-013 Arabic markers, optional quiz settings header) MUST continue to work when field bodies contain plain Unicode math.
- **FR-004**: When teachers paste text that already follows FR-001, the product MUST preserve that text through preview and save without introducing LaTeX markup.
- **FR-005**: The product MUST NOT require a specialized formula typesetting engine for newly recommended STEM paste to be readable; readability MUST come from the stored characters themselves.
- **FR-006**: The product MUST enforce or document a spacing convention: at least one space between an Arabic word and an adjacent Latin/math expression in official samples; imported teacher text that already has those spaces MUST keep them.
- **FR-007**: For pasted content that still contains common LaTeX math, the product MUST either (a) normalize common patterns into plain Unicode in the import draft, or (b) show a clear Arabic non-blocking warning that LaTeX will display as raw code — and MUST document which behavior is shipped in planning.
- **FR-008**: Normalization (if shipped) MUST be conservative: never invent incorrect mathematical meaning for unrecognized LaTeX; leave unrecognized fragments unchanged.
- **FR-009**: Student exam gatekeeper rules (no answers/explanations before submit) and multi-tenant teacher scoping MUST remain unchanged by this feature.
- **FR-010**: Teachers MUST still be able to import structurally valid LMS questions even if some math fragments remain as raw LaTeX after best-effort handling (structure validity is independent of math style).

### Key Entities

- **Quick-paste document**: Teacher-authored or AI-generated text consumed by «لصق نصي سريع», optionally with quiz settings header and one or more question blocks.
- **Question block**: Stem + choices + answer marker + optional explanation; math style applies inside text fields only.
- **Plain math expression**: Human-readable Unicode/Latin notation embedded in Arabic prose without LaTeX control sequences.
- **LaTeX fragment**: Legacy or AI-produced substring using `$`/`\(...\)` delimiters or backslash commands that the platform does not typeset.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a timed walkthrough, a teacher can copy the official LMS sample, paste it, and confirm a valid STEM question preview in under 2 minutes without manually deleting LaTeX tags.
- **SC-002**: For a reference set of at least 10 representative high-school math questions rewritten in plain Unicode (fractions, roots, vectors/segments, trig), 100% import as structurally valid LMS blocks when options and `Answer:` are complete.
- **SC-003**: After import of that reference set, a reviewer inspecting preview and saved question text finds zero occurrences of `$...$`, `\frac`, `\vec`, or `\widehat` introduced by the sample or by successful normalization of covered patterns.
- **SC-004**: At least 9 of 10 teachers in an internal review of mixed Arabic+math lines with proper spaces rate the preview as “readable without decoding code” (binary yes/no).
- **SC-005**: Existing TEACH-013/TEACH-014 regression checks for structure, bilingual paste, and settings header remain passing; no increase in false-invalid rate for Unicode-only STEM pastes versus equivalent LaTeX pastes of the same structure.

## Assumptions

- The platform will not ship a full formula typesetting engine in this feature; plain characters are the display strategy.
- “Quiz formatting engine” here means product rules + samples (+ optional paste normalization), not a separate standalone formatting service.
- Default for FR-007 in planning: prefer best-effort normalization for common inline patterns (`\frac`, `\vec`, `\sqrt`, `$...$`) with an Arabic notice when residual LaTeX remains; exact conversion table is a planning artifact.
- TEACH-014’s prior “LaTeX preserved” acceptance is narrowed: preservation remains true for unrecognized fragments, but the recommended and sampled path is plain Unicode; docs/spec registry should be updated when this feature is implemented.
- Bulk migration of historical LaTeX questions is out of scope.
- Excel/Word imports are out of scope except that once text is stored, it displays the same way as paste-imported text.
- Punctuation placement guidance is advisory for authors; the parser does not rewrite sentence order for BiDi beyond preserving spaces.
- Feature ID TEACH-016 is reserved in the product registry when implementation updates `.speckit/spec.yaml`.
