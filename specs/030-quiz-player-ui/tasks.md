---
description: "Task list for UI-016 Mobile Quiz Player Redesign"
---

# Tasks: Mobile Quiz Player Redesign (UI-016)

**Input**: Design documents from `/specs/030-quiz-player-ui/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — plan requires Vitest `[UI-016]` for `src/lib/quiz-player.ts`, Playwright phone smoke in `e2e/ui-016-quiz-player.spec.ts`, and regression `[QUIZ-001]` / `[QUIZ-004]`.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US4)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js app: `src/`, `tests/`, `e2e/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Spekit + registry scaffolding for UI-016

- [x] T001 [P] Add Spekit keys `quizPlayerHeader`, `quizExitButton`, `quizExitDialog`, `quizQuestionPager`, `quizJumpSheet` to `SPEKIT` in `src/lib/spekit-targets.ts` (keep existing `quizTimer`, `questionCard`, `quizSubmitButton`, `quizProgress`, `quizPage`)
- [x] T002 [P] Mirror those selectors under a UI-016 section in `.speckit/spekit-targets.yaml` (bump `meta.total_targets`)
- [x] T003 [P] Add draft `UI-016` entry (status `partial`) in `.speckit/spec.yaml` linking `specs/030-quiz-player-ui/`, route `/quiz/[id]`, and extends `QUIZ-001` `QUIZ-004` `UI-001` `UI-014` `OFFLINE-001`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure player helpers used by header, card, pager, and tests — MUST land before story UI

**⚠️ CRITICAL**: No user-story UI until this phase is complete

- [x] T004 Add failing `[UI-016]` tests for `optionLetter`, `answeredProgress`, `questionNavStatus` (taking vs review, never requires correct keys when `!isSubmitted`), and `shouldConfirmQuizExit` in `tests/features/ui-016-quiz-player.test.ts` per `specs/030-quiz-player-ui/contracts/client-state.md`
- [x] T005 Implement `optionLetter`, `answeredProgress`, `questionNavStatus`, and `shouldConfirmQuizExit` in `src/lib/quiz-player.ts` until T004 passes
- [x] T006 Switch `src/components/quiz/QuestionNavGrid.tsx` to import `questionNavStatus` from `src/lib/quiz-player.ts` (no duplicated status logic)

**Checkpoint**: Foundation ready — helpers are unit-tested; stories can compose UI

---

## Phase 3: User Story 1 — Stay focused with a clean header and countdown (Priority: P1) 🎯 MVP

**Goal**: Slim sticky quiz sub-header with Arabic exit confirm (header + system Back) and QUIZ-004 countdown in the bar; no title/progress/grid cards above the question while taking.

**Independent Test**: Phone-width timed and untimed quizzes — header visible, untimed has no clock, timed shows `MM:SS` «الوقت المتبقي» with 2-minute warning, exit dialog saves draft and returns to `/quizzes`, sidebar brand cards gone from the taking canvas.

### Implementation for User Story 1

- [x] T007 [P] [US1] Create slim sticky `QuizPlayerHeader` (exit control + optional timer slot, Spekit `quiz-player-header` / `quiz-exit-button`) in `src/components/quiz/QuizPlayerHeader.tsx` per `specs/030-quiz-player-ui/contracts/ui-components.md`
- [x] T008 [P] [US1] Create Arabic `AlertDialog` «هل أنت متأكد أنك تريد الخروج؟» / «سيتم حفظ تقدّمك.» with بقاء / خروج in `src/components/quiz/QuizExitDialog.tsx` (`data-spekit=quiz-exit-dialog`)
- [x] T009 [US1] Fold `QuizTimerBadge` into the header (reuse `formatRemainingMmSs` / `isWarningRemaining`, keep `data-spekit=quiz-timer`) in `src/components/quiz/QuizTimerBadge.tsx` and `src/components/quiz/QuizPlayerHeader.tsx`
- [x] T010 [US1] Mount header + exit dialog in `src/components/quiz/QuizRunner.tsx`: `shouldConfirmQuizExit` arms `pushState`/`popstate`; confirm flushes `saveInProgress` then `router.push("/quizzes")`; after submit, exit is a plain navigate; do **not** mount `QuizSidebar` while taking; omit timer when `timer` is null

**Checkpoint**: MVP — taking screen is a calm header + existing question card; pager/sheet not required yet

---

## Phase 4: User Story 2 — Answer on an immersive question card (Priority: P1)

**Goal**: One full-width card with «السؤال N», 44px lettered A/B/C/D rows, selected state `#065f46`, no solutions or category chips until submit.

**Independent Test**: Select and change options — green selected styling, no leak of correct answers, image/math still visible, rows ≥ 44px.

### Implementation for User Story 2

- [x] T011 [US2] Restyle choice rows in `src/components/quiz/QuestionCard.tsx`: `min-h-11`, circular `optionLetter` badges on the RTL start side, selected fill `#065f46` + white glyph, hide category chip unless `showResult`, semantic card surface for dark appearance
- [x] T012 [US2] Confirm `src/components/quiz/QuizRunner.tsx` passes `correctAnswer` / explanation / `categoryTag` to `QuestionCard` only when `isSubmitted` (QUIZ-001 call-site contract in `specs/030-quiz-player-ui/contracts/client-state.md`)

**Checkpoint**: Answering feels like a course-player card; header from US1 still works

---

## Phase 5: User Story 3 — Jump questions and submit from compact bottom chrome (Priority: P1)

**Goal**: Horizontal numbered pager + dismissible all-questions sheet replace the always-on grid; sticky bar shows progress plus «تسليم الإجابات وإنهاء الاختبار».

**Independent Test**: 10-question quiz — pager jump, sheet overview, progress updates, submit blocked with blanks, submit succeeds to existing review; bar sits above student tabs (`bottom-16`).

### Implementation for User Story 3

- [x] T013 [P] [US3] Create horizontal RTL `QuestionPager` (`overflow-x-auto`, `min-h-11` chips, `questionNavStatus`, Spekit `quiz-question-pager`) in `src/components/quiz/QuestionPager.tsx`
- [x] T014 [P] [US3] Create `QuestionJumpSheet` using `Dialog` bottom-sheet classes (`bottom-16`, Spekit `quiz-jump-sheet`) wrapping `QuestionNavGrid` in `src/components/quiz/QuestionJumpSheet.tsx` (mirror `src/components/pwa/PwaInstallSheet.tsx`)
- [x] T015 [US3] Bump jump cells to `min-h-11 min-w-11` in `src/components/quiz/QuestionNavGrid.tsx`
- [x] T016 [US3] Wire pager + «كل الأسئلة» sheet in `src/components/quiz/QuizRunner.tsx`; hide pager/sheet/submit when empty; keep compact السابق/التالي at `min-h-11`
- [x] T017 [US3] Show `{answered} من {total}` (and/or percent from `answeredProgress`) with Spekit `quiz-progress` on the existing `fixed bottom-16` bar beside `quiz-submit-button` in `src/components/quiz/QuizRunner.tsx`

**Checkpoint**: Jump + submit work without the old sidebar; US1 exit still saves

---

## Phase 6: User Story 4 — Comfortable mobile motion and touch (Priority: P2)

**Goal**: Short fade/slide on question change (instant if reduced-motion); all primary targets ≥ 44px; chrome follows light/dark tokens; RTL motion.

**Independent Test**: Pager jumps animate; OS reduced-motion is instant; exit/choices/pager/submit are ≥ 44px; dark appearance does not leave a hard white island.

### Implementation for User Story 4

- [x] T018 [P] [US4] Add `quiz-question-enter` keyframes (opacity + 8–12px translate) and disable them under `prefers-reduced-motion` in `src/app/globals.css`
- [x] T019 [US4] Apply `quiz-question-enter` on the card wrapper keyed by `activeIndex` in `src/components/quiz/QuizRunner.tsx` (do not delay `handleAnswer`)
- [x] T020 [US4] Audit remaining player chrome for `min-h-11` and semantic tokens (`bg-background` / `bg-card` / `border-border`) on `src/components/quiz/QuizPlayerHeader.tsx`, `src/components/quiz/QuestionPager.tsx`, and the sticky bar in `src/components/quiz/QuizRunner.tsx`

**Checkpoint**: Polish does not change scoring, timer fairness, or gatekeeper

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Registry, e2e, regressions, quickstart gates

- [x] T021 Mark `UI-016` `implemented` with acceptance + file list in `.speckit/spec.yaml`
- [x] T022 [P] Add Playwright Pixel-7 coverage: header + timer/untimed, no taking sidebar grid, pager visible, choice rows `min-h-11`, submit bar `bottom-16`, in `e2e/ui-016-quiz-player.spec.ts`
- [x] T023 [P] Confirm `[QUIZ-001]` and `[QUIZ-004]` still pass via `npm run test:unit -- tests/features/quiz-001-gatekeeper.test.ts tests/features/quiz-004-countdown-timer.test.ts`
- [x] T024 Run `npm run lint`, `npm run typecheck`, `npm run test:unit -- tests/features/ui-016-quiz-player.test.ts`, and `npm run test:e2e -- e2e/ui-016-quiz-player.spec.ts` using `specs/030-quiz-player-ui/quickstart.md`
- [x] T025 Walk the quickstart matrix (header/exit/timer, card selection, pager/sheet/submit, motion/appearance, empty/offline/teacher regression) in `specs/030-quiz-player-ui/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (P1)**: After Phase 2 — MVP; no dependency on US2–US4
- **US2 (P1)**: After Phase 2 — `QuestionCard.tsx` is independent of pager; `QuizRunner.tsx` call-site (T012) should follow T010 if one agent
- **US3 (P1)**: After Phase 2 — pager/sheet can ship without US2 styling, but same `QuizRunner.tsx` as US1 (sequential if one agent)
- **US4 (P2)**: After US1 card is on screen (needs wrapper in `QuizRunner.tsx`); CSS file (T018) is parallel
- **Polish**: After desired stories

### User Story Dependencies

- **US1**: Independent after foundation (header + hide sidebar)
- **US2**: Independent card styling; shares `QuizRunner.tsx` with US1 for gatekeeper props
- **US3**: Independent UX value; shares `QuizRunner.tsx` and `QuestionNavGrid.tsx` with foundation
- **US4**: Motion/tokens on US1–US3 chrome; do not block MVP

### Within Each User Story

- Helper tests (T004) fail before T005
- New components (T007/T008, T013/T014) before `QuizRunner.tsx` wiring
- Story complete before the next priority when a single agent owns `QuizRunner.tsx`

### Parallel Opportunities

- T001, T002, T003 in Setup
- T007 and T008 (header vs dialog)
- T013 and T014 (pager vs sheet)
- T018 (CSS) in parallel with US3
- T022 and T023 in Polish

---

## Parallel Example: User Story 1

```bash
# After Phase 2:
Task: "Create QuizPlayerHeader in src/components/quiz/QuizPlayerHeader.tsx"
Task: "Create QuizExitDialog in src/components/quiz/QuizExitDialog.tsx"
# Then sequential:
Task: "Fold QuizTimerBadge into the header"
Task: "Wire header, popstate guard, hide QuizSidebar in QuizRunner.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "Create QuestionPager in src/components/quiz/QuestionPager.tsx"
Task: "Create QuestionJumpSheet in src/components/quiz/QuestionJumpSheet.tsx"
# Then sequential on QuizRunner.tsx / QuestionNavGrid.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: timed/untimed header, exit save, no sidebar cards
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → helpers green
2. US1 → calm taking header (MVP)
3. US2 → immersive card
4. US3 → pager + sheet + progress bar
5. US4 → motion / 44px audit
6. Polish → registry + e2e + QUIZ-001/004

### Parallel Team Strategy

With multiple developers after Phase 2:

- Developer A: US1 (`QuizPlayerHeader`, `QuizExitDialog`, then `QuizRunner.tsx`)
- Developer B: US2 (`QuestionCard.tsx` only until A finishes runner wiring)
- Developer C: US3 pager/sheet files, then merge into `QuizRunner.tsx` after A

Do not edit `QuizRunner.tsx` in parallel.

---

## Notes

- [P] tasks = different files, no incomplete dependencies
- [Story] label maps to spec user stories US1–US4
- No new SQL, packages, or quiz routes
- Do not break QUIZ-001 gatekeeper or QUIZ-004 auto-submit
- Commit only if the user asks
- Stop at any checkpoint to validate the story independently
