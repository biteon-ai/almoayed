---
description: "Task list for Quiz Countdown Timer (QUIZ-004)"
---

# Tasks: Quiz Countdown Timer

**Input**: Design documents from `specs/018-quiz-countdown-timer/`  
**Prerequisites**: `plan.md`, `spec.md` (Clarified), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Tests**: Included — plan/quickstart call for Vitest `tests/features/quiz-004-countdown-timer.test.ts` (helpers + session/submit contracts; not full TDD)

**Organization**: US1 (teacher config) → US2 (live countdown) → US3 (auto-submit / late reopen) → US4 (RTL/Spekit). Shared foundation: migration `013_quiz_timer.sql` + types/selects + `quiz-timer` helpers.

**Feature ID**: `QUIZ-004` (extends `TEACH-003` · `QUIZ-001`) — do not break gatekeeper selects, MT-002 scoping, RTL Tajawal, Server Actions

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US4 maps to spec user stories
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Spekit / registry stubs shared by teacher + student stories

- [x] T001 [P] Add Spekit ids `quiz-timer` and optional `quiz-timer-settings` to `src/lib/spekit-targets.ts` and `.speckit/spekit-targets.yaml`
- [x] T002 [P] Draft `QUIZ-004` stub entry (status planned/partial) in `.speckit/spec.yaml` with routes `/teacher/quizzes`, `/teacher/quizzes/new`, `/teacher/quizzes/[id]`, `/quiz/[id]` and planned file list per `plan.md`

**Checkpoint**: Spekit + registry stubs ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema + types + pure timer helpers — MUST complete before story UI/actions

**⚠️ CRITICAL**: No timed sessions or UI until migration + `Quiz` fields + `QUIZ_LIST_SELECT` + helpers exist

- [x] T003 Create `supabase/migrations/013_quiz_timer.sql` adding `quizzes.is_timed BOOLEAN NOT NULL DEFAULT false`, `quizzes.duration_minutes INTEGER NULL` with CHECK (NULL or 1–180), and table `quiz_timed_sessions` (`student_id`, `quiz_id`, `started_at`, `duration_minutes`, UNIQUE pair, FKs) per `data-model.md`
- [x] T004 [P] Extend `Quiz` with `is_timed: boolean` and `duration_minutes: number | null` in `src/types/database.ts`; add `QuizTimedSession` / `TimedQuizSessionView` types as needed
- [x] T005 [P] Append `is_timed, duration_minutes` to `QUIZ_LIST_SELECT` in `src/lib/perf-selects.ts`
- [x] T006 [P] Implement `src/lib/quiz-timer.ts`: `validateDurationMinutes`, `formatRemainingMmSs` (minutes may be ≥ 60), `isWarningRemaining` (≤ 120s), `computeRemainingSeconds(startedAt, durationMinutes, now)`
- [x] T007 Apply migration with `npx supabase db push` and confirm columns/table exist

**Checkpoint**: Foundation ready — stories can persist and compute timer state

---

## Phase 3: User Story 1 — Teacher configures a timed quiz (Priority: P1) 🎯 MVP

**Goal**: Teacher can enable «تفعيل التوقيت», set duration 1–180 minutes, save/clear on create (and edit); settings scoped to owning teacher.

**Independent Test**: Create/edit quiz → enable timer → duration `2` → save → reopen persists; invalid `0`/`181` blocked; disable toggle clears duration.

### Tests for User Story 1

- [x] T008 [P] [US1] Scaffold `tests/features/quiz-004-countdown-timer.test.ts` covering `validateDurationMinutes` (1–180) and untimed clears duration rules (pure helper / contract style)

### Implementation for User Story 1

- [x] T009 [US1] Extend `createQuiz` in `src/actions/teacher.ts` to read `is_timed` + `duration_minutes` from FormData, validate via `quiz-timer` helpers, persist columns with `created_by` scope
- [x] T010 [US1] Extend `updateQuizFlags` (or add `updateQuizTimerSettings`) in `src/actions/teacher.ts` so edit path can set/clear timer fields with the same validation and teacher scope
- [x] T011 [P] [US1] Add «تفعيل التوقيت» toggle + conditional «مدة الاختبار بالدقائق» input (Spekit `quiz-timer-settings`) to `src/components/teacher/QuizCreateForm.tsx`
- [x] T012 [US1] Wire timer controls on quiz edit UI (quiz detail/flags surface under `src/app/teacher/(portal)/quizzes/[id]/` and related components such as `QuizManagement.tsx` / edit form) so existing quizzes can enable/change/disable timer
- [x] T013 [US1] Ensure create wizard still submits new fields via `src/components/teacher/QuizCreateWizard.tsx` (FormData names match action)

**Checkpoint**: US1 complete — teacher can configure timed quizzes

---

## Phase 4: User Story 2 — Student live countdown (Priority: P1)

**Goal**: Timed quizzes show sticky `MM:SS` badge; remaining from server start + snapshot; warning ≤ 2 minutes; refresh does not reset; untimed shows no badge.

**Independent Test**: Open timed quiz → badge visible → refresh keeps remaining → ≤2:00 warning style; untimed quiz has no badge.

### Tests for User Story 2

- [x] T014 [P] [US2] Extend `tests/features/quiz-004-countdown-timer.test.ts` for `formatRemainingMmSs` / `isWarningRemaining` / remaining-seconds math (incl. minutes ≥ 60)

### Implementation for User Story 2

- [x] T015 [US2] Implement `ensureTimedQuizSession(quizId)` in `src/actions/quiz.ts` per `contracts/server-actions.md` (idempotent insert with duration snapshot; reuse existing session; null if untimed or already submitted)
- [x] T016 [US2] Extend `getQuizForStudent` in `src/actions/quiz.ts` to return `timer: TimedQuizSessionView | null` (ensure session when timed; `remainingSeconds` from server now; keep QUIZ-001 question select)
- [x] T017 [P] [US2] Create sticky `QuizTimerBadge` in `src/components/quiz/QuizTimerBadge.tsx` (`data-spekit="quiz-timer"`, `MM:SS`, warning pulse when ≤ 120s)
- [x] T018 [US2] Pass `timer` from `src/app/(student)/quiz/[id]/page.tsx` / `QuizRunnerContainer.tsx` into `QuizRunner`
- [x] T019 [US2] Integrate badge + 1s client tick (recompute from `endsAt` / startedAt+duration, not a resettable local full duration) in `src/components/quiz/QuizRunner.tsx`; hide when `timer` null or results already shown

**Checkpoint**: US2 complete — live fair countdown on timed exams

---

## Phase 5: User Story 3 — Auto-submit on expiry / late reopen (Priority: P1)

**Goal**: At `00:00` or late reopen, lock answers, Arabic notice, auto-`submitQuiz`, results with score; server allows submit after deadline; no post-deadline answer mutations if any save API exists.

**Independent Test**: Short timed quiz reaches 0 (or reopen after wait) → lock + notice + auto-submit → results; QUIZ-001 still holds pre-submit.

### Tests for User Story 3

- [x] T020 [P] [US3] Extend `tests/features/quiz-004-countdown-timer.test.ts` with contracts: past-deadline allows submit path; ensure-session does not create a second row; helper asserts mutation-blocked after deadline

### Implementation for User Story 3

- [x] T021 [US3] Harden `submitQuiz` in `src/actions/quiz.ts` to use DB timed session for deadline math (ignore client start/duration); never reject submit solely for being past deadline
- [x] T022 [US3] In `src/components/quiz/QuizRunner.tsx`, on `remainingSeconds === 0` (including initial load): disable inputs, show «انتهى الوقت المحدد للاختبار! جاري تسليم إجاباتك تلقائياً...», call `submitQuiz`, navigate to results; prevent double-submit
- [x] T023 [US3] Document/guard shared `assertTimedSessionAllowsMutation` in `src/lib/quiz-timer.ts` (or `quiz.ts`) for any future mid-attempt save; confirm no mid-attempt answer Server Action bypasses it today
- [x] T024 [US3] Align offline pending flush in `src/lib/offline/sync-processor.ts` / runner so expired timed attempts still submit when back online without resetting `started_at`

**Checkpoint**: US3 complete — enforceable expiry + auto-submit

---

## Phase 6: User Story 4 — RTL & Spekit (Priority: P2)

**Goal**: Timer controls and badge are Arabic RTL, touch-friendly, Spekit-complete.

**Independent Test**: Narrow viewport create timed quiz + take exam; RTL labels; `data-spekit="quiz-timer"` present.

### Implementation for User Story 4

- [x] T025 [P] [US4] Audit teacher timer controls in `QuizCreateForm.tsx` (and edit UI) for RTL `text-start`, Tajawal shell, touch targets `h-10`–`h-12`
- [x] T026 [P] [US4] Audit `QuizTimerBadge.tsx` sticky layout so it does not obscure primary question controls on ~390px width (SC-006)
- [x] T027 [US4] Finalize `.speckit/spec.yaml` `QUIZ-004` acceptance + spekit list; mark status implemented when done

**Checkpoint**: US4 complete — polish + registry accurate

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify gates across stories

- [x] T028 [P] Run `npx vitest run tests/features/quiz-004-countdown-timer.test.ts` and existing `quiz-001-gatekeeper` tests; fix regressions
- [x] T029 [P] Manual QA per `specs/018-quiz-countdown-timer/quickstart.md` (create timed, refresh fairness, warning, expiry auto-submit, untimed)
- [x] T030 Run `npm run build` and fix type/select errors from timer columns
- [x] T031 Confirm out-of-scope holds: no per-question timers, no pause/resume, no teacher mid-exam time extension UI

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: After Foundational — **MVP** (teacher can configure)
- **US2 (Phase 4)**: After Foundational; needs US1 data for real quizzes (can mock session in tests earlier)
- **US3 (Phase 5)**: After US2 (runner + session exist)
- **US4 (Phase 6)**: After US1 + US2 UI exist
- **Polish (Phase 7)**: After all stories

### User Story Dependencies

```text
Setup → Foundational
           ├─► US1 (teacher config) ──────────────┐
           └─► US2 (live countdown) ─► US3 (expiry) ┼─► US4 → Polish
```

### Parallel Opportunities

- T001 ∥ T002 (setup)
- T004 ∥ T005 ∥ T006 after T003 written (types/selects/helpers)
- Within US1: T011 ∥ action work after helpers
- Within US2: T017 badge ∥ T015/T016 actions
- US4 audits T025 ∥ T026

### Parallel example: User Story 2

```bash
# After foundation:
# Agent A: T015–T016 ensureTimedQuizSession + getQuizForStudent.timer
# Agent B: T017 QuizTimerBadge
# Then: T018–T019 wire into page/runner
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Setup + Foundational  
2. Ship teacher timer toggle + duration persistence  
3. **Stop and validate** Independent Test for US1  

### Incremental delivery

1. MVP = US1  
2. Add US2 = live fair countdown  
3. Add US3 = auto-submit / late reopen  
4. Add US4 + polish = ship-ready QUIZ-004  

### Suggested MVP scope

**US1 only** unlocks configuration; full student value needs **US2+US3** before calling QUIZ-004 done.

---

## Task Summary

| Phase | Story | Task IDs | Count |
|-------|-------|----------|-------|
| Setup | — | T001–T002 | 2 |
| Foundational | — | T003–T007 | 5 |
| US1 | Teacher config | T008–T013 | 6 |
| US2 | Live countdown | T014–T019 | 6 |
| US3 | Auto-submit | T020–T024 | 5 |
| US4 | RTL / Spekit | T025–T027 | 3 |
| Polish | — | T028–T031 | 4 |
| **Total** | | **T001–T031** | **31** |

**Format validation**: All tasks use `- [ ]`, sequential Task IDs, optional `[P]`, story labels only on US phases, and exact file paths in descriptions.
