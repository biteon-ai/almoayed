---
description: "Task list for QUIZ-006 Quiz Retake Reset & Shuffle"
---

# Tasks: Quiz Retake Reset & Shuffle (QUIZ-006)

**Input**: Design documents from `/specs/032-quiz-retake-shuffle/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — plan requires Vitest `[QUIZ-006]` in `tests/features/quiz-006-retake-shuffle.test.ts`, Playwright in `e2e/quiz-006-retake-shuffle.spec.ts`, and regression `[QUIZ-001]` / `[QUIZ-004]` / `[QUIZ-005]`.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US4)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js app: `src/`, `tests/`, `e2e/`, `supabase/migrations/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Spekit + registry scaffolding for QUIZ-006

- [x] T001 [P] Add Spekit key `quizRetakeCta: "quiz-retake-cta"` to `SPEKIT` in `src/lib/spekit-targets.ts`
- [x] T002 [P] Mirror `quiz-retake-cta` under the QUIZ-001/QUIZ-006 quiz section in `.speckit/spekit-targets.yaml` and bump `meta.total_targets`
- [x] T003 [P] Add draft `QUIZ-006` entry (status `partial`) in `.speckit/spec.yaml` linking `specs/032-quiz-retake-shuffle/`, routes `/quiz/[id]` and `/results`, files from `plan.md`, and extends `QUIZ-001` `QUIZ-004` `QUIZ-005` `UI-016` `UI-017` `OFFLINE-001`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types, migration, and pure shuffle/draft helpers — MUST land before story wiring

**⚠️ CRITICAL**: No user-story UI or Server Action wiring until this phase is complete

- [x] T004 [P] Add `AttemptPresentation`, `exam_submissions.question_order` / `option_orders` on `ExamSubmission`, and `options: string[]` on each `QuizSubmitResult.answers` row in `src/types/database.ts` per `specs/032-quiz-retake-shuffle/data-model.md`
- [x] T005 [P] Add optional `usedAttemptsAtStart?: number` to `InProgressRecord` in `src/lib/offline/types.ts`
- [x] T006 Create `supabase/migrations/021_quiz_attempt_presentation.sql`: table `quiz_attempt_presentations` (`student_id`, `quiz_id` PK, `question_ids uuid[]`, `option_orders jsonb`, `created_at`) plus nullable `exam_submissions.question_order uuid[]` and `option_orders jsonb`; RLS aligned with other student tables (admin-client writes)
- [x] T007 Add failing `[QUIZ-006]` tests in `tests/features/quiz-006-retake-shuffle.test.ts` for `fisherYates` / `shuffleDistinctFrom` / `buildAttemptPresentation` / `isPermutation` / `applyPresentation` / `isStaleInProgressDraft` per `specs/032-quiz-retake-shuffle/contracts/shuffle.md` and `contracts/client-state.md` (stub `rng`; assert FR-008 swap when collision; FR-010 complete permutation; stale draft when stamp missing or mismatched; pending skips stale)
- [x] T008 [P] Implement `fisherYates`, `shuffleDistinctFrom`, `buildAttemptPresentation`, and `createCryptoRng` in `src/lib/quiz-shuffle.ts` until the shuffle cases in T007 pass
- [x] T009 [P] Implement `isStaleInProgressDraft` in `src/lib/quiz-player.ts` until the draft cases in T007 pass
- [x] T010 [P] Implement `isPermutation`, `applyPresentation`, and `presentationsEqual` in `src/lib/quiz-presentation.ts` until the apply/validate cases in T007 pass (no `correct_answer` in types)

**Checkpoint**: Foundation ready — helpers are unit-tested; stories can persist layouts and wipe drafts

---

## Phase 3: User Story 1 — Start a completely blank new attempt (Priority: P1) 🎯 MVP

**Goal**: «إعادة المحاولة» opens a new attempt with no leftover answers, empty progress, index 0, and a full timer when timed. Pending-sync queues are not deleted. Exhausted attempts stay review-only.

**Independent Test**: Submit a multi-question timed quiz, tap «إعادة المحاولة», confirm zero selections, `0 من N` progress, and a full countdown.

### Implementation for User Story 1

- [x] T011 [US1] Extend `saveInProgress` / `saveInProgressDebounced` in `src/lib/offline/in-progress.ts` to persist `usedAttemptsAtStart` with answers and `activeIndex`
- [x] T012 [US1] Pass `attemptState` (at least `usedAttempts`) from `src/components/quiz/QuizRunnerContainer.tsx` into `QuizRunner`
- [x] T013 [US1] In `src/components/quiz/QuizRunner.tsx`, run restore only after `draftReady` gating: pending → existing pending-sync path; else if `isStaleInProgressDraft` → `clearInProgress` and `answers={}` / `activeIndex=0`; else restore draft; stamp new blank starts with `usedAttempts`; call `clearInProgress` after successful online `submitQuiz`
- [x] T014 [P] [US1] Add `data-spekit={SPEKIT.quizRetakeCta}` to «إعادة المحاولة» in `src/components/student/StudentResultsView.tsx` only when retake is allowed (`/quiz/{id}` without `?review=`)
- [x] T015 [P] [US1] Add `data-spekit={SPEKIT.quizRetakeCta}` to «إعادة الاختبار» in `src/components/student/StudentQuizGridCard.tsx` when `canRetake`
- [x] T016 [P] [US1] Add `data-spekit={SPEKIT.quizRetakeCta}` to the retake CTA in `src/components/dashboard/QuizCarouselCard.tsx` when `canRetake`

**Checkpoint**: MVP — retake no longer resurrects the previous attempt’s answers from IndexedDB

---

## Phase 4: User Story 2 — Questions and choices appear in a new order (Priority: P1)

**Goal**: Each new taking session presents a shuffled question list and shuffled MCQ options with positional A/B/C/D. A retake differs from the immediately previous attempt when another order exists. Scoring still uses option text. Gatekeeper exam fields only.

**Independent Test**: Four+ MCQs with four options — note attempt-1 order, submit, retake, confirm both question sequence and per-question option texts under A–D differ; a known-correct option text still scores correct.

### Implementation for User Story 2

- [x] T017 [US2] Add load / upsert / delete helpers for `quiz_attempt_presentations` in `src/lib/quiz-presentation.ts` (admin client usage from Server Actions only; validate live bank with `isPermutation`)
- [x] T018 [US2] In `getQuizForStudent` inside `src/actions/quiz.ts`, on the taking path (`canStartNewAttempt` and not review-only): reuse a matching live presentation or `buildAttemptPresentation` against the latest submission snapshot (authored order if snapshot NULL); return `applyPresentation` questions; never attach forbidden gatekeeper fields
- [x] T019 [US2] In `submitQuiz` inside `src/actions/quiz.ts`, reject a live presentation that is no longer a permutation of the live bank (`QUIZ_CHANGED`); keep grading via `resolveCorrectOptionText` on **authored** options; DELETE the live presentation row on success so the next taking mints a new shuffle
- [x] T020 [US2] Extend `[QUIZ-006]` cases in `tests/features/quiz-006-retake-shuffle.test.ts` for complete permutations (FR-010), distinct-from-previous question and option orders (FR-008), and “letters are display index / identity is option text” (FR-006/FR-007)

**Checkpoint**: New attempts are shuffled; submit still grades meaning, not letter; next open cannot reuse the deleted live row

---

## Phase 5: User Story 3 — Order stays stable for the life of one attempt (Priority: P2)

**Goal**: Leave/return/refresh of the same in-progress attempt keeps the same question/option order and the answers already chosen. A later new attempt after submit gets a new shuffle and US1 blank state.

**Independent Test**: Start an attempt, answer two questions, exit, reopen without submitting — same order and same two answers.

### Implementation for User Story 3

- [x] T021 [US3] In `getQuizForStudent` inside `src/actions/quiz.ts`, reuse the live presentation when question IDs and option-text sets still match; if the published bank diverged, delete the live row, mint a new presentation, and rely on US1 stale-draft wipe for leftover answers
- [x] T022 [US3] Extend `[QUIZ-006]` tests in `tests/features/quiz-006-retake-shuffle.test.ts` so `presentationsEqual` holds across reuse, `isStaleInProgressDraft` is false when `usedAttemptsAtStart === usedAttempts` and there is no pending submission, and a used-attempt mismatch is stale

**Checkpoint**: Resume is not a reshuffle; retake after submit still is

---

## Phase 6: User Story 4 — Past results stay intact and reviewable (Priority: P2)

**Goal**: Retake does not delete prior graded rows. Review of a completed attempt (`?review=`) shows that attempt’s presentation. Teacher editors stay in authored order. Gamification/attempt-limit rules unchanged.

**Independent Test**: Submit attempt 1, retake and submit attempt 2, reopen attempt 1 review — order matches attempt 1; teacher question list unchanged.

### Implementation for User Story 4

- [x] T023 [US4] On successful `submitQuiz` in `src/actions/quiz.ts`, copy the live presentation (or authored fallback) into `exam_submissions.question_order` and `option_orders`; return `QuizSubmitResult.answers` in presentation order with `options` arrays; do not update or delete prior submissions
- [x] T024 [US4] Extend `getSubmissionResults` in `src/actions/quiz.ts` to order answers by `question_order` when set and attach per-question `options` from `option_orders` (legacy NULL → authored `sort_order` / authored options)
- [x] T025 [US4] In `src/app/(student)/quiz/[id]/page.tsx`, for `?review=` / review-only: apply the submission snapshot to `questions` passed into the runner; do **not** upsert `quiz_attempt_presentations`; keep timer null
- [x] T026 [US4] Skip `saveQuizPackage` in `src/components/quiz/QuizRunnerContainer.tsx` when `initialResults` is set so review order does not overwrite an in-progress taking cache

**Checkpoint**: History and teacher source order survive retakes; QUIZ-001 solutions only on review/submit success

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Registry, e2e, regressions, quickstart gates

- [x] T027 Mark `QUIZ-006` `implemented` with acceptance + file list in `.speckit/spec.yaml`
- [x] T028 [P] Add Playwright coverage in `e2e/quiz-006-retake-shuffle.spec.ts`: retake CTA `quiz-retake-cta` opens a blank player (no pre-selected choice, progress `0`); after two taking loads of a 4+ question quiz, question stems or option-under-A texts are not identical for every item (smoke for shuffle); dismiss A2HS first
- [x] T029 [P] Confirm `[QUIZ-001]`, `[QUIZ-004]`, and `[QUIZ-005]` still pass via `npm run test:unit -- tests/features/quiz-001-gatekeeper.test.ts tests/features/quiz-004-countdown-timer.test.ts tests/features/quiz-005-attempt-limits.test.ts`
- [x] T030 Run `npm run lint`, `npm run typecheck`, `npm run test:unit -- tests/features/quiz-006-retake-shuffle.test.ts`, and `npm run build`
- [x] T031 Walk `specs/032-quiz-retake-shuffle/quickstart.md` (blank retake, shuffle, resume vs retake, history, pending/exhausted/profile-gate) including `npm run test:e2e -- e2e/quiz-006-retake-shuffle.spec.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (P1)**: After Phase 2 — MVP (IDB wipe + retake CTAs)
- **US2 (P1)**: After Phase 2 — shuffle mint; share `src/actions/quiz.ts` with later stories (one agent: after US1 or in parallel if not editing `QuizRunner.tsx`)
- **US3 (P2)**: After US2 taking path exists (reuse vs mint lives in `getQuizForStudent`)
- **US4 (P2)**: After US2 live-row lifecycle (copy on submit + review apply)
- **Polish**: After desired stories

### User Story Dependencies

- **US1**: Independent after foundation (`in-progress.ts` + runner). Does not need shuffle to demo a blank retake
- **US2**: Independent of US1 except both touch `QuizRunner.tsx` only if debugging hydration; primary files are `quiz.ts` / `quiz-presentation.ts`
- **US3**: Extends US2 reuse; tests can land once T018 exists
- **US4**: Extends US2 submit; `quiz/[id]/page.tsx` and container are independent of US1 CTA files

### Within Each User Story

- Fail T007 before implementing T008–T010
- Types/migration before Server Actions
- Helpers before `getQuizForStudent` / `submitQuiz`
- Taking mint/delete before review snapshot
- Story complete before moving to next priority when sharing `src/actions/quiz.ts`

### Parallel Opportunities

- T001, T002, T003 in Setup
- T004 and T005 in Foundational
- T008, T009, T010 after T007 (three different lib files)
- T014, T015, T016 retake Spekit hooks
- T028 and T029 in Polish
- Do **not** parallel-edit `src/actions/quiz.ts` (T018, T019, T021, T023, T024)

---

## Parallel Example: Foundation helpers

```bash
# After T007 failing tests:
Task: "Implement src/lib/quiz-shuffle.ts"
Task: "Implement isStaleInProgressDraft in src/lib/quiz-player.ts"
Task: "Implement applyPresentation in src/lib/quiz-presentation.ts"
```

## Parallel Example: US1 Spekit

```bash
Task: "Spekit retake CTA in src/components/student/StudentResultsView.tsx"
Task: "Spekit retake CTA in src/components/student/StudentQuizGridCard.tsx"
Task: "Spekit retake CTA in src/components/dashboard/QuizCarouselCard.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: retake is blank (no leftover answers)
5. Demo if ready — shuffle can follow immediately (P1)

### Incremental Delivery

1. Setup + Foundational → helpers green
2. US1 → blank retake (MVP)
3. US2 → shuffle + delete live row on submit
4. US3 → stable resume
5. US4 → review snapshot
6. Polish → registry + e2e + quickstart

### Parallel Team Strategy

Do not edit `src/actions/quiz.ts` or `src/components/quiz/QuizRunner.tsx` in parallel. A: US1 runner + IDB. B: shuffle lib + tests (Phase 2) then US2/US3/US4 actions after A finishes runner. C: Spekit CTAs (T014–T016) anytime after T001.

---

## Notes

- [P] tasks = different files, no incomplete dependencies
- [Story] label maps to spec user stories US1–US4
- Client must not supply the order of record on submit; server live row (or authored fallback) is copied
- Do not reorder teacher question editors
- Do not break QUIZ-001 gatekeeper, QUIZ-004 timer snapshot, QUIZ-005 caps, or OFFLINE-001 pending queue
- Commit only if the user asks
