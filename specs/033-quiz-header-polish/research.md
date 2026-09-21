# Research: Quiz Header Polish

**Date**: 2026-09-21  
**Status**: Complete — all Technical Context items resolved

## 1. Physical left/right in an RTL app

**Decision**: Keep the card-header action row `dir="ltr"` (same as UI-017 pager). DOM order is `[compact submit] [pager]`. Pager wraps with `ms-auto` so it stays on the **visual right** even if the submit control is short. Do **not** rely on RTL flex start/end for this row — the spec defines visual left/right as physical screen sides.

**Rationale**: FR-001/FR-002. CSS logical “start” in `dir="rtl"` would put the first child on the right, which is the opposite of “submit left, stepper right.”

**Alternatives considered**:
- `dir="rtl"` + `flex-row-reverse` — easy to invert again when a child sets `dir`.
- Absolute-position the pager — brittle with compact submit text.

## 2. Always-visible submit vs last-question-only

**Decision**: While taking (`!isSubmitted && !pendingSync && !timeLocked && questions.length > 0`), compact submit is **always mounted**. Enable iff `isQuizComplete`. Label «تسليم» (plus a small Flag or Check icon). Offline taking uses the same «تسليم»; pending spinner may still say «جاري الحفظ...». Do not use «تسليم الإجابات وإنهاء الاختبار» in this slot. Empty quiz: do not mount a successful-grade CTA.

**Rationale**: FR-003–FR-006 override UI-017’s “show on last question or when complete.” Discoverability of how the exam ends, plus a stable right-aligned stepper, needs a constant left slot.

**Alternatives considered**:
- Keep last-question-only visibility — fails FR-004 and re-centers the stepper mid-quiz.
- `flex-1` long submit — crowds the pager (current pain).

## 3. Disabled tap vs unanswered dialog

**Decision**: Compact submit `disabled={!complete || isPending}`. A disabled control does not open `QuizSubmitDialog` or `QuizUnansweredDialog`. `handleSubmit` may keep a complete-only guard as defense in depth. Timed auto-submit still skips both dialogs. Do not delete `QuizUnansweredDialog` in this feature unless it has no remaining callers after the CTA is gated (unwire first; leftover file is optional cleanup, not required).

**Rationale**: FR-005: faded, not tappable, no confirm, no grade. UI-017’s “submit anyway” path would contradict 100% gating.

**Alternatives considered**:
- Keep unanswered dialog on incomplete tap — contradicts FR-005.
- Hide until complete — worse than disabled-visible (spec chose always shown).

## 4. Timer countdown bar vs answered-progress bar

**Decision**: Two different bars:
- **Answered progress** (`QuizProgressBar`, Spekit `quiz-progress`) stays under the card-header stepper (UI-017).
- **Time remaining** is a new thin bar in `QuizTimerBadge` under the MM:SS + «الوقت المتبقي» row. Spekit `quiz-timer-bar`. Fill width = `remainingTimeFraction * 100%`. Formula: `clamp(remainingSeconds / (durationMinutes * 60), 0, 1)`. Duration is this attempt’s full duration (`TimedQuizSessionView.durationMinutes`), so leave/return leftover time still maps correctly. Untimed: no badge bar. After submit, header already hides the live timer.

Warning: when `isWarningRemaining(remainingSeconds)` (≤120s, not expired), bar track/fill use the same rose accent as the digits. Expired: width 0, not a looping animation.

**Rationale**: FR-008–FR-010. Reusing `quiz-progress` would mix “questions answered” with “time left” for Spekit and a11y.

**Alternatives considered**:
- One bar that means both — ambiguous.
- Bar beside the digits in the same row — squeezes MM:SS on ~390px; under-row is safer.
- CSS-only `animation` from 100%→0 over durationMinutes — drifts after backgrounding; tick from `remainingSeconds` stays honest.

## 5. «كل الأسئلة» polish

**Decision**: Restyle the header control only: `min-h-11`, similar vertical padding to the compact timer, `rounded-xl`, `text-xs font-bold`, subtle border/muted fill so it is not a leftover chip and not as heavy as primary submit. Keep copy «كل الأسئلة» + grid icon. Add Spekit `quiz-all-questions` on the button. `QuestionJumpSheet` behavior unchanged.

**Rationale**: FR-011 / US3. Header already places the control in the end column (visual left in RTL grid) beside the centered timer.

**Alternatives considered**:
- Icon-only — loses the Arabic label the spec keeps.
- Move into the card header — fights the submit/stepper row.

## 6. Tests and Spekit

**Decision**:
- Vitest `[UI-018]` for `remainingTimeFraction` (start/mid/≤2 min/zero; untimed N/A; invalid duration → 0).
- Playwright `[UI-018]`: ~390px; submit left + pager right; submit disabled with a blank; enables after last answer; confirm copy; timer bar present on timed, absent on untimed; «كل الأسئلة» opens the sheet.
- Regression: `[UI-017]` confirm, `[QUIZ-004]` auto-submit, `[QUIZ-001]` no solutions before submit, `[UI-016]` exit dialog.
- Spekit: `quiz-timer-bar`, `quiz-all-questions`. Reuse `quiz-submit-button`, `quiz-question-pager`, `quiz-timer`, `quiz-progress`, `quiz-jump-sheet`, `quiz-submit-confirm`.
