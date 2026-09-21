---
description: "Task list for UI-018 Quiz Header Polish"
---

# Tasks: Quiz Header Polish (UI-018)

**Input**: Design documents from `/specs/033-quiz-header-polish/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — plan requires Vitest `[UI-018]` for `remainingTimeFraction` in `tests/features/ui-018-quiz-header-polish.test.ts`, Playwright in `e2e/ui-018-quiz-header-polish.spec.ts`, and regression `[UI-017]` / `[UI-016]` / `[QUIZ-001]` / `[QUIZ-004]`.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US3)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js app: `src/`, `tests/`, `e2e/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Spekit + registry scaffolding for UI-018

- [x] T001 [P] Add Spekit keys `quizTimerBar: "quiz-timer-bar"` and `quizAllQuestions: "quiz-all-questions"` to `SPEKIT` in `src/lib/spekit-targets.ts` (keep `quizSubmitButton`, `quizQuestionPager`, `quizTimer`, `quizProgress`, `quizJumpSheet`, `quizSubmitConfirm`)
- [x] T002 [P] Mirror `quiz-timer-bar` and `quiz-all-questions` in `.speckit/spekit-targets.yaml` and bump `meta.total_targets` from 132 to 134
- [x] T003 [P] Add draft `UI-018` entry (status `partial`) in `.speckit/spec.yaml` linking `specs/033-quiz-header-polish/`, route `/quiz/[id]`, files from `plan.md`, and extends `UI-017` `UI-016` `QUIZ-001` `QUIZ-004`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure remaining-time fraction helper — MUST land before the timer bar story; completeness already exists as `isQuizComplete` in `src/lib/quiz-player.ts`

**⚠️ CRITICAL**: No user-story UI until T004–T005 are done (small; US1 then uses existing `isQuizComplete`)

- [x] T004 Add failing `[UI-018]` tests for `remainingTimeFraction` (full duration → 1, mid → 0.5, 120s of 10 min → 0.2, zero → 0, `durationMinutes <= 0` → 0; must not use answered count) in `tests/features/ui-018-quiz-header-polish.test.ts` per `specs/033-quiz-header-polish/contracts/client-state.md`
- [x] T005 Implement `remainingTimeFraction(remainingSeconds, durationMinutes)` in `src/lib/quiz-timer.ts` until T004 passes

**Checkpoint**: Foundation ready — timer math is unit-tested; stories can compose UI

---

## Phase 3: User Story 1 — Compact submit beside a right-aligned stepper (Priority: P1) 🎯 MVP

**Goal**: Card-header stepper stays on the visual right. Compact «تسليم» (short label + flag/check icon) sits on the visual left of that row for the whole taking session, faded and untappable until every question is answered, then opens the existing confirm.

**Independent Test**: ~390px in-progress quiz — stepper physical right, «تسليم» physical left; one blank → disabled, tap does not grade; all answered → enables; confirm/cancel still work; expiry still auto-ends without this button.

### Implementation for User Story 1

- [x] T006 [US1] In `src/components/quiz/QuizRunner.tsx`, always mount compact `quiz-submit-button` while taking (`!isSubmitted && !pendingSync && !timeLocked && questions.length > 0`); drop the last-question-or-complete visibility gate; `disabled={!complete || isPending}`; label «تسليم» (optional Flag/Check icon); pending copy may stay «جاري التسليم...» / «جاري الحفظ...»; never use «تسليم الإجابات وإنهاء الاختبار» in this slot
- [x] T007 [US1] In `src/components/quiz/QuizRunner.tsx`, keep the card-header action row `dir="ltr"`; submit `shrink-0` on the physical left; `QuestionPager` `ms-auto` compact on the physical right (not centered while taking); `handleSubmit` is a no-op when incomplete (do not open `QuizUnansweredDialog`); enabled tap still opens `QuizSubmitDialog`; expiry still closes confirm and calls `submitAttempt({ forceTimedExpiry: true })`

**Checkpoint**: MVP — submit is always findable, gated at 100%, stepper stays right

---

## Phase 4: User Story 2 — Timer countdown bar (Priority: P1)

**Goal**: Timed taking shows a thin bar under MM:SS + «الوقت المتبقي» whose fill is remaining ÷ attempt duration, shrinking with the tick and sharing the 2-minute warning accent. Untimed quizzes have no bar.

**Independent Test**: Timed quiz near start (bar nearly full) and with little time left (bar nearly empty, warning accent); untimed: no `quiz-timer-bar`.

### Implementation for User Story 2

- [x] T008 [P] [US2] Extend `src/components/quiz/QuizTimerBadge.tsx` to accept `durationMinutes`; when compact and timed, render a thin linear bar under the digits using `remainingTimeFraction`; Spekit `quiz-timer-bar`; `role="progressbar"` with `aria-valuemin={0}` `aria-valuemax={100}` `aria-valuenow` rounded remaining percent and `aria-label` «الوقت المتبقي»; warning/expired use the same rose treatment as the digits (`isWarningRemaining`); no bar when not compact / no duration
- [x] T009 [US2] Pass `durationMinutes` from `src/components/quiz/QuizPlayerHeader.tsx` into `QuizTimerBadge` (timed taking only)
- [x] T010 [US2] Pass `timer.durationMinutes` from `src/components/quiz/QuizRunner.tsx` into `QuizPlayerHeader`; live bar must not show after submit (header already hides the timer when `isSubmitted`)

**Checkpoint**: Remaining time is felt as a shrinking bar without changing QUIZ-004 fairness

---

## Phase 5: User Story 3 — Cleaner «كل الأسئلة» (Priority: P2)

**Goal**: Header «كل الأسئلة» looks balanced with the timer cluster (`min-h-11`, similar padding, not a leftover chip). Jump-and-dismiss unchanged.

**Independent Test**: Timed and untimed — control is tappable, opens the overview, jump still works; no overlap with timer/bar on ~390px.

### Implementation for User Story 3

- [x] T011 [US3] Restyle the «كل الأسئلة» button in `src/components/quiz/QuizPlayerHeader.tsx` (`min-h-11`, `rounded-xl`, `text-xs font-bold`, subtle border/muted fill aligned with the compact timer); add `data-spekit={SPEKIT.quizAllQuestions}`; keep copy + grid icon; do not change `QuestionJumpSheet` behavior in `src/components/quiz/QuestionJumpSheet.tsx`

**Checkpoint**: Header chrome is even; exam rules unchanged

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Registry, e2e, regressions, quickstart gates

- [x] T012 Mark `UI-018` `implemented` with acceptance + file list in `.speckit/spec.yaml` (compact left «تسليم» always visible while taking and disabled until complete; stepper visual right; timer countdown bar; polished «كل الأسئلة»)
- [x] T013 [P] Add Playwright Pixel-7 coverage in `e2e/ui-018-quiz-header-polish.spec.ts`: on Q1 with a blank, `quiz-submit-button` is visible, disabled, and left of `quiz-question-pager`; after answering all, submit enables and confirm copy matches UI-017; timed quiz shows `quiz-timer-bar`; untimed does not; `quiz-all-questions` opens `quiz-jump-sheet` (dismiss A2HS first; start via «ابدأ الاختبار الآن»)
- [x] T014 [P] Update `e2e/ui-017-quiz-nav-submit.spec.ts` so compact submit no longer depends on the unanswered-dialog / «التسليم على أي حال» path (disabled until complete; confirm only when enabled)
- [x] T015 [P] Confirm `[UI-017]`, `[UI-016]`, `[QUIZ-001]`, and `[QUIZ-004]` still pass via `npm run test:unit -- tests/features/ui-017-quiz-nav-submit.test.ts tests/features/ui-016-quiz-player.test.ts tests/features/quiz-001-gatekeeper.test.ts tests/features/quiz-004-countdown-timer.test.ts`
- [x] T016 Run `npm run lint`, `npm run typecheck`, `npm run test:unit -- tests/features/ui-018-quiz-header-polish.test.ts`, and `npm run build`
- [x] T017 Walk `specs/033-quiz-header-polish/quickstart.md` (compact submit + right stepper, timer bar, كل الأسئلة, empty/offline/expiry) including `npm run test:e2e -- e2e/ui-018-quiz-header-polish.spec.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (P1)**: After Phase 2 — MVP (`QuizRunner.tsx`)
- **US2 (P1)**: After Phase 2 — `QuizTimerBadge.tsx` / `QuizPlayerHeader.tsx` can start in parallel with US1; `QuizRunner.tsx` duration pass (T010) after T006–T007 if one agent
- **US3 (P2)**: After T009 (same `QuizPlayerHeader.tsx`) or sequential after US2 header work
- **Polish**: After desired stories

### User Story Dependencies

- **US1**: Independent after foundation (`QuizRunner.tsx` only). Reuses `isQuizComplete` and `QuizSubmitDialog`
- **US2**: Independent badge file; header + runner wiring share files with US1/US3
- **US3**: Header-only restyle; jump sheet unchanged

### Parallel Opportunities

- T001, T002, T003 in Setup
- T008 (`QuizTimerBadge.tsx`) in parallel with T006–T007 (`QuizRunner.tsx`)
- T013, T014, T015 in Polish

---

## Parallel Example: User Story 1 + 2 files

```bash
# After Phase 2:
Task: "Compact gated «تسليم» + right stepper in src/components/quiz/QuizRunner.tsx"
Task: "Timer countdown bar in src/components/quiz/QuizTimerBadge.tsx"
# Then sequential on shared chrome:
Task: "Pass durationMinutes through QuizPlayerHeader.tsx"
Task: "Pass timer.durationMinutes from QuizRunner.tsx"
Task: "Polish كل الأسئلة in QuizPlayerHeader.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: compact gated «تسليم», stepper on the right
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → `remainingTimeFraction` green
2. US1 → compact submit + right stepper (MVP)
3. US2 → timer countdown bar
4. US3 → «كل الأسئلة» polish
5. Polish → registry + e2e + UI-017 e2e update

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (`QuizRunner.tsx`)
   - Developer B: User Story 2 (`QuizTimerBadge.tsx` + header duration prop)
3. US3 after header duration prop lands
4. Polish together

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to US1–US3
- Visual left/right = physical screen sides (`dir="ltr"` on the card-header action row)
- Do not reuse `quiz-progress` (answered bar) as the timer bar
- Compact submit never opens `QuizUnansweredDialog`
- Verify T004 fails before T005
- Stop after US1 to validate MVP independently
