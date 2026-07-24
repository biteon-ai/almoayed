# Implementation Plan: Quiz Countdown Timer

**Branch**: `018-quiz-countdown-timer` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/018-quiz-countdown-timer/spec.md` (Clarified 2026-07-24)

**Feature ID (registry)**: `QUIZ-004` (extends `TEACH-003` · `QUIZ-001`)

## Summary

Add teacher-configurable quiz timers (`is_timed` + `duration_minutes` 1–180) and a student sticky `MM:SS` countdown driven by a server-side `quiz_timed_sessions` start snapshot so refresh cannot reset time; at expiry (or late reopen) lock answers, show Arabic notice, auto-submit via existing `submitQuiz`, and preserve QUIZ-001 gatekeeper.

**Technical approach**: Migration `013_quiz_timer.sql`; helpers in `src/lib/quiz-timer.ts`; teacher form + `createQuiz`/update; `ensureTimedQuizSession` + timer payload on `getQuizForStudent`; `QuizRunner` badge + auto-submit; Vitest + Spekit `quiz-timer`; update `.speckit/spec.yaml`; `npm run build`.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC, Server Actions |
| **Database** | **Supabase** PostgreSQL — migration `013_quiz_timer.sql` |
| **Data access** | Server Actions + `createAdminClient()` |
| **Session / auth** | iron-session — `requireTeacher` / `requireStudent` |
| **UI** | Tailwind, Shadcn, RTL Tajawal, Spekit |
| **Testing** | Vitest `tests/features/quiz-004-countdown-timer.test.ts` |
| **Target platform** | Mobile-first PWA |
| **Spec registry** | `.speckit/spec.yaml` → QUIZ-004 |

**Feature-specific overrides**:

- **Primary Dependencies**: Existing stack only.
- **Storage / tables touched**: `quizzes` (+ `is_timed`, `duration_minutes`); new `quiz_timed_sessions`.
- **Performance Goals**: Timer remaining computed in O(1) from session row; badge updates client-side each second without extra network.
- **Constraints**: QUIZ-001 gatekeeper selects unchanged pre-submit; MT-002 `created_by` / active teacher; wall-clock fairness; duration snapshot FR-015; server rejects post-deadline answer **mutations** (submit still allowed); RTL + `quiz-timer` Spekit.
- **Scale/Scope**: Whole-quiz timer only; no per-question timer, pause, or teacher live proctoring.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries | PASS — timer settings on teacher-owned quizzes; student load via active teacher |
| QUIZ-001 | No answer leakage pre-submit | PASS — exam question select unchanged; timer payload has no grading fields |
| Server layer | Privileged data via server only | PASS — session start + submit via Server Actions + admin client |
| RTL UX | Arabic RTL, touch, Spekit | PASS — Arabic controls; sticky badge; `quiz-timer` |
| Minimal diff | Match existing patterns | PASS — extend create form, `quiz.ts`, `QuizRunner` |
| Passwordless | WhatsApp iron-session | PASS — no auth redesign |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — `quiz_timed_sessions` stores start + snapshot; deadline math server-side; late reopen auto-submits; `submitQuiz` remains the only grade path; gatekeeper intact; offline uses existing pending queue without resetting start.

## Project Structure

### Documentation (this feature)

```text
specs/018-quiz-countdown-timer/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── server-actions.md
│   └── ui-components.md
└── tasks.md                # /speckit-tasks
```

### Source Code (planned touch points)

```text
supabase/migrations/013_quiz_timer.sql
src/types/database.ts
src/lib/perf-selects.ts                 # QUIZ_LIST_SELECT + timer columns
src/lib/quiz-timer.ts                   # NEW format / validate / remaining
src/actions/teacher.ts                  # create/update timer fields
src/actions/quiz.ts                     # ensureTimedQuizSession, getQuizForStudent.timer, submitQuiz
src/components/teacher/QuizCreateForm.tsx
src/components/teacher/*edit flags*     # wherever quiz metadata is edited
src/components/quiz/QuizTimerBadge.tsx  # NEW sticky badge
src/components/quiz/QuizRunner.tsx
src/app/(student)/quiz/[id]/page.tsx
src/lib/spekit-targets.ts
.speckit/spekit-targets.yaml
.speckit/spec.yaml
tests/features/quiz-004-countdown-timer.test.ts
```

**Structure decision**: Prefer dedicated `quiz_timed_sessions` over overloading `exam_submissions`. Prefer pure `quiz-timer` helpers. Prefer extending `QuizRunner` with a small `QuizTimerBadge` child.

## Complexity Tracking

> No constitution violations.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 / Phase 1 outputs

| Artifact | Path |
|----------|------|
| Research | [research.md](./research.md) |
| Data model | [data-model.md](./data-model.md) |
| Contracts | [contracts/](./contracts/) |
| Quickstart | [quickstart.md](./quickstart.md) |

**Next**: `/speckit-tasks` → `/speckit-implement`
