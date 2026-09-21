# Implementation Plan: Quiz Navigation and Safe Submit

**Branch**: `031-quiz-nav-submit` | **Date**: 2026-09-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/031-quiz-nav-submit/spec.md`

**Feature IDs (registry)**: `UI-017`  
**Extends**: `UI-016` · `QUIZ-001` · `QUIZ-004`

## Summary

Polish the UI-016 student quiz player: prominent RTL-correct «السابق» / «التالي» under the card, centered badge/header/timer chrome, keep «كل الأسئلة», gate «تسليم الإجابات وإنهاء الاختبار» until every question is answered, then confirm before grading. Timer auto-submit does not use the new dialog.

**Technical approach**:
1. Extend `src/lib/quiz-player.ts` with `isQuizComplete` (every `questionId` has a non-empty answer) and `stepNavState` (canPrev / canNext).
2. Extract `QuestionStepNav` (`min-h-11`): «التالي» is the start-side (RTL right) forward control (`activeIndex + 1`); «السابق» is the end-side back control. Disable at first/last. Spekit `quiz-step-prev` / `quiz-step-next`.
3. `QuizSubmitDialog` (`AlertDialog`, same pattern as `QuizExitDialog`) with the spec copy; `handleSubmit` only opens it; confirm calls existing `submitAttempt({ forceTimedExpiry: false })`.
4. Sticky submit stays visible but `disabled` until `isQuizComplete`; Arabic hint `{remaining} أسئلة متبقية`. Auto-submit / expiry closes the dialog and skips confirm.
5. Center the question badge row; 3-column header (exit | centered timer | equal-width spacer). No SQL, no new packages.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for all educational levels and subjects

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** — client island `QuizRunner` |
| **Database** | **None new** |
| **Data access** | Existing `submitQuiz` only |
| **UI** | Tailwind, Shadcn `AlertDialog`, Spekit |
| **Testing** | Vitest `[UI-017]` + Playwright Pixel-7; keep `[QUIZ-001]` / `[QUIZ-004]` / `[UI-016]` |
| **Target platform** | Student `/quiz/[id]` phone player |

**Feature-specific overrides**:

- **Primary Dependencies**: none beyond stack defaults
- **Storage / tables touched**: none (in-progress IDB unchanged)
- **Performance Goals**: step navigation &lt; 200ms perceived; confirm must not delay auto-submit
- **Constraints**: QUIZ-001 gatekeeper; QUIZ-004 auto-submit without confirm; 44px (`min-h-11`); RTL labels must match direction
- **Scale/Scope**: Taking + on-page review chrome only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md`

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries | PASS — no new queries |
| QUIZ-001 | No answer leakage pre-submit | PASS — confirm does not reveal solutions; grading still after `submitQuiz` |
| Server layer | Server Actions only | PASS — existing submit path |
| RTL UX | Arabic RTL, 44px targets | PASS — `min-h-11`; التالي/السابق mapped to index ±1 |
| Passwordless | WhatsApp identity | PASS |
| Minimal diff | Match existing patterns | PASS — extend `quiz-player.ts` + runner chrome; reuse AlertDialog |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — completeness is a client gate in addition to existing server/validation; expiry still calls `submitAttempt({ forceTimedExpiry: true })` without the dialog.

## Project Structure

### Documentation (this feature)

```text
specs/031-quiz-nav-submit/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ui-components.md
│   └── client-state.md
└── tasks.md                    # via /speckit-tasks
```

### Source Code (planned touch points)

```text
src/lib/quiz-player.ts                          # EXTEND — isQuizComplete, stepNavState
src/components/quiz/QuestionStepNav.tsx         # NEW — السابق / التالي pair
src/components/quiz/QuizSubmitDialog.tsx        # NEW — confirm before manual submit
src/components/quiz/QuizRunner.tsx              # EXTEND — gate submit, confirm, step nav, keep jump sheet
src/components/quiz/QuestionCard.tsx            # EXTEND — center badge row
src/components/quiz/QuizPlayerHeader.tsx        # EXTEND — 3-column balanced timer
src/lib/spekit-targets.ts                       # EXTEND
.speckit/spekit-targets.yaml
.speckit/spec.yaml                              # UI-017

tests/features/ui-017-quiz-nav-submit.test.ts
e2e/ui-017-quiz-nav-submit.spec.ts
```

**Structure decision**: Pure completeness/step helpers in `quiz-player.ts` for Vitest. Dialogs stay presentational; `QuizRunner` remains the only orchestrator.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| none | — | — |

## Phase 0: Research

See [research.md](./research.md). Resolved: RTL visual order, completeness check vs `Object.keys` count, confirm vs auto-submit, centered badge vs stem alignment.

## Phase 1: Design

See [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

**Key decisions**:
1. Completeness = every `questionId` has a non-empty answer (not `Object.keys(answers).length`).
2. Submit **visible + disabled** until complete; hint with remaining count.
3. Manual submit → dialog; expiry auto-submit skips dialog and dismisses it if open.
4. «التالي» on RTL **start** (right); «السابق» on **end** (left); handlers `±1`.
5. Badge row centered; stem stays `text-start` for readable Arabic; header uses equal side columns so the timer sits in the middle.

## Phase 2: Task planning

Deferred to `/speckit-tasks`.
