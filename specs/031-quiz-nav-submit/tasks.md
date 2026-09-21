---
description: "Task list for UI-017 Quiz Navigation and Safe Submit"
---

# Tasks: Quiz Navigation and Safe Submit (UI-017)

**Input**: Design documents from `/specs/031-quiz-nav-submit/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — plan requires Vitest `[UI-017]` for `isQuizComplete` / `stepNavState` / `remainingUnanswered`, Playwright in `e2e/ui-017-quiz-nav-submit.spec.ts`, and regression `[QUIZ-001]` / `[QUIZ-004]` / `[UI-016]`.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US4)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js app: `src/`, `tests/`, `e2e/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Spekit + registry scaffolding for UI-017

- [x] T001 [P] Add Spekit keys `quizStepPrev`, `quizStepNext`, `quizSubmitConfirm` to `SPEKIT` in `src/lib/spekit-targets.ts` (keep `quizSubmitButton`, `quizJumpSheet`, `quizPlayerHeader`, `questionCard`)
- [x] T002 [P] Mirror those selectors under a UI-017 section in `.speckit/spekit-targets.yaml` (bump `meta.total_targets`)
- [x] T003 [P] Add draft `UI-017` entry (status `partial`) in `.speckit/spec.yaml` linking `specs/031-quiz-nav-submit/`, route `/quiz/[id]`, and extends `UI-016` `QUIZ-001` `QUIZ-004`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure completeness and step-nav helpers — MUST land before story UI

**⚠️ CRITICAL**: No user-story UI until this phase is complete

- [x] T004 Add failing `[UI-017]` tests for `isQuizComplete` (empty quiz, extra answer keys must not complete, trim-empty fails), `remainingUnanswered`, and `stepNavState` (first/last/single) in `tests/features/ui-017-quiz-nav-submit.test.ts` per `specs/031-quiz-nav-submit/contracts/client-state.md`
- [x] T005 Implement `isQuizComplete`, `remainingUnanswered`, and `stepNavState` in `src/lib/quiz-player.ts` until T004 passes

**Checkpoint**: Foundation ready — helpers are unit-tested; stories can compose UI

---

## Phase 3: User Story 1 — Step through questions with واضح السابق / التالي (Priority: P1) 🎯 MVP

**Goal**: Prominent RTL step pair under the card: «التالي» on start (right) goes forward; «السابق» on end (left) goes back; disabled on first/last.

**Independent Test**: 3+ question quiz on a phone — Q1 السابق disabled; التالي → Q2; last question التالي disabled; pager jump updates enabled state.

### Implementation for User Story 1

- [x] T006 [P] [US1] Create `QuestionStepNav` (`dir="rtl"`, DOM order التالي then counter then السابق, `min-h-11`, Spekit `quiz-step-next` / `quiz-step-prev`) in `src/components/quiz/QuestionStepNav.tsx` per `specs/031-quiz-nav-submit/contracts/ui-components.md`
- [x] T007 [US1] Replace the inline prev/next row in `src/components/quiz/QuizRunner.tsx` with `QuestionStepNav` using `stepNavState` + `goToQuestion(activeIndex ± 1)`; hide the pair when `questions.length === 0`

**Checkpoint**: MVP — students can walk the exam with truthful RTL Next/Previous

---

## Phase 4: User Story 2 — Submit only when complete, then confirm (Priority: P1)

**Goal**: Submit stays visible but disabled until every question is answered; tap opens Arabic confirm; cancel does not grade; expiry auto-submit skips the dialog.

**Independent Test**: One blank → submit disabled + hint; all answered → tap submit → cancel stays; confirm grades; timed `00:00` does not show this dialog.

### Implementation for User Story 2

- [x] T008 [P] [US2] Create `QuizSubmitDialog` (`AlertDialog`, copy «هل أنت متأكد من تسليم الإجابات؟» / «لا يمكنك التراجع بعد التأكيد.», إلغاء / تأكيد التسليم, Spekit `quiz-submit-confirm`) in `src/components/quiz/QuizSubmitDialog.tsx` matching `src/components/quiz/QuizExitDialog.tsx`
- [x] T009 [US2] In `src/components/quiz/QuizRunner.tsx`, disable `quiz-submit-button` until `isQuizComplete`; show remaining hint via `remainingUnanswered`; `handleSubmit` only opens the dialog; confirm calls `submitAttempt({ forceTimedExpiry: false })`; close the dialog on expiry/`timeLocked` without using it for auto-submit

**Checkpoint**: Accidental submit is blocked; QUIZ-004 auto-submit still fires immediately

---

## Phase 5: User Story 3 — Centered, balanced player (Priority: P2)

**Goal**: Centered «السؤال N» badge; header timer visually centered with equal side columns; sticky chrome does not cover Previous/Next.

**Independent Test**: ~390px width — badge centered, timer balanced, US1–US2 still work.

### Implementation for User Story 3

- [x] T010 [P] [US3] Center the badge header row (`justify-center`) on `src/components/quiz/QuestionCard.tsx`; keep stem/choices `text-start`
- [x] T011 [US3] Restyle `src/components/quiz/QuizPlayerHeader.tsx` as `grid-cols-[2.75rem_1fr_2.75rem]` with exit in the start cell, timer centered, matching empty end cell

**Checkpoint**: Chrome looks symmetrical; exam rules unchanged

---

## Phase 6: User Story 4 — Keep jumping via كل الأسئلة (Priority: P2)

**Goal**: «كل الأسئلة» overview remains reachable beside the pager while step nav and gated submit exist.

**Independent Test**: Mid-quiz open «كل الأسئلة», tap a number, land there; Previous/Next match the new index.

### Implementation for User Story 4

- [x] T012 [US4] Confirm the «كل الأسئلة» control + `QuestionJumpSheet` remain mounted in `src/components/quiz/QuizRunner.tsx` (copy «كل الأسئلة», Spekit `quiz-jump-sheet`) and still dismiss on jump

**Checkpoint**: Jump overview is not removed by US1–US3

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Registry, e2e, regressions, quickstart gates

- [x] T013 Mark `UI-017` `implemented` with acceptance + file list in `.speckit/spec.yaml`
- [x] T014 [P] Add Playwright Pixel-7 coverage: Q1 السابق disabled, التالي advances, submit disabled with a blank, confirm dialog copy, cancel stays on `/quiz/` in `e2e/ui-017-quiz-nav-submit.spec.ts` (dismiss A2HS first; start via «ابدأ الاختبار الآن»)
- [x] T015 [P] Confirm `[UI-016]`, `[QUIZ-001]`, and `[QUIZ-004]` still pass via `npm run test:unit -- tests/features/ui-016-quiz-player.test.ts tests/features/quiz-001-gatekeeper.test.ts tests/features/quiz-004-countdown-timer.test.ts`
- [x] T016 Run `npm run lint`, `npm run typecheck`, `npm run test:unit -- tests/features/ui-017-quiz-nav-submit.test.ts`, and `npm run test:e2e -- e2e/ui-017-quiz-nav-submit.spec.ts` using `specs/031-quiz-nav-submit/quickstart.md`
- [x] T017 Walk the quickstart matrix (step nav, gated submit + confirm, centered chrome, كل الأسئلة, empty/offline/expiry) in `specs/031-quiz-nav-submit/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (P1)**: After Phase 2 — MVP
- **US2 (P1)**: After Phase 2 — shares `QuizRunner.tsx` with US1 (sequential if one agent)
- **US3 (P2)**: After Phase 2 — `QuestionCard.tsx` / `QuizPlayerHeader.tsx` independent of US2
- **US4 (P2)**: After US1/US2 runner edits so the jump button is not accidentally dropped
- **Polish**: After desired stories

### User Story Dependencies

- **US1**: Independent after foundation (`QuestionStepNav.tsx` then runner)
- **US2**: Independent dialog file; runner wiring after T007 if one agent
- **US3**: Independent files from US1/US2 except shared visual QA
- **US4**: Verify-only on `QuizRunner.tsx` after US1–US2

### Parallel Opportunities

- T001, T002, T003 in Setup
- T006 (step nav) in parallel with T008 (submit dialog)
- T010 (card badge) in parallel with US2 dialog
- T014 and T015 in Polish

---

## Parallel Example: User Story 1 + 2 files

```bash
# After Phase 2:
Task: "Create QuestionStepNav in src/components/quiz/QuestionStepNav.tsx"
Task: "Create QuizSubmitDialog in src/components/quiz/QuizSubmitDialog.tsx"
# Then sequential on QuizRunner.tsx:
Task: "Wire step nav"
Task: "Gate submit + confirm + expiry dismiss"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: RTL التالي/السابق
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → helpers green
2. US1 → step nav (MVP)
3. US2 → gated submit + confirm
4. US3 → centered chrome
5. US4 → jump sheet still there
6. Polish → registry + e2e

### Parallel Team Strategy

Do not edit `QuizRunner.tsx` in parallel. A: step nav + runner. B: `QuizSubmitDialog.tsx` then merge into runner. C: `QuestionCard.tsx` + `QuizPlayerHeader.tsx`.

---

## Notes

- [P] tasks = different files, no incomplete dependencies
- [Story] label maps to spec user stories US1–US4
- No new SQL, packages, or quiz routes
- Do not break QUIZ-001, QUIZ-004 auto-submit, or UI-016 exit-save
- Commit only if the user asks
