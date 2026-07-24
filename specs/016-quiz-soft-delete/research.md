# Research: Teacher Quiz Soft Delete & Trash (TEACH-011)

**Date**: 2026-07-24  
**Status**: Complete — all Technical Context items resolved

## 1. Soft-delete marker: `deleted_at` vs `is_deleted` vs reusing `is_archived`

**Decision**: Add nullable `quizzes.deleted_at TIMESTAMPTZ` (NULL = active list; non-NULL = in Trash). Do **not** reuse `is_archived`.

**Rationale**:
- Spec prefers a timestamp for “when trashed” and indefinite retention.
- `is_archived` is already used by **admin** teacher-account teardown (`src/lib/admin/teachers.ts`) and KPI/count filters — conflating teacher Trash with admin archive would mix personas and break restore semantics.
- Timestamp is clearer than boolean for future UX (sort Trash by deleted time) without schema churn later.

**Alternatives considered**:
- `is_deleted boolean` — rejected; loses trash time; same semantics as weak boolean.
- Reuse `is_archived` for teacher Trash — rejected; admin vs teacher semantics collide; restore would fight admin archive.
- Separate `quiz_trash` table — rejected; overkill; quiz row already owns lifecycle.

## 2. Where Server Actions live (`teacher.ts` vs `quiz.ts`)

**Decision**:
- **Mutations** `softDeleteQuiz` / `restoreQuiz` / `permanentlyDeleteQuiz` → `src/actions/teacher.ts` (TEACH-* pattern, `requireTeacher`, `created_by = session.profileId`).
- **Student catalog filters** → `src/actions/quiz.ts` (and any shared dashboard loaders) add `.is("deleted_at", null)` on list/home queries only.

**Rationale**: Existing TEACH-003 quiz CRUD/flags live in `teacher.ts`. Original touch hint named `quiz.ts`; student path changes belong there, teacher writes stay with teacher actions. Constitution: Server Actions + admin client.

**Alternatives considered**:
- All delete APIs in `quiz.ts` — rejected; breaks TEACH file ownership and mixes student/teacher entrypoints.
- New `src/actions/quiz-trash.ts` — rejected; unnecessary file for three actions.

## 3. Soft delete side effects on `is_active` / quota

**Decision**: Soft delete sets `deleted_at = now()` only. **Do not** flip `is_active`. Restore clears `deleted_at` only (flags preserved). Soft-deleted quizzes **still count** toward `max_quiz_limit` until permanent delete.

**Rationale**: Clarifications require flag preservation on restore; flipping active would surprise teachers and complicate mid-exam submit (today `getQuizForStudent` / `submitQuiz` require `is_active`). Quota gaming via Trash is undesirable; permanent delete frees the slot (and cascades rows).

**Alternatives considered**:
- Soft delete forces `is_active = false` — rejected; breaks mid-exam submit path unless submit is specially relaxed; restore must remember prior active bit (extra column or guess).
- Soft delete frees quota immediately — rejected; encourages Trash-as-overflow without intentional purge.

## 4. Student mid-exam + catalog vs gate path (clarification Q3)

**Decision**:
- **Catalog / home / paged student lists**: exclude `deleted_at IS NOT NULL`.
- **`getQuizForStudent` / `submitQuiz`**: do **not** reject solely because `deleted_at` is set (still require teacher link, `is_active`, free/pro, group rules, QUIZ-001 select lists). Enables finish+submit after soft delete without a server-side “in progress” draft table.
- No new mid-exam resume UI.

**Rationale**: Matches clarification “finish current attempt; block new starts from catalog.” Catalog is the primary start surface. Residual deep-link start of a soft-deleted-but-still-active quiz is accepted for v1 (documented); closing it would break refresh mid-exam without draft sessions.

**Alternatives considered**:
- Reject soft-deleted in `getQuizForStudent` but allow `submitQuiz` via separate loader — more code; refresh mid-exam still fails.
- Server “attempt lock” / draft submission — out of scope.

## 5. Permanent delete cascade (clarification Q2)

**Decision**: `DELETE FROM quizzes WHERE id = ? AND created_by = teacher AND deleted_at IS NOT NULL`. Rely on existing `ON DELETE CASCADE` for `questions`, `exam_submissions`, `student_answers` (via submission). No “block if submissions exist.” Confirmation copy warns irreversible history loss.

**Rationale**: Clarification A; schema already cascades. Must require `deleted_at IS NOT NULL` so active quizzes cannot be hard-deleted in one step.

**Alternatives considered**:
- Block purge when submissions exist — rejected by clarification.
- Soft-anonymize scores — out of scope (clarification rejected retained history).

## 6. Teacher list UX: tabs + server paging

**Decision**: Extend `/teacher/quizzes` with searchParam `view=active|trash` (default `active`). `getTeacherQuizzes({ page, view })` filters:
- `active`: `deleted_at IS NULL`
- `trash`: `deleted_at IS NOT NULL` (order by `deleted_at DESC`)

Reuse existing `QuizManagement` + `PaginationControls`; add tab/segment control «اختباراتي» / «سلة المهملات». Soft delete / restore: Server Action + `router.refresh()` / optimistic local list update (same pattern as toggle flags). Permanent delete: Shadcn `AlertDialog` (already imported in `QuizManagement`).

**Rationale**: Spec FR-005; page already server-paged (PERF-005). Client-only trash filter would mix pages incorrectly.

**Alternatives considered**:
- Separate `/teacher/quizzes/trash` route — extra nav chrome; tab is enough.
- Client filter over full list — conflicts with server paging.

## 7. Edit deep link for trashed quiz (clarification Q1)

**Decision**: `getTeacherQuizById` returns soft-deleted quizzes (still `created_by` scoped). Edit page shows Arabic banner «في سلة المهملات» with Restore (+ optional Permanent Delete with same AlertDialog rules). Do not `notFound()` solely for Trash.

**Rationale**: Clarification A.

## 8. KPI / admin / archive interaction

**Decision**: Migration `012_quiz_soft_delete.sql` adds column + composite index `(created_by, deleted_at)`. Update teacher dashboard KPI SQL (and any `teacher_quizzes` CTEs that already filter `is_archived`) to also require `deleted_at IS NULL` so Trash does not inflate quiz counts / popular exams. Admin archive path unchanged (`is_archived`); teacher Trash independent. When both set, treat as hidden from student catalogs via either flag.

**Rationale**: Consistency with “active teaching catalog”; avoids double-counting trashed quizzes in TEACH-005 analytics.

**Alternatives considered**: App-only filters without RPC update — leaves SQL KPI wrong until next dashboard load path; prefer updating SQL in same migration.

## 9. Spekit / registry

**Decision**: Register `TEACH-011` in `.speckit/spec.yaml`. Add Spekit ids: `quiz-delete-action` (required), plus `quiz-trash-tab`, `quiz-restore-action`, `quiz-permanent-delete-action`, `quiz-trash-banner` for edit page. Mirror in `spekit-targets.ts` + `spekit-targets.yaml`.

**Rationale**: Spec FR-012 / ENABLE-001.

## 10. Testing strategy

**Decision**: Vitest feature tests `tests/features/teach-011-quiz-soft-delete.test.ts` for action scoping (wrong teacher, active vs trash permanent-delete guard, restore clears marker). Gatekeeper regression: existing QUIZ-001 tests remain green. Optional Playwright smoke for Trash tab RTL later.

**Rationale**: Match TEACH-003 test style; constitution verify gate includes build.
