# Contracts: Routing & Links (TEACH-017)

Teacher quiz **management** URLs only. Student `/quiz/[id]` unchanged.

## 1. Database

Migration `supabase/migrations/019_quiz_friendly_slug.sql`:

- `ALTER TABLE quizzes ADD COLUMN slug TEXT;`
- Function `public.quiz_friendly_slug(p_title text, p_id uuid) RETURNS text` (algorithm in [research.md](../research.md) §2).
- Backfill all rows.
- `ALTER COLUMN slug SET NOT NULL`.
- Unique index on `(created_by, slug)`.
- `BEFORE INSERT` trigger: set `NEW.slug` when null; **no** overwrite on `UPDATE`.

`QUIZ_LIST_SELECT` includes `slug`. `Quiz.slug: string` in `src/types/database.ts`.

## 2. App Router

| Before | After |
|--------|--------|
| `src/app/teacher/(portal)/quizzes/[id]/page.tsx` | `…/quizzes/[slug]/page.tsx` |
| `…/[id]/loading.tsx` | `…/[slug]/loading.tsx` |
| `params: Promise<{ id: string }>` | `params: Promise<{ slug: string }>` |

Static sibling `quizzes/new/` is unchanged and must win over `[slug]`.

Page algorithm:

```text
param = decodeURIComponent(params.slug).trim()
quiz = await resolveTeacherQuizParam(param)
if !quiz → notFound()
if isUuid(param) && param !== quiz.slug:
  permanentRedirect(teacherQuizHref(quiz.slug) + original search string)
else:
  render editor (pass quiz.id to mutations, quiz.slug to client nav)
```

## 3. Supabase queries

All via `createAdminClient()` + `requireTeacher()`.

| Function | Query |
|----------|--------|
| `resolveTeacherQuizParam(param)` | UUID → existing id lookup; else `.eq("slug", param).eq("created_by", profileId)` |
| `getTeacherQuizById(id)` | Unchanged ownership; select list now includes `slug` |
| `getTeacherQuizzes` | Same filters; `slug` in select for list hrefs |
| Mutations | Still `.eq("id", quizId).eq("created_by", …)`; also `select("id, slug")` when calling `revalidatePath` |

Never resolve another teacher’s quiz by slug or id.

## 4. Link helper

**Module**: `src/lib/teacher-quiz-path.ts`

```ts
export function buildQuizSlug(title: string, id: string): string;
export function isQuizUuidParam(param: string): boolean;
export function teacherQuizHref(
  slug: string,
  extras?: { query?: Record<string, string>; hash?: string }
): string;
```

`teacherQuizHref` returns `/teacher/quizzes/{slug}` with optional `?setup=import`, `?imported={n}`, `#quiz-questions`.

### Call sites (must not interpolate `quiz.id` into teacher quiz paths)

| File | New href |
|------|----------|
| `QuizListItem.tsx` | `teacherQuizHref(quiz.slug)` |
| `QuizCreateWizard.tsx` | `teacherQuizHref(created.slug, { query: { setup: "import" } })` |
| `QuizQuestionsDashboard.tsx` | `quizSlug` prop + helper (`imported`, strip setup) |
| `EditQuizBulkImportSection.tsx` | same |
| `ImportSectionHeader.tsx` | comment/example uses slug |
| `src/actions/teacher.ts` | `revalidatePath(teacherQuizHref(slug))` |
| `TeacherHeaderNav.tsx` | comment `[slug]` |

Student `href={\`/quiz/${quiz.id}\`}` **must not** change.

## 5. createQuiz return

```ts
// before
return data.id as string;
// after
return { id: data.id as string, slug: data.slug as string };
```

Wizard uses `slug` for navigation. Internal `id` still used for any follow-up that needs PK.
