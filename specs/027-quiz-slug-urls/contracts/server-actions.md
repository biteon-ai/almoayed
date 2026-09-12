# Contracts: Server Actions (TEACH-017)

All mutations: `"use server"`, `requireTeacher()`, `createAdminClient()`, `created_by = session.profileId`.  
Arabic errors unchanged. Revalidate list + **slug** detail path.

## Types

```ts
type CreatedQuiz = { id: string; slug: string };

type TeacherQuiz = Quiz & {
  question_count: number;
  assigned_groups: Array<{ id: string; name: string }>;
};
// Quiz includes slug: string
```

---

## `buildQuizSlug` / `isQuizUuidParam` / `teacherQuizHref`

Pure helpers in `src/lib/teacher-quiz-path.ts` (see [routing-and-links.md](./routing-and-links.md)). No I/O. Vitest owns the algorithm.

---

## `resolveTeacherQuizParam(param: string): Promise<TeacherQuiz | null>`

1. Trim / decode. Empty → `null`.
2. If UUID → delegate to `getTeacherQuizById`.
3. Else `.from("quizzes").select(QUIZ_LIST_SELECT + questions count).eq("slug", param).eq("created_by", profileId).maybeSingle()`.
4. Include Trash rows (same as `getTeacherQuizById` / TEACH-011).
5. Miss or other teacher → `null` (page `notFound()`).

## `getTeacherQuizById(quizId)`

Unchanged contract except select includes `slug`. Still owner-scoped; includes soft-deleted.

## `getTeacherQuizzes`

Unchanged paging/view filters. Each `TeacherQuiz` includes `slug` for list links.

## `createQuiz(formData): Promise<CreatedQuiz>`

1. Existing title/limit/timer/attempt logic.
2. `insert({ … })` **without** `slug` (trigger fills).
3. `.select("id, slug").single()`.
4. `revalidatePath("/teacher/quizzes")`.
5. Return `{ id, slug }` — **not** a bare id string.

## Trash / flags / import actions

Keep `quizId: string` (UUID) as the mutation argument. When revalidating detail:

1. `select("id, slug")` on the owned row (already loaded in several actions — add `slug` to that select).
2. `revalidatePath("/teacher/quizzes")`.
3. `revalidatePath(teacherQuizHref(slug))`.

Do not revalidate a UUID path as the canonical editor cache key.

## Out of scope actions

`src/actions/quiz.ts` student load/submit — no slug in student URLs (FR-011, FR-012).
