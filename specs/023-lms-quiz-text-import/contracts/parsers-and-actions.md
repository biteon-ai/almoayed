# Parsers & Server Action Contracts: TEACH-014

## Pure parser — EXTEND `src/lib/import-text.ts`

### `parseQuickPasteDocument(text: string): QuickPasteDocument`

| Output | Meaning |
|--------|---------|
| `settings` | `ParsedQuizSettings \| null` |
| `drafts` | Ordered `QuickPasteDraft[]` (LMS + Arabic) |

**Header**: Optional `=== Quiz Settings ===` … until questions section / first question marker.

**Splitters**: blank line, `(n)`, `Qn:` (`/^Q\d+:/i`).

**LMS block**: `Qn:` stem, `A)`–`D)` (aliases), `Answer: X`, optional `Explanation:`.

**Arabic block**: existing TEACH-013 grammar.

### `parseQuickPasteText(text)` 

Returns `drafts` only (`parseQuickPasteDocument(text).drafts`) — TEACH-013 compatibility.

### Mapping helpers

- `mapLmsQuizType(raw: string): AssessmentCategory | null`
- `mapLmsAttempts(raw: string): { value: number } | { error: string }`
- `mapLmsTimer(enableRaw, durationRaw): partial flags | timer_error`

---

## Server Action — EXTEND

### `importQuickPasteQuestions(quizId, text)`

1. Auth + ownership  
2. `parseQuickPasteDocument`  
3. `toImportRowsFromValidDrafts` (cap 50)  
4. If no rows → Arabic error (no settings apply)  
5. `importQuestionRows` append  
6. If `imported ≥ 1` and settings present → `updateQuizFlags` with **only valid** fields  
7. Return `{ imported, skippedInvalid, capped, settingsApplied: string[], settingsSkipped: string[] }`

---

## Existing (unchanged contracts)

| Function | Role |
|----------|------|
| `updateQuizFlags` | Validate + update quiz settings |
| `importQuestionRows` | Append questions |
| `parseWordLikeText` | File TXT — unchanged |

## Multi-tenant

All writes MUST remain owner-scoped.

## Tests

`describe("[TEACH-014] …")` in `tests/features/teach-014-*.test.ts`
