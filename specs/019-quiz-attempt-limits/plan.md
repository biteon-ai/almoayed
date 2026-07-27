# Implementation Plan: Quiz Attempt Limits & Category

**Branch**: `019-quiz-attempt-limits` | **Date**: 2026-07-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/019-quiz-attempt-limits/spec.md`

**Feature ID (registry)**: `QUIZ-005` (extends `TEACH-003` · `QUIZ-001` · `QUIZ-004` · `GAMIF-001`)

## Summary

Add teacher-configurable **quiz category** («نوع الاختبار»: practice / evaluation / challenge) and **max attempts** («عدد المحاولات المسموحة»: unlimited or 1–10) on quiz create/edit; enforce attempt caps server-side on `submitQuiz` and student entry; support multiple graded `exam_submissions` per student/quiz (drop single-row unique constraint); reset timed sessions on retakes (QUIZ-004); show attempt progress and review-only UX when exhausted; add challenge leaderboard (best score per student, teacher-scoped).

**Technical approach**: Migration `014_quiz_attempt_limits.sql`; helpers in `src/lib/quiz-attempts.ts`; teacher settings card + `createQuiz`/update; extend `getQuizForStudent` with `attemptState`; refactor `submitQuiz` + `ensureTimedQuizSession`; student card/runner copy; `getChallengeLeaderboard` action; Vitest + Spekit; update `.speckit/spec.yaml`; `npm run build`.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC, Server Actions |
| **Database** | **Supabase** PostgreSQL — migration `014_quiz_attempt_limits.sql` |
| **Data access** | Server Actions + `createAdminClient()` |
| **Session / auth** | iron-session — `requireTeacher` / `requireStudent` |
| **UI** | Tailwind, Shadcn, RTL Tajawal, Spekit |
| **Testing** | Vitest `tests/features/quiz-005-attempt-limits.test.ts` |
| **Target platform** | Mobile-first PWA |
| **Spec registry** | `.speckit/spec.yaml` → QUIZ-005 |

**Feature-specific overrides**:

- **Primary Dependencies**: Existing stack only.
- **Storage / tables touched**: `quizzes` (+ `assessment_category`, `max_attempts`); `exam_submissions` (drop `UNIQUE(student_id, quiz_id)`, add composite index); `quiz_timed_sessions` (lifecycle on retake).
- **Performance Goals**: Attempt count = indexed `COUNT(*)` or `count` query per student/quiz on load; leaderboard query bounded by teacher roster size (typical class ≤ 200).
- **Constraints**: QUIZ-001 gatekeeper unchanged pre-submit; MT-002 `created_by` / active teacher; do **not** rename existing `quiz_type` (`regular` / `session_group`); gamification uses existing `aggregateSubmissionStats` best-per-quiz; offline sync rejects over-limit submit.
- **Scale/Scope**: Teacher quiz create/edit + student catalog/runner/leaderboard; no admin analytics export; no global cross-quiz leaderboard.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md`

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries | PASS — settings on teacher-owned quizzes; leaderboard filtered by quiz owner + linked students |
| QUIZ-001 | No answer leakage pre-submit | PASS — fresh attempts still use `EXAM_QUESTION_SELECT_FIELDS`; review loads results post-submit only |
| Server layer | Privileged data via server only | PASS — attempt checks + leaderboard via Server Actions + admin client |
| RTL UX | Arabic RTL, touch, Spekit | PASS — Arabic category/attempt controls; student attempt badges; new Spekit hooks |
| Minimal diff | Match existing patterns | PASS — extend `QuizCreateForm`, quiz edit, `quiz.ts`, student cards |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — multiple submissions retained for history; best score derived in queries/helpers; timed session deleted before new attempt; gatekeeper intact; no client-side attempt bypass.

## Project Structure

### Documentation (this feature)

```text
specs/019-quiz-attempt-limits/
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
supabase/migrations/014_quiz_attempt_limits.sql
src/types/database.ts
src/lib/perf-selects.ts
src/lib/quiz-attempts.ts              # NEW validate / defaults / attemptState
src/actions/teacher.ts                  # create/update category + max_attempts
src/actions/quiz.ts                     # getQuizForStudent.attemptState, submitQuiz guard, leaderboard
src/components/teacher/QuizCreateForm.tsx
src/components/teacher/QuizAttemptSettings.tsx   # NEW (or extend timer card pattern)
src/components/teacher/quiz-editor/*    # edit route if separate from create
src/components/quiz/QuizRunnerContainer.tsx
src/components/student/StudentQuizGridCard.tsx
src/components/student/QuizCarouselCard.tsx
src/components/quiz/ChallengeLeaderboard.tsx     # NEW P2
src/lib/student-quiz-ui.ts
src/lib/offline/sync-processor.ts       # attempt-exhausted error path
src/lib/spekit-targets.ts
.speckit/spekit-targets.yaml
.speckit/spec.yaml
tests/features/quiz-005-attempt-limits.test.ts
```

**Structure decision**: Use `assessment_category` column name (not `quiz_type`) to avoid collision with audience enum. Drop single-submission unique constraint rather than upsert-overwrite so attempt history and leaderboard tie-breaks remain auditable. Reuse `aggregateSubmissionStats` for gamification best-score.

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
