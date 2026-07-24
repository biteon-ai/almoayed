# Contracts: Server Actions (PERF-004 / 005 / 006)

## Shared paging

```ts
type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;      // clamped
  pageSize: number;
};

type PageInput = {
  page?: number;     // default 1
  pageSize?: number; // hub default if omitted
};
```

Helpers (e.g. `src/lib/pagination-server.ts`): `clampPage(page, pageSize, total)`, `rangeFromPage(page, pageSize)` → `[from, to]` for `.range()`.

---

## Teacher (PERF-004 / 005)

### `getTeacherDashboardAnalytics()`

1. `requireTeacher()`
2. `rpc('get_teacher_dashboard_kpis', { p_teacher_id: session.profileId })` (or replaced analytics name)
3. Map → UI first-paint analytics shape
4. On RPC failure → lean multi-query aggregate fallback (no full catalogs)
5. On fallback failure → throw/return section error (Arabic); page shell still renders

**Guarantees**: MT-002; no gatekeeper fields; popular exams ≤10.

### `getTeacherStudents(filters?, pageInput?)`

Returns `PagedResult<TeacherStudentRow>`. Default `pageSize = 8`. Filter by `teacher_id = session` + existing tier/status filters. Clamp page.

### `getTeacherQuizzes(pageInput?)`

Returns `PagedResult<TeacherQuiz>`. Default `pageSize = 6`. Select `QUIZ_LIST_SELECT` + `questions(count)` (not `*`). Order by `updated_at`/`created_at` DESC. Clamp page.

---

## Student (PERF-005 / 006)

### List hubs

- Paged student quizzes list loader → `PagedResult`, `pageSize = 4`, scoped to `currentTeacherId`, active quizzes, lean select + question counts without full question bodies.
- Paged student results list loader → `PagedResult`, `pageSize = 4`, submissions for student + teacher quiz set, order `submitted_at DESC`.

### Home dashboard window

- Cap teacher quiz catalog fetch to **12** lean rows (recent/active). Not a full `PagedResult` UX requirement.

### Exam path

- `getQuizForStudent` / `EXAM_QUESTION_SELECT_FIELDS` **unchanged** (QUIZ-001).

---

## Admin (PERF-005 / 006)

### `listTeachers(filters?, pageInput?)`

Returns `PagedResult<AdminTeacherRow>`. Default `pageSize = 20`.  
Quiz counts via `admin_quiz_counts_by_teacher` RPC or scoped aggregate for page teacher ids — **never** `from('quizzes').select('created_by')` unbounded.

List/select columns: no `password_hash` on directory rows. Auth verify paths may select `password_hash` only when checking credentials.

---

## Writes

Unchanged: Server Actions + `createAdminClient()` only. Pagination/KPI work is read-path focused.
