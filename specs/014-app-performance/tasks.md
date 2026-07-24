---
description: "Task list for App Performance Optimization (PERF-001 / PERF-002 / PERF-003)"
---

# Tasks: App Performance Optimization

**Input**: Design documents from `specs/014-app-performance/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Tests**: Not TDD-first (spec does not require new suites). Polish phase runs build + existing gatekeeper checks; optional Vitest for RPC mapper if helpers are pure.

**Organization**: US1 (PERF-001 hub latency) → US2 (PERF-002 DB/RPC) → US3 (PERF-003 mobile/fonts/bundle). Shared foundation: baseline notes + React `cache()` auth + migration skeleton.

**Feature IDs**: `PERF-001`, `PERF-002`, `PERF-003` — do not break `QUIZ-001`, `MT-002`, iron-session auth, Spekit, Tajawal RTL

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US3 maps to spec user stories (PERF-001 / 002 / 003)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline capture and shared select-column constants before code changes

- [x] T001 Document pre-optimization baseline metrics (student `/dashboard` + teacher `/teacher` dashboard TTI/LCP, JS transfer, KPI time-to-readable) in `specs/014-app-performance/quickstart.md` Baseline table using demo accounts
- [x] T002 [P] Add shared lean column/select constants for quiz list + dashboard rows (no `*`) in `src/lib/perf-selects.ts` (or extend `src/lib/dashboard-stats.ts` / `src/lib/teacher-analytics.ts` if cleaner) per `contracts/server-actions.md` — must not include QUIZ-001 forbidden exam fields

**Checkpoint**: Baseline recorded; lean select constants available for story work

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Request-scoped auth dedupe + index/RPC migration — MUST complete before story-specific action/UI work that depends on them

**⚠️ CRITICAL**: No user story implementation that assumes cached auth or new indexes/RPC should begin until this phase is complete

- [x] T003 Wrap `requireStudent` / `requireTeacher` (and shared device-lock path) with React `cache()` in `src/lib/auth.ts` so one RSC request pays AUTH-003 once — preserve iron-session fields and error behavior per `contracts/server-actions.md` and `research.md` R2
- [x] T004 Create `supabase/migrations/010_perf_indexes_and_teacher_dashboard_rpc.sql` with composite indexes on `student_teachers (teacher_id, status)`, `(student_id, status)`, `quizzes (created_by, is_active)`, `(created_by, is_archived)` per `contracts/sql-rpc.md` / `data-model.md`
- [x] T005 In the same migration `010_perf_indexes_and_teacher_dashboard_rpc.sql`, add `get_teacher_dashboard_analytics(p_teacher_id uuid) RETURNS jsonb` scoped strictly by teacher id (no answer/explanation columns) matching KPI / gradeBuckets / weeklyActivity / popularExams shape in `contracts/sql-rpc.md`
- [x] T006 [P] Add brief comment in `src/middleware.ts` confirming session-decrypt-only budget (no DB) so future changes do not add Supabase to middleware

**Checkpoint**: Foundation ready — cached auth + migration with indexes/RPC; stories can proceed

---

## Phase 3: User Story 1 — Faster app navigation and screen loads (Priority: P1) 🎯 MVP — PERF-001

**Goal**: Collapse waterfalls and over-fetching on primary student/teacher hubs so navigation feels snappy without breaking gatekeeper, teacher scoping, or session auth.

**Independent Test**: Demo student + teacher hubs load without multi-second freezes; Network/DB shows fewer duplicate auth/device-lock hits; list queries no longer use blanket `select("*")` on audited paths; unsubmitted quiz still hides answers (QUIZ-001).

### Implementation for User Story 1

- [x] T007 [P] [US1] Narrow `select("*")` on student dashboard / available-quiz / list paths in `src/actions/quiz.ts` to lean columns from T002; keep `EXAM_QUESTION_SELECT_FIELDS` / gatekeeper path in `src/lib/quiz-gatekeeper.ts` unchanged
- [x] T008 [P] [US1] Narrow list/detail `select("*")` hotspots in `src/actions/teacher.ts` for non-editor list/dashboard reads (leave full-row selects only where quiz editors need full entities)
- [x] T009 [P] [US1] Narrow `select("*")` on gamification tier/status reads in `src/actions/gamification.ts`
- [x] T010 [US1] Parallelize independent student dashboard fetches and remove redundant sequential `requireStudent` stacking in `src/app/(student)/dashboard/page.tsx` + callers in `src/actions/quiz.ts` / `src/actions/student.ts` (rely on T003 `cache()`)
- [x] T011 [US1] Dedupe teacher portal auth: ensure `src/app/teacher/(portal)/layout.tsx` and `src/app/teacher/(portal)/dashboard/page.tsx` do not double-pay device lock (layout require + page require is OK only because of T003)
- [x] T012 [US1] Verify teacher switch + `revalidatePath` paths in `src/actions/student.ts` / `src/actions/teacher.ts` never serve previous teacher’s data after context change (SC-005 smoke)

**Checkpoint**: US1 complete — hubs leaner and auth-deduped; QUIZ-001 + MT-002 intact

---

## Phase 4: User Story 2 — Faster teacher-scoped dashboards and lists (Priority: P2) — PERF-002

**Goal**: Teacher dashboard KPIs and multi-tenant lists use indexes + single aggregation RPC; reads select only required columns.

**Independent Test**: After `npx supabase db push`, teacher dashboard KPIs match demo expectations via RPC path; EXPLAIN or timing improves vs pull-all baseline; all metrics scoped to logged-in teacher; writes still Server Actions only.

### Implementation for User Story 2

- [x] T013 [US2] Map RPC JSON → existing analytics UI types in `src/lib/teacher-analytics.ts` (keep or thin `computeTeacherDashboardAnalytics` as fallback mapper only)
- [x] T014 [US2] Switch `getTeacherDashboardAnalytics` in `src/actions/teacher.ts` to `createAdminClient().rpc('get_teacher_dashboard_analytics', { p_teacher_id: session.profileId })`, drop redundant student recount + `quizzes.select("*")` pull-all path, Arabic section error on RPC failure per `contracts/server-actions.md`
- [x] T015 [P] [US2] Audit remaining teacher student/quiz/group list queries in `src/actions/teacher.ts` for column-minimal selects and `created_by` / `teacher_id` filters benefiting from new indexes
- [x] T016 [P] [US2] Audit student multi-tenant link queries in `src/actions/student.ts` for `(student_id, status)`-friendly filters and lean columns
- [x] T017 [US2] Apply migration locally (`npx supabase db push`) and smoke-check teacher dashboard numbers against demo seed

**Checkpoint**: US2 complete — RPC + indexes live; MT-002 scoping preserved

---

## Phase 5: User Story 3 — Smooth mobile UI and lighter first paint (Priority: P3) — PERF-003

**Goal**: Defer Recharts, trim Tajawal weights (keep arabic + swap), right-size public assets; preserve Spekit hooks and touch targets.

**Independent Test**: Hard reload teacher dashboard shows separate chart chunk; Arabic text visible quickly with Tajawal; Spekit attributes present on chrome before charts load; touch targets remain `h-10`–`h-12`.

### Implementation for User Story 3

- [x] T018 [P] [US3] Extract or wrap Recharts usage with `next/dynamic` (`ssr: false`, Arabic loading placeholder) for teacher charts in `src/components/teacher/TeacherDashboardAnalytics.tsx` — keep Spekit hooks on always-mounted parent wrappers per `contracts/ui-components.md`
- [x] T019 [P] [US3] Same `next/dynamic` Recharts deferral for `src/components/teacher/StudentDetailDashboard.tsx`
- [x] T020 [US3] Trim Tajawal weights in `src/app/layout.tsx` to minimum used (`400` + `700`, keep `500` only if `font-medium` requires it); retain `subsets: ["arabic"]` and `display: "swap"`
- [x] T021 [P] [US3] Audit and compress/resize oversized rasters under `public/` (and landing imagery if oversized); leave SVGs as SVG; no new creatives
- [x] T022 [US3] Confirm Spekit targets still present on student/teacher hub chrome (`src/lib/spekit-targets.ts` usage sites) after dynamic chart split — no hook removal

**Checkpoint**: US3 complete — lighter first paint; Tajawal + Spekit + touch intact

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Registry, build verification, baseline comparison, optional pure-helper tests

- [x] T023 [P] Register `PERF-001`, `PERF-002`, `PERF-003` in `.speckit/spec.yaml` with acceptance notes, routes/files touched, and status
- [x] T024 [P] Fill after metrics in `specs/014-app-performance/quickstart.md` Baseline table and confirm SC-001 / SC-002 / SC-008 directionally met (or document budget already met)
- [x] T025 Run `npm run build` and fix any type/bundle regressions from dynamic imports or select narrowing
- [x] T026 [P] Optional: add Vitest for RPC JSON → UI mapper / lean-select invariants in `tests/features/perf-001-auth-cache.test.ts` or `tests/features/perf-002-dashboard-rpc.test.ts` if pure helpers were extracted
- [x] T027 Re-run QUIZ-001 gatekeeper smoke (unsubmitted quiz hides answers) and MT-002 teacher-switch smoke per `specs/014-app-performance/quickstart.md`

**Checkpoint**: Feature exit criteria met — registry updated, build green, non-negotiables verified

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (T002 constants useful before US1 selects; T001 baseline before/after polish). T003–T006 block story work that assumes cached auth / migration
- **US1 (Phase 3)**: Depends on Phase 2 (especially T003); can start lean-select tasks once T002 + T003 done
- **US2 (Phase 4)**: Depends on T004–T005 migration; benefits from US1 lean selects but is independently testable after `db push`
- **US3 (Phase 5)**: Depends on Phase 2 only for shared discipline; can run in parallel with US1/US2 (different files)
- **Polish (Phase 6)**: Depends on completed stories intended for release

### User Story Dependencies

- **US1 (PERF-001)**: After Foundational — no hard dependency on US2/US3
- **US2 (PERF-002)**: After Foundational migration — independent of US3; soft benefit from US1 lean selects
- **US3 (PERF-003)**: After Foundational — independent of US1/US2 (charts/fonts/assets)

### Parallel Opportunities

- T001 ∥ T002 (Setup)
- T004–T005 sequential in one migration file; T006 ∥ T003 after planning
- Within US1: T007 ∥ T008 ∥ T009 then T010–T012
- Within US2: T015 ∥ T016 after T014
- Within US3: T018 ∥ T019 ∥ T021; T020 sequential with layout only
- Across stories (team): US1 + US3 in parallel after Phase 2; US2 after migration applied

---

## Parallel Example: User Story 1

```bash
# After T002 + T003, launch lean-select audits in parallel:
Task: "Narrow select(*) in src/actions/quiz.ts"
Task: "Narrow select(*) in src/actions/teacher.ts"
Task: "Narrow select(*) in src/actions/gamification.ts"

# Then waterfall fixes (same request trees — sequential preferred):
Task: "Parallelize student dashboard in src/app/(student)/dashboard/page.tsx"
Task: "Confirm teacher layout/page auth dedupe via cache()"
```

## Parallel Example: User Story 3

```bash
Task: "dynamic() Recharts in TeacherDashboardAnalytics.tsx"
Task: "dynamic() Recharts in StudentDetailDashboard.tsx"
Task: "Compress oversized public/ assets"
# Then:
Task: "Trim Tajawal weights in src/app/layout.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (baseline + select constants)
2. Complete Phase 2: Foundational (`cache()` auth + migration — ship indexes even if RPC wired in US2)
3. Complete Phase 3: US1 lean fetches + dashboard parallelization
4. **STOP and VALIDATE**: Hub latency improved; QUIZ-001 / session auth OK
5. Demo MVP

### Incremental Delivery

1. Setup + Foundational → auth dedupe + DB ready
2. US1 → faster hubs (MVP)
3. US2 → RPC dashboard + index-backed lists
4. US3 → mobile font/bundle/assets
5. Polish → `.speckit/spec.yaml` + `npm run build` + baseline after numbers

### Parallel Team Strategy

1. Together: Phase 1–2
2. Dev A: US1 action/page waterfalls  
3. Dev B: US2 RPC wiring + list audits (after migration)  
4. Dev C: US3 dynamic charts + fonts + assets  
5. Together: Polish registry + build

---

## Notes

- Attempts table in this schema is `exam_submissions` (not `quiz_attempts`)
- Do not add Supabase calls to `src/middleware.ts`
- Do not cache gatekeeper-forbidden quiz fields across requests
- Prefer RPC over materialized views for v1 (plan decision)
- Commit after each task or logical group; stop at story checkpoints to validate independently
