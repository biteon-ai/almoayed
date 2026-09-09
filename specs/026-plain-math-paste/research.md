# Research: Plain Unicode Math for Quick-Paste (TEACH-016)

**Date**: 2026-09-09  
**Status**: Complete — all Technical Context / FR-007 items resolved

## 1. FR-007: Normalize vs warn-only

**Decision**: Ship **both** — best-effort normalization of common inline LaTeX into plain Unicode, **plus** a non-blocking Arabic notice when any residual LaTeX-like markup remains after conversion.

**Rationale**: Spec Assumptions prefer normalize for common patterns; AI output still ships `$...$` / `\frac`. Warn-only leaves preview looking broken. Normalize-only without a notice hides incomplete conversions. Combining matches US3 acceptance (convert **or** warn) and FR-008 (do not invent math).

**Alternatives considered**:
- Warn-only — rejected (teachers still see `\frac` in preview).
- Aggressive full LaTeX→Unicode library — rejected (heavy dependency; incorrect conversions risk; constitution minimal-diff).
- Add KaTeX renderer — rejected (FR-005 / product assumption: no typesetting engine).

## 2. Where to apply normalization

**Decision**: Apply `normalizeLatexToPlainMath` to **parsed field strings** (`question_text`, `option_a`–`option_d`, `explanation`) after structural parse of each block. Do **not** run the converter on the raw whole document before splitting (avoids breaking `$` inside rare edge cases near markers and keeps settings header keys intact).

**Rationale**: Structure markers (`Qn:`, `Answer: B`, `=== Quiz Settings ===`) must stay exact for TEACH-014. Field-level normalize matches FR-003/FR-010.

**Alternatives considered**:
- Pre-process entire paste string — rejected (risk to headers / `Answer:` lines with `$`).
- Normalize only in the UI textarea (rewrite teacher text live) — rejected (surprising cursor jumps; server must still normalize for trust).

## 3. Conversion table (v1 covered patterns)

**Decision**: Conservative ordered replacements inside delimited math and bare commands:

| Pattern | Plain output |
|---------|----------------|
| `$...$`, `\(...\)` | Inner text after nested command conversion; delimiters removed |
| `$$...$$` | Same as inline when single-line; multi-line / unmatched → leave + `residualLatex` |
| `\frac{a}{b}` | `a/b` |
| `\sqrt{x}` / `\sqrt{2}` | `√x` / `√2` |
| `\vec{AB}`, `\overrightarrow{AB}` | `AB` |
| `\widehat{ABC}`, `\hat{A}` | `ABC` / `A` |
| `\cos`, `\sin`, `\tan`, `\cot` | `cos`, `sin`, `tan`, `cot` |
| `\pm`, `\infty`, `\cdot`, `\times` | `±`, `∞`, `·`, `×` |
| `\{`, `\}` | `{`, `}` when leftover from simple wraps |

Unrecognized backslash commands or broken braces → leave substring unchanged and set `residualLatex: true`.

**Rationale**: Covers Baccalaureate-style paste from the reported Q10 / angle / fraction cases without a full TeX engine.

**Alternatives considered**:
- Map `\vec{AB}` → `→AB` or Unicode combining arrow — deferred; plain `AB` matches sample guidance (`BM`, `MA`) and avoids BiDi arrow surprises.
- Convert `\frac{1+0}{2}` nested args — supported if braced args parse; otherwise residual.

## 4. Sample content strategy

**Decision**: Rewrite `LMS_QUICK_PASTE_SAMPLE` so Q1 uses plain math (e.g. `What is 2 + 2?` remains fine; add a second STEM-flavored example with `1/2`, `√2`, or `[AB]` and spaces). Keep Arabic `QUICK_PASTE_SAMPLE_FORMAT` free of LaTeX (already is). Optionally add one Arabic STEM line in docs/quickstart only if sample stays short.

**Rationale**: FR-002 / US2 — copy control is the teaching surface.

**Alternatives considered**:
- Separate “math sample” button — rejected (extra UI; one LMS sample is enough if it demonstrates Unicode).

## 5. Document / draft metadata for UI notice

**Decision**: Extend parse output with document-level flags, e.g. `mathNotice: { residualLatex: boolean; convertedCount: number }` aggregated from field normalizations. Do not fail `valid` solely due to residual LaTeX (FR-010).

**Rationale**: Dialog needs one Arabic banner without per-row noise; structure validity stays independent.

**Alternatives considered**:
- Per-draft `residualLatex` only — still useful internally; aggregate for banner.
- Scan raw textarea with regex in the dialog only — rejected (server import must share same logic).

## 6. Arabic–Latin spacing

**Decision**: **Samples** always include a space between Arabic letters and Latin/math tokens. **Importer** preserves existing spaces (FR-006). Optional best-effort `ensureArabicMathSpacing` may insert a single missing space at Arabic↔Latin/digit boundaries during normalize; must not strip spaces or reorder punctuation.

**Rationale**: Spec US4 — spacing is author/sample-led; soft insert is optional polish if tests prove it does not break options like `B)1/2` (prefer insert only when Arabic letter immediately abuts Latin/math).

**Alternatives considered**:
- Hard-fail parse when spaces missing — rejected (FR-010 / Independent Test).
- Full BiDi isolate wrappers (`\u2068`…`\u2069`) — deferred; adds invisible chars teachers may not expect when editing later.

## 7. TEACH-014 regression: “preserves LaTeX”

**Decision**: Change the TEACH-014 test that expects `$x^2$` / `$$\frac{1}{2}$$` retained into TEACH-016 expectations: covered patterns become plain (`x^2`, `1/2`); document residual only if something remains. Update `.speckit/spec.yaml` TEACH-014 acceptance bullet from “LaTeX delimiters preserved” to “unrecognized LaTeX preserved; common patterns normalized (see TEACH-016)”.

**Rationale**: Spec explicitly narrows TEACH-014 guidance.

## 8. Testing & Spekit

**Decision**:
- `teach-016-plain-math.test.ts` — conversion table unit cases + residual detection
- `teach-016-paste-normalize.test.ts` — LMS/Arabic blocks with LaTeX → normalized drafts; sample has no LaTeX; structure still valid
- Keep `teach-013-*` / settings tests green
- Optional Spekit: `quick-text-paste-math-notice` on the notice banner root

**Rationale**: ENABLE-001 if new persistent UI chrome; converter deserves Spekit-ID-mapped Vitest names `[TEACH-016]`.

## 9. Server vs client consistency

**Decision**: Dialog preview calls `parseQuickPasteDocument` (client). Server action `importQuickPasteQuestions` already re-parses the same text. Normalization inside parse guarantees preview ≡ saved text without trusting client-mutated drafts.

**Rationale**: Constitution server layer; TEACH-014 pattern.
