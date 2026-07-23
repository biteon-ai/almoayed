---
description: "Task list for Teacher-Driven Gamification & Ranking (GAMIF-001)"
---

# Tasks: Teacher-Driven Gamification & Ranking

**Input**: Design documents from `specs/011-teacher-gamification/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Tests**: Included per plan/quickstart Vitest suite — not strict TDD-first; pure-lib tests early, feature tests with stories.

**Organization**: US1 (teacher tier CRUD) → US2 (level progress card) → US3 (badge gallery) → US4 (teacher switcher) → US5 (results summary). US2–US5 share `getStudentGamificationStatus`; finish foundational compute + US1 before student UI.

**Feature IDs**: `GAMIF-001`, MT-002, QUIZ-001 (scores only), ENABLE-001 (Spekit), no Pro gate (TIER-001 unchanged)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US5 maps to spec user stories
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Types and Spekit IDs before schema/UI work

- [x] T001 [P] Add `GamificationIconType`, `GamificationTier`, and save-payload types in `src/types/database.ts` per `specs/011-teacher-gamification/data-model.md`
- [x] T002 [P] Register Spekit targets `gamifSettingsPage`, `gamifTierList`, `gamifTierAdd`, `gamifTierForm`, `gamifIconSelect`, `gamifTiersSave`, `gamifLevelCard`, `gamifBadgeGallery`, `gamifResultsSummary` in `src/lib/spekit-targets.ts` and `.speckit/spekit-targets.yaml` under `GAMIF-001`

**Checkpoint**: Types + Spekit IDs compile; no runtime behavior yet

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Migration, pure leveling math, Server Actions — MUST complete before ANY user story UI

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create `supabase/migrations/007_gamification_tiers.sql` for `gamification_tiers` (columns, CHECKs, `UNIQUE (teacher_id, level_number)`, index on `teacher_id`, RLS enabled) per `data-model.md`
- [x] T004 Implement pure helpers in `src/lib/teacher-gamification.ts`: `validateGamificationLadder`, Arabic icon labels, `computeTeacherGamificationStatus` (distinct quizzes, best/avg score, current/next tier, bottleneck `progressFill`, remaining quizzes/score, per-tier unlock flags) — do **not** modify `src/lib/student-gamification.ts`
- [x] T005 [P] Add Vitest coverage for ladder validation, bottleneck progress, current/next tier, and empty-tier null path in `tests/features/gamif-001-teacher-gamification.test.ts`
- [x] T006 Implement `getGamificationTiers` and `saveGamificationTiers` in `src/actions/gamification.ts` (`requireTeacher`, `createAdminClient`, max 20, effort ladder, replace-all ≤20 rows, Arabic `ActionResult` errors, `revalidatePath`) per `contracts/server-actions.md`
- [x] T007 Implement `getStudentGamificationStatus` in `src/actions/gamification.ts` (`requireStudent`, `currentTeacherId`, verify `student_teachers` active link, join `exam_submissions` ⋈ `quizzes.created_by`, return `null` when zero tiers) per contracts

**Checkpoint**: Foundation ready — DB + lib + actions usable; stories can proceed

---

## Phase 3: User Story 1 — Teacher configures level tiers and rewards (Priority: P1) 🎯 MVP

**Goal**: Teacher CRUD for ordered tiers (name, quiz mins, avg %, icon) with validation, max 20, MT-002 isolation, no Pro gate.

**Independent Test**: Open `/teacher/settings/gamification`, add/edit/reorder/save ≤20 levels; inverted ladder and 21st level blocked; Teacher B never sees Teacher A’s tiers; free teacher can save.

### Implementation for User Story 1

- [x] T008 [US1] Create RSC page `src/app/teacher/(portal)/settings/gamification/page.tsx` that `requireTeacher`s, loads `getGamificationTiers()`, and renders settings UI (`data-spekit` / `SPEKIT.gamifSettingsPage`)
- [x] T009 [P] [US1] Build `src/components/teacher/GamificationSettings.tsx` — RTL list, add/edit/remove/reorder, fields اسم المستوى / عدد الاختبارات / المعدل % / أيقونة select (كأس ألماس نجمة درع وسام), Spekit form/list/add/save hooks
- [x] T010 [US1] Wire save + client validation (max 20, ladder) to `saveGamificationTiers` in `GamificationSettings.tsx` with Arabic success/error feedback
- [x] T011 [US1] Add link «إعداد المستويات» from `src/app/teacher/(portal)/settings/page.tsx` (or shared Settings page) to `/teacher/settings/gamification`
- [x] T012 [P] [US1] Extend `tests/features/gamif-001-teacher-gamification.test.ts` for max-20 and effort-ladder rejection cases (pure + documented action expectations)

**Checkpoint**: US1 complete — teacher can configure tiers end-to-end

---

## Phase 4: User Story 2 — Student sees current level and progress (Priority: P1)

**Goal**: Dashboard Level Progress card with current level/icon, bottleneck bar, Arabic remaining copy; hidden when no tiers.

**Independent Test**: With known stats + tiers, `/dashboard` shows correct level and bottleneck progress; zero tiers → no card; unfinished quizzes do not count; retakes do not double-count.

### Implementation for User Story 2

- [x] T013 [P] [US2] Create `src/components/dashboard/LevelProgressCard.tsx` (level name + icon, progress bar, remaining/top-tier Arabic copy, `SPEKIT.gamifLevelCard`)
- [x] T014 [US2] Load `getStudentGamificationStatus()` in `src/app/(student)/dashboard/page.tsx` and pass status into `StudentDashboardView` (alongside existing streak gamification — do not replace streaks)
- [x] T015 [US2] Mount `LevelProgressCard` in `src/components/dashboard/StudentDashboardView.tsx` only when teacher status is non-null

**Checkpoint**: US2 complete — level progress visible on dashboard when tiers exist

---

## Phase 5: User Story 3 — Student browses unlocked vs locked rewards (Priority: P2)

**Goal**: Badge / hall-of-fame gallery of teacher reward icons with unlocked vs locked states.

**Independent Test**: Multiple tiers → gallery shows unlock state matching thresholds; unmet tiers stay locked.

### Implementation for User Story 3

- [x] T016 [P] [US3] Create `src/components/dashboard/BadgeGallery.tsx` rendering all tiers’ icons/names with unlocked/locked visuals (`SPEKIT.gamifBadgeGallery`)
- [x] T017 [US3] Mount `BadgeGallery` in `src/components/dashboard/StudentDashboardView.tsx` when status is non-null (near Level Progress card)

**Checkpoint**: US3 complete — gallery works with US2 status payload

---

## Phase 6: User Story 4 — Progress follows the active teacher (Priority: P2)

**Goal**: Level/progress/badges refresh to the selected teacher’s rules and quiz history only (MT-002).

**Independent Test**: Switch active teacher → UI updates to that teacher’s tiers/stats; teacher with zero tiers hides gamification (no leftover badges).

### Implementation for User Story 4

- [x] T018 [US4] Verify `getStudentGamificationStatus` uses only `session.currentTeacherId` and that teacher’s `quizzes.created_by` submissions; harden link check in `src/actions/gamification.ts` if gaps found
- [x] T019 [US4] Confirm teacher-switcher path revalidates/refreshes student dashboard so `LevelProgressCard` + `BadgeGallery` remount with new status (fix `revalidatePath` / `router.refresh` on existing switcher in `src/actions/student.ts` or dashboard consumers if needed)
- [x] T020 [P] [US4] Add Vitest cases documenting per-teacher isolation of compute inputs (tiers A vs B, submissions scoped by teacher) in `tests/features/gamif-001-teacher-gamification.test.ts`

**Checkpoint**: US4 complete — switcher shows correct teacher’s gamification only

---

## Phase 7: User Story 5 — Results page reflects the same status (Priority: P3)

**Goal**: Compact level/reward summary on `/results` consistent with dashboard; omit when no tiers.

**Independent Test**: With tiers, results summary matches dashboard level; without tiers, no gamification block.

### Implementation for User Story 5

- [x] T021 [US5] Load `getStudentGamificationStatus()` in `src/app/(student)/results/page.tsx` (or via `getStudentResultsPageData` extension in `src/actions/quiz.ts` if cleaner) and pass into `StudentResultsView`
- [x] T022 [US5] Render compact summary (reuse `LevelProgressCard` compact mode or slim row) in `src/components/student/StudentResultsView.tsx` with `SPEKIT.gamifResultsSummary`; hide when null

**Checkpoint**: US5 complete — results mirrors dashboard rules

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Registry, QA, build health

- [x] T023 [P] Register feature `GAMIF-001` in `.speckit/spec.yaml` (routes, files, acceptance summary per AGENTS/speckit conventions)
- [x] T024 [P] Align Spekit yaml descriptions with shipped UI copy in `.speckit/spekit-targets.yaml`
- [x] T025 Run manual path from `specs/011-teacher-gamification/quickstart.md` (teacher CRUD, isolation, student dashboard hide/show, results)
- [x] T026 Run `npx vitest run tests/features/gamif-001-teacher-gamification.test.ts` and `npm run build`; fix any failures

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: After Foundational — MVP teacher config
- **US2 (Phase 4)**: After Foundational (needs T007); benefits from US1 tiers in DB for manual QA
- **US3 (Phase 5)**: After US2 status plumbing (shares dashboard mount)
- **US4 (Phase 6)**: After US2/US3 UI exists to observe switcher
- **US5 (Phase 7)**: After T007; can parallel with US3/US4 if status API stable
- **Polish (Phase 8)**: After desired stories complete

### User Story Dependencies

| Story | Depends on | Notes |
|-------|------------|-------|
| US1 | Phase 2 | Standalone MVP |
| US2 | Phase 2 (T007) | Independent if seed tiers exist |
| US3 | US2 mount point | Same status object |
| US4 | US2 (+ US3 preferred) | Soft verify + refresh |
| US5 | T007 | Independent of gallery |

### Parallel Opportunities

- T001 ∥ T002 (Setup)
- T005 ∥ T006 after T004 (tests while actions start — or T005 right after T004)
- T008 page shell ∥ T009 component (then T010 wires them)
- T013 ∥ T016 once status type is stable
- T023 ∥ T024 in Polish

### Parallel Example: After Foundational

```bash
# Teacher MVP track:
Task: "T008 RSC gamification settings page"
Task: "T009 GamificationSettings component"   # then T010–T011

# Student track (needs tiers in DB for manual QA):
Task: "T013 LevelProgressCard"
Task: "T016 BadgeGallery"   # after T014–T015 props ready
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup  
2. Phase 2 Foundational  
3. Phase 3 US1  
4. **STOP** — validate teacher CRUD + isolation via quickstart §1–2  

### Incremental Delivery

1. Setup + Foundational → actions + math ready  
2. US1 → teacher MVP  
3. US2 → student level card  
4. US3 → gallery  
5. US4 → switcher hardening  
6. US5 → results summary  
7. Polish → `spec.yaml`, Spekit, Vitest, `npm run build`

### Suggested MVP scope

**US1 only** (teacher settings + persistence). Student display (US2+) is the next increment once tiers can be configured.

---

## Notes

- [P] = different files, no incomplete-task dependency
- Do not conflate with `src/lib/student-gamification.ts` streak UI
- Hide all student gamification UI when status is `null`
- Commit after each phase or logical group when asked
- Next command after tasks: `/speckit-implement`
