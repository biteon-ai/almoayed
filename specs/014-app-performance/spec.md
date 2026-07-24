# Feature Specification: App Performance Optimization

**Feature Branch**: `014-app-performance`

**Created**: 2026-07-24

**Status**: Draft

**Feature IDs**: `PERF-001` · `PERF-002` · `PERF-003`

**Input**: User description: "PERF-001: Identify, profile, and fix performance bottlenecks causing slow page loads and UI latency (super admin | developer). PERF-002: Optimize database response times and multi-tenant data fetching latency (developer). PERF-003: Eliminate mobile UI render lag, optimize web fonts, and reduce initial bundle payload (student | teacher). Do not break QUIZ-001 gatekeeper, MT-002 currentTeacherId scoping, WhatsApp iron-session auth, Server Actions DB write policies, Tajawal RTL font rendering, touch-friendly targets, or Spekit hooks. After implementation: update feature registry and verify production build succeeds."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Faster app navigation and screen loads (Priority: P1) — PERF-001

As a super admin or developer verifying the product, I want core student and teacher screens to load and respond quickly so users no longer experience slow page transitions or sticky UI after login.

**Why this priority**: Perceived speed is the primary pain; without fixing end-to-end load and interaction latency, database and font work alone will not restore trust in the product.

**Independent Test**: On a representative mobile network profile, open the most-used authenticated hubs (student home, teacher dashboard, quiz list) before and after the work; confirm measurable load and interaction improvements without regressions in quiz gating, teacher scoping, or login session behavior.

**Acceptance Scenarios**:

1. **Given** a logged-in student or teacher, **When** they navigate between primary hubs, **Then** each destination becomes interactive without prolonged blank or frozen states attributable to avoidable repeated data fetching.
2. **Given** screens that previously fetched related records one-by-one or over-fetched unused fields, **When** those screens are exercised, **Then** each view retrieves only the data required for that view and related collections are loaded efficiently in bulk where applicable.
3. **Given** routes that can safely reuse fresh-enough data, **When** a user revisits them within a short period, **Then** the experience feels snappy (cached or reused data) without showing stale private data across teachers or sessions.
4. **Given** heavy interactive widgets (charts, rich editors, export tools), **When** a page that contains them first loads, **Then** the page shell appears first and those widgets load on demand rather than blocking the whole screen.
5. **Given** session-protected navigation, **When** every authenticated request runs through session checks, **Then** login/session protection still works and adds negligible delay relative to the page’s own data work.
6. **Given** a completed optimization pass, **When** a production build is run, **Then** the build succeeds and the feature registry documents PERF-001.

---

### User Story 2 - Faster teacher-scoped dashboards and lists (Priority: P2) — PERF-002

As a teacher (and as a developer validating multi-tenant data paths), I want dashboards and student/quiz lists scoped to my active teacher context to return quickly so waiting on summary cards and tables is rare.

**Why this priority**: Multi-tenant joins and aggregations are the main backend latency source after general page hygiene; teachers feel this every day on dashboard and management hubs.

**Independent Test**: As a teacher with a realistic volume of students, quizzes, and attempts, open the teacher dashboard and key management lists; confirm faster time-to-meaningful-content while all numbers and rows remain scoped to the active teacher only and writes still go through approved server write paths.

**Acceptance Scenarios**:

1. **Given** a teacher with an active teacher context selected, **When** they open dashboards or lists that join students, quizzes, or attempts, **Then** results remain strictly scoped to that active teacher and arrive faster than the pre-optimization baseline for the same dataset size.
2. **Given** heavily used relationship paths (student–teacher links, quizzes, quiz attempts), **When** those paths are queried under load, **Then** lookups use efficient indexed access patterns suitable for teacher-scoped filters and joins (including composite keys where teacher context plus another filter is common).
3. **Given** dashboard aggregations previously computed by many round-trips (teacher stats / dashboard KPIs), **When** the teacher opens those views, **Then** summary metrics resolve via a single optimized aggregation path rather than many sequential scans of the same underlying data.
4. **Given** any data read for a screen, **When** the request executes, **Then** only columns required for that screen are returned (no blanket full-row fetches for list and summary UIs).
5. **Given** existing write policies for server-side mutations, **When** performance changes are applied, **Then** all database writes continue to go through the approved write paths and multi-tenant scoping rules remain enforced.
6. **Given** a completed PERF-002 pass, **When** a production build is run, **Then** the build succeeds and the feature registry documents PERF-002.

---

### User Story 3 - Smooth mobile UI and lighter first paint (Priority: P3) — PERF-003

As a student or teacher on a phone, I want the Arabic RTL interface to feel responsive on first open and while scrolling so text appears quickly, offscreen content does not jank the main thread, and images do not inflate the initial download.

**Why this priority**: Even with faster data, mobile users still abandon if fonts flash late, dashboards hitch while scrolling, or the first payload is too large on cellular networks.

**Independent Test**: On a mid-range mobile device or throttled mobile profile, open landing and authenticated hubs; verify Arabic text remains correct (Tajawal), touch targets stay usable, Spekit hooks remain present, and first interaction feels smoother with reduced initial payload.

**Acceptance Scenarios**:

1. **Given** a first visit to the app shell, **When** the Arabic UI paints, **Then** the primary UI font loads with swap behavior so text is readable immediately and settles into Tajawal without layout breakage or wrong script fallback for Arabic content.
2. **Given** student or teacher dashboards with below-the-fold or optional heavy widgets, **When** the user lands on the page, **Then** only above-the-fold content blocks interaction; charts, export tools, and similar libraries load when needed (scroll into view or explicit open).
3. **Given** marketing/landing and in-app hub imagery (including SVGs), **When** pages are loaded on mobile, **Then** assets are appropriately sized for their display contexts and do not dominate the initial download compared to the pre-optimization baseline.
4. **Given** existing Spekit instrumentation and touch-friendly controls, **When** UI performance changes ship, **Then** Spekit hooks remain intact and interactive targets stay large enough for touch use.
5. **Given** a completed PERF-003 pass, **When** a production build is run, **Then** the build succeeds and the feature registry documents PERF-003.

---

### Edge Cases

- What happens when a teacher switches active teacher context mid-session? Cached or reused data for the previous teacher MUST NOT leak into the newly selected teacher’s views.
- How does the system behave on a slow network when deferred widgets fail to load? The page shell and critical actions remain usable; failed optional widgets show a clear Arabic retry/fallback instead of freezing the hub.
- What if a dashboard aggregation path is temporarily unavailable? The UI shows a recoverable error for that section without blanking the entire workspace.
- What if font files are blocked or slow? Text remains readable via swap/fallback without invisible text for an extended period, and Arabic readability is preserved once the primary font arrives.
- How are quiz exam flows affected? Pre-submission quiz views MUST still withhold answers and explanations (gatekeeper intact) even when caching or deferred loading is introduced.
- What about very large teacher datasets? Lists and dashboards remain responsive enough to open and browse; if pagination or windowing already exists, performance work MUST NOT force loading the entire catalog at once.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST identify and eliminate avoidable repeated related-record fetching and over-fetching on primary authenticated student and teacher screens so each view loads only the data it needs.
- **FR-002**: The product MUST apply safe data-reuse strategies for routes and server reads where freshness requirements allow, without serving another teacher’s or another user’s private data.
- **FR-003**: The product MUST defer loading of heavy interactive widgets (charts, rich editors, export tools) so they do not block first interaction on hubs that embed them.
- **FR-004**: Session protection on authenticated navigation MUST remain correct while keeping session-check overhead minimal relative to page data work.
- **FR-005**: All teacher-scoped reads for students, quizzes, attempts, and dashboard metrics MUST continue to respect the active teacher context; no performance change may widen visibility across teachers.
- **FR-006**: Heavily queried relationship paths (student–teacher links, quizzes, quiz attempts) MUST be supported by efficient lookup patterns for teacher-scoped filters and common secondary filters used together.
- **FR-007**: Heavy dashboard aggregations used by teacher stats and management overview surfaces MUST resolve through optimized aggregation paths rather than many sequential full scans of the same data.
- **FR-008**: Data reads for list and summary UIs MUST request only the columns required for that UI.
- **FR-009**: Database writes MUST continue to use approved server write paths and existing write-policy constraints.
- **FR-010**: The Arabic UI font (Tajawal) MUST load in a way that keeps text visible quickly (swap), preserves RTL Arabic rendering, and avoids prolonged invisible or broken text on first paint.
- **FR-011**: Offscreen or optional heavy client libraries on student and teacher dashboards MUST load lazily without removing Spekit hooks or reducing touch-target usability.
- **FR-012**: Landing and hub images/SVGs MUST be sized appropriately for their display contexts to reduce initial payload on mobile.
- **FR-013**: Quiz exam flows MUST preserve the gatekeeper rule: answers and explanations are never revealed before submission, including under any new caching or deferred-loading behavior.
- **FR-014**: After the performance work, the feature registry MUST document PERF-001, PERF-002, and PERF-003, and a production build MUST succeed.

### Key Entities

- **Active teacher context**: The currently selected teacher relationship that scopes all teacher-owned data a student or teacher sees; performance caching must key off this context.
- **Student–teacher link**: Relationship connecting a student to one or more teachers; primary multi-tenant join path for lists and access checks.
- **Quiz**: Teacher-owned assessment metadata and content references used in lists and dashboards.
- **Quiz attempt**: Student submission and scoring record; high-volume read path for progress and teacher stats.
- **Dashboard aggregation**: Precomputed or efficiently computed summary metrics for teacher (and related) overview surfaces.
- **Deferred UI widget**: Optional heavy interactive surface (chart, editor, export) that must not block the initial hub render.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a mid-range mobile profile, time-to-interactive for the primary student hub and primary teacher hub improves by at least 30% versus the documented pre-optimization baseline for the same accounts and dataset size.
- **SC-002**: Teacher dashboard summary metrics reach a usable on-screen state in under 3 seconds on a typical 4G mobile profile for a teacher with up to 500 students and 100 quizzes (or the project’s current realistic demo volume if lower—baseline documented in planning).
- **SC-003**: At least 90% of list/summary data requests for audited screens return only fields required by those screens (zero blanket full-row fetches on those paths).
- **SC-004**: Heavy widgets (charts / editors / export tools) are absent from the critical first-load path on student and teacher dashboards; first meaningful paint of the hub shell occurs without waiting for those libraries.
- **SC-005**: Switching active teacher context never shows another teacher’s students, quizzes, or metrics in a subsequent view (0 cross-tenant cache/data leaks in verification).
- **SC-006**: Quiz attempt flows still withhold answers and explanations until after submit in 100% of gatekeeper verification cases.
- **SC-007**: On first visit, Arabic body text is visible within 1 second of first paint under normal conditions (no prolonged invisible-text period), and final Tajawal rendering remains correct for RTL Arabic.
- **SC-008**: Initial transferable payload for the main authenticated shell (excluding deferred widget chunks) is reduced by at least 20% versus the pre-optimization baseline, or documented as already under the agreed budget if further cuts are not possible without breaking UX.
- **SC-009**: Production build succeeds after the change set; PERF-001, PERF-002, and PERF-003 appear in the feature registry with acceptance notes.

## Assumptions

- Pre-optimization baselines (hub load time, dashboard metrics time, initial payload size) will be captured once during planning/implementation and used for SC-001, SC-002, and SC-008 comparisons.
- “Typical” verification volume is the demo/realistic seed dataset unless a larger fixture is provided; success thresholds scale with the documented baseline rather than inventing production-scale load tests in this feature.
- Existing WhatsApp session-based authentication remains the only session mechanism; this feature optimizes overhead, it does not replace auth.
- Existing multi-tenant active-teacher scoping and server write policies remain authoritative; performance work is additive (indexes, leaner reads, safer reuse) and does not introduce client-side privileged writes.
- Quiz gatekeeper behavior (no answers/explanations pre-submit) is non-negotiable and outranks caching convenience.
- Tajawal remains the primary Arabic UI font; optimization improves loading strategy, not a font family change.
- Spekit hooks and touch-friendly target sizes are preserved; visual redesign is out of scope except where asset sizing or deferred loading requires minor layout adjustments.
- Materialized summaries or optimized aggregation endpoints may be introduced for dashboard KPIs if needed; exact mechanism is an implementation choice deferred to planning, as long as FR-007 and multi-tenant scoping hold.
- Landing/marketing asset optimization is limited to sizing and delivery of existing creative; new marketing content is out of scope.
- Updating the project feature registry and verifying a successful production build are mandatory exit criteria for each PERF ID in this feature set.
