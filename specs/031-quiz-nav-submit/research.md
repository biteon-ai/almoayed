# Research: Quiz Navigation and Safe Submit

**Date**: 2026-09-21  
**Status**: Complete — all Technical Context items resolved

## 1. RTL Previous / Next visual order

**Decision**: Keep click meaning: «التالي» → `activeIndex + 1`, «السابق» → `activeIndex - 1`. Place **«التالي» on the RTL start side (right)** as the forward exam control and **«السابق» on the end side (left)**. Implement as DOM order `[التالي] [n / N] [السابق]` inside `dir="rtl"` flex (first item = start). Disable with `disabled` + `aria-disabled`, not by hiding. Extract `QuestionStepNav`. Chevrons: physical arrows that match the control’s side (التالي uses a start-pointing chevron in RTL). Do not swap handlers to “fix” icons.

**Rationale**: Today’s row puts «السابق» first in the DOM, so in RTL it sits on the right — the start/primary slot — which reads as “back” occupying the forward position. Spec FR-002/FR-004 care about truthful labels and forward/back exam order.

**Alternatives considered**:
- Keep current DOM order — fails the “التالي directs forward” layout request.
- Sticky floating pair over the submit bar — extra overlap with `bottom-16`; spec allows under-card, which already exists.

## 2. Completeness gate

**Decision**: `isQuizComplete({ answers, questionIds })` is true iff `questionIds.length > 0` and every id has `String(answers[id] ?? "").trim() !== ""`. Do **not** use `Object.keys(answers).length === questions.length` (stale keys / extra ids can lie). Submit button stays mounted, `disabled={!complete || isPending}`, hint «أجب على جميع الأسئلة» or «متبقي {n} أسئلة». Existing `submitAttempt` validation remains a second line of defense.

**Rationale**: Spec assumes visible-but-disabled submit. Client gate prevents accidental tap-through (SC-002) without changing the server.

**Alternatives considered**:
- Hide the button until complete — spec allows it, but discoverability of “how the exam ends” is worse.
- Completeness = answeredCount only — brittle.

## 3. Submit confirmation vs QUIZ-004

**Decision**: New `QuizSubmitDialog` (`AlertDialog`). Manual `handleSubmit` only `setSubmitOpen(true)` when complete. Confirm runs `submitAttempt({ forceTimedExpiry: false })` (online grade or offline enqueue). Cancel closes the dialog, no enqueue. `submitAttempt({ forceTimedExpiry: true })` never opens the dialog. If `timeExpiredNotice` or `timeLocked` becomes true while open, set `submitOpen` false.

**Rationale**: FR-008–FR-010. Reuse exit-dialog pattern; no `window.confirm` (not styled, not RTL-reliable).

**Alternatives considered**:
- `window.confirm` — fails native-feeling Arabic modal.
- Confirm also on auto-submit — would block expiry (rejected by spec).

## 4. Centered layout without harming stem readability

**Decision**: Center the **badge row** (`justify-center text-center`) on `QuestionCard`. Keep the stem and choices `text-start` so long Arabic/math stays readable. Player column already `max-w-3xl mx-auto`. Header: CSS grid `grid-cols-[2.75rem_1fr_2.75rem]` — exit in start cell, timer centered in the middle, empty end cell for symmetry.

**Rationale**: SC-004 is about the badge and chrome, not forcing every paragraph to center.

**Alternatives considered**:
- `text-center` on the stem — hurts multi-line questions and math.
- Hiding StudentHeader on quiz — out of scope (UI-016 decision).

## 5. كل الأسئلة

**Decision**: Keep `QuestionJumpSheet` + toolbar button copy «كل الأسئلة». No behavior change except ensuring the control stays while step nav and gated submit ship.

**Rationale**: US4 is preserve-not-rebuild.

## 6. Tests and Spekit

**Decision**: Vitest `[UI-017]` for `isQuizComplete` and `stepNavState`. Playwright: prev disabled on Q1, next advances, submit disabled with a blank, confirm dialog copy, cancel does not leave `/quiz/`. Regression `[QUIZ-001]`, `[QUIZ-004]`, `[UI-016]` helpers. New Spekit: `quiz-step-prev`, `quiz-step-next`, `quiz-submit-confirm`. Reuse `quiz-submit-button`, `quiz-jump-sheet`, `quiz-player-header`, `question-card`.
