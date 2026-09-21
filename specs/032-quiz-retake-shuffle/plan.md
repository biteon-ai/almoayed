# Implementation Plan: Quiz Retake Reset & Shuffle

**Branch**: `032-quiz-retake-shuffle` | **Date**: 2026-09-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/032-quiz-retake-shuffle/spec.md`

**Feature IDs (registry)**: `QUIZ-006`  
**Extends**: `QUIZ-001` · `QUIZ-004` · `QUIZ-005` · `UI-016` · `UI-017` · `OFFLINE-001`

## Summary

When a student starts a new quiz attempt (first open or «إعادة المحاولة»), the player must be a blank slate and the question/option order must be a new permutation so choice-position memory does not work. Resume of the **same** in-progress attempt keeps that attempt’s layout and answers. Past graded attempts keep their own snapshot for review. Teacher-authored order is untouched.

**Technical approach**:
1. Pure shuffle in `src/lib/quiz-shuffle.ts` (injectable RNG; `shuffleDistinctFrom` vs previous attempt).
2. Migration `021_quiz_attempt_presentation.sql`: live table `quiz_attempt_presentations` plus `exam_submissions.question_order` / `option_orders`.
3. `getQuizForStudent` mints or reuses a taking layout and returns already-shuffled `ExamQuestion[]`. `submitQuiz` copies the layout onto the new submission and deletes the live row. `getSubmissionResults` + `?review=` apply the snapshot.
4. Client: `isStaleInProgressDraft` + `clearInProgress` on mismatched `usedAttemptsAtStart` and after online submit (fixes leftover IDB answers on retake). Stamp drafts with `usedAttemptsAtStart`.
5. Spekit `quiz-retake-cta`; Vitest `[QUIZ-006]`; Playwright retake/shuffle smoke. No teacher toggle.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for all educational levels and subjects

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — `getQuizForStudent` / `submitQuiz` Server Actions + client `QuizRunner` |
| **Database** | **Supabase** — new presentation table + submission snapshot columns |
| **Data access** | Admin client in `src/actions/quiz.ts` only |
| **UI** | Existing player; Spekit on retake CTAs |
| **Testing** | Vitest `[QUIZ-006]` + Playwright; keep `[QUIZ-001]` / `[QUIZ-004]` / `[QUIZ-005]` |
| **Target platform** | Student `/quiz/[id]`, `/results` |

**Feature-specific overrides**:

- **Primary Dependencies**: none beyond stack defaults (`crypto.getRandomValues`)
- **Storage / tables touched**: `quiz_attempt_presentations` (new); `exam_submissions` (+ `question_order`, `option_orders`); IDB `inProgress` extra field `usedAttemptsAtStart`
- **Performance Goals**: shuffle of typical class quizzes (under 100 questions) is negligible vs existing quiz fetch; retake first question visible in under 5 seconds on a normal phone connection (SC-005)
- **Constraints**: QUIZ-001 exam-field select; MT-002 quiz `created_by`; QUIZ-005 attempt cap; grading by option **text**; one live presentation per student+quiz
- **Scale/Scope**: Student taking + review only; not teacher editors

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md`

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped quiz load | PASS — existing `created_by = ctx.teacherId`; presentation is student+quiz, read only in `requireStudent` |
| QUIZ-001 | No answer leakage pre-submit | PASS — shuffle runs on `EXAM_QUESTION_SELECT_FIELDS`; snapshot on submission is post-grade review |
| Server layer | Server Actions + admin client | PASS — mint/persist presentation in `quiz.ts`; client does not supply order of record |
| RTL UX | Arabic RTL, positional A–D | PASS — `optionLetter(displayIndex)`; no new tiny controls |
| Passwordless | WhatsApp identity | PASS |
| Minimal diff | Match existing patterns | PASS — follow timed-session lifecycle; extend runner restore rather than new player |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — client IDB wipe is UX state only; grading and layout of record stay server-side; review uses submission snapshot so shuffle cannot leak into teacher source rows.

## Project Structure

### Documentation (this feature)

```text
specs/032-quiz-retake-shuffle/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── shuffle.md
│   ├── server-actions.md
│   ├── client-state.md
│   └── ui-components.md
└── tasks.md                    # via /speckit-tasks
```

### Source Code (planned touch points)

```text
supabase/migrations/021_quiz_attempt_presentation.sql   # NEW
src/lib/quiz-shuffle.ts                                 # NEW — Fisher–Yates + distinct-from-previous
src/lib/quiz-presentation.ts                            # NEW — apply/validate snapshots (pure + thin DB helpers if kept out of actions)
src/lib/offline/types.ts                                # EXTEND — usedAttemptsAtStart
src/lib/offline/in-progress.ts                          # EXTEND — persist stamp
src/lib/quiz-player.ts                                  # EXTEND — isStaleInProgressDraft (or quiz-shuffle/client helper)
src/actions/quiz.ts                                     # EXTEND — mint/reuse/copy/delete presentation
src/types/database.ts                                   # EXTEND — submission snapshot; result.options
src/app/(student)/quiz/[id]/page.tsx                    # EXTEND — review applies snapshot; taking uses server questions
src/components/quiz/QuizRunner.tsx                      # EXTEND — stale wipe; clearInProgress on submit; attemptState
src/components/quiz/QuizRunnerContainer.tsx             # EXTEND — pass usedAttempts; skip package save on review
src/components/student/StudentResultsView.tsx           # EXTEND — spekit retake CTA
src/components/student/StudentQuizGridCard.tsx          # EXTEND — spekit
src/components/dashboard/QuizCarouselCard.tsx           # EXTEND — spekit
src/lib/spekit-targets.ts
.speckit/spekit-targets.yaml
.speckit/spec.yaml                                      # QUIZ-006

tests/features/quiz-006-retake-shuffle.test.ts
e2e/quiz-006-retake-shuffle.spec.ts
```

**Structure decision**: Shuffle math stays pure for Vitest. Lifecycle (mint/reuse/copy) sits next to `ensureTimedQuizSession` in the quiz action module (or a lib used only from that action). `QuizRunner` remains the only client orchestrator for drafts.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| none | — | — |

Server presentation table is **not** a constitution violation; it is the same pattern as `quiz_timed_sessions` (state that exists before `exam_submissions`).

## Phase 0: Research

See [research.md](./research.md). Resolved: server snapshot vs client-only shuffle, IDB stale-draft rule, option-text grading, distinct-from-previous swap, review `?review=`, pending-sync non-wipe, RNG injection.

## Phase 1: Design

See [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

**Key decisions**:
1. Live layout in `quiz_attempt_presentations`; frozen copy on `exam_submissions`.
2. Client never wins on order: submit copies the server live row (or authored fallback).
3. Stale IDB = `usedAttemptsAtStart !== usedAttempts` (and no pending queue).
4. Letters are display indices; answers stay option text.
5. Teacher editors unchanged.

## Phase 2: Task planning

Deferred to `/speckit-tasks`.
