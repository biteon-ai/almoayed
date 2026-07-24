# Implementation Plan: Teacher Quiz Soft Delete & Trash

**Branch**: `016-quiz-soft-delete` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/016-quiz-soft-delete/spec.md` (Clarified 2026-07-24)

**Feature ID (registry)**: `TEACH-011` (extends `TEACH-003`)

## Summary

Add a two-step teacher quiz deletion lifecycle: soft delete via `quizzes.deleted_at` into a Trash tab, restore, and confirmation-gated permanent purge (cascade questions/attempts). Scope all mutations to the owning teacher; hide trashed quizzes from student catalogs while allowing mid-exam submit; show an in-Trash banner on edit deep links. Wire Spekit hooks and register TEACH-011.

**Technical approach**: Migration `012_quiz_soft_delete.sql` (`deleted_at` + indexes + KPI CTE filter); Server Actions in `teacher.ts`; student list filters in `quiz.ts`; extend `QuizManagement` / `QuizListItem` + edit banner; update types, `QUIZ_LIST_SELECT`, `.speckit/spec.yaml`, Spekit maps; Vitest + `npm run build`.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC, Server Actions |
| **Database** | **Supabase** PostgreSQL — migration `012_quiz_soft_delete.sql` |
| **Data access** | Server Actions + `createAdminClient()` |
| **Session / auth** | iron-session — `requireTeacher` / `requireStudent`; MT-002 via owner `created_by` / `currentTeacherId` |
| **UI** | Tailwind, Shadcn AlertDialog, RTL Tajawal, Spekit |
| **Testing** | Vitest `tests/features/teach-011-*.test.ts`; QUIZ-001 regression |
| **Target platform** | Mobile-first PWA |
| **Spec registry** | `.speckit/spec.yaml` → TEACH-011 |

**Feature-specific overrides**:

- **Primary Dependencies**: Existing stack only (no new packages).
- **Storage / tables touched**: `quizzes` (+ cascade delete to `questions`, `exam_submissions`, `student_answers`); KPI SQL functions that list teacher quizzes.
- **Performance Goals**: Soft delete / restore UI feedback within ~2s under normal conditions (SC-001); reuse server paging (no fetch-all).
- **Constraints**: Do not break MT-002, QUIZ-001 gatekeeper selects, RTL shell, Server Action writes; no bulk Trash; no auto-purge; `deleted_at` ≠ admin `is_archived`.
- **Scale/Scope**: Teacher quizzes list + edit deep link + student catalog filters; per-quiz actions only.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries | PASS — all trash ops filter `created_by = session.profileId` |
| QUIZ-001 | No answer leakage pre-submit | PASS — exam question selects unchanged; only catalog visibility changes |
| Server layer | Privileged data via server only | PASS — soft/restore/purge via Server Actions + admin client |
| RTL UX | Arabic RTL, touch, Spekit | PASS — tabs/actions/dialog Arabic; `quiz-delete-action` + related hooks |
| Minimal diff | Match existing patterns | PASS — extend QuizManagement AlertDialog + teacher.ts TEACH pattern |
| Passwordless | WhatsApp iron-session | PASS — no auth change |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — `deleted_at` isolated from admin archive; permanent delete only from Trash; student catalog filters soft-deleted; mid-exam path leaves `getQuizForStudent`/`submitQuiz` without `deleted_at` hard-reject; KPI SQL excludes trashed rows; Spekit/registry in delivery gate.

## Project Structure

### Documentation (this feature)

```text
specs/016-quiz-soft-delete/
├── spec.md
├── plan.md                 # This file
├── research.md             # Phase 0
├── data-model.md           # Phase 1
├── quickstart.md
├── contracts/
│   ├── server-actions.md
│   └── ui-components.md
└── tasks.md                # /speckit-tasks
```

### Source Code (planned touch points)

```text
supabase/migrations/
└── 012_quiz_soft_delete.sql          # deleted_at, indexes, KPI filter

src/types/database.ts                 # Quiz.deleted_at
src/lib/perf-selects.ts               # QUIZ_LIST_SELECT + deleted_at
src/lib/spekit-targets.ts             # quiz-delete-action, trash/restore/purge/banner
.speckit/spekit-targets.yaml
.speckit/spec.yaml                    # TEACH-011

src/actions/teacher.ts                # getTeacherQuizzes(view), soft/restore/permanent delete
src/actions/quiz.ts                   # catalog/home .is("deleted_at", null)

src/app/teacher/(portal)/quizzes/page.tsx          # searchParams.view
src/app/teacher/(portal)/quizzes/[id]/page.tsx    # trash banner props
src/components/teacher/QuizManagement.tsx          # tabs, trash actions, permanent AlertDialog
src/components/teacher/QuizListItem.tsx            # حذف action
src/components/teacher/QuizTrashBanner.tsx         # NEW (or inline on edit dashboard)

tests/features/teach-011-quiz-soft-delete.test.ts
```

**Structure decision**: Teacher mutations stay in `teacher.ts` (TEACH-003 home); student visibility filters in `quiz.ts`. Soft-delete marker is `deleted_at`, not `is_archived`. List uses `?view=trash` rather than a separate route.

## Complexity Tracking

> No constitution violations.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
