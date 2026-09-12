# Implementation Plan: Friendly Teacher Quiz URLs

**Branch**: `027-quiz-slug-urls` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/027-quiz-slug-urls/spec.md`

**Feature ID (registry)**: `TEACH-017` (extends TEACH-003 quiz editor URLs; TEACH-011 Trash still reachable; student `/quiz/[id]` unchanged)

## Summary

Teacher quiz management addresses stop using raw UUIDs as the primary path. Each quiz gets a **stable `slug`**: readable title (Arabic allowed) plus an 8-character id fragment (`arabic-quiz-dd000018`). In-app teacher links, post-create `?setup=import`, import return, and Trash/edit use `/teacher/quizzes/{slug}`. Old `/teacher/quizzes/{uuid}` bookmarks **308** to the slug. Lookup is always `created_by = current teacher`. Mutations still use UUID internally.

**Technical approach**:
1. Migration `019_quiz_friendly_slug.sql` — `quizzes.slug`, SQL `quiz_friendly_slug()`, backfill, unique `(created_by, slug)`, insert trigger (do not overwrite on title update).
2. Pure `src/lib/teacher-quiz-path.ts` — `buildQuizSlug`, `isQuizUuidParam`, `teacherQuizHref`.
3. Rename App Router folder `[id]` → `[slug]`; page resolves UUID vs slug; `permanentRedirect` for legacy ids.
4. `QUIZ_LIST_SELECT` + `Quiz.slug`; `createQuiz` returns `{ id, slug }`; `resolveTeacherQuizParam`; `revalidatePath` uses slug hrefs.
5. Update teacher `Link` / `router.push|replace` call sites; leave student `/quiz/${id}` alone.
6. Vitest `[TEACH-017]`; TEACH-003 create-return test; registry `TEACH-017`.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for Syrian Baccalaureate math

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC, `permanentRedirect`, Server Actions |
| **Database** | **Supabase** PostgreSQL — `quizzes.slug` via `supabase/migrations/019_quiz_friendly_slug.sql` |
| **Data access** | Server Actions + `createAdminClient()` — **no** client Supabase for quiz resolve |
| **Session / auth** | `requireTeacher()` + `created_by = session.profileId` |
| **UI** | Existing quiz list/editor; no new slug field |
| **Testing** | Vitest `tests/features/teach-017-quiz-slug.test.ts` + TEACH-003 create test |
| **Target platform** | Teacher quiz management — mobile + desktop PWA |

**Feature-specific overrides**:

- **Primary Dependencies**: None beyond stack defaults (no slugify npm package)
- **Storage / tables touched**: `quizzes` (`slug` column + unique index + trigger)
- **Performance Goals**: Single indexed equality lookup by `(created_by, slug)`; redirect hop only for legacy UUID
- **Constraints**: MT-002 on every resolve; QUIZ-001 / student URLs untouched; reserved path `new`; slug stable after title change
- **Scale/Scope**: Teacher `/teacher/quizzes/*` only; dashboard KPI RPC does not need slug

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries / session | PASS — slug and UUID lookups both `.eq("created_by", profileId)` |
| QUIZ-001 | No answer leakage pre-submit | PASS — student exam path and `getQuizForStudent` unchanged |
| Server layer | Privileged data via Server Actions | PASS — resolve in RSC/actions + admin client; no client Supabase |
| RTL UX | Arabic RTL, touch targets | PASS — Arabic characters allowed in slug; no new tiny controls |
| Minimal diff | Match existing patterns | PASS — one helper, one column, rename dynamic segment, update hrefs |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — trigger does not rewrite slug on UPDATE; student routes untouched; unique index is per-teacher not global; mutations keep UUID PKs.

## Project Structure

### Documentation (this feature)

```text
specs/027-quiz-slug-urls/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── routing-and-links.md
│   ├── server-actions.md
│   └── ui-components.md
└── tasks.md                    # via /speckit-tasks
```

### Source Code (planned touch points)

```text
supabase/migrations/019_quiz_friendly_slug.sql    # NEW

src/lib/teacher-quiz-path.ts                      # NEW — slug + href helpers
src/lib/perf-selects.ts                           # ADD slug to QUIZ_LIST_SELECT
src/types/database.ts                             # Quiz.slug

src/app/teacher/(portal)/quizzes/[id]/            # RENAME → [slug]/
src/app/teacher/(portal)/quizzes/[slug]/page.tsx  # resolve + UUID redirect
src/app/teacher/(portal)/quizzes/[slug]/loading.tsx

src/actions/teacher.ts                            # createQuiz return, resolver, revalidatePath
src/components/teacher/QuizListItem.tsx
src/components/teacher/QuizCreateWizard.tsx
src/components/teacher/QuizQuestionsDashboard.tsx
src/components/teacher/EditQuizBulkImportSection.tsx
src/components/layout/TeacherHeaderNav.tsx        # comment only

.speckit/spec.yaml                                # TEACH-017 + TEACH-003 routes

tests/features/teach-017-quiz-slug.test.ts        # NEW
tests/features/teach-003-quiz-flags.test.ts       # createQuiz return shape
```

**Structure decision**: Canonical path builder in `src/lib/` (unit-testable). DB trigger is the insert source of truth so seeds cannot omit `slug`. App Router keeps a single dynamic segment that accepts both slug and UUID.

## Complexity Tracking

> No constitution violations.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0: Research

See [research.md](./research.md). All technical unknowns resolved:

1. **Persist `slug`** (not on-the-fly) so titles can change without breaking URLs.
2. **Format** `{titleSlug}-{id8}` with Arabic letters kept.
3. **Rename `[id]` → `[slug]`**; UUID 308 to canonical slug; query string preserved.
4. **Lookup** `.eq("slug")` + `created_by`; mutations stay on `id`.
5. **Links** only through `teacherQuizHref`.

## Phase 1: Design

See [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

**Key decisions**:
1. Unique `(created_by, slug)` — not globally unique.
2. Insert trigger fills slug; UPDATE never overwrites.
3. `createQuiz` returns `{ id, slug }`.
4. Client islands that navigate need `quizSlug` in addition to `quizId`.
5. No Spekit hook; no student URL change.

## Phase 2: Task planning

Deferred to `/speckit-tasks`.
