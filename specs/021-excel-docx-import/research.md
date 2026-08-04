# Research: Excel & Word Quiz Import Templates (TEACH-012)

**Date**: 2026-08-04  
**Status**: Complete — all Technical Context items resolved

## 1. Word sample download format

**Decision**: Replace the current `ImportWordGuide` download (which saves `almoayed-import-template.txt`) with a primary CTA that downloads a real **`almoayed-import-template.docx`**. Keep the plain-text block preview in the UI; optionally retain a secondary “تحميل نموذج نصي” control for `.txt` authors.

**Rationale**: Spec FR-004 requires a downloadable `.docx` that uploads successfully through the existing staging preview. The TXT download falsely labeled as “نموذج Word” causes teacher confusion and fails the Word happy path.

**Alternatives considered**:
- Keep TXT-only download + DOCX callout — rejected (spec P1 requires real `.docx` sample).
- Host static file in `public/` only — see decision 2.

## 2. How to produce the sample `.docx`

**Decision**: Add the **`docx`** npm package and implement `buildSampleImportDocxBuffer()` / `downloadSampleImportDocx()` in `src/lib/import-docx-template.ts`. Document structure must match what `parseDocxHtmlQuestions` expects after mammoth HTML conversion: numbered question paragraphs like `(1) …` and a table (or clear a–d cells) for options.

**Rationale**: Matches the Excel pattern (`buildSampleImportSheetRows` → client download → same builder in Vitest). Avoids binary drift between `public/` assets and parser expectations. `mammoth` already converts `.docx` → HTML server-side; generation is the missing half.

**Alternatives considered**:
- Static committed `.docx` in `public/` + `tests/fixtures/` — rejected as primary approach (headers/content drift; dual copies). Acceptable as a fallback only if `docx` packaging is blocked.
- Hand-rolled OOXML ZIP — rejected (fragile, hard to maintain).
- Server Action that returns a buffer — rejected (unnecessary round-trip for a public template).

## 3. Excel path: implement vs verify

**Decision**: Treat Excel as **verify + harden**, not rewrite. Existing `downloadSampleImportXlsx`, `parseXlsxQuestions`, and `importQuestions` (`.xlsx` / `.xls`) remain authoritative. Add TEACH-012 Vitest round-trip: `buildSampleImportSheetRows` → `XLSX.write` → `parseXlsxQuestions` → equals `SAMPLE_IMPORT_ROW`. Fix only if gaps appear (empty sheet errors, alias headers, Arabic answer letters).

**Rationale**: Code and TEACH-004 tests already cover sample Excel parse; user report reflects incomplete Word template + need for template-driven confidence, not absence of Excel parser.

**Alternatives considered**:
- Rebuild Excel importer — rejected (minimal-diff constitution; working path exists).
- Drop `.xls` support — out of scope; keep current accept list; sample remains `.xlsx`.

## 4. Sample content alignment (Excel ↔ Word)

**Decision**: Word sample uses the **same conceptual MCQ** as `SAMPLE_IMPORT_ROW` (ما ناتج 5 × 5؟ / 20–35 / correct ب / شرح / ضرب). Word layout uses `(1)` numbering + a–d option table so mammoth HTML hits existing parser markers. Default correct answer when DOCX has no key remains current parser default (`أ`) **unless** the generated sample can encode the key in a way the parser already understands; if not, document that Excel carries the key in-column while Word sample may need staging edit — prefer encoding answer in sample if a supported convention exists without expanding parser scope.

**Rationale**: Spec assumes Excel rows include explicit correct option; Word exam layout historically may default. For the **official sample**, teachers should see a usable import; if parser cannot read a key from DOCX, staging preview still lets teacher set answer before confirm (existing UI). Prefer generating structure the current parser accepts without new grammar.

**Alternatives considered**:
- Different sample questions per format — rejected (harder QA, dual fixtures).
- Expand DOCX grammar for “الجواب:” lines in this feature — defer unless sample cannot pass without it (keep minimal diff).

## 5. Testing strategy

**Decision**:
- `tests/features/teach-012-excel-template.test.ts` — builder ↔ `parseXlsxQuestions`
- `tests/features/teach-012-docx-template.test.ts` — `buildSampleImportDocxBuffer` → mammoth `convertToHtml` → `parseDocxHtmlQuestions` / `sanitizeImportRows`; assert ≥1 question with four options and expected stem text
- Keep existing `teach-004-import.test.ts` / `teach-004-docx-parse.test.ts` green (TXT + HTML fixtures)

**Rationale**: FR-007 / SC-004 require template-driven automated verification using the same artifacts teachers download.

**Alternatives considered**:
- Playwright-only E2E download clicks — useful later; Vitest unit/integration is sufficient for v1 contract lock.
- Snapshot binary hashes — brittle across `docx` library versions; assert parsed semantic rows instead.

## 6. Dependency and bundle impact

**Decision**: Add `docx` as a **dependency**. Dynamically `import("docx")` inside download helper (same pattern as `import("xlsx")`) so the quiz edit page does not eagerly load OOXML generation until the teacher clicks download.

**Rationale**: Keeps initial teacher page JS lean; generation is infrequent.

**Alternatives considered**:
- Server-only generation route — rejected (extra surface; client download is fine).

## 7. Spekit hooks

**Decision**: Add:
- `SPEKIT.importExcelTemplateDownload = "import-excel-template-download"`
- `SPEKIT.importDocxTemplateDownload = "import-docx-template-download"`

Register in `.speckit/spekit-targets.yaml` under TEACH-012 / TEACH-004. Wire on respective download buttons.

**Rationale**: ENABLE-001 / constitution — new help CTAs get DAP hooks. Existing `import-validation-tips`, `docx-import-preview`, `docx-import-confirm` unchanged.

## 8. Registry ID

**Decision**: Register as **`TEACH-012`** in `.speckit/spec.yaml`, linked to TEACH-004 files, with acceptance criteria mirroring P1 Excel/Word template flows. Do not remove TEACH-004 entries.

**Rationale**: TEACH-004 already documents instruction UI; TEACH-012 scopes fidelity + Word `.docx` sample + template tests without rewriting TEACH-004 history.
