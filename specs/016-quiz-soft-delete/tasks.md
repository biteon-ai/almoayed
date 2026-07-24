---
description: "Task list for Teacher Quiz Soft Delete & Trash (TEACH-011)"
---

# Tasks: Teacher Quiz Soft Delete & Trash

**Input**: Design documents from `specs/016-quiz-soft-delete/`  
**Prerequisites**: `plan.md`, `spec.md` (Clarified), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Tests**: Included — plan/quickstart call for Vitest `teach-011` + QUIZ-001 regression (not full TDD; contract tests alongside or just before actions)

**Organization**: US1 (soft delete) → US2 (Trash + restore) → US3 (permanent delete) → US4 (RTL/Spekit polish). Shared foundation: migration `deleted_at` + types/selects.

**Feature ID**: `TEACH-011` (extends `TEACH-003`) — do not break `MT-002`, `QUIZ-001`, RTL Tajawal, Server Actions, Spekit registry patterns

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US4 maps to spec user stories
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Spekit / registry stubs and type surface so stories share one `deleted_at` contract

- [x] T001 [P] Add Spekit ids `quiz-delete-action`, `quiz-trash-tab`, `quiz-restore-action`, `quiz-permanent-delete-action`, `quiz-trash-banner` to `src/lib/spekit-targets.ts` and `.speckit/spekit-targets.yaml`
- [x] T002 [P] Draft `TEACH-011` stub entry (status planned/partial) in `.speckit/spec.yaml` with routes `/teacher/quizzes`, `/teacher/quizzes/[id]` and planned file list per plan

**Checkpoint**: Spekit + registry stubs ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema + lean select/types — MUST complete before soft-delete actions/UI

**⚠️ CRITICAL**: No user-story mutations until migration + `Quiz.deleted_at` + `QUIZ_LIST_SELECT` include the column

- [x] T003 Create `supabase/migrations/012_quiz_soft_delete.sql` adding nullable `quizzes.deleted_at TIMESTAMPTZ` and index(es) per `data-model.md` (`idx_quizzes_created_by_deleted_at` and/or partial active/trash indexes)
- [x] T004 In the same `012_quiz_soft_delete.sql`, update `get_teacher_dashboard_kpis` (and any `teacher_quizzes` CTE) to exclude `deleted_at IS NOT NULL` alongside existing `is_archived` filters per `research.md` §8 / `contracts/server-actions.md`
- [x] T005 [P] Extend `Quiz` with `deleted_at: string | null` in `src/types/database.ts`
- [x] T006 [P] Append `deleted_at` to `QUIZ_LIST_SELECT` in `src/lib/perf-selects.ts`
- [x] T007 Apply migration with `npx supabase db push` and confirm column exists on remote/local

**Checkpoint**: Foundation ready — stories can filter/mutate `deleted_at`

---

## Phase 3: User Story 1 — Move a quiz to Trash (Priority: P1) 🎯 MVP

**Goal**: Teacher soft-deletes a quiz from the active list; it leaves active view; students no longer see it as a new catalog start; mid-exam submit still works.

**Independent Test**: On `/teacher/quizzes`, tap «حذف» → quiz gone from active list; student catalog hides it; optional mid-exam finish+submit still succeeds; other teacher cannot soft-delete it.

### Tests for User Story 1

- [x] T008 [P] [US1] Add Vitest scaffolding in `tests/features/teach-011-quiz-soft-delete.test.ts` covering soft-delete owner scope (reject wrong teacher / already deleted) and asserting student catalog queries conceptually filter `deleted_at` (mock or pure contract style matching other `teach-*` tests)

### Implementation for User Story 1

- [x] T009 [US1] Implement `softDeleteQuiz(quizId)` in `src/actions/teacher.ts` per `contracts/server-actions.md` (`requireTeacher`, `created_by` scope, set `deleted_at`, no flag changes, `revalidatePath`)
- [x] T010 [US1] Extend `getTeacherQuizzes` in `src/actions/teacher.ts` to accept `view: "active" | "trash"` (default `active`) and filter `.is("deleted_at", null)` for active; keep paging/clamp
- [x] T011 [US1] Pass `view` from `searchParams` in `src/app/teacher/(portal)/quizzes/page.tsx` into `getTeacherQuizzes` / `QuizManagement`
- [x] T012 [US1] Add «حذف» + Trash icon with loading state and Spekit `quiz-delete-action` on active cards in `src/components/teacher/QuizListItem.tsx` (wire callback from parent)
- [x] T013 [US1] Wire soft-delete handler (transition + optimistic/local remove + `router.refresh()`) in `src/components/teacher/QuizManagement.tsx` for active view only
- [x] T014 [US1] Exclude soft-deleted quizzes from student home/list catalog queries with `.is("deleted_at", null)` in `src/actions/quiz.ts` (do **not** hard-reject `deleted_at` in `getQuizForStudent` / `submitQuiz` per research §4)

**Checkpoint**: US1 complete — soft delete + catalog hide; QUIZ-001 / MT-002 intact

---

## Phase 4: User Story 2 — Inspect Trash and restore (Priority: P1)

**Goal**: Trash tab lists soft-deleted quizzes; Restore returns them to active with prior flags; edit deep link shows in-Trash banner + Restore.

**Independent Test**: Soft-delete → open «سلة المهملات» → see quiz → «استعادة» → back on active list with same flags; open `/teacher/quizzes/{id}` while trashed → banner + Restore, no silent redirect.

### Tests for User Story 2

- [x] T015 [P] [US2] Extend `tests/features/teach-011-quiz-soft-delete.test.ts` with restore contract (clears `deleted_at`, rejects non-owner / not-in-trash)

### Implementation for User Story 2

- [x] T016 [US2] Implement `restoreQuiz(quizId)` in `src/actions/teacher.ts` (owner + currently soft-deleted → `deleted_at = null`, revalidate)
- [x] T017 [US2] Ensure `getTeacherQuizzes` trash view filters `deleted_at IS NOT NULL` and orders by `deleted_at DESC` in `src/actions/teacher.ts`
- [x] T018 [US2] Confirm `getTeacherQuizById` in `src/actions/teacher.ts` returns soft-deleted rows (owner-scoped) for edit deep links
- [x] T019 [US2] Add active/Trash tab UI (`view` searchParam, reset page on switch, Spekit `quiz-trash-tab`) and Trash empty state in `src/components/teacher/QuizManagement.tsx`
- [x] T020 [US2] Render Trash row actions «استعادة» (Spekit `quiz-restore-action`) with loading in `src/components/teacher/QuizManagement.tsx` and/or trash variant of `QuizListItem.tsx`
- [x] T021 [US2] Add `QuizTrashBanner` (or inline) with Spekit `quiz-trash-banner` + Restore on `src/app/teacher/(portal)/quizzes/[id]/page.tsx` / related edit dashboard when `quiz.deleted_at` is set

**Checkpoint**: US2 complete — Trash browse + restore + deep-link banner

---

## Phase 5: User Story 3 — Permanent delete with confirmation (Priority: P2)

**Goal**: From Trash only, «حذف نهائي» shows Arabic AlertDialog; confirm purges quiz + cascaded history; cancel keeps Trash row; submissions never block purge.

**Independent Test**: In Trash, open permanent delete → cancel (still there) → confirm (gone, not restorable); attempting permanent delete on active quiz fails at action layer.

### Tests for User Story 3

- [x] T022 [P] [US3] Extend `tests/features/teach-011-quiz-soft-delete.test.ts` asserting permanent delete requires `deleted_at` set, owner scope, and does not allow purge of active quizzes

### Implementation for User Story 3

- [x] T023 [US3] Implement `permanentlyDeleteQuiz(quizId)` in `src/actions/teacher.ts` (owner + `deleted_at IS NOT NULL` → `DELETE` row; Arabic error otherwise; revalidate)
- [x] T024 [US3] Add «حذف نهائي» control (Spekit `quiz-permanent-delete-action`) on Trash rows in `src/components/teacher/QuizManagement.tsx`
- [x] T025 [US3] Wire Shadcn `AlertDialog` Arabic irreversible copy (incl. history loss) with loading / double-submit guard before calling `permanentlyDeleteQuiz` in `src/components/teacher/QuizManagement.tsx`
- [x] T026 [US3] Optionally expose Permanent Delete from edit Trash banner with the same dialog rules on `src/components/teacher/QuizTrashBanner.tsx` (or edit page)

**Checkpoint**: US3 complete — confirmation-gated purge from Trash only

---

## Phase 6: User Story 4 — RTL, touch, and guided discovery (Priority: P3)

**Goal**: Delete/trash/restore/permanent controls are Arabic RTL, touch-friendly, and Spekit-complete.

**Independent Test**: Narrow viewport walk of soft-delete → Trash → restore → permanent delete; labels Arabic; `data-spekit="quiz-delete-action"` (and related ids) present on controls.

### Implementation for User Story 4

- [x] T027 [P] [US4] Audit Trash/delete controls in `src/components/teacher/QuizManagement.tsx` and `QuizListItem.tsx` for RTL (`text-start`), Tajawal shell, and touch targets `h-10`–`h-12`
- [x] T028 [P] [US4] Verify all Spekit hooks from T001 are applied on live controls (delete/tab/restore/purge/banner) across teacher quiz components
- [x] T029 [US4] Finalize `.speckit/spec.yaml` `TEACH-011` acceptance + spekit list to match shipped UI; mark status implemented when done

**Checkpoint**: US4 complete — polish + registry accurate

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify gates across stories

- [x] T030 [P] Run `npx vitest run tests/features/teach-011-quiz-soft-delete.test.ts` and existing QUIZ-001 gatekeeper tests; fix regressions
- [x] T031 [P] Manual QA per `specs/016-quiz-soft-delete/quickstart.md` (soft delete, catalog hide, restore, permanent delete, deep link, MT-002)
- [x] T032 Run `npm run build` and fix any type/select errors from `deleted_at`
- [x] T033 Confirm out-of-scope holds: no bulk empty-Trash, no auto-purge TTL, no soft-delete confirmation dialog

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: After Foundational — MVP
- **US2 (Phase 4)**: After US1 soft-delete + `view` plumbing (reuses Trash filter)
- **US3 (Phase 5)**: After US2 Trash UI (permanent delete lives on Trash rows)
- **US4 (Phase 6)**: After US1–US3 controls exist (Spekit/RTL audit)
- **Polish (Phase 7)**: After desired stories complete

### User Story Dependencies

- **US1**: Foundation only
- **US2**: Practically needs US1 soft-delete + active/trash `getTeacherQuizzes` view
- **US3**: Needs US2 Trash list UI
- **US4**: Needs controls from US1–US3

### Parallel Opportunities

- T001 ∥ T002 (Setup)
- T005 ∥ T006 after T003 drafted (types/selects)
- T008 test scaffolding ∥ early action stubs within US1
- T015 ∥ T016 within US2 once soft-delete exists
- T022 ∥ T023 within US3
- T027 ∥ T028 within US4
- T030 ∥ T031 in Polish

---

## Parallel Example: User Story 1

```bash
# After foundation:
Task: "Vitest scaffolding in tests/features/teach-011-quiz-soft-delete.test.ts"
Task: "softDeleteQuiz in src/actions/teacher.ts"
# Then sequentially: getTeacherQuizzes view → page searchParams → QuizListItem → QuizManagement → quiz.ts catalog filter
```

---

## Parallel Example: User Story 2

```bash
Task: "restoreQuiz Vitest assertions"
Task: "restoreQuiz in src/actions/teacher.ts"
# Then: trash tab UI + restore button + edit banner (banner can parallel list UI if actions ready)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup  
2. Phase 2 Foundation (`012` + types + select)  
3. Phase 3 US1 soft delete + catalog hide  
4. **STOP** — validate soft delete + student catalog  
5. Continue US2 → US3 → US4 → Polish  

### Incremental Delivery

1. Setup + Foundation → schema ready  
2. US1 → soft delete MVP  
3. US2 → Trash + restore + deep link  
4. US3 → permanent purge with dialog  
5. US4 + Polish → Spekit/registry/build  

### Suggested MVP scope

**US1 only** (soft delete + exclude from student catalog + active list update). Trash/restore/purge follow immediately after for a complete TEACH-011.

---

## Notes

- Soft delete does **not** change `is_active`; permanent delete only when `deleted_at IS NOT NULL`
- Soft-deleted quizzes still count toward `max_quiz_limit` until permanent delete
- Do not reuse `is_archived` for teacher Trash
- Commit after each phase or logical group when asked
- Format validation: all tasks use `- [x] Tnnn ...` with file paths; story tasks include `[USn]`
