# Parsers & Actions Contracts: TEACH-016

## Pure module — NEW `src/lib/plain-math.ts`

### `normalizeLatexToPlainMath(input: string): PlainMathNormalizeResult`

| Output | Meaning |
|--------|---------|
| `text` | Plain Unicode / Latin math preferred form |
| `convertedCount` | Number of successful known-pattern rewrites |
| `residualLatex` | True if LaTeX-like markup remains |

**Must**:
- Be pure (no I/O)
- Be idempotent on already-plain text (`convertedCount === 0`, `residualLatex === false` for clean Unicode)
- Never throw

**Covered patterns**: see [research.md](../research.md) §3.

### `detectLatexResidue(text: string): boolean`

True if text still contains `$...$`-like delimiters or `\` command tokens (shared helper for tests/UI).

### `ensureArabicMathSpacing(text: string): string` (optional v1)

Insert a single space when an Arabic letter immediately abuts a Latin letter, digit, or `√`/`∞`/`±`. Must not alter structural option letters already separated by `)`.

---

## Pure parser — EXTEND `src/lib/import-text.ts`

### `parseQuickPasteDocument(text: string): QuickPasteDocument`

**Additional behavior**:
1. After structural field extraction per block, run `normalizeLatexToPlainMath` on stem, each option, and explanation.
2. Set `correct_answer` from the (already normalized) chosen option text.
3. Aggregate `mathNotice` on the document.
4. Settings header parsing unchanged.

### Samples

| Export | Contract |
|--------|----------|
| `LMS_QUICK_PASTE_SAMPLE` | No LaTeX delimiters/commands; includes at least one plain-math STEM token (`1/2`, `√`, or `[AB]`); Arabic–math spaces if Arabic present |
| `QUICK_PASTE_SAMPLE_FORMAT` | Remains valid TEACH-013 sample; no LaTeX |

### `parseQuickPasteText` / `toImportRowsFromValidDrafts`

Unchanged signatures; they automatically consume normalized drafts via `parseQuickPasteDocument`.

---

## Server Action — EXISTING `importQuickPasteQuestions`

No new parameters. Because the action re-parses `text` with `parseQuickPasteDocument`, imported rows receive normalized field text. Optional: include `mathNotice` in the action result for toast copy (not required if dialog already showed the banner).

**Must not**:
- Trust client-supplied normalized rows without re-parse
- Change QUIZ-001 or tenant checks

---

## Multi-tenant

Unchanged — owner-scoped quiz import only.

## Tests

| File | Focus |
|------|--------|
| `tests/features/teach-016-plain-math.test.ts` | Converter table + residual + idempotence |
| `tests/features/teach-016-paste-normalize.test.ts` | Parse/normalize integration; sample LaTeX-free; FR-010 residual still valid |
| `tests/features/teach-014-lms-parse.test.ts` | Update former “preserves LaTeX” case |
| `tests/features/teach-013-*.test.ts` | Regression |

All new describes: `` `[TEACH-016] …` ``.
