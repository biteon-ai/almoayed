# Implementation Plan: Mobile Quiz Player Redesign

**Branch**: `030-quiz-player-ui` | **Date**: 2026-09-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/030-quiz-player-ui/spec.md`

**Feature IDs (registry)**: `UI-016`  
**Extends**: `QUIZ-001` · `QUIZ-004` · `UI-001` · `UI-014` · `OFFLINE-001`

## Summary

Restyle the in-progress student quiz-taking screen (`/quiz/[id]`) into a Udemy-like mobile player: slim sticky **exit + countdown** header, one immersive **question card** with lettered A/B/C/D rows in `#065f46` when selected, a **horizontal pager** plus dismissible **all-questions sheet** instead of the always-on sidebar grid, and a sticky **progress + submit** bar. Scoring, gatekeeper, timer fairness, offline drafts, and teacher screens stay unchanged.

**Technical approach**:
1. Keep `QuizRunner` as the client orchestrator (answers, timer tick, submit, offline restore). Replace the visual chrome; do not fork a second runner.
2. Fold `QuizTimerBadge` into `QuizPlayerHeader` (exit + `MM:SS` «الوقت المتبقي»). Reuse `formatRemainingMmSs` / `isWarningRemaining` from `src/lib/quiz-timer.ts`.
3. Restyle `QuestionCard` choice rows (`min-h-11`, circular letter badges, selected `#065f46`). Hide category chips until `showResult`.
4. Stop mounting `QuizSidebar` during taking. Add `QuestionPager` (horizontal scroll) + `QuestionJumpSheet` (existing `Dialog` bottom-sheet pattern from `PwaInstallSheet`). Extract pager status to a pure helper for Vitest.
5. Extend the existing `fixed bottom-16` action bar with answered-count / percent (`quiz-progress`) beside `quiz-submit-button`.
6. `AlertDialog` for exit copy; history `pushState` + `popstate` guard while in-progress so system Back matches the header. Flush `saveInProgress` before `router.push("/quizzes")`.
7. CSS fade/slide on `activeIndex` change; honor existing `prefers-reduced-motion` in `globals.css`. No new packages, no SQL.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for all educational levels and subjects

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — `QuizRunner` remains a client island |
| **Database** | **None new** — exam rows and submissions unchanged |
| **Data access** | Existing `submitQuiz` / `getQuizForStudent` only; no client Supabase |
| **Session / auth** | iron-session `requireStudent` on `/quiz/[id]` |
| **UI** | Tailwind, Shadcn `AlertDialog` + `Dialog`, semantic tokens, RTL |
| **Testing** | Vitest `[UI-016]` + Playwright phone smoke; keep `[QUIZ-001]` / `[QUIZ-004]` |
| **Target platform** | Student phone PWA; desktop uses the same player (no sidebar return) |

**Feature-specific overrides**:

- **Primary Dependencies**: none beyond stack defaults (no Vaul/Sheet package, no animation library)
- **Storage / tables touched**: existing IndexedDB `inProgress` (`saveInProgress` / `saveInProgressDebounced`). No SQL, no new object store, no `localStorage` keys
- **Performance Goals**: question jump &lt; 200ms perceived; choice tap must not await animation; header/timer always visible while scrolling the stem
- **Constraints**: QUIZ-001 (no `correct_answer` / explanations until submit); QUIZ-004 snapshot + 2-minute warning + auto-submit; MT-002 already enforced by `getQuizForStudent`; RTL; 44px (`min-h-11`) tap targets; sticky bar above `StudentBottomNav` (`bottom-16`)
- **Scale/Scope**: Student `/quiz/[id]` taking + on-page post-submit review chrome. Teacher quiz builder, `/results` list, and student tab bar on other routes are out of scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries / session | PASS — no new queries; page still uses `getQuizForStudent` + session `currentTeacherId` |
| QUIZ-001 | No answer leakage pre-submit | PASS — `QuestionCard` still receives `correctAnswer` / explanations only when `isSubmitted`; pager/sheet never show keys |
| Server layer | Privileged data via Server Actions | PASS — submit/grade stay on existing actions; chrome is client-only |
| RTL UX | Arabic RTL, Tajawal, touch targets | PASS — `dir="rtl"`, `min-h-11` (44px) meets `h-10`–`h-12`; Latin A–D badges as today |
| Passwordless | WhatsApp identity | PASS — no auth change |
| Minimal diff | Match existing patterns | PASS — restyle runner + extract helpers; reuse Dialog/AlertDialog; no new quiz framework |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — no migrations; in-progress draft is the existing IDB record; history guard is client-only and disabled after submit / during auto-submit; selected-state hex does not change the global brand palette.

## Project Structure

### Documentation (this feature)

```text
specs/030-quiz-player-ui/
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
src/components/quiz/QuizRunner.tsx              # EXTEND — new chrome, hide sidebar while taking
src/components/quiz/QuestionCard.tsx            # EXTEND — immersive card, #065f46 selected rows
src/components/quiz/QuizTimerBadge.tsx          # EXTEND or fold — header timer readout
src/components/quiz/QuizSidebar.tsx             # STOP mounting on taking layout
src/components/quiz/QuestionNavGrid.tsx         # REUSE inside jump sheet; bump tap size
src/components/quiz/QuizPlayerHeader.tsx        # NEW — exit + timer
src/components/quiz/QuestionPager.tsx           # NEW — horizontal numbers
src/components/quiz/QuestionJumpSheet.tsx       # NEW — Dialog bottom sheet
src/components/quiz/QuizExitDialog.tsx          # NEW — AlertDialog
src/lib/quiz-player.ts                          # NEW — pager status, letters, exit-guard, progress
src/lib/quiz-timer.ts                           # USE — MM:SS + warning
src/lib/offline/in-progress.ts                  # USE — flush on confirmed exit
src/lib/haptic.ts                               # USE — keep UI-014 pulses
src/app/globals.css                             # EXTEND — question-enter keyframes + reduced-motion
src/lib/spekit-targets.ts                       # EXTEND
.speckit/spekit-targets.yaml
.speckit/spec.yaml                              # UI-016

tests/features/ui-016-quiz-player.test.ts
e2e/ui-016-quiz-player.spec.ts                  # header, pager, no sidebar grid, submit bar
tests/features/quiz-001-gatekeeper.test.ts      # regression
tests/features/quiz-004-countdown-timer.test.ts # regression
```

**Structure decision**: Visual composition inside the existing runner. Pure helpers in `src/lib/quiz-player.ts` so Vitest does not need to mount the full runner for pager/exit/progress rules.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| none | — | — |

## Phase 0: Research

See [research.md](./research.md). All technical unknowns resolved (header vs app chrome, history-back confirm, selected hex vs brand teal, pager+sheet, CSS index motion, no SQL).

## Phase 1: Design

See [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

**Key decisions**:
1. Keep `StudentHeader` + bottom tabs; quiz sub-header replaces timer badge + sidebar, not the app shell.
2. Selected choice color is **exact `#065f46`**, not `brand-600` teal.
3. Pager always visible; jump sheet is the overview (reuse `QuestionNavGrid` at `min-h-11`).
4. Exit confirm + `popstate` guard only while in-progress (not after submit, not during expiry auto-submit).
5. Flush IndexedDB draft on confirm; navigate to `/quizzes`.
6. Question motion is CSS on `activeIndex`, not a route View Transition.

## Phase 2: Task planning

Deferred to `/speckit-tasks`.
