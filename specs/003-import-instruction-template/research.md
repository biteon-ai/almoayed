# Research: TEACH-004 Import Instruction Template

**Date**: 2026-07-14  
**Status**: Complete — all Technical Context items resolved

## 1. Excel template download mechanism

**Decision**: Client-side generation in `src/lib/import-template.ts` using existing `xlsx` package (`XLSX.utils.aoa_to_sheet` + `XLSX.write` with `bookType: "xlsx"`). Trigger via `<Button onClick>` — no Server Action or static file in `public/`.

**Rationale**: Spec requires dynamic generation with parser field headers + one sample row. `xlsx` is already a project dependency (used in `parseXlsxQuestions` and tests). Avoids deployment drift between static file and parser.

**Alternatives considered**:
- Static `public/sample-import.xlsx` — rejected (harder to keep in sync with parser fields).
- Server Action returning buffer — rejected (unnecessary server round-trip for public template shape).

## 2. Tab component selection

**Decision**: Reuse `src/components/ui/tabs.tsx` (Base UI) inside new `ImportFormatTabs.tsx`. Default value `"excel"`.

**Rationale**: Tabs primitive already exists from DASH-001 work; matches RTL styling patterns. Clarification locked Excel/CSV as default tab.

**Alternatives considered**:
- Custom button toggle — rejected (accessibility + keyboard nav).
- Radix tabs — rejected (project uses Base UI).

## 3. Word/Text label alias extension

**Decision**: Extend `parseWordLikeText` line matchers:
- Explanation: `شرح:`, `الشرح:`, `Explanation:`
- Category: `قسم:`, `التصنيف:`, `Category:`

Implement via small helper `matchLabelPrefix(line, prefixes[])` to avoid duplicated branches.

**Rationale**: Clarification requires UI canonical labels while preserving backward compatibility with existing `.txt` fixtures in `teach-004-import.test.ts`.

**Alternatives considered**:
- UI-only change without parser update — rejected (teachers following UI labels would fail import).
- Normalizing labels in pre-processor — rejected (inline matcher extension is minimal).

## 4. Component decomposition

**Decision**:

| Component | Responsibility |
|-----------|----------------|
| `ImportFormatTabs` | Tab shell + default tab state |
| `ImportExcelGuide` | Column mapping table + download CTA |
| `ImportWordGuide` | `<pre>` block format + DOCX callout card |
| `ImportValidationTips` | Persistent Arabic bullet hint |

Compose in `BulkQuestionUpload` order: `ImportFormatTabs` → `ImportValidationTips` → `FileUploadZone`.

**Rationale**: Keeps `BulkQuestionUpload` focused on upload state machine (idle/parsing/preview/importing). Each guide component is independently testable in Storybook/manual QA.

**Alternatives considered**:
- Monolithic inline JSX in `BulkQuestionUpload` — rejected (constitution minimal diff ≠ single 300-line file).

## 5. Sample row content

**Decision**: One Arabic MCQ example row in template:

| Field | Sample value |
|-------|--------------|
| `question_text` | `ما ناتج 5 × 5؟` |
| `option_a`–`d` | `20`, `25`, `30`, `35` |
| `correct_answer` | `ب` |
| `explanation_text` | `5 × 5 = 25` |
| `category_tag` | `ضرب` |

**Rationale**: Mirrors existing test fixtures; imports successfully without edit. Teachers can delete row 2 before filling.

## 6. Spekit target

**Decision**: Add `SPEKIT.importValidationTips = "import-validation-tips"` on hint container root. Register in `.speckit/spekit-targets.yaml` under TEACH-004.

**Rationale**: Spec FR-006 mandates `data-spekit="import-validation-tips"`. Constitution requires spekit registry updates for new help surfaces.

## 7. DOCX instruction scope

**Decision**: Word tab shows `.txt` block in `<pre className="... font-mono text-xs">` plus compact `Alert`/callout card for `.docx` — no duplicate of full DOCX parser rules (already enforced in staging preview).

**Rationale**: Clarification Option A — brief callout only; avoids maintaining two full DOCX spec documents.
