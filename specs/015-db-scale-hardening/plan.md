# Implementation Plan: Database Scale Hardening

**Branch**: `015-db-scale-hardening` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-db-scale-hardening/spec.md` (Clarified 2026-07-24)

**Feature IDs (registry)**: `PERF-004` · `PERF-005` · `PERF-006`

## Summary

Close remaining Supabase scale bottlenecks after `014-app-performance`: (1) replace the row-dumping teacher dashboard RPC with a true aggregate KPI payload (≤10 popular exams) plus lean multi-query fallback, and revoke execute from untrusted roles; (2) move primary list hubs to server-side pagination with page clamp, cap the student home quiz window, and fix admin quiz counting without a global scan; (3) add deny-all RLS on server-only tenant tables, wrap `auth.uid()` as `(SELECT auth.uid())`, lean hot-path selects, efficient question counts, and additive composite indexes.

**Technical approach**: Migration `011_db_scale_hardening.sql` (KPI RPC + grants + RLS + indexes + optional admin quiz-count RPC); update `getTeacherDashboardAnalytics` / `teacher-analytics` mappers; add shared `PagedResult<T>` helpers and wire teacher/student/admin list UIs to server `page` params; update `.speckit/spec.yaml`; verify `npm run build` (+ targeted Vitest / optional `test:perf`).

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC, Server Actions |
| **Database** | **Supabase** PostgreSQL — new migration `011_db_scale_hardening.sql` (after `010_*`) |
| **Data access** | Server Actions + `createAdminClient()` — no client Supabase for privileged reads |
| **Session / auth** | iron-session — unchanged; MT-002 via `currentTeacherId` / teacher `profileId` |
| **UI** | Tailwind, Shadcn/Base UI, RTL; existing `PaginationControls` + Spekit |
| **Testing** | Vitest feature/contract tests; optional stress probe |
| **Target platform** | Mobile-first PWA |
| **Spec registry** | `.speckit/spec.yaml` (+ PERF-004/005/006) |

**Feature-specific overrides**:

- **Primary Dependencies**: Existing stack only. No new packages.
- **Storage / tables touched**: Indexes + RLS policies + SQL functions on `student_teachers`, `teacher_groups`, `teacher_group_members`, `categories`, `topics`, `auth_otp_states`, `quizzes`, `questions`, `exam_submissions`, `profiles` (select lists only). No destructive drops required for exit.
- **Performance Goals**: Teacher dashboard first-paint KPIs usable &lt;3s at ≥500 students / 100 quizzes (or max seeded volume); list hubs never materialize full catalogs client-side; admin teachers first page usable with ≥1k quizzes without full quiz fan-out.
- **Constraints**: QUIZ-001 gatekeeper selects unchanged; MT-002 on every teacher-scoped path; service-role remains primary data path; no Supabase Auth rewrite; no direct PG pooler in Next.js; no Realtime/Storage/GIN without proven need.
- **Scale/Scope**: P0 dashboard KPI + RPC lock + server pagination + admin counts; P1 RLS harden + lean selects + question counts + indexes. Student home = capped window (default **12**), not full list pagination.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries | PASS — RPC `p_teacher_id` = session teacher; paged lists filter teacher id / `currentTeacherId` |
| QUIZ-001 | No answer leakage pre-submit | PASS — exam select lists unchanged; KPI RPC has no answer columns |
| Server layer | Privileged data via server only | PASS — admin client + Server Actions; REVOKE RPC from anon/authenticated |
| RTL UX | Arabic RTL, touch, Spekit | PASS — reuse pagination chrome; no redesign |
| Minimal diff | Match existing patterns | PASS — extend `perf-selects`, migration 010 style, existing page sizes |
| Passwordless | WhatsApp iron-session | PASS — no auth redesign |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — KPI RPC returns aggregates only; fallback stays lean; deny-all RLS does not break service role; pagination clamp + page sizes preserve UX; student home cap avoids fetch-all without forcing home pagination chrome.

## Project Structure

### Documentation (this feature)

```text
specs/015-db-scale-hardening/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md
├── contracts/
│   ├── server-actions.md
│   ├── sql-rpc.md
│   └── ui-pagination.md
└── tasks.md             # /speckit-tasks
```

### Source Code (planned touch points)

```text
supabase/migrations/
└── 011_db_scale_hardening.sql

src/lib/
├── perf-selects.ts                 # extend lean selects; quiz list + questions(count)
├── teacher-analytics.ts            # map KPI RPC → TeacherDashboardAnalytics first-paint subset
├── pagination-server.ts            # NEW: clampPage, rangeFromPage, PagedResult type helpers
└── student-quiz-ui.ts / paginate-students.ts  # keep page size constants; UI calls server page

src/actions/
├── teacher.ts                      # KPI RPC + fallback; paged getTeacherStudents/Quizzes; lean selects
├── quiz.ts                         # paged student quizzes/results; home window cap; questions(count)
└── (admin via) src/lib/admin/teachers.ts  # paged listTeachers + quiz count RPC/aggregate

src/components/
├── teacher/StudentManagement.tsx / QuizManagement.tsx / StudentsTable.tsx
├── student/StudentQuizzesView.tsx / StudentResultsView.tsx
└── admin/AdminTeachersTable.tsx    # wire page → server; drop client-only full-array paging where applicable

tests/features/perf-004-*.test.ts / perf-005-*.test.ts / perf-006-*.test.ts
.speckit/spec.yaml                  # register PERF-004/005/006
```

**Structure decision**: Prefer replacing `get_teacher_dashboard_analytics` body (or adding `get_teacher_dashboard_kpis` and switching callers) over materialized views. Prefer PostgREST `.range()` + `count: 'exact'` over keyset for v1 (matches existing offset UI). Prefer deny-all RLS policies for server-only tables over inventing JWT tenant policies (app stays on service role).

## Complexity Tracking

> No constitution violations.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
