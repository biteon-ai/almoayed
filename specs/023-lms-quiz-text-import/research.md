# Research: Structured LMS Quiz Text Import (TEACH-014)

**Date**: 2026-08-13  
**Status**: Complete — all Technical Context items resolved

## 1. Extend TEACH-013 parser vs separate module

**Decision**: Extend `src/lib/import-text.ts` with `parseQuickPasteDocument` (settings + drafts). Keep `parseQuickPasteText` as a thin wrapper returning drafts only for backward-compatible TEACH-013 tests.

**Rationale**: One paste surface; clarifications require mixed per-block detection in the same dialog. Separate modules would duplicate splitters and risk drift.

**Alternatives considered**:
- New `import-lms-text.ts` only — rejected (duplication; harder mixed paste).
- Fork dialog / second entry point — rejected (FR-001).

## 2. Settings application API

**Decision**: After successful `importQuestionRows`, call existing `updateQuizFlags(quizId, partialFlags)` with **only** fields that parsed as valid. Do not call timer/attempt helpers with invalid data (they throw).

**Rationale**: Reuses product validation (`validateDurationMinutes`, `validateMaxAttempts`, `parseAssessmentCategory`) and ownership checks already in `updateQuizFlags`.

**Alternatives considered**:
- Raw Supabase update in paste action — rejected (bypasses validation).
- Always call `updateQuizAttemptSettings` / `updateQuizTimerSettings` separately — OK equivalent; prefer one `updateQuizFlags` batch when possible.

## 3. Quiz type string mapping

**Decision**: Map header strings (case-insensitive, trim) to `AssessmentCategory`:

| Header value (examples) | Product |
|-------------------------|---------|
| Practice, Homework, Practice / Homework | `practice` |
| Assessment, Assessment Quiz | `evaluation` |
| Challenge, Competition, Challenge / Competition | `challenge` |

Unrecognized → field invalid (warning; skip).

**Rationale**: Matches FR-007 and existing `assessment_category` enum.

## 4. Attempts & timer field rules

**Decision**:
- `Unlimited` / `غير محدود` → `max_attempts: 0`
- Positive int within product max → that value; above max → skip field + warn
- Timer `No` → `is_timed: false`, `duration_minutes: null`
- Timer `Yes` + duration 1–180 → both set
- Timer `Yes` + missing/blank/OOR duration → **skip both timer fields** (FR-009a); do not enable timer

**Rationale**: Clarifications; avoid broken timed quizzes.

## 5. Block splitting & LMS vs Arabic detection

**Decision**: Extend `splitQuickPasteBlocks` to also flush on `/^Q\d+:/i`. Detect block kind: if first content line (after strip) matches `Qn:` or contains LMS `Answer:` grammar → LMS validation (require 4 options); else TEACH-013 (≥2 options, `*`/`الجواب:`).

**Rationale**: Clarifications Q3–Q4.

**Alternatives considered**:
- Whole-document mode switch — rejected.
- Require blank lines for `Qn:` — rejected.

## 6. Settings header extraction

**Decision**: Detect `=== Quiz Settings ===` … until `=== Quiz Questions ===` or first question marker (`Qn:` / `(n)` / blank-line Arabic block start). Parse `Key: Value` lines. Strip header from question body before split.

**Rationale**: Matches generator template; missing Questions banner still OK.

## 7. UI preview

**Decision**: When settings present, show a compact RTL card above/ beside question preview listing each field’s Arabic label, parsed value, and warning chip if invalid/skipped. Apply on same Save button.

**Rationale**: Clarification Q1.

## 8. Testing & Spekit

**Decision**:
- `teach-014-lms-parse.test.ts` — Qn: split, 4 choices, Answer→option text, LaTeX retain, mixed Arabic+LMS
- `teach-014-lms-settings.test.ts` — mapping, per-field skip, timer Yes without duration
- Keep TEACH-013 tests green
- Optional Spekit: `quick-text-paste-settings` on settings preview root

## 9. Sample format

**Decision**: Extend `QUICK_PASTE_SAMPLE_FORMAT` (or add `LMS_QUICK_PASTE_SAMPLE`) with a short English LMS example including settings header for copy-example; keep Arabic sample available (primary copy can show bilingual or LMS sample in placeholder — prefer LMS sample addition without removing Arabic copy path: e.g. secondary “نسخ نموذج LMS” or replace placeholder with dual short samples). Prefer: copy button pastes Arabic TEACH-013 sample; add second control «نسخ نموذج LMS» for English template.

**Rationale**: Teachers need the generator contract visible; Arabic path remains first-class.
