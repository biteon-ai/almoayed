# Research: App Performance Optimization (PERF-001 / 002 / 003)

**Date**: 2026-07-24  
**Branch**: `014-app-performance`

## R1 — Where latency actually is

**Decision**: Treat **post-middleware data waterfalls** as the primary bottleneck, not iron-session decrypt in `src/middleware.ts`.

**Rationale**: Middleware only decrypts the session cookie on matched protected routes (no Supabase). Student dashboard currently stacks multiple `requireStudent` calls (layout guard → page → nested actions), each potentially re-running AUTH-003 device-lock queries. Teacher dashboard runs `requireTeacher` in layout **and** page, then `getTeacherDashboardAnalytics` does multi-round-trip fetches + in-Node aggregation over full quiz rows (`select("*")`).

**Alternatives considered**:
- Rewrite middleware to skip iron-session — rejected (breaks AUTH route protection; decrypt cost is already small).
- Move auth entirely into middleware with DB — rejected (adds DB to every request; constitution prefers thin middleware).

---

## R2 — Auth / device-lock deduplication

**Decision**: Wrap `requireStudent` / `requireTeacher` (and the device-lock check they share) in React `cache()` so one RSC request tree pays once. Keep middleware as cookie decrypt only.

**Rationale**: Matches Next App Router request memoization; preserves AUTH-003; zero cross-request tenant risk (cache is per-request).

**Alternatives considered**:
- Remove device lock from hot paths — rejected (security regression).
- Global module singleton for session — rejected (can leak across concurrent requests in serverless).

---

## R3 — Read caching strategy

**Decision**: Phase 1 defaults to **no cross-request cache** for private hubs. Use request-scoped `cache()` for shared loaders. Optionally add short-TTL `unstable_cache` later only for pure aggregates keyed by `profileId` + `currentTeacherId`, invalidated via existing `revalidatePath` on mutations and teacher switch.

**Rationale**: Spec forbids cross-teacher stale data; App Router authenticated routes are already fully dynamic (no `export const revalidate` today). Request memoization alone removes most duplicate work.

**Alternatives considered**:
- Aggressive `unstable_cache` on full dashboard payloads — rejected for v1 (tenant-key bugs are high-impact).
- Full static generation — rejected (session-specific data).

---

## R4 — Teacher dashboard aggregation (PERF-002)

**Decision**: Add PostgreSQL function callable via `supabase.rpc(...)`, e.g. `get_teacher_dashboard_analytics(p_teacher_id uuid)`, returning JSON matching the existing `computeTeacherDashboardAnalytics` shape (KPIs, grade buckets, weekly activity, popular exams). Keep a thin TS mapper; retire pull-all-then-aggregate for the hot path. Prefer **RPC over materialized view** for v1.

**Rationale**: Current path loads all teacher quizzes with `*`, all linked students, all matching submissions, then aggregates in Node — O(data) transfer for O(summary) UI. RPC does aggregation next to indexes in one round-trip while enforcing `p_teacher_id` (MT-002).

**Alternatives considered**:
- Materialized view refreshed on cron — deferred (ops complexity; staleness UX).
- Keep Node aggregation but narrow columns only — partial win; still multi-round-trip and large row sets.

---

## R5 — Indexes (PERF-002)

**Decision**: Migration adds composites aligned to real filters (attempts live in `exam_submissions`, not `quiz_attempts`):

| Index | Purpose |
|-------|---------|
| `student_teachers (teacher_id, status)` | Teacher roster / dashboard student sets |
| `student_teachers (student_id, status)` | Student multi-teacher lists |
| `quizzes (created_by, is_active)` | Teacher + student active quiz lists |
| `quizzes (created_by, is_archived)` | Teacher archive filters if used hot |
| Review `exam_submissions (quiz_id, submitted_at DESC)` if EXPLAIN shows need beyond existing `(student_id)`, `(quiz_id)`, `(submitted_at)` |

**Rationale**: Existing single-column indexes miss the common `(teacher_id, status)` and `(created_by, is_active)` pairs used in actions.

**Alternatives considered**:
- Index every filter column combination — rejected (write amplification; minimal diff).
- Rely on UNIQUE `(student_id, teacher_id)` alone — insufficient for status-filtered teacher scans.

---

## R6 — Column narrowing (PERF-001 / 002)

**Decision**: Replace `select("*")` on list/dashboard paths in `actions/quiz.ts`, `actions/teacher.ts`, and `actions/gamification.ts` with explicit column lists. Keep full-row selects only where editors need full entities. Never widen quiz exam selects beyond `EXAM_QUESTION_SELECT_FIELDS` (QUIZ-001).

**Rationale**: Spec SC-003 (≥90% audited screens lean). Full quiz rows on dashboards ship question-unrelated payload and encourage accidental field use.

**Alternatives considered**:
- GraphQL / view layer — rejected (out of scope / over-engineering).

---

## R7 — Client bundle / charts (PERF-003)

**Decision**: Load Recharts via `next/dynamic(..., { ssr: false, loading: … })` from `TeacherDashboardAnalytics` and `StudentDetailDashboard` (or extract a `TeacherCharts.tsx` / `StudentCharts.tsx` chunk). Leave `xlsx` as existing dynamic `import()` on import tools. No chart.js/tiptap in repo.

**Rationale**: Zero `next/dynamic` usages today; Recharts is statically imported into teacher hub client graphs and dominates optional JS.

**Alternatives considered**:
- Remove charts — rejected (TEACH-005 value).
- Replace Recharts with CSS bars — possible later; not required for FR.

---

## R8 — Fonts (PERF-003)

**Decision**: Keep `next/font/google` Tajawal with `subsets: ["arabic"]` and `display: "swap"`. Reduce weights from `[400, 500, 700, 800]` to the minimum used in UI (likely `400` + `700`, add `500` only if design tokens need it).

**Rationale**: Swap already satisfies FR-010 visibility; four weights inflate first-byte font cost on mobile.

**Alternatives considered**:
- Self-host variable Tajawal — optional later; `next/font` already subsets.
- Switch font family — rejected (constitution / Spekit visual identity).

---

## R9 — Images / public assets (PERF-003)

**Decision**: Audit `public/` and landing imagery; compress oversized PNG/JPG; prefer SVG where already vector; use `next/image` only where raster heroes exist and sizing attributes help. No new marketing creatives.

**Rationale**: Spec limits scope to sizing/delivery of existing assets.

**Alternatives considered**:
- CDN image pipeline — out of scope for this feature.

---

## R10 — Baseline measurement

**Decision**: Before merging fixes, capture a short baseline in `quickstart.md`: Lighthouse mobile (or DevTools Performance) on `/dashboard` and `/teacher/dashboard` with demo accounts; note transfer size of main JS excluding later chart chunks; note teacher analytics time-to-KPI. Store numbers in the PR description / quickstart “Baseline” section for SC-001/002/008.

**Rationale**: Spec assumes baselines documented during planning/implementation.

**Alternatives considered**:
- Synthetic k6 DB load only — insufficient for UX success criteria.

---

## Resolved clarifications

All Technical Context unknowns from the plan are resolved above. No remaining NEEDS CLARIFICATION blockers for `/speckit-tasks`.
