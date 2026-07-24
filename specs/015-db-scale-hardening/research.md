# Research: Database Scale Hardening (PERF-004 / 005 / 006)

**Date**: 2026-07-24  
**Branch**: `015-db-scale-hardening`

## R1 — Dashboard first paint: aggregates vs row dump

**Decision**: Replace the `010` row-dumping `get_teacher_dashboard_analytics` payload with a **true aggregate KPI RPC** (or replace function body in place) that returns scalars + grade buckets + weekly activity + **≤10 popular exams**. Do **not** `jsonb_agg` all students/submissions for first paint. Row-heavy widgets use separate paged/limited loaders.

**Rationale**: Clarification Session 2026-07-24 (Q1, Q5). Current 010 RPC still ships O(rows) JSON then Node re-aggregates — fails SC-001 at scale. Spec FR-001 / SC-001 require compact first paint.

**Alternatives considered**:
- Keep 010 shape and only add indexes — rejected (payload still grows with roster).
- Materialized view refreshed on cron — deferred (ops + staleness).
- One RPC that still returns all rows “for future widgets” — rejected by clarification B.

**KPI field mapping note**: Existing `TeacherDashboardAnalytics` includes top performer, exam difficulty, completion rates with access rules. SQL should compute everything that is aggregate-safe (counts, avg/pass rates over scoped submissions, grade buckets matching existing labels, weekday passed/failed, top 10 by attempts with title/avg/completion vs active-student denominator simplified as attempt-based rates). Access-rule-perfect `totalAttempts` may use **active quizzes × active students** approximation in SQL for first paint; document if UI labels change slightly vs Node access-rule precision.

---

## R2 — Dashboard failure policy

**Decision**: On KPI RPC error → **lean multi-query fallback** that still returns only aggregate inputs needed for first-paint mapping (counts + limited popular exams via SQL `ORDER BY … LIMIT 10` / grouped queries), never full catalogs. If fallback fails → section-level Arabic error; hub chrome stays.

**Rationale**: Clarification Q2. Matches 014 spirit while enforcing “no full dump” on fallback.

**Alternatives considered**: Error-only immediately — worse UX. Soft zeros without notice — hides outages.

---

## R3 — RPC execute lockdown

**Decision**: `REVOKE ALL … FROM PUBLIC, anon, authenticated` on dashboard KPI (and admin quiz-count) functions; `GRANT EXECUTE … TO service_role` only. Server Action still passes `p_teacher_id = session.profileId` (never client-supplied teacher id).

**Rationale**: FR-003 / SC-004. SECURITY DEFINER without revoke is a latent cross-tenant harvest vector if anon keys appear later.

**Alternatives considered**: Rely on “we only use service role” without revoke — rejected (defense-in-depth).

---

## R4 — Server pagination vs client slice

**Decision**: Introduce shared helpers (`clampPage`, `rangeFromPage`) and change list Server Actions to accept `{ page, pageSize?, filters? }` returning `{ items, total, page, pageSize }`. Use PostgREST `.range(from, to)` + `count: 'exact'`. **Clamp** out-of-range pages to last valid page (clarification Q3). Keep page sizes: students **8**, teacher quizzes **6**, student exams/results **4**, admin teachers default **20**.

Wire UI: pass `page` into actions (searchParams and/or client fetch) instead of `usePagination` over full arrays on primary hubs.

**Rationale**: FR-005 / SC-002. Offset pagination matches existing UI; keyset can wait.

**Alternatives considered**: Keyset-only — better at huge offsets but more UI churn. Keep client pagination — fails scale goals.

---

## R5 — Student home window

**Decision**: Student home dashboard loads at most **12** recent/active quizzes (lean select + `questions(count)` or equivalent), not the full catalog. Full server pagination remains on `/quizzes` and `/results` only.

**Rationale**: Clarification Q4; deferred exact size resolved here as 12 (2× `QUIZ_QUEUE_PAGE_SIZE` / reasonable carousel).

**Alternatives considered**: Same pagination as list hubs on home — unnecessary UX change. Leave home unbounded — fails FR-005a.

---

## R6 — Admin quiz counts

**Decision**: Add `admin_quiz_counts_by_teacher()` SECURITY DEFINER SQL (`GROUP BY created_by` where not archived) with service_role-only execute **or** scoped `.in('created_by', teacherIds)` aggregate for the current page. Prefer SQL GROUP BY RPC when listing many teachers; for a single page of N teachers, `.in` count query is acceptable if it avoids scanning unrelated teachers’ absence.

**Rationale**: FR-007 / SC-003. Current `listTeachers` loads all quiz `created_by` rows.

**Alternatives considered**: Keep JS full scan — rejected.

---

## R7 — RLS defense-in-depth

**Decision**: Add deny-all policies (`USING (false) WITH CHECK (false)`) on `student_teachers`, `teacher_groups`, `teacher_group_members`, `categories`, `topics`, `auth_otp_states` (match `gamification_tiers`). Rewrite residual `001` policies to use `(SELECT auth.uid())`. Service role continues to bypass RLS for app paths.

**Rationale**: FR-009 / FR-010 / SC-004. App does not use JWT for tenant reads today; deny-all locks accidental anon/authenticated access.

**Alternatives considered**: Full JWT tenant RLS now — out of scope / auth rewrite. Leave tables RLS-enabled with zero policies — already locked for roles without BYPASSRLS, but explicit deny-all documents intent and matches 007 pattern.

---

## R8 — Lean selects & question counts

**Decision**: `getTeacherQuizzes` → `QUIZ_LIST_SELECT` + `questions(count)`. Admin list/auth paths → explicit columns (no `password_hash` on directory lists). Student hubs needing counts → embed `questions(count)` or single grouped count query — never fetch all question rows to tally.

**Rationale**: FR-011 / FR-012 / SC-005 / SC-006.

**Alternatives considered**: Keep `select('*')` on editors only — allowed for question editors; not for lists.

---

## R9 — Indexes (011)

**Decision**: Add:

- `exam_submissions (student_id, submitted_at DESC)`
- `questions (quiz_id, sort_order)`
- partial `student_teachers (teacher_id) WHERE upgrade_requested = true`
- `quizzes (created_by, updated_at DESC, created_at DESC)`

Document optional future drops of low-selectivity boolean singles after EXPLAIN; do **not** require drops to exit the feature.

**Rationale**: FR-013; builds on 010 composites. No GIN (FR-016).

**Optional later (not required to exit)**: After EXPLAIN validates composites in production-like load, consider dropping low-selectivity singles such as `idx_quizzes_is_free`, `idx_profiles_is_subscribed` (commented in `011_db_scale_hardening.sql`).

**Alternatives considered**: CONCURRENTLY — not inside Supabase transactional migrator; use plain `CREATE INDEX IF NOT EXISTS`.

---

## R10 — Relationship to 014 / 010

**Decision**: Do not rewrite migration 010 history. Ship **011** that replaces/repairs KPI function behavior + grants + RLS + new indexes. Callers prefer new aggregate shape; keep temporary TypeScript mapper compatibility where UI still expects `TeacherDashboardAnalytics`.

**Rationale**: Spec prefers migration after 010; audit C1 targets live 010 behavior.
