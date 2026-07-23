# Implementation Plan: Teacher-Driven Gamification & Ranking

**Branch**: `011-teacher-gamification` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-teacher-gamification/spec.md`

**Feature ID (registry)**: `GAMIF-001` — teacher-configured level tiers + student level/progress/badges (active teacher scoped).

## Summary

Teachers configure ordered level tiers (name, min distinct completed quizzes, min average score %, reward icon) under settings. Students see a Level Progress card (bottleneck progress bar + Arabic remaining copy) and a badge gallery on `/dashboard`, plus a compact summary on `/results`, only when the **active** teacher has ≥1 tier. Stats are derived live from `exam_submissions` joined to that teacher’s quizzes — no permanent unlock table.

**Technical approach**: Migration `007_gamification_tiers.sql` adds `gamification_tiers`; pure helpers in `src/lib/teacher-gamification.ts` (keep existing streak helper `student-gamification.ts` separate); Server Actions for tier CRUD + student status; teacher UI at `/teacher/settings/gamification`; mount student components in dashboard/results; Spekit + `.speckit/spec.yaml`.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC, Server Actions, `src/app/` |
| **Database** | **Supabase** PostgreSQL — migration `007_gamification_tiers.sql` |
| **Data access** | Server Actions + `createAdminClient()` |
| **Session / auth** | iron-session — `requireTeacher` / `requireStudent` + `currentTeacherId` |
| **UI** | Tailwind, Shadcn/Base UI, RTL, touch targets `h-10`–`h-12` |
| **Testing** | Vitest (`tests/features/gamif-001-*.test.ts`), optional Playwright smoke |
| **Target platform** | Mobile-first PWA |
| **Spec registry** | `.speckit/spec.yaml` (+ `GAMIF-001`) |

**Feature-specific overrides**:

- **Primary Dependencies**: none beyond stack defaults
- **Storage / tables touched**: new `gamification_tiers`; read `exam_submissions`, `quizzes`, `student_teachers`
- **Performance Goals**: Student status compute ≤1s for typical classroom (≤100 quizzes / student under one teacher); tier save &lt;2s for ≤20 levels
- **Constraints**: MT-002 scope on all reads/writes; QUIZ-001 unchanged (gamification uses post-submit scores only); max 20 tiers; no Pro gate; hide UI when zero tiers
- **Scale/Scope**: ~12–18 files — migration, lib helper, actions, teacher settings page/component, 2 student components, wire dashboard/results, Spekit, tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries filter by session | PASS — tiers `.eq("teacher_id", session.profileId)`; student stats use `currentTeacherId` + link ownership |
| QUIZ-001 | No answer leakage pre-submit | PASS — uses only completed `exam_submissions.score`; does not expose correct answers |
| Server layer | Privileged data via server only | PASS — Server Actions + admin client |
| RTL UX | Arabic RTL, touch targets | PASS — contracts specify Arabic labels + mobile settings builder |
| Minimal diff | Match existing patterns | PASS — settings sub-route, reuse Dialog/forms patterns; separate from streak `student-gamification.ts` |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — live derived status (no unlock cache table); distinct-quiz aggregates via existing unique `(student_id, quiz_id)` on submissions; naming avoids collision with streak helper.

## Project Structure

### Documentation (this feature)

```text
specs/011-teacher-gamification/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md
├── contracts/
│   ├── server-actions.md
│   └── ui-components.md
└── tasks.md             # /speckit-tasks
```

### Source Code (planned touch points)

```text
supabase/migrations/
└── 007_gamification_tiers.sql

src/
├── app/teacher/(portal)/settings/gamification/page.tsx
├── app/(student)/dashboard/page.tsx          # load + pass teacher gamification status
├── app/(student)/results/page.tsx            # compact summary (or via existing view props)
├── actions/gamification.ts                   # teacher CRUD + getStudentGamificationStatus
├── lib/teacher-gamification.ts               # pure: validate ladder, compute status/progress
├── components/teacher/GamificationSettings.tsx
├── components/dashboard/LevelProgressCard.tsx
├── components/dashboard/BadgeGallery.tsx
├── components/dashboard/StudentDashboardView.tsx   # mount card + gallery when status present
├── components/student/StudentResultsView.tsx       # compact summary
├── types/database.ts
├── lib/spekit-targets.ts
└── components/layout/TeacherHeaderNav.tsx    # optional deep-link from settings only

tests/features/gamif-001-teacher-gamification.test.ts
.speckit/spec.yaml
.speckit/spekit-targets.yaml
```

**Structure decision**: Dedicated `src/actions/gamification.ts` keeps teacher.ts from growing further; pure math in `teacher-gamification.ts` for Vitest without DB. Existing streak/achievement UI in `student-gamification.ts` remains unchanged and visually distinct from teacher tiers.

## Complexity Tracking

> No constitution violations.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 Output

See [research.md](./research.md) — submission counting, progress math, storage vs compute, route placement, naming vs streak helper.

## Phase 1 Output

| Artifact | Path |
|----------|------|
| Data model | [data-model.md](./data-model.md) |
| Server actions | [contracts/server-actions.md](./contracts/server-actions.md) |
| UI contracts | [contracts/ui-components.md](./contracts/ui-components.md) |
| Quickstart | [quickstart.md](./quickstart.md) |

## Implementation Notes (for `/speckit-tasks`)

1. **Migration first** — `gamification_tiers` + indexes + RLS policies consistent with other teacher tables.
2. **Pure lib + unit tests** — effort ladder, bottleneck progress, current/next tier, unlock flags.
3. **Teacher settings UI** — `/teacher/settings/gamification` with full replace-save of ordered list (normalize `level_number` 1..n).
4. **Student wire-up** — `getStudentGamificationStatus`; hide when `tiers.length === 0`; respect teacher switcher via `currentTeacherId`.
5. **Registry** — `GAMIF-001` in `spec.yaml` + Spekit hooks (`ENABLE-001`).
6. **Verify** — `npm run build` (and feature Vitest file).

## Next Command

`/speckit-tasks`
