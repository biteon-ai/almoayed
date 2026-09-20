# Research: Mobile Quiz Player Redesign

**Date**: 2026-09-20  
**Status**: Complete — all Technical Context items resolved

## 1. Keep the runner; replace chrome

**Decision**: `QuizRunner` remains the single client orchestrator (answers map, `activeIndex`, timer interval, `submitQuiz`, offline restore/pending sync, haptic pulses). New presentational pieces (`QuizPlayerHeader`, `QuestionPager`, `QuestionJumpSheet`, `QuizExitDialog`) compose inside it. Do not create a parallel player page.

**Rationale**: Submit, QUIZ-004 auto-submit, OFFLINE-001 restore, and QUIZ-001 `showResult` gating already live here. A rewrite would risk gatekeeper and timer regressions (constitution: minimal diff).

**Alternatives considered**:
- New `/quiz/[id]/play` route — splits restore/submit logic and breaks existing links.
- Server-rendered one-question-per-URL — fights in-progress IDB and timer snapshot.

## 2. App header vs quiz sub-header

**Decision**: Keep `StudentHeader` (gear / appearance / identity) and `StudentBottomNav`. Add a **slim quiz sub-header** (exit + timer) that **replaces** the standalone `QuizTimerBadge` strip and the `QuizSidebar` title/progress cards. Do not hide the student shell on `/quiz/[id]`.

**Rationale**: UI-013 drawer and UI-012 chrome still need the gear. Spec clutter is the brand/progress/grid **cards**, not the global shell. Submit bar already uses `bottom-16` above tabs (UI-014).

**Alternatives considered**:
- Full-screen player hiding student header/tabs — more Udemy-like, but breaks drawer/theme and contradicts “submit bar above tab bar”.
- Put timer in `StudentHeader` — couples global chrome to quiz-only state.

## 3. Exit confirmation and system Back

**Decision**: Shadcn `AlertDialog` (same pattern as `LogoutConfirmButton`) with Arabic title/description «هل أنت متأكد أنك تريد الخروج؟ سيتم حفظ تقدّمك.» Actions: «بقاء» (cancel) / «خروج» (confirm).

While `!isSubmitted && !pendingSync && questions.length > 0 && !timeExpiredNotice`, push a sentinel `history` entry on mount and intercept `popstate` to **re-push** and open the same dialog (does not call `preventDefault` on popstate — restore the extra entry instead). Header exit opens the dialog without touching history.

On confirm: `await saveInProgress(quizId, { answers, activeIndex })` (flush debounce), then `router.push("/quizzes")`. On cancel: stay on the current question.

Disable the guard after submit and while expiry auto-submit is running so Back does not fight grading.

**Rationale**: `beforeunload` cannot show custom Arabic copy. Spec requires header **and** system Back. `/quizzes` is the natural list the student came from more often than dashboard.

**Alternatives considered**:
- Header-only confirm — fails FR-002 for swipe-back.
- `router.back()` after confirm — may leave the sentinel and bounce into the dialog again.
- Confirm on tab-bar taps — out of spec; would trap students in the quiz.

## 4. Timer in the sub-header

**Decision**: Move the existing sticky timer UI into the sub-header. Keep `role="timer"`, `aria-live="polite"`, `data-spekit=quiz-timer`, `formatRemainingMmSs`, `isWarningRemaining` (≤ 120s), and untimed = omit. Warning uses a **soft** amber/rose accent (already on the badge); do not overlay the question.

**Rationale**: QUIZ-004 acceptance already specifies MM:SS, 2-minute warning, no reset on refresh. Only the chrome location changes.

**Alternatives considered**:
- Keep a floating badge plus a header clock — duplicate clutter.
- Change the 2-minute threshold — rejected by spec assumptions.

## 5. Selected choice color `#065f46`

**Decision**: Selected (pre-submit) row border/background tint and letter-badge fill use **exact `#065f46`** with white letter text. Do **not** use `brand-600` (`#0d6e6e`) or `brand-800` (`#0b4747`). Unselected rows stay muted semantic surfaces. Post-submit correct/wrong colors stay as today’s green/red review treatment. Dark appearance: keep `#065f46` + white glyph (still WCAG-ish on the badge); card surface follows `.dark` tokens.

**Rationale**: Spec FR-008 is an explicit brand call, distinct from the teal shell.

**Alternatives considered**:
- Map to nearest `brand-*` — visually different from the request.
- Change global `brand` palette — out of scope and would restyle the whole app.

## 6. Pager + jump sheet instead of sidebar

**Decision**: Do not mount `QuizSidebar` during taking (phone **or** desktop). Always show a horizontal `QuestionPager` (`overflow-x-auto`, `flex-nowrap`, RTL, `min-h-11` chips). A compact «كل الأسئلة» control opens `QuestionJumpSheet` — `Dialog` with the same bottom-sheet classes as `PwaInstallSheet` (`bottom-16` so tabs remain). Sheet content reuses `QuestionNavGrid` (export/share `getQuestionStatus` via `src/lib/quiz-player.ts`). Dismiss on jump, backdrop, or close.

Empty quiz: no pager, no sheet, no enabled submit (existing empty card).

**Rationale**: Spec wants pager **and** an overview sheet; the grid is valuable for 30+ questions if it is not occupying the canvas.

**Alternatives considered**:
- Pager only — weaker overview on long exams (FR-011).
- New Vaul/Sheet dependency — Dialog already used for A2HS sheet.
- Keep sidebar on `md+` — spec says the same player, not a two-layout product.

## 7. Question switch motion

**Decision**: CSS class on the card wrapper keyed by `activeIndex` (short opacity + 8–12px inline-start-aware translate, ~180–220ms). Register `quiz-question-enter` in `globals.css` and disable it in the existing `@media (prefers-reduced-motion: reduce)` block. This is **not** a Next.js View Transition (index change is local state, not a route).

**Rationale**: `(student)/template.tsx` already animates **route** changes (UI-014). Intra-quiz jumps never remount the page.

**Alternatives considered**:
- `startViewTransition` around `setActiveIndex` — extra complexity; reduced-motion still needed.
- No animation — fails FR-016.

## 8. Sticky action bar

**Decision**: Keep `fixed inset-x-0 bottom-16 z-40 … md:bottom-0` from UI-014. Add a progress line (`N من M` and/or percent) using existing `answeredCount` / `progress`. Primary CTA copy unchanged. Hide the bar when submitted, pending-sync, time-locked, or empty. Flush-save still happens via debounce on answer; submit path unchanged.

**Rationale**: Spec FR-012 is an extension of the bar that already exists.

**Alternatives considered**:
- Move submit into the header — fights thumb reach and UI-014.

## 9. Previous / next

**Decision**: Keep compact السابق / التالي under the card (`min-h-11`), disabled at ends. Pager is the primary jump; prev/next are optional extras allowed by the spec.

**Rationale**: Already implemented; cheap to keep; helps one-handed step without hunting numbers.

## 10. Post-submit and offline

**Decision**: After submit, hide exit-guard and submit bar; keep header back as a **plain** navigate to `/quizzes` (no save dialog). Card `showResult` + WhatsApp share + review copy stay. Pending-sync and expiry notice cards stay above the question.

**Rationale**: FR-014 / FR-018: restyle chrome, do not redesign results or sync.

## 11. Tests and Spekit

**Decision**: Extract pure functions (`optionLetter`, `questionNavStatus`, `answeredProgress`, `shouldConfirmQuizExit`) to `src/lib/quiz-player.ts`. Vitest `[UI-016]`. Playwright Pixel-7: header+timer, no sidebar grid, pager jump, choice min height, submit bar visible. Always run `[QUIZ-001]` and `[QUIZ-004]` unit files as regression.

New Spekit keys: `quiz-player-header`, `quiz-exit-button`, `quiz-exit-dialog`, `quiz-question-pager`, `quiz-jump-sheet`. Reuse `quiz-timer`, `question-card`, `quiz-submit-button`, `quiz-progress`, `quiz-page`.
