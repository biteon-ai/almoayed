# Quickstart: TEACH-011 Quiz Soft Delete & Trash

## Prerequisites

- Branch `016-quiz-soft-delete`
- Local/env Supabase with ability to `db push`
- Demo teacher session (e.g. WhatsApp `963912345678`)

## Apply schema

```bash
# adds quizzes.deleted_at + indexes; updates KPI filters
npx supabase db push
```

Migration expected: `supabase/migrations/012_quiz_soft_delete.sql`

## Run app

```bash
npm run dev
```

## Manual QA checklist

1. **Soft delete** — Teacher → اختباراتي → «حذف» on a quiz → leaves active list; appears under سلة المهملات; loading state visible.
2. **Student catalog** — Linked student no longer sees that quiz as a new start on home/list.
3. **Mid-exam** (optional) — Start exam before soft delete; after teacher soft-deletes, finish + submit still succeeds.
4. **Restore** — Trash → «استعادة» → quiz returns to active with prior flags.
5. **Permanent delete** — Trash → «حذف نهائي» → AlertDialog → cancel keeps quiz; confirm purges; cannot restore.
6. **Deep link** — Open `/teacher/quizzes/{id}` for trashed quiz → banner + Restore (no silent redirect).
7. **MT-002** — Other teacher context cannot mutate this quiz.
8. **Gatekeeper** — Active (non-trashed) exam still hides answers until submit (QUIZ-001).

## Automated verify

```bash
npx vitest run tests/features/teach-011-quiz-soft-delete.test.ts
npx vitest run tests/features/quiz-001-gatekeeper.test.ts  # or existing QUIZ-001 path
npm run build
```

## Registry / Spekit (implement gate)

- `.speckit/spec.yaml` → add `TEACH-011`
- `src/lib/spekit-targets.ts` + `.speckit/spekit-targets.yaml` → `quiz-delete-action`, trash/restore/purge/banner ids
