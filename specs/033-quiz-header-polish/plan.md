# Implementation Plan: Quiz Header Polish

**Branch**: `033-quiz-header-polish` | **Date**: 2026-09-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/033-quiz-header-polish/spec.md`

**Feature IDs (registry)**: `UI-018`  
**Extends**: `UI-017` · `UI-016` · `QUIZ-004` · `QUIZ-001`

## Summary

Finish the student quiz taking chrome: pin the card-header stepper to the **visual right**, always show a compact **«تسليم»** on the **visual left** of that row (disabled until every question is answered), add a thin remaining-time bar under the timer digits, and restyle «كل الأسئلة» so it matches the timer cluster.

**Technical approach**:
1. Card-header row stays `dir="ltr"` (physical left/right as specified). Compact submit is the first child (`shrink-0`); `QuestionPager` is `ms-auto` on the right. Drop the “last question or complete” visibility gate — show submit for the whole taking session.
2. Enable with existing `isQuizComplete`. Disabled: `disabled` + faded (`opacity-50 cursor-not-allowed`). Incomplete tap is a no-op (do not open `QuizUnansweredDialog`). Enabled tap still opens `QuizSubmitDialog`. Timed expiry still calls `submitAttempt({ forceTimedExpiry: true })` without confirm.
3. Pure `remainingTimeFraction(remainingSeconds, durationMinutes)` in `quiz-timer.ts`. `QuizTimerBadge` renders a thin bar under the MM:SS row (timed taking only); fill = remaining ÷ attempt duration; warning uses the same rose treatment as the digits.
4. Polish «كل الأسئلة» in `QuizPlayerHeader` (weight/padding aligned with the timer). Jump-sheet behavior unchanged. No SQL, no new packages.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for all educational levels and subjects

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** — client island `QuizRunner` |
| **Database** | **None new** |
| **Data access** | Existing `submitQuiz` only |
| **UI** | Tailwind, Shadcn `Button` / `AlertDialog`, Spekit |
| **Testing** | Vitest `[UI-018]` + Playwright Pixel-7; keep `[UI-017]` / `[UI-016]` / `[QUIZ-001]` / `[QUIZ-004]` |
| **Target platform** | Student `/quiz/[id]` phone player (~390px) |

**Feature-specific overrides**:

- **Primary Dependencies**: none beyond stack defaults
- **Storage / tables touched**: none (IDB drafts unchanged)
- **Performance Goals**: submit enable within 1s of last answer (SC-002); countdown bar within 5 percentage points of true remaining fraction (SC-004)
- **Constraints**: QUIZ-001 gatekeeper; QUIZ-004 auto-submit without confirm; visual left/right = physical screen sides (`dir="ltr"` on the card-header row); tap height `min-h-11`
- **Scale/Scope**: Taking chrome only; review-after-submit does not show compact taking submit or a live shrinking bar

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md`

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries | PASS — no new queries |
| QUIZ-001 | No answer leakage pre-submit | PASS — chrome only; grading still after `submitQuiz` |
| Server layer | Server Actions only | PASS — existing submit path |
| RTL UX | Arabic RTL, 44px targets | PASS — compact «تسليم» stays `min-h-11`; physical L/R via `dir="ltr"` on the action row |
| Passwordless | WhatsApp identity | PASS |
| Minimal diff | Match existing patterns | PASS — extend header/badge/runner; reuse `isQuizComplete` + `QuizSubmitDialog` |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — completeness remains a client gate on top of existing submit validation; expiry still bypasses confirm; answered-progress bar under the stepper (`quiz-progress`) stays; the new timer bar is a separate Spekit surface.

## Project Structure

### Documentation (this feature)

```text
specs/033-quiz-header-polish/
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
src/lib/quiz-timer.ts                           # EXTEND — remainingTimeFraction
src/components/quiz/QuizTimerBadge.tsx          # EXTEND — thin countdown bar
src/components/quiz/QuizPlayerHeader.tsx        # EXTEND — pass duration; polish كل الأسئلة
src/components/quiz/QuizRunner.tsx              # EXTEND — always-visible gated compact submit; pin stepper right
src/lib/spekit-targets.ts                       # EXTEND — quiz-timer-bar, quiz-all-questions
.speckit/spekit-targets.yaml
.speckit/spec.yaml                              # UI-018

tests/features/ui-018-quiz-header-polish.test.ts
e2e/ui-018-quiz-header-polish.spec.ts
```

**Structure decision**: Timer math stays in `quiz-timer.ts` (QUIZ-004). Completeness stays in `quiz-player.ts` (UI-017). `QuizRunner` remains the only orchestrator. No new tables.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| none | — | — |

## Phase 0: Research

See [research.md](./research.md). Resolved: physical left/right vs RTL, always-visible vs last-question submit, timer bar vs answered-progress bar, unanswered dialog unwired from this CTA.

## Phase 1: Design

See [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

**Key decisions**:
1. Card-header row `dir="ltr"`: compact «تسليم» visual left, stepper `ms-auto` visual right — including mid-quiz, not only last question.
2. Submit **visible + disabled** until `isQuizComplete`; incomplete tap does not open confirm or the unanswered dialog.
3. Countdown bar fill = `remainingSeconds / (durationMinutes * 60)`; hide on untimed; warning matches digits (`isWarningRemaining`).
4. Keep UI-017 answered-progress under the stepper (`quiz-progress`). New Spekit `quiz-timer-bar` on the timer bar.
5. «كل الأسئلة» restyle only; jump-sheet unchanged.

## Phase 2: Task planning

Deferred to `/speckit-tasks`.
