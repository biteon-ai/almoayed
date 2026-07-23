# Contributing to Al-Moayed (المؤيد)

Thank you for contributing. Read [AGENTS.md](AGENTS.md) and [`.speckit/constitution.md`](.speckit/constitution.md) before opening a PR.

---

## Development setup

```bash
npm install
cp .env.example .env
npx supabase db push
npm run dev
```

Verify changes with:

```bash
npm run build
npm test
```

---

## Bulk import — append-only strategy

**Feature:** TEACH-004 (question bulk import on `/teacher/quizzes/[id]`)

### Design decision

Bulk import handlers use an **append-only** strategy. **Duplicate detection is explicitly out of scope.**

| Behavior | Detail |
|----------|--------|
| Default mode | `append` — valid rows insert as new questions |
| Re-import same file | Creates duplicate questions (by design) |
| Replace mode | Deletes all existing quiz questions, then imports — still no per-row dedup |
| Row filtering | Only structural validation (empty question text, fewer than two options) |

Every imported row becomes a **new database row with a fresh UUID**. Parsers do not compare question text, titles, or option sets against existing records.

### Where this is implemented

| Layer | Path |
|-------|------|
| Server Actions | `src/actions/teacher.ts` — `importQuestionRows`, `importQuestions` |
| DOCX parse action | `src/actions/parse-docx.ts` — `parseDocxQuestions` |
| CSV/XLSX/TXT parsers | `src/lib/import-questions.ts` |
| DOCX/HTML parsers | `src/lib/parse-docx-questions.ts` |
| UI disclaimer | `src/components/teacher/BulkQuestionUpload.tsx`, `ImportValidationTips.tsx` |

There are **no** `/api/import/*` REST routes; import writes go through Server Actions with the admin Supabase client.

### Do not add duplicate validation without a new spec

If product requirements change (e.g. block duplicate question text on re-import):

1. Add a clarification to the feature spec under `specs/` or `.speckit/spec.yaml`
2. Update acceptance criteria and UI copy
3. Only then implement dedup logic

Do **not** silently add duplicate checks in import parsers or Server Actions — teachers currently rely on append behavior and the UI warns that re-upload creates duplicates.

### Related (not bulk import)

- **Manual student add** (`createStudentManually`) rejects duplicate WhatsApp for the same teacher — that is single-record enrollment, not bulk import.
- **Question clone** (`duplicateQuestion`) copies one existing question in the quiz editor — unrelated to file import.

---

## Code conventions

- Scope teacher queries to `currentTeacherId` (multi-tenant).
- Quiz exam API: never return grading fields pre-submission (QUIZ-001).
- Server Actions only for DB writes; use admin Supabase client.
- RTL, touch-friendly UI; no raw native `<select>` in new UI.
- Add Spekit hooks via `SPEKIT` in `src/lib/spekit-targets.ts` for new interactive surfaces.
- Update [`.speckit/spec.yaml`](.speckit/spec.yaml) when behavior changes.
