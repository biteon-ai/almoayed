# Feature Specification: Database Scale Hardening

**Feature Branch**: `015-db-scale-hardening`

**Created**: 2026-07-24

**Status**: Clarified

**Feature IDs**: `PERF-004` · `PERF-005` · `PERF-006`

**Input**: User description: "Fix Supabase/Postgres scale bottlenecks in Al-Moayed after the 014 performance pass and scale audit (Critical C1–C5, High H1–H6): dashboard KPIs must be true summaries (not full row dumps), privileged aggregate paths must be locked to trusted server callers only, defense-in-depth access rules on tenant tables, server-side pagination for primary hubs (stop fetch-all + client slice), admin teacher lists must not scan all quizzes globally, lean list payloads, efficient student question counts, and targeted lookup indexes. Preserve WhatsApp iron-session auth, service-role server data access, MT-002 teacher scoping, QUIZ-001 gatekeeper, RTL/Spekit, and minimal diffs. Out of scope: Supabase Auth rewrite, direct Postgres pooler in the app, Realtime/Storage, materialized views/Redis unless measured later."

## Clarifications

### Session 2026-07-24

- Q: Teacher dashboard summary completeness for first paint → A: Compact KPIs + grade buckets + top-N popular exams on first paint; row-heavy widgets load via separate paged/limited paths (not one giant catalog dump)
- Q: When compact dashboard summary path fails → A: Lean multi-query fallback first; section Arabic error only if fallback also fails
- Q: Requested list page past last page → A: Clamp to last valid page; return that page’s rows plus accurate total
- Q: Server paging scope for student home dashboard → A: List hubs fully server-paged; student home uses a limited window (cap), not full catalog / not required full pagination chrome
- Q: Popular exams top-N on teacher dashboard first paint → A: Top 10

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Teacher dashboard stays usable as rosters grow (Priority: P1) — PERF-004

As a teacher with a large active roster and many exams, I want my dashboard summary cards, grade overview, and popular-exam highlights to load as compact summaries so the hub remains responsive even when my school has grown far beyond demo size.

**Why this priority**: Full dump-then-summarize paths are the first crash and timeout risk as student × exam volume grows; without this, pagination and indexes alone still leave the primary teacher hub fragile.

**Independent Test**: As a teacher with a realistically large dataset (or seeded high-volume demo), open the teacher dashboard; confirm KPIs and highlights appear without loading or transferring every student row and every submission into the summary path, remain scoped to the active teacher only, and degrade gracefully if the optimized summary path is temporarily unavailable.

**Acceptance Scenarios**:

1. **Given** a teacher with many active students and submissions, **When** they open the teacher dashboard, **Then** first paint shows compact summary metrics (counts, averages, grade distribution, and up to 10 popular exams) without shipping full student/submission catalogs for that summary.
2. **Given** row-heavy dashboard widgets (for example per-student progress tables or detail charts that need many individual rows), **When** those widgets render, **Then** they load via separate paged or strictly limited paths — not by embedding the full catalog inside the first-paint summary.
3. **Given** an active teacher context, **When** dashboard summaries are computed, **Then** all figures remain strictly scoped to that teacher and never include another teacher’s students, quizzes, or attempts.
4. **Given** the optimized summary path is unavailable, **When** the teacher opens the dashboard, **Then** the product attempts a lean multi-query fallback that still avoids full catalog dumps; only if that fallback also fails does the section show a clear Arabic error — without blanking the entire workspace or leaking cross-tenant data.
5. **Given** privileged summary paths exist for trusted server callers, **When** untrusted clients attempt to invoke those paths, **Then** they cannot execute them or harvest another teacher’s aggregates.
6. **Given** a completed PERF-004 pass, **When** a production build is run, **Then** the build succeeds and the feature registry documents PERF-004.

---

### User Story 2 - Large lists browse page-by-page from the server (Priority: P1) — PERF-005

As a teacher, student, or super admin, I want student rosters, quiz catalogs, student exam/result lists, and admin teacher directories to load one page at a time from the server so opening a hub never requires downloading the entire catalog first.

**Why this priority**: Client-only pagination after fetch-all is the second major scale wall; without server paging, memory and timeouts appear before true product capacity is reached.

**Independent Test**: On teacher students, teacher quizzes, student quizzes/results, and admin teachers lists, change pages and filters; confirm each page request returns only that page’s rows plus a total count, UI page size behavior remains familiar, and teacher-scoped lists never show another teacher’s data.

**Acceptance Scenarios**:

1. **Given** a teacher with more students than one page, **When** they open and page through the students hub, **Then** each navigation loads only the current page of roster rows (plus total) rather than the full roster into the browser first.
2. **Given** a teacher with more quizzes than one page, **When** they browse the quizzes hub, **Then** paging is server-backed the same way and question counts (or equivalent list metadata) remain available per visible row without fetching every question body.
3. **Given** a student with many available exams or results under the active teacher, **When** they browse the quizzes or results list hubs, **Then** paging is server-backed and remains scoped to the active teacher context.
4. **Given** the student home dashboard (stats/carousel), **When** it loads under a large teacher quiz catalog, **Then** it uses a strictly limited recent/active window rather than downloading the full catalog (full pagination chrome is not required on home).
5. **Given** a super admin viewing the teachers directory, **When** they browse or filter teachers, **Then** the directory pages without scanning every quiz in the platform just to show per-teacher quiz counts.
6. **Given** existing Arabic pagination controls and Spekit hooks on those hubs, **When** server paging ships, **Then** those controls and hooks remain usable and RTL-correct.
7. **Given** a completed PERF-005 pass, **When** a production build is run, **Then** the build succeeds and the feature registry documents PERF-005.

---

### User Story 3 - Safer defaults and leaner hot paths at scale (Priority: P2) — PERF-006

As a product owner and developer, I want tenant tables deny untrusted direct access by default, hot list paths to avoid blanket full-row fetches, student hubs to count questions efficiently, and common lookup patterns to stay fast so growth does not silently widen risk or reintroduce payload bloat.

**Why this priority**: Hardens defense-in-depth and closes remaining high-priority audit items after the critical dashboard and pagination work; reduces future JWT/client misuse risk and keeps list payloads lean.

**Independent Test**: Verify deny-by-default behavior for untrusted callers on tenant relationship tables; confirm teacher/student/admin list and summary reads use lean field sets; confirm student hubs no longer pull every question row solely to count; confirm large-roster list/order paths remain acceptably fast with the added lookup support; gatekeeper and teacher scoping still pass.

**Acceptance Scenarios**:

1. **Given** tenant relationship and catalog tables used only through trusted server paths today, **When** an untrusted caller attempts direct table access, **Then** access is denied by default (defense-in-depth), while the app’s trusted server paths continue to work.
2. **Given** identity checks used in any residual access policies, **When** those policies are evaluated under load, **Then** they use efficient per-request identity evaluation (not repeated raw identity calls per row in a way that amplifies cost).
3. **Given** teacher quiz lists and admin teacher/profile reads on hot paths, **When** those screens load, **Then** they request only fields required for the view (full sensitive credential fields are not pulled on directory/list paths; full question bodies remain allowed only on question editors).
4. **Given** the student hub needs per-quiz question availability counts, **When** the hub loads, **Then** counts are obtained without transferring every question row into the application just to tally them.
5. **Given** common list filters and sort orders (student attempt history, question order within a quiz, pending upgrades, teacher quiz recency), **When** those paths run at higher volume, **Then** lookups use efficient multi-column access patterns suitable for those filters and sorts.
6. **Given** quiz exam flows, **When** any lean-select or aggregation change ships, **Then** answers and explanations remain withheld until after submit (gatekeeper intact).
7. **Given** a completed PERF-006 pass, **When** a production build is run, **Then** the build succeeds and the feature registry documents PERF-006.

---

### Edge Cases

- What if a teacher’s roster is empty? Dashboard summaries show zeros/empty highlights without errors; lists show empty states.
- What if the optimized dashboard summary path fails? Attempt lean multi-query fallback (still no full catalog dump); if fallback fails, show section-level Arabic error; no cross-teacher data; no full silent failure of unrelated hub chrome.
- What if the user requests a page beyond the last page? Clamp to the last valid page and return that page’s rows with an accurate total (do not leave the user on an empty dead page when a valid page exists).
- What if filters reduce results below one page? Return the filtered page and correct total; do not fetch unfiltered full sets.
- What if a student switches active teacher mid-session? Subsequent paged lists and summaries MUST reflect only the new teacher; prior page caches MUST NOT leak.
- How are exam flows affected? Pre-submit quiz views MUST still withhold answers and explanations.
- What about the student home dashboard under a large quiz catalog? It MUST use a limited recent/active window (not the full catalog). Full server pagination chrome is required on list hubs (`/quizzes`, `/results`, teacher students/quizzes, admin teachers), not necessarily on student home.
- What about very large admin directories? Server paging and aggregate quiz counts MUST keep the directory browsable without platform-wide quiz table fan-out.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Teacher dashboard first paint MUST resolve compact summary metrics (roster/quiz/upgrade counts, score averages, grade distribution, and at most 10 popular-exam highlights) through a compact summary path that does not transfer full student or submission catalogs. Row-heavy widgets MUST use separate paged or strictly limited data paths rather than expanding the first-paint summary into a full catalog dump.
- **FR-002**: All teacher dashboard summaries and related privileged aggregate paths MUST remain scoped to the active teacher context (MT-002); no change may widen visibility across teachers.
- **FR-003**: Privileged aggregate/summary paths MUST be callable only by trusted server-side callers; untrusted clients MUST NOT be able to execute them for arbitrary teachers.
- **FR-004**: If the optimized dashboard summary path is unavailable, the product MUST attempt a lean multi-query fallback that still avoids transferring full student/submission catalogs for the summary; only if that fallback also fails MUST the section show a clear Arabic recoverable error, without cross-tenant leakage or blanking the whole workspace.
- **FR-005**: Primary list hubs — teacher students, teacher quizzes, student quizzes, student results, and admin teachers — MUST load data page-by-page from the server with an accurate total (or equivalent paging contract), not by downloading the full catalog and slicing it only in the browser. If the requested page is beyond the last valid page, the server MUST clamp to the last valid page and return that page’s rows plus total.
- **FR-005a**: The student home dashboard MUST NOT download the full teacher quiz catalog for stats/carousel; it MUST use a strictly limited recent/active window. Full pagination chrome is not required on student home for this feature.
- **FR-006**: Server-paged teacher and student lists MUST continue to respect active teacher scoping and existing list filters (tier, status, archive, search where already supported).
- **FR-007**: Admin teacher directory quiz counts MUST be obtained via teacher-scoped or grouped aggregates, not by scanning every quiz in the platform into the application to count in memory.
- **FR-008**: Existing Arabic pagination UX and Spekit instrumentation on affected hubs MUST remain intact while switching to server-backed paging (page sizes may keep current product defaults).
- **FR-009**: Tenant relationship and related catalog tables that are application-server-only MUST deny untrusted direct access by default (defense-in-depth), without breaking trusted server reads/writes.
- **FR-010**: Any residual row-level identity policies MUST evaluate caller identity efficiently per request (cached identity expression pattern), not in a per-row amplifying form.
- **FR-011**: Hot list and directory reads MUST use lean field sets appropriate to the screen; sensitive credential material MUST NOT be fetched on list/directory paths; full question bodies remain allowed on teacher question editors only.
- **FR-012**: Student hubs that need per-quiz question counts MUST obtain those counts without transferring every question row solely to tally them.
- **FR-013**: Common high-volume filter/sort paths (student submission history by time, questions ordered within a quiz, teachers’ pending upgrade queues, teacher quizzes by recency) MUST be supported by efficient multi-column lookup patterns.
- **FR-014**: Quiz exam flows MUST preserve the gatekeeper rule: answers and explanations are never revealed before submission.
- **FR-015**: Session authentication (WhatsApp iron-session), trusted server write paths, RTL Arabic UX, and Spekit hooks MUST remain intact; this feature MUST NOT rewrite auth to a different identity provider or introduce direct app-to-database pooling as the primary data path.
- **FR-016**: This feature MUST NOT add Realtime subscriptions or new media-storage delivery pipelines, and MUST NOT add full-text/JSONB search indexes unless a concrete query need is proven.
- **FR-017**: After the work, the feature registry MUST document PERF-004, PERF-005, and PERF-006, and a production build MUST succeed.

### Key Entities

- **Dashboard KPI summary**: Compact teacher-scoped metrics and limited highlights for teacher dashboard first paint (counts, averages, grade buckets, up to 10 popular exams) — not the full underlying event log and not a substitute for row-heavy widgets.
- **Row-heavy dashboard widget**: Optional dashboard surface that needs many individual student or submission rows; must load via separate paged/limited paths after or alongside first-paint KPIs.
- **Paged list result**: A page of roster/quiz/result/admin rows plus total count and page metadata for UI navigation.
- **Active teacher context**: Currently selected teacher relationship that scopes all teacher-owned data.
- **Student–teacher link**: Multi-tenant relationship used for roster and access checks.
- **Quiz catalog item**: Lean quiz list row including availability metadata such as question count.
- **Quiz attempt / submission**: Student scoring record used in summaries and results lists.
- **Trusted server caller**: Application server path authorized to perform privileged reads/aggregations; distinct from untrusted clients.
- **Deny-by-default tenant table**: Relationship/catalog table that blocks untrusted direct access while remaining usable via trusted server paths.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For a teacher with at least 500 active students and 100 quizzes (or the highest available seeded volume if lower—baseline documented in planning), teacher dashboard first-paint KPI summary (counts, averages, grade buckets, ≤10 popular exams) reaches a usable on-screen state in under 3 seconds on a typical mid-range 4G profile without transferring full submission catalogs for that summary.
- **SC-002**: Opening teacher students, teacher quizzes, student quizzes, student results, and admin teachers hubs never requires the client to hold the entire unpaged catalog in memory to render the first page; each first page returns only that page’s rows plus total. Student home dashboard loads a limited window only (not the full quiz catalog).
- **SC-003**: Admin teacher directory quiz counts for a page of teachers complete without a platform-wide “load every quiz row” step; directory first page remains usable under a catalog of at least 1,000 quizzes (or documented demo maximum).
- **SC-004**: Untrusted callers cannot execute privileged teacher aggregate/summary paths or read deny-by-default tenant tables directly (0 successful unauthorized invocations in verification).
- **SC-005**: At least 90% of audited hot list/directory reads use lean field sets (no blanket full-row fetches on those paths); list paths never request password/credential hashes.
- **SC-006**: Student hub question-count paths transfer 0 full question bodies when only counts are required.
- **SC-007**: Switching active teacher context never shows another teacher’s paged lists or dashboard metrics afterward (0 cross-tenant leaks in verification).
- **SC-008**: Quiz attempt flows still withhold answers and explanations until after submit in 100% of gatekeeper verification cases.
- **SC-009**: Production build succeeds after the change set; PERF-004, PERF-005, and PERF-006 appear in the feature registry with acceptance notes.

## Assumptions

- Builds on `014-app-performance` (PERF-001–003); this feature hardens remaining scale audit items rather than repeating font/bundle work.
- Existing UI page sizes (students, quizzes, student exams/results) remain the default page sizes unless planning shows a strong reason to change.
- Out-of-range page requests clamp to the last valid page (with accurate total).
- Student home dashboard uses a capped recent/active quiz window; full server pagination applies to list hubs, not necessarily home.
- Popular-exam highlights on the teacher dashboard first-paint summary are fixed at a maximum of 10.
- Trusted server data access via the existing privileged server client remains the primary path; iron-session continues as the app session mechanism.
- Dashboard first paint is KPI-compact; existing richer per-student tables/charts are not required to be satisfied by the same compact payload.
- Dashboard summary failure policy: lean multi-query fallback first; section Arabic error only if fallback also fails; fallback must still avoid shipping full catalogs when producing KPI summaries.
- Low-selectivity single-column indexes may be documented for optional later removal after measurement; dropping them is not required to close this feature if risky.
- Stress/perf harness (`test:perf` / probe) may be extended in planning/tasks but is not a user-facing requirement beyond verification support.
- No requirement to introduce Redis, materialized views, Realtime, or Storage CDN in this feature.

## Out of Scope

- Rewriting authentication to Supabase Auth (or any JWT-user client data model) for normal student/teacher sessions
- Making direct database connection pooling the app’s primary data access path
- Broad UI redesign of hubs (beyond wiring existing pagination to server pages)
- Realtime channels, media storage pipelines, and JSONB/full-text search indexes without a proven query need
- Materialized views or external caches unless a later measurement proves they are required
- Replacing or expanding the WhatsApp OTP provider capacity planning (separate ops concern)
