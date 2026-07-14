---
description: "Task list for DASH-001 student dashboard mobile density refactor"
---

# Tasks: DASH-001 Student Dashboard Mobile Density

**Input**: Design documents from `specs/002-student-dashboard-density/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`  
**Tests**: Included per plan Phase 2 outline (Vitest + Playwright) — run after implementation, not TDD-first.

**Status**: ✅ Completed 2026-07-14

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm design artifacts and environment before implementation

- [x] T001 Review acceptance criteria in `specs/002-student-dashboard-density/spec.md` and contracts in `specs/002-student-dashboard-density/contracts/`
- [x] T002 [P] Confirm dev server and demo student login work per `.speckit/spec.yaml` → `demo_accounts`
- [x] T003 [P] Read implementation map and file layout in `specs/002-student-dashboard-density/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, UI primitive, server bundle query — blocks all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add `DashboardStats`, `RecentScoreRow`, `QuizCarouselItem`, and `StudentDashboardData` types in `src/types/database.ts` per `specs/002-student-dashboard-density/data-model.md`
- [x] T005 [P] Create Shadcn-compatible Base UI tabs primitive in `src/components/ui/tabs.tsx`
- [x] T006 [P] Add pure helper `computeDashboardStats(scores: number[])` in `src/lib/dashboard-stats.ts` (count + rounded mean; 0 when empty)
- [x] T007 Implement `getStudentDashboardData()` in `src/actions/quiz.ts` — teacher-scoped stats, recent 5 scores, quizzes with `questionCount` + `hasSubmission`, reuse `getWeakPoints()` and `getStudentTeachers()` data
- [x] T008 [P] Add draft `DASH-001` feature entry (status: planned) with routes and acceptance in `.speckit/spec.yaml`

**Checkpoint**: Foundation ready — bundled dashboard data loads server-side; types and tabs primitive exist

---

## Phase 3: User Story 1 — See key stats at a glance (Priority: P1) 🎯 MVP

**Goal**: Horizontal Quick Stats row (tier, completed count, average score) visible without scrolling on mobile.

**Independent Test**: Open `/dashboard` at 390×844 — three mini-stat cards in one row; 0 completed shows 0% average; completed submissions show correct rounded mean.

### Implementation for User Story 1

- [x] T009 [P] [US1] Create `DashboardStatsRow` mini-card row component in `src/components/dashboard/DashboardStatsRow.tsx`
- [x] T010 [US1] Refactor `src/app/dashboard/page.tsx` to call `getStudentDashboardData()` and render `DashboardStatsRow` with mobile one-line welcome (`subtitle` hidden below `md:`)

**Checkpoint**: US1 complete — stats row renders with live data for current teacher

---

## Phase 4: User Story 2 — Browse and start quizzes via carousel (Priority: P1)

**Goal**: Horizontally scrollable quiz carousel with compact cards, Start/Continue, and inline locked Pro cards.

**Independent Test**: Multiple quizzes scroll horizontally; each card shows title, question count, and action; locked cards show upgrade CTA; Start navigates to `/quiz/[id]`.

### Implementation for User Story 2

- [x] T011 [P] [US2] Create accessible + locked variants in `src/components/dashboard/QuizCarouselCard.tsx` (reuse `requestProUpgrade()` for locked CTA; Spekit `proUpgradeCard`)
- [x] T012 [US2] Create horizontal snap-scroll `QuizCarousel` in `src/components/dashboard/QuizCarousel.tsx` (`overflow-x-auto flex snap-x gap-3 scrollbar-none`; empty state)
- [x] T013 [US2] Replace vertical quiz list and `ProUpgradeCard` stack with `QuizCarousel` in `src/app/dashboard/page.tsx`

**Checkpoint**: US2 complete — carousel is primary quiz access path; no vertical quiz cards remain

---

## Phase 5: User Story 3 — Access scores, weak points, and teachers via tabs (Priority: P1)

**Goal**: Bottom Shadcn tabs for نتائجي / نقاط الضعف / أساتذتي; teacher switcher only in Teachers tab.

**Independent Test**: Three tabs switch content without navigation; My Scores shows ≤5 rows; Weak Points shows compact list (no rings); teacher switch refreshes dashboard data.

### Implementation for User Story 3

- [x] T014 [P] [US3] Create compact score list in `src/components/dashboard/MyScoresTab.tsx` (max 5 rows, empty state)
- [x] T015 [P] [US3] Create compact category rows in `src/components/dashboard/WeakPointsTab.tsx` (weak/strong badges; no rings or recommendations; Spekit `weakPointsCard`)
- [x] T016 [P] [US3] Create `TeachersTab` wrapping existing `TeacherSwitcher` in `src/components/dashboard/TeachersTab.tsx`
- [x] T017 [US3] Create client `DashboardTabs` shell in `src/components/dashboard/DashboardTabs.tsx` wiring three tab panels
- [x] T018 [US3] Remove top-of-page `TeacherSwitcher` and root `WeakPointsCard` from `src/app/dashboard/page.tsx`; mount `DashboardTabs` below carousel

**Checkpoint**: US3 complete — full tabbed dashboard layout; no duplicate teacher switcher

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tests, registry sync, and quality gates

- [x] T019 [P] Add Vitest tests for `computeDashboardStats` and teacher-scoped score filtering in `tests/features/dash-001-dashboard-density.test.ts`
- [x] T020 [P] Add Playwright mobile viewport smoke test (stats + carousel + tabs above fold) in `e2e/student-dashboard.spec.ts`
- [x] T021 Update `DASH-001` status to implemented with file paths in `.speckit/spec.yaml`
- [x] T022 Run manual verification steps in `specs/002-student-dashboard-density/quickstart.md`
- [x] T023 Run `npm run lint && npm run typecheck && npm run test`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational — **MVP deliverable**
- **User Story 2 (Phase 4)**: Depends on Phase 3 (page already uses bundled data fetch)
- **User Story 3 (Phase 5)**: Depends on Phase 4 (carousel section in place before tabs below)
- **Polish (Phase 6)**: Depends on Phases 3–5 complete

### User Story Dependencies

- **User Story 1 (P1)**: Stats row — independent after Foundational
- **User Story 2 (P1)**: Carousel — builds on page refactor from US1
- **User Story 3 (P1)**: Tabs — builds on US1+US2 page structure; tab panel components (T014–T016) can be built in parallel before T017–T018 integration

### Within Each User Story

- Components in separate files marked [P] before page integration tasks
- Page integration tasks (T010, T013, T018) are sequential — same file `src/app/dashboard/page.tsx`

### Parallel Opportunities

- **Phase 1**: T002 ∥ T003
- **Phase 2**: T005 ∥ T006 ∥ T008 (after T004 types)
- **Phase 3**: T009 parallel with nothing else (T010 depends on T009)
- **Phase 4**: T011 before T012; T012 before T013
- **Phase 5**: T014 ∥ T015 ∥ T016 → then T017 → T018
- **Phase 6**: T019 ∥ T020

---

## Parallel Example: User Story 3

```bash
# Build all tab panels concurrently (different files):
Task T014: "Create MyScoresTab in src/components/dashboard/MyScoresTab.tsx"
Task T015: "Create WeakPointsTab in src/components/dashboard/WeakPointsTab.tsx"
Task T016: "Create TeachersTab in src/components/dashboard/TeachersTab.tsx"

# Then integrate:
Task T017: "Create DashboardTabs in src/components/dashboard/DashboardTabs.tsx"
Task T018: "Mount DashboardTabs in src/app/dashboard/page.tsx"
```

---

## Parallel Example: Foundational

```bash
# After T004 types land:
Task T005: "Create tabs.tsx in src/components/ui/tabs.tsx"
Task T006: "Add computeDashboardStats in src/lib/dashboard-stats.ts"
Task T008: "Add DASH-001 draft in .speckit/spec.yaml"

# Then server bundle (depends on T006):
Task T007: "Implement getStudentDashboardData in src/actions/quiz.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (stats row + welcome)
4. **STOP and VALIDATE**: Stats accurate for current teacher on mobile viewport
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → data layer ready
2. Add US1 → stats visible above fold
3. Add US2 → carousel replaces vertical quiz list
4. Add US3 → tabs consolidate secondary content
5. Polish → tests + registry + quality gates

### Parallel Team Strategy

With multiple developers after Foundational:

- Developer A: US1 (T009–T010)
- Developer B: US2 components (T011–T012) while A finishes page hook
- Developer C: US3 tab panels (T014–T016) while B finishes carousel

---

## Task Summary

| Phase | Tasks | Story |
|-------|-------|-------|
| Setup | T001–T003 (3) | — |
| Foundational | T004–T008 (5) | — |
| US1 Stats | T009–T010 (2) | US1 |
| US2 Carousel | T011–T013 (3) | US2 |
| US3 Tabs | T014–T018 (5) | US3 |
| Polish | T019–T023 (5) | — |
| **Total** | **23** | |

**MVP scope**: Phases 1–3 (10 tasks) — Quick Stats row on refactored dashboard fetch.

**Independent test criteria**:

| Story | Verify |
|-------|--------|
| US1 | 390×844: tier + count + average visible; average = rounded mean of submissions |
| US2 | Horizontal carousel; Start/Continue; inline locked upgrade cards |
| US3 | Three tabs; no top teacher switcher; compact weak points; teacher switch works |

---

## Notes

- `[P]` = different files, safe to parallelize
- All user stories are P1; page.tsx integration must stay sequential across US1→US2→US3
- Reuse existing `TeacherSwitcher`, `requestProUpgrade`, `getWeakPoints` — do not duplicate business logic
- Preserve existing Spekit targets where elements relocate (`studentDashboard`, `studentQuizList`, `weakPointsCard`, `teacherSwitcher`, `proUpgradeCard`)
