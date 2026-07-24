# Contracts: Server Actions (TEACH-011)

All mutations: `"use server"`, `requireTeacher()`, `createAdminClient()`, scope `created_by = session.profileId`.  
Arabic errors on failure. `revalidatePath("/teacher/quizzes")` and quiz detail path as needed.

## Types

```ts
type QuizListView = "active" | "trash";

type SoftDeleteResult = { ok: true } | { ok: false; error: string };
```

---

## `getTeacherQuizzes(pageInput?, opts?: { view?: QuizListView })`

- Default `view = "active"`.
- **active**: `.is("deleted_at", null)` (+ existing order/paging).
- **trash**: `.not("deleted_at", "is", null)` (or `.filter("deleted_at", "not.is", null)`), order `deleted_at DESC`.
- Select: `QUIZ_LIST_SELECT` (incl. `deleted_at`) + `questions(count)`.
- Return `PagedResult<TeacherQuiz>`; clamp page.

## `getTeacherQuizById(quizId)`

- Owner-scoped; **includes** soft-deleted rows (for edit banner).
- Returns `null` if missing / wrong teacher (→ `notFound()`).

## `softDeleteQuiz(quizId: string): Promise<SoftDeleteResult>`

1. Load quiz: `id` + `created_by` + `deleted_at`.
2. Fail if not owner or already soft-deleted.
3. `update({ deleted_at: new Date().toISOString() })` where owner + `deleted_at IS NULL`.
4. Revalidate list (+ detail).

**Guarantees**: No confirmation required; does not change `is_active` / flags; MT-002.

## `restoreQuiz(quizId: string): Promise<SoftDeleteResult>`

1. Owner + currently soft-deleted.
2. `update({ deleted_at: null })`.
3. Revalidate.

## `permanentlyDeleteQuiz(quizId: string): Promise<SoftDeleteResult>`

1. Owner + **must** have `deleted_at IS NOT NULL` (reject active quizzes).
2. `delete()` quiz row (cascades questions / submissions / answers).
3. Revalidate list; detail path becomes 404.

**UI contract**: Caller shows Arabic AlertDialog before invoke. Action itself is authoritative guard (never purge active).

---

## Student path (`src/actions/quiz.ts`)

| Function | Change |
|----------|--------|
| Student home / list quiz queries | Add `.is("deleted_at", null)` (and keep `is_active` / teacher scope) |
| `getQuizForStudent` | **No** hard reject on `deleted_at` alone (mid-exam); QUIZ-001 select lists unchanged |
| `submitQuiz` | Unchanged gatekeeper post-submit selects; may succeed for soft-deleted-but-active quizzes |

---

## KPI SQL (migration)

`get_teacher_dashboard_kpis` / related CTEs: treat quizzes with `deleted_at IS NOT NULL` like non-catalog (exclude from `teacher_quizzes` / counts / popular), same as `is_archived` exclusion pattern.
