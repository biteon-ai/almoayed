# Research: Quick Text Paste Bulk Question Import (TEACH-013)

**Date**: 2026-08-13  
**Status**: Complete — all Technical Context items resolved

## 1. Reuse TEACH-004 `parseWordLikeText` vs dedicated paste parser

**Decision**: Add **`src/lib/import-text.ts`** with `parseQuickPasteText` / `QUICK_PASTE_SAMPLE_FORMAT` tailored to clarifications (`*ب)`, blank-line blocks, validity + Arabic error reasons). Do **not** change `parseWordLikeText` / `parseLabeledWordBlocks` behavior for file import in this feature.

**Rationale**: Existing labeled parser requires `س:`-or-first-line stem and `الجواب:` (no `*letter)`), and only emits rows that already have a correct answer — no invalid draft list for live preview. Paste UX needs per-block validity status without regressing TXT upload.

**Alternatives considered**:
- Extend `parseLabeledWordBlocks` in place — rejected for v1 (risk to TEACH-004 fixtures; harder to return invalid drafts).
- Call `parseWordLikeText` only and drop asterisk / invalid preview — rejected (fails FR-005 / Story 2).

## 2. Client vs server parse authority

**Decision**: Pure shared parser used in the client for **live preview**; Server Action **re-parses** the raw string on confirm, applies 50-cap, then persists. Client never sends pre-validated row arrays as the sole source of truth.

**Rationale**: Prevents tampered client payloads; matches constitution (privileged writes server-side). Same grammar ensures preview ≈ save.

**Alternatives considered**:
- Client-only parse + `importQuestionRows(rows)` — rejected (trust boundary).
- Server-only parse on every keystroke — rejected (latency / chatter).

## 3. Correct answer persistence (letter vs option text)

**Decision**: On paste persist, set `correct_answer` to **`resolveCorrectOptionText(letterOrText, options)`** (option text). Preview may still show the letter for teacher clarity.

**Rationale**: Spec FR-005 / SC-003a; avoids letter-vs-text grading mismatch. `resolveCorrectOptionText` already exists.

**Alternatives considered**:
- Store letter only (rely on grade-time resolve) — rejected by clarification.
- Change all TEACH-004 inserts in this PR — optional follow-up; **paste path must** normalize; shared `importRowsToQuestionInserts` normalize is allowed if TEACH-004 tests stay green (prefer paste-only map first for minimal diff).

## 4. Persist API surface

**Decision**: New `importQuickPasteQuestions(quizId: string, text: string)` in `src/actions/teacher.ts` → parse → filter valid → slice(0, 50) → map to `ImportQuestionRow` with option-text correct → `importQuestionRows(quizId, rows, { mode: "append" })`. Return `{ imported, skippedInvalid, capped: boolean }`.

**Rationale**: Single entry for UI; ownership + revalidate already in `importQuestionRows`; append-only matches spec (no replace).

**Alternatives considered**:
- Reuse `importQuestions` FormData file path — rejected (no file).
- Duplicate insert SQL in new action — rejected (reuse inserts helper).

## 5. Option padding

**Decision**: Build `options` via `.filter(Boolean)` on a–d fields (existing `importRowsToQuestionInserts`). Do not invent empty strings for missing ج/د.

**Rationale**: Clarification Q5; FR-004.

## 6. UI placement and feedback

**Decision**: Button **«لصق نصي سريع»** beside **«إضافة سؤال يدوياً»** in `QuizQuestionsManager`. Dialog: textarea + «نسخ نموذج التنسيق» + scrollable preview list + confirm. On `imported ≥ 1`: close + toast with counts; on zero valid: keep open + Arabic error. Use existing toast/HubToast patterns on the page.

**Rationale**: Spec FR-001 / FR-009; matches Story 1–3.

**Alternatives considered**:
- Only on bulk-import tab — rejected (entry next to manual add).
- Keep dialog open after partial skip — rejected (clarification Q3).

## 7. Asterisk and conflict rules

**Decision**: Option line regex allows optional leading `*` before letter (`*ب)` / `*ب)`). Separate `الجواب:` / `Answer:` line; if both disagree, **`الجواب:` wins**. Latin a–d map to أ–د.

**Rationale**: Spec Assumptions + Story 4.

## 8. Spekit + registry

**Decision**:
- `SPEKIT.quickTextPasteOpen = "quick-text-paste-open"`
- `SPEKIT.quickTextPasteDialog = "quick-text-paste-dialog"`
- `SPEKIT.quickTextPasteSubmit = "quick-text-paste-submit"`
- Registry feature **`TEACH-013`** in `.speckit/spec.yaml` on implement.

**Rationale**: ENABLE-001; DAP for new CTAs.

## 9. Testing

**Decision**:
- `teach-013-quick-paste-parse.test.ts` — blank lines, `س:`/plain stem, `*ب)`, `الجواب:`, conflict winner, &lt;2 options invalid, Latin aliases, no empty padding
- `teach-013-quick-paste-save.test.ts` — valid subset, 50-cap, letter→option text on insert shape
- Keep TEACH-004 import tests green (no intentional file-parser changes)

**Rationale**: SC-003 / SC-001a / SC-003a testability without requiring Playwright for v1.
