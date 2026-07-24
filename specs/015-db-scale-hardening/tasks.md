---
description: "Task list for Database Scale Hardening (PERF-004 / PERF-005 / PERF-006)"
---

# Tasks: Database Scale Hardening

**Input**: Design documents from `specs/015-db-scale-hardening/`  
**Prerequisites**: `plan.md`, `spec.md` (Clarified), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Tests**: Included — original deliverables + `quickstart.md` require Vitest PERF/MT/QUIZ contract coverage (not full TDD; write failing contract tests before or alongside implementation).

**Organization**: US1 (PERF-004 KPI RPC) → US2 (PERF-005 server pagination) → US3 (PERF-006 lean paths / defense polish). Shared foundation: `011` indexes + RLS + paging helpers.

**Feature IDs**: `PERF-004`, `PERF-005`, `PERF-006` — do not break `QUIZ-001`, `MT-002`, iron-session auth, Spekit, RTL

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US3 maps to spec user stories (PERF-004 / 005 / 006)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared paging types/helpers and confirm page-size constants before story work

- [x] T001 Add `PagedResult<T>`, `PageInput`, `clampPage`, and `rangeFromPage` helpers in `src/lib/pagination-server.ts` per `contracts/server-actions.md` and `data-model.md` clamp rules
- [x] T002 [P] Confirm/export existing page-size constants remain canonical (`STUDENT_PAGE_SIZE=8`, `QUIZ_PAGE_SIZE=6` in `src/lib/paginate-students.ts`; `STUDENT_EXAMS_PAGE_SIZE` / `STUDENT_RESULTS_PAGE_SIZE=4` in `src/lib/student-quiz-ui.ts`) and document admin default **20** + student-home window **12** as named constants (extend those files or `src/lib/pagination-server.ts`)

**Checkpoint**: Paging helpers + size constants ready for all stories

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Migration skeleton for indexes + RLS defense-in-depth — MUST complete before story RPC/UI that assumes them

**⚠️ CRITICAL**: Do not start US1–US3 DB-dependent work until this migration file exists and is reviewable (apply with `db push` can wait until first story smoke)

- [x] T003 Create `supabase/migrations/011_db_scale_hardening.sql` with indexes: `exam_submissions (student_id, submitted_at DESC)`, `questions (quiz_id, sort_order)`, partial `student_teachers (teacher_id) WHERE upgrade_requested`, `quizzes (created_by, updated_at DESC, created_at DESC)` per `contracts/sql-rpc.md` (no `CONCURRENTLY`, no GIN)
- [x] T004 In the same `011_db_scale_hardening.sql`, add deny-all RLS policies on `student_teachers`, `teacher_groups`, `teacher_group_members`, `categories`, `topics`, `auth_otp_states` matching `gamification_tiers` pattern
- [x] T005 In the same `011_db_scale_hardening.sql`, rewrite residual `001` policies to use `(SELECT auth.uid())` instead of raw `auth.uid()` for profiles / quizzes / questions / exam_submissions / student_answers select/insert policies

**Checkpoint**: Foundation ready — indexes + RLS harden in `011`; stories can add RPCs and app code

---

## Phase 3: User Story 1 — Teacher dashboard stays usable as rosters grow (Priority: P1) 🎯 MVP — PERF-004

**Goal**: First-paint teacher dashboard KPIs come from a true aggregate RPC (≤10 popular exams), with lean multi-query fallback and service_role-only execute.

**Independent Test**: After `npx supabase db push`, open teacher dashboard — KPI cards / grade buckets / weekly activity / ≤10 popular exams populate without shipping full student/submission arrays; break RPC → lean fallback; break both → Arabic section error; metrics scoped to logged-in teacher only.

### Tests for User Story 1

- [x] T006 [P] [US1] Add contract tests in `tests/features/perf-004-dashboard-kpis.test.ts` asserting KPI payload has no full `studentLinks`/`submissions` arrays, `popularExams.length ≤ 10`, and no `correct_answer`/`explanation` keys (mirror style of `tests/features/perf-002-dashboard-rpc.test.ts`)

### Implementation for User Story 1

- [x] T007 [US1] In `supabase/migrations/011_db_scale_hardening.sql`, add `get_teacher_dashboard_kpis(p_teacher_id uuid) RETURNS jsonb` (or replace body of `get_teacher_dashboard_analytics` to aggregate-only shape) per `contracts/sql-rpc.md` / `research.md` R1 — MT-002 filter on all CTEs; no answer columns
- [x] T008 [US1] In `011_db_scale_hardening.sql`, `REVOKE ALL … FROM PUBLIC, anon, authenticated` and `GRANT EXECUTE … TO service_role` for the KPI function (and any retained analytics alias) per `research.md` R3
- [x] T009 [US1] Map KPI JSON → first-paint `TeacherDashboardAnalytics` (safe defaults for unused row-heavy fields) in `src/lib/teacher-analytics.ts`
- [x] T010 [US1] Switch `getTeacherDashboardAnalytics` in `src/actions/teacher.ts` to call the KPI RPC with `p_teacher_id: session.profileId`; on failure run lean multi-query aggregate fallback (no full catalogs); on fallback failure surface Arabic section error per clarification Q2 / `contracts/server-actions.md`
- [x] T011 [US1] Apply migration (`npx supabase db push`) and smoke-check teacher dashboard numbers against demo seed per `quickstart.md` §1

**Checkpoint**: US1 complete — aggregate KPIs + lockdown + fallback; QUIZ-001 / MT-002 intact

---

## Phase 4: User Story 2 — Large lists browse page-by-page from the server (Priority: P1) — PERF-005

**Goal**: Primary list hubs use server `.range()` + total + page clamp; student home uses cap 12; admin quiz counts without global scan.

**Independent Test**: Page through teacher students/quizzes, student quizzes/results, admin teachers — each request returns one page + total; page 999 clamps; student home does not load full quiz catalog; admin counts do not fan out all quizzes.

### Tests for User Story 2

- [x] T012 [P] [US2] Add unit/contract tests for `clampPage` / `rangeFromPage` in `tests/features/perf-005-pagination.test.ts`
- [x] T013 [P] [US2] Add contract assertions that paged loader return shapes include `{ items, total, page, pageSize }` and default page sizes match constants (can mock or pure-helper style)

### Implementation for User Story 2

- [x] T014 [US2] Change `getTeacherStudents` in `src/actions/teacher.ts` to accept page input, use `.range()` + exact count, return `PagedResult`, clamp page (default pageSize 8)
- [x] T015 [P] [US2] Change `getTeacherQuizzes` in `src/actions/teacher.ts` to paged `PagedResult` (default pageSize 6), order by updated/created DESC, select `QUIZ_LIST_SELECT` + `questions(count)` (not `*`)
- [x] T016 [P] [US2] Add/adjust paged student quizzes list loader in `src/actions/quiz.ts` (default pageSize 4, MT-002 `currentTeacherId`, lean select + question counts without full question bodies)
- [x] T017 [P] [US2] Add/adjust paged student results list loader in `src/actions/quiz.ts` (default pageSize 4, order `submitted_at DESC`, teacher-scoped quiz set)
- [x] T018 [US2] Cap student home dashboard quiz fetch to **12** lean rows in `src/actions/quiz.ts` (home path / `getStudentDashboardData`) per FR-005a — not full catalog
- [x] T019 [US2] In `011_db_scale_hardening.sql`, add `admin_quiz_counts_by_teacher()` (+ REVOKE/GRANT service_role only) per `contracts/sql-rpc.md`; update `listTeachers` in `src/lib/admin/teachers.ts` to paged `PagedResult` (default 20) and use RPC or scoped aggregate — remove unbounded `quizzes.select('created_by')` scan
- [x] T020 [US2] Wire teacher UI pagination to server pages in `src/components/teacher/StudentManagement.tsx` / `StudentsTable.tsx` / `QuizManagement.tsx` per `contracts/ui-pagination.md` (preserve Spekit + RTL `PaginationControls`)
- [x] T021 [P] [US2] Wire student UI pagination to server pages in `src/components/student/StudentQuizzesView.tsx` and `StudentResultsView.tsx`
- [x] T022 [P] [US2] Wire admin teachers table paging to server pages in `src/components/admin/AdminTeachersTable.tsx`
- [x] T023 [US2] Smoke-check paging + clamp + Spekit per `quickstart.md` §2–4

**Checkpoint**: US2 complete — server-backed hubs; home capped; admin counts fixed

---

## Phase 5: User Story 3 — Safer defaults and leaner hot paths (Priority: P2) — PERF-006

**Goal**: Finish lean selects on remaining hot paths, efficient question counts everywhere needed, and verify RLS/select contracts (indexes already in Phase 2).

**Independent Test**: Hot list paths show no `select('*')` / no `password_hash` on directories; student hubs never transfer full question bodies for counts; deny-all + initplan policies present in `011`; gatekeeper still passes.

### Tests for User Story 3

- [x] T024 [P] [US3] Add/extend Vitest in `tests/features/perf-006-lean-selects.test.ts` asserting `QUIZ_LIST_SELECT` / teacher quiz list selects exclude `*` and password fields; question-count paths do not select full question bodies

### Implementation for User Story 3

- [x] T025 [P] [US3] Replace remaining hot-path `select("*")` in `src/lib/admin/teachers.ts` and `src/lib/admin/auth.ts` with explicit columns (keep `password_hash` only on credential verify paths)
- [x] T026 [P] [US3] Ensure student hub question counts use `questions(count)` embed or grouped count in `src/actions/quiz.ts` (remove fetch-all `questions.select('quiz_id')` tally loops)
- [x] T027 [US3] Audit teacher question editor paths in `src/actions/teacher.ts` — full question selects allowed only on editors; list paths stay lean
- [x] T028 [US3] Document optional future drops of low-selectivity boolean indexes in `specs/015-db-scale-hardening/research.md` or migration comment (do not drop in this feature unless EXPLAIN-proven safe)
- [x] T029 [US3] Re-run gatekeeper + tenant smoke: `tests/features/quiz-001-gatekeeper.test.ts` and MT-002 expectations still pass

**Checkpoint**: US3 complete — lean + count efficiency + RLS foundation verified

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Registry, build, quickstart validation

- [x] T030 [P] Register `PERF-004`, `PERF-005`, `PERF-006` with acceptance notes in `.speckit/spec.yaml`
- [x] T031 [P] Update stress/probe contracts if they assert old RPC row-dump shape (`tests/stress/perf-test-contract.test.ts`, `src/app/api/perf/probe/route.ts`) to accept aggregate KPI function name/shape
- [x] T032 Run `npm run build` and targeted Vitest suite from `specs/015-db-scale-hardening/quickstart.md`; fix regressions
- [x] T033 Manual pass of `quickstart.md` QA checklist (dashboard KPIs, paging clamp, home cap, admin counts, gatekeeper, teacher switch)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS story DB work that assumes `011` indexes/RLS
- **US1 (Phase 3)**: Depends on Foundational — MVP
- **US2 (Phase 4)**: Depends on Foundational (+ T001 helpers); can start after or parallel to US1 if staffing allows (different files mostly)
- **US3 (Phase 5)**: Depends on Foundational; best after US2 quiz list lean select (T015) to avoid conflicts in `quiz.ts` / `teacher.ts`
- **Polish (Phase 6)**: Depends on desired stories complete

### User Story Dependencies

- **US1 (PERF-004)**: After Phase 2 — no dependency on US2/US3
- **US2 (PERF-005)**: After Phase 1–2 — independently testable; shares `011` file with US1 (coordinate migration edits)
- **US3 (PERF-006)**: After Phase 2 — lean/count work should not regress US2 paging

### Parallel Opportunities

- T001 || T002 (Setup)
- T006 || (T007 after T005) — write US1 tests while drafting SQL
- T012 || T013 (US2 tests)
- T015 || T016 || T017 (paged loaders in different concerns; watch `quiz.ts` conflicts)
- T021 || T022 (student vs admin UI)
- T024 || T025 || T026 (US3)
- T030 || T031 (Polish docs/probe)

---

## Parallel Example: User Story 1

```bash
# Tests (can draft while SQL is written):
Task: "T006 contract tests in tests/features/perf-004-dashboard-kpis.test.ts"

# Then sequential migration + app:
Task: "T007 KPI RPC in 011_db_scale_hardening.sql"
Task: "T008 REVOKE/GRANT in same migration"
Task: "T009 mapper in src/lib/teacher-analytics.ts"
Task: "T010 getTeacherDashboardAnalytics in src/actions/teacher.ts"
```

## Parallel Example: User Story 2

```bash
Task: "T012 clamp/range tests in tests/features/perf-005-pagination.test.ts"
Task: "T013 PagedResult shape tests"
# After helpers exist:
Task: "T015 getTeacherQuizzes paged"
Task: "T016 student quizzes paged"
Task: "T017 student results paged"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup  
2. Phase 2 Foundational (`011` indexes + RLS)  
3. Phase 3 US1 (KPI RPC + fallback + lockdown)  
4. **STOP and VALIDATE** teacher dashboard under load / demo  
5. Demo MVP

### Incremental Delivery

1. Setup + Foundational → foundation ready  
2. US1 → aggregate dashboard (MVP)  
3. US2 → server pagination + admin counts + home cap  
4. US3 → lean selects + question counts polish  
5. Polish → registry + build + quickstart  

### Suggested MVP scope

**US1 (PERF-004) only** — removes the primary crash/CPU risk (row-dumping dashboard). Pagination (US2) is the next highest scale wall.

---

## Notes

- [P] = different files / no incomplete-task dependency  
- Coordinate edits to shared `011_db_scale_hardening.sql` across US1/US2 (single migration file)  
- Keep `EXAM_QUESTION_SELECT_FIELDS` / gatekeeper unchanged  
- Prefer extending `src/lib/perf-selects.ts` over new select sprawl  
- Commit after each phase or logical group when user requests commits  
- Next command after tasks: `/speckit-implement`
