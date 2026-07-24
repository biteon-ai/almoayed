# Implementation Plan: App Performance Optimization

**Branch**: `014-app-performance` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/014-app-performance/spec.md`

**Feature IDs (registry)**: `PERF-001` · `PERF-002` · `PERF-003`

## Summary

Eliminate slow authenticated hub loads and mobile UI jank across three coordinated tracks: (1) collapse repeated session/device-lock work and over-fetching on student/teacher screens with request-scoped auth cache and leaner Server Action selects; (2) add composite indexes and a teacher-scoped dashboard aggregation RPC (or equivalent single-round-trip path) so TEACH-005 / DASH-001 stop pull-all-then-aggregate; (3) code-split Recharts, trim Tajawal weights while keeping `display: swap` + Arabic subset, and right-size public assets.

**Technical approach**: Migration `010_perf_indexes_and_teacher_dashboard_rpc.sql`; React `cache()` wrappers around `requireStudent` / `requireTeacher`; narrow `select("*")` on list/dashboard paths; `next/dynamic` for chart clients; optional short-TTL `unstable_cache` only where keys include `profileId` + `currentTeacherId`; update `.speckit/spec.yaml`; verify `npm run build`.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC, Server Actions |
| **Database** | **Supabase** PostgreSQL — new migration `010_perf_indexes_and_teacher_dashboard_rpc.sql` |
| **Data access** | Server Actions + `createAdminClient()` — no client Supabase for privileged reads |
| **Session / auth** | iron-session — middleware decrypt only; auth helpers + AUTH-003 device lock |
| **UI** | Tailwind, Shadcn/Base UI, RTL, Tajawal via `next/font`, touch `h-10`–`h-12` |
| **Testing** | Vitest feature tests + manual Lighthouse / Network baseline |
| **Target platform** | Mobile-first PWA |
| **Spec registry** | `.speckit/spec.yaml` (+ PERF-001/002/003) |

**Feature-specific overrides**:

- **Primary Dependencies**: Existing stack only (`recharts` already present; load via `next/dynamic`). No new packages required.
- **Storage / tables touched**: Indexes on `student_teachers`, `quizzes`, `exam_submissions` (attempts table name in this schema); optional SQL function/RPC for teacher dashboard KPIs. No destructive schema changes.
- **Performance Goals**: ≥30% TTI improvement on student + teacher hubs vs documented baseline; teacher dashboard summaries usable &lt;3s on mid 4G at demo/realistic volume; ≥20% smaller critical JS/CSS for authenticated shell excluding deferred chart chunks; Arabic text visible &lt;1s (swap).
- **Constraints**: QUIZ-001 gatekeeper fields never cached into pre-submit exam payloads; MT-002 — all caches/RPC keys filter by `currentTeacherId` / teacher `profileId`; iron-session auth unchanged; Spekit hooks + touch targets preserved; Server Actions remain the only privileged write path.
- **Scale/Scope**: Audit + fix primary hubs (student dashboard/quizzes/results, teacher dashboard/students/quizzes); not a full rewrite of every action.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries | PASS — RPC/cache keys include teacher id; indexes support `(teacher_id, …)` / `(created_by, …)` filters |
| QUIZ-001 | No answer leakage pre-submit | PASS — no caching of gatekeeper-forbidden fields; exam select lists unchanged |
| Server layer | Privileged data via server only | PASS — optimizations stay in Server Actions + admin client + SQL |
| RTL UX | Arabic RTL, Tajawal, touch targets | PASS — font strategy keeps Tajawal + swap; dynamic imports preserve Spekit wrappers |
| Minimal diff | Match existing patterns | PASS — extend auth helpers, teacher analytics, layout/font; one migration |
| Passwordless | WhatsApp iron-session | PASS — middleware stays decrypt-only; no auth redesign |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — request-scoped `cache()` for auth avoids duplicate device-lock without cross-request tenant bleed; any `unstable_cache` must key `profileId`+`currentTeacherId` and invalidate on teacher switch / mutations via existing `revalidatePath`; dashboard RPC returns aggregates only (no quiz answer columns); Recharts deferred behind dynamic import with Arabic loading fallback.

## Project Structure

### Documentation (this feature)

```text
specs/014-app-performance/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md
├── contracts/
│   ├── server-actions.md
│   ├── sql-rpc.md
│   └── ui-components.md
└── tasks.md             # /speckit-tasks
```

### Source Code (planned touch points)

```text
supabase/migrations/
└── 010_perf_indexes_and_teacher_dashboard_rpc.sql

src/
├── middleware.ts                         # keep session-only; document overhead budget
├── lib/auth.ts                           # React cache() around require* + device lock
├── lib/supabase/admin.ts                 # optional request memo if useful; keep 8s timeout
├── lib/teacher-analytics.ts              # thin client of RPC result shape (or map RPC JSON)
├── lib/dashboard-stats.ts                # keep; ensure callers pass lean rows
├── lib/quiz-gatekeeper.ts                # unchanged select field lists (QUIZ-001)
├── actions/teacher.ts                    # lean selects; call dashboard RPC; drop redundant counts
├── actions/quiz.ts                       # lean dashboard/list selects; fewer requireStudent hops
├── actions/student.ts                    # lean teacher-link selects
├── actions/gamification.ts               # column-narrow tier/status reads
├── app/layout.tsx                        # Tajawal weights trim (keep arabic + swap)
├── app/(student)/dashboard/page.tsx      # parallelize fetches; single auth entry
├── app/teacher/(portal)/dashboard/page.tsx
├── app/teacher/(portal)/layout.tsx       # avoid double requireTeacher if page also calls it
├── components/teacher/TeacherDashboardAnalytics.tsx  # dynamic() Recharts
├── components/teacher/StudentDetailDashboard.tsx     # dynamic() Recharts
├── next.config.mjs                       # only if bundle hints needed
└── public/                               # compress/resize oversized landing assets if any

tests/features/perf-00*-*.test.ts         # RPC shape, select helpers, cache key invariants
.speckit/spec.yaml                        # register PERF-001/002/003
```

**Structure decision**: Prefer SQL indexes + one teacher dashboard RPC over materialized views for v1 (simpler ops, always fresh, still one round-trip). Prefer React `cache()` for auth dedupe over removing device lock. Prefer `next/dynamic` for charts over removing analytics UI.

## Complexity Tracking

> No constitution violations.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
