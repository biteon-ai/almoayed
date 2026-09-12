# UI Components Contract: TEACH-017

**Route**: `/teacher/quizzes/[slug]` (legacy `/teacher/quizzes/[uuid]` 308 → slug).

No new teacher chrome. No slug editor. Address bar is the user-facing change.

## `QuizListItem`

| Property | Contract |
|----------|----------|
| Edit / open | `teacherQuizHref(quiz.slug)` — never `quiz.id` in the path |
| Trash mode | Same slug href (TEACH-011 still opens editor + banner) |
| Touch | Existing `h-10`–`h-12` actions unchanged |

Requires `quiz.slug` on `TeacherQuiz` from list fetch.

## `QuizCreateWizard`

After `createQuiz`, `router.push(teacherQuizHref(slug, { query: { setup: "import" } }))`.  
Error/loading UX unchanged.

## `QuizQuestionsDashboard` / `EditQuizBulkImportSection`

| Prop | Contract |
|------|----------|
| `quizId` | UUID — still passed to import/question mutations |
| `quizSlug` | **NEW** — used for `router.replace` / back `href` |

| Action | Href |
|--------|------|
| Finish setup | `teacherQuizHref(quizSlug)` |
| Import success | `teacherQuizHref(quizSlug, { query: { imported: String(count) } })` |
| Back to questions | `teacherQuizHref(quizSlug, { hash: "quiz-questions" })` |

`?setup=import` still selects the import tab.

## Edit page (`[slug]/page.tsx`)

- Spekit: existing `data-spekit={SPEKIT.teacherQuizEditPage}`.
- Pass `quiz.id` into settings/trash/questions mutations.
- Pass `quiz.slug` into dashboard/import client islands.
- UUID param → `permanentRedirect` before render (user never stays on UUID in the address they can copy).

## Out of scope UI

- Student quiz cards / carousel / results (`/quiz/{id}`).
- Manual “edit URL” field.
- Displaying slug as a badge (optional later; not required).
