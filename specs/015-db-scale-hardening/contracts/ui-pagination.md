# Contracts: UI Pagination (PERF-005)

## Goals

Reuse existing Arabic RTL pagination chrome (`PaginationControls`, Spekit targets). Switch data source from **client slice of full arrays** to **server `PagedResult`**.

## Hubs in scope

| Surface | Component(s) | Server loader | Default pageSize |
|---------|--------------|---------------|------------------|
| Teacher students | `StudentManagement` / `StudentsTable` | `getTeacherStudents` | 8 |
| Teacher quizzes | `QuizManagement` | `getTeacherQuizzes` | 6 |
| Student exams | `StudentQuizzesView` | paged quiz list action | 4 |
| Student results | `StudentResultsView` | paged results action | 4 |
| Admin teachers | `AdminTeachersTable` | `listTeachers` | 20 |

## Behavior

1. Initial render requests `page=1` (or URL `?page=` if already used).
2. Prev/next calls loader with new page; replace `items` + `total`.
3. If server returns clamped `page`, UI syncs to that page number.
4. Filters (tier/status/search) reset to page 1 and re-fetch.
5. Spekit hooks on pagination footers remain present.
6. No broad visual redesign — layout, page sizes, and copy stay familiar.

## Out of scope for this contract

- Student home dashboard carousel (capped window; may keep simple client list of ≤12).
- Keyset “load more” infinite scroll.
- Changing Spekit IDs unless a hook breaks (prefer preserve).
