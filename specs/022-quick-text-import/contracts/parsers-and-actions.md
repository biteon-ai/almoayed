# Parsers & Server Action Contracts: TEACH-013

## Scope

Teacher-only quick paste import. No new public HTTP API. Contracts are pure parser functions + one Server Action.

---

## Pure parser — NEW

### `parseQuickPasteText(text: string): QuickPasteDraft[]`

**File**: `src/lib/import-text.ts`

| Input | Output |
|-------|--------|
| Raw pasted string | Ordered drafts (valid and invalid) |

**Grammar**:
- Split blocks on blank lines (`/\n\s*\n/`)
- Stem: `س:` / `Q:` prefix optional; else first non-option/meta line
- Options: optional `*` + letter `أ|ب|ج|د|a–d` + `)` / `.` / `:` / `-`
- Meta: `الجواب:` / `Answer:`, `الشرح:` / `شرح:`, `التصنيف:` / `قسم:` / `Category:`
- Conflict: `الجواب:` overrides asterisk letter

**Validity** (FR-004): non-empty stem, ≥2 options, correct letter maps to a present option → set `correct_answer` to that option’s text.

### `QUICK_PASTE_SAMPLE_FORMAT: string`

Canonical Arabic example (blank-line separated, optional `س:`, four options, one correct marker). Used for placeholder + clipboard copy.

### `toImportRowsFromValidDrafts(drafts, { max?: 50 }): { rows, imported, skippedInvalid, capped }`

Filters `valid`, applies cap, maps to `ImportQuestionRow[]`.

---

## Server Action — NEW

### `importQuickPasteQuestions(quizId: string, text: string)`

| Step | Behavior |
|------|----------|
| Auth | `requireTeacher()` |
| Ownership | `assertQuizOwnedByTeacher(quizId, session.profileId)` |
| Parse | `parseQuickPasteText(text)` |
| Empty | If no valid → throw or return `{ imported: 0, skippedInvalid, capped: false }` with Arabic message for UI |
| Cap | First 50 valid only |
| Persist | `importQuestionRows(quizId, rows, { mode: "append" })` |
| Return | `{ imported: number, skippedInvalid: number, capped: boolean }` |

**Must not** accept client-supplied row arrays as the only input.

---

## Existing (unchanged signatures)

| Function | Role |
|----------|------|
| `importQuestionRows` | Append inserts; ownership already enforced |
| `importQuestions` | File path only — **unchanged** |
| `parseWordLikeText` | TXT file — **unchanged** for TEACH-013 |

---

## Multi-tenant

All persist paths MUST call `assertQuizOwnedByTeacher` (or equivalent). No cross-teacher `quizId` writes.

---

## Test naming

- `describe("TEACH-013 …")` in `tests/features/teach-013-*.test.ts`
