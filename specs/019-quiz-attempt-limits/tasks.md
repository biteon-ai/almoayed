---
description: "Task list for Quiz Attempt Limits & Category (QUIZ-005)"
---

# Tasks: Quiz Attempt Limits & Category

**Input**: Design documents from `specs/019-quiz-attempt-limits/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Tests**: Included — plan/quickstart call for Vitest `tests/features/quiz-005-attempt-limits.test.ts` (helpers + attempt-state contracts)

**Organization**: US1 (teacher config) → US2 (student enforcement) → US3 (challenge leaderboard). Shared foundation: migration `014_quiz_attempt_limits.sql` + types/selects + `quiz-attempts` helpers.

**Feature ID**: `QUIZ-005` (extends `TEACH-003` · `QUIZ-001` · `QUIZ-004` · `GAMIF-001`) — implemented

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US3 maps to spec user stories
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Spekit / registry stubs shared by teacher + student stories

- [x] T001 [P] Add Spekit ids `quiz-attempt-settings`, `quiz-attempt-badge`, and `challenge-leaderboard` to `src/lib/spekit-targets.ts` and `.speckit/spekit-targets.yaml`
- [x] T002 [P] Draft `QUIZ-005` stub entry (status planned/partial) in `.speckit/spec.yaml` with routes `/teacher/quizzes/new`, `/teacher/quizzes/[id]`, `/quiz/[id]` and planned file list per `plan.md`

**Checkpoint**: Spekit + registry stubs ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema + types + pure attempt helpers — MUST complete before story UI/actions

**⚠️ CRITICAL**: No attempt enforcement or teacher settings until migration + `Quiz` fields + helpers exist

- [x] T003 Create `supabase/migrations/014_quiz_attempt_limits.sql`: `CREATE TYPE assessment_category AS ENUM ('practice','evaluation','challenge')`; add `quizzes.assessment_category` + `quizzes.max_attempts` with CHECK (`0` or `1–10`); backfill existing rows to `evaluation` + `1`; `DROP CONSTRAINT exam_submissions_student_quiz_unique`; add index `idx_exam_submissions_student_quiz_submitted ON (student_id, quiz_id, submitted_at DESC)` per `data-model.md`
- [x] T004 [P] Extend `Quiz` with `assessment_category: AssessmentCategory` and `max_attempts: number` in `src/types/database.ts`; export `AssessmentCategory` type (`practice` | `evaluation` | `challenge`)
- [x] T005 [P] Append `assessment_category, max_attempts` to `QUIZ_LIST_SELECT` in `src/lib/perf-selects.ts`
- [x] T006 [P] Implement `src/lib/quiz-attempts.ts`: `validateMaxAttempts`, `categoryDefaultMaxAttempts`, `canStartNewAttempt`, `formatAttemptProgressAr`, and `buildAttemptState(used, max, submissions[])` helper per `contracts/server-actions.md`
- [x] T007 [P] Add `ErrorCode.QUIZ_ATTEMPTS_EXHAUSTED` with Arabic message in `src/lib/app-errors.ts`
- [x] T008 Apply migration with `npx supabase db push` and confirm columns/index/constraint changes exist

**Checkpoint**: Foundation ready — stories can persist and compute attempt state

---

## Phase 3: User Story 1 — Teacher sets quiz category and attempt limit (Priority: P1) 🎯 MVP

**Goal**: Teacher can set «نوع الاختبار» and «عدد المحاولات المسموحة» on create/edit with category defaults and validation.

**Independent Test**: Create/edit quiz → pick Practice → unlimited default → save → reopen persists; switch Evaluation → default 1; custom 3 on Practice; invalid `11` blocked.

### Tests for User Story 1

- [x] T009 [P] [US1] Scaffold `tests/features/quiz-005-attempt-limits.test.ts` covering `validateMaxAttempts`, `categoryDefaultMaxAttempts`, and `canStartNewAttempt` (pure helper tests)

### Implementation for User Story 1

- [x] T010 [US1] Extend `createQuiz` in `src/actions/teacher.ts` to read `assessment_category`, `max_attempts_unlimited`, and `max_attempts` from FormData; validate via `quiz-attempts` helpers; persist with `created_by` scope
- [x] T011 [US1] Extend quiz update path (`updateQuizFlags` or dedicated update action) in `src/actions/teacher.ts` for category + max attempts with same validation and teacher scope
- [x] T012 [P] [US1] Create `src/components/teacher/QuizAttemptSettings.tsx`: Arabic category radio/segment («تدريب / واجب» · «اختبار تقييمي / نصفي» · «تحدي / مسابقة»), unlimited toggle «غير محدود», conditional number input 1–10; Spekit `quiz-attempt-settings`
- [x] T013 [US1] Integrate `QuizAttemptSettings` into `src/components/teacher/QuizCreateForm.tsx` with category-change defaults and `attemptsCustomized` client flag per spec FR-003
- [x] T014 [US1] Wire attempt settings on quiz edit UI (`src/app/teacher/(portal)/quizzes/[id]/page.tsx` and related edit components such as `QuizManagement.tsx` / quiz metadata form) so existing quizzes can change category and attempts
- [x] T015 [US1] Ensure `src/components/teacher/QuizCreateWizard.tsx` FormData field names match server action expectations for category + attempts

**Checkpoint**: US1 complete — teacher can configure category and attempt limits

---

## Phase 4: User Story 2 — Student attempt limits enforced (Priority: P1)

**Goal**: Students can retake when allowed; blocked when exhausted; UI shows progress; server rejects over-limit submit; timed retakes get fresh sessions; gamification uses best score.

**Independent Test**: Evaluation 1-attempt → review only after submit; Practice 3-attempt → retake until exhausted; unlimited → always retake; direct URL cannot bypass server guard.

### Tests for User Story 2

- [x] T016 [P] [US2] Extend `tests/features/quiz-005-attempt-limits.test.ts` with `buildAttemptState` scenarios (exhausted, unlimited, N remaining) and leaderboard sort pure function stub (prep for US3)

### Implementation for User Story 2

- [x] T017 [US2] Refactor submission fetch in `getQuizForStudent` in `src/actions/quiz.ts`: load all submissions for pair; return `attemptState` per contract; set `existingSubmissionId` only when `!canStartNewAttempt` (review path)
- [x] T018 [US2] Update `submitQuiz` in `src/actions/quiz.ts`: remove early-return on any existing submission; guard with `QUIZ_ATTEMPTS_EXHAUSTED`; always INSERT new row; delete `quiz_timed_sessions` after submit when retakes remain
- [x] T019 [US2] Extend `ensureTimedQuizSession` in `src/actions/quiz.ts`: respect `canStartNewAttempt`; delete prior timed session when starting new attempt after prior submit; keep QUIZ-004 in-flight session reuse
- [x] T020 [US2] Update `src/app/(student)/quiz/[id]/page.tsx` to pass `attemptState` into `QuizRunnerContainer`; load `initialResults` only when review-only (`!canStartNewAttempt`)
- [x] T021 [US2] Extend `QuizRunnerContainer` / `QuizRunner` in `src/components/quiz/QuizRunnerContainer.tsx` and `src/components/quiz/QuizRunner.tsx` for fresh-attempt vs review-only modes and optional attempt progress banner
- [x] T022 [US2] Extend `QuizCarouselItem` in `src/types/database.ts` with `usedAttempts`, `maxAttempts`, `canRetake`, `bestScore` (keep `lastScore` as best for display)
- [x] T023 [US2] Update student quiz list builder in `src/actions/quiz.ts` (`getStudentDashboardData` / list paths): aggregate multiple submissions per quiz (count, best score, latest); include `max_attempts` from quiz row
- [x] T024 [P] [US2] Update `src/components/student/StudentQuizGridCard.tsx`: «إعادة الاختبار» when `canRetake`; «مراجعة النتيجة» when exhausted; show `formatAttemptProgressAr` when finite max
- [x] T025 [P] [US2] Update `src/components/dashboard/QuizCarouselCard.tsx` and `src/lib/student-quiz-ui.ts` with same retake/review CTA rules and attempt progress
- [x] T026 [US2] Update `src/lib/student-profile.ts` `shouldBlockNewQuiz` to treat exhausted single-attempt quiz as having submission (profile gate unchanged for retake-allowed quizzes)
- [x] T027 [US2] Handle `QUIZ_ATTEMPTS_EXHAUSTED` in `src/lib/offline/sync-processor.ts` with Arabic user-visible failure (no silent drop)
- [x] T028 [US2] Verify `aggregateSubmissionStats` in `src/lib/teacher-gamification.ts` still correct with multiple rows per quiz; add regression test in `tests/features/quiz-005-attempt-limits.test.ts` if not covered

**Checkpoint**: US2 complete — attempt limits enforced end-to-end

---

## Phase 5: User Story 3 — Challenge leaderboard (Priority: P2)

**Goal**: Challenge-category quizzes show teacher-scoped ranked leaderboard (best score per student, tie-break by submit time).

**Independent Test**: Publish challenge quiz; two students submit different scores; both see correct rank order; non-challenge quiz shows no leaderboard.

### Tests for User Story 3

- [x] T029 [P] [US3] Add pure rank/sort tests for challenge leaderboard aggregation in `tests/features/quiz-005-attempt-limits.test.ts`

### Implementation for User Story 3

- [x] T030 [US3] Implement `getChallengeLeaderboard(quizId)` in `src/actions/quiz.ts` per `contracts/server-actions.md` (access gates, best score per student, MT-002 scope, display name only)
- [x] T031 [P] [US3] Create `src/components/quiz/ChallengeLeaderboard.tsx` with Arabic empty state, ranked rows, viewer highlight; Spekit `challenge-leaderboard`
- [x] T032 [US3] Render `ChallengeLeaderboard` on `src/app/(student)/quiz/[id]/page.tsx` (or runner container) when `quiz.assessment_category === 'challenge'`
- [x] T033 [US3] Optionally show compact leaderboard link/badge on `StudentQuizGridCard` / `QuizCarouselCard` for challenge quizzes only

**Checkpoint**: US3 complete — challenge leaderboard visible and scoped

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Registry completion, factory helpers, build verification

- [x] T034 [P] Update `tests/helpers/quiz-factory.ts` with `assessment_category` and `max_attempts` defaults for test fixtures
- [x] T035 [P] Mark `QUIZ-005` implemented/partial with acceptance criteria in `.speckit/spec.yaml`
- [x] T036 Run `npx vitest run tests/features/quiz-005-attempt-limits.test.ts` and fix failures
- [x] T037 Run `npm run build` and resolve type/lint errors from multi-submission refactor
- [x] T038 Manual QA walkthrough per `specs/019-quiz-attempt-limits/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — teacher MVP
- **US2 (Phase 4)**: Depends on Phase 2 — can start after T003–T007; integrates US1 fields but testable with seeded DB values
- **US3 (Phase 5)**: Depends on Phase 2 + US2 submission multi-row model (T017–T018)
- **Polish (Phase 6)**: Depends on desired story completion

### User Story Dependencies

| Story | Depends on | Independent test |
|-------|------------|------------------|
| US1 | Phase 2 | Teacher create/edit saves category + attempts |
| US2 | Phase 2 (+ US1 for full teacher flow) | Student retake/review/block server-side |
| US3 | US2 multi-submission queries | Challenge leaderboard ranks |

### Parallel Opportunities

- **Phase 1**: T001 ∥ T002
- **Phase 2**: T004 ∥ T005 ∥ T006 ∥ T007 (after T003 drafted)
- **US1**: T009 ∥ T012; T013 after T012
- **US2**: T024 ∥ T025; T016 after T006
- **US3**: T029 ∥ T031; T030 before T032
- **Polish**: T034 ∥ T035

---

## Parallel Example: User Story 1

```bash
# After Phase 2 completes, launch in parallel:
# T009 — tests/features/quiz-005-attempt-limits.test.ts (helpers)
# T012 — src/components/teacher/QuizAttemptSettings.tsx (UI component)

# Then sequential:
# T010 → T011 (server actions)
# T013 → T014 → T015 (wire create + edit + wizard)
```

---

## Parallel Example: User Story 2

```bash
# Core server path (sequential):
# T017 → T018 → T019 (src/actions/quiz.ts)

# UI updates in parallel after T022 types land:
# T024 — StudentQuizGridCard.tsx
# T025 — QuizCarouselCard.tsx + student-quiz-ui.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 + US2 core)

1. Complete Phase 1 + Phase 2
2. Complete US1 — teacher can configure attempts
3. Complete US2 server enforcement (T017–T019) + minimal student page (T020–T021) + one card (T024)
4. **STOP and VALIDATE** — evaluation 1-attempt + practice 3-attempt scenarios
5. Deploy/demo

### Incremental Delivery

1. Foundation → US1 → US2 (full student surfaces) → US3 leaderboard → Polish
2. US3 can ship after US2 without blocking MVP retake enforcement

### Suggested MVP Scope

- **In MVP**: Phase 1–2, US1, US2 (T009–T028 except optional T026 if profile gate already works)
- **Post-MVP**: US3 leaderboard (T029–T033), Polish (T034–T038)

---

## Notes

- Do **not** rename or overload existing `quiz_type` (`regular` / `session_group`); pedagogical category is `assessment_category` only
- Legacy quizzes migrate to `evaluation` + `max_attempts = 1` — preserves current single-submit behavior
- `max_attempts = 0` means unlimited everywhere (DB, helpers, UI)
- Best score on student cards aligns with GAMIF-001 `aggregateSubmissionStats`
