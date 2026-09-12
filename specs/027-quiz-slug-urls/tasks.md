# Tasks: Friendly Teacher Quiz URLs (TEACH-017)

**Input**: Design documents from `/specs/027-quiz-slug-urls/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — plan + SC-002/SC-003/SC-004 require Vitest for slug builder, UUID detect, href helper, `createQuiz` return shape, and owner-scoped resolve.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js app: `src/`, `tests/`, `supabase/migrations/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Registry scaffolding; no new npm packages

- [x] T001 [P] Add draft `TEACH-017` feature entry (status `pending` or `partial`) in `.speckit/spec.yaml` with routes `/teacher/quizzes`, `/teacher/quizzes/new`, `/teacher/quizzes/[slug]` and planned files from `specs/027-quiz-slug-urls/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Persisted slug, shared path helpers, list/create/resolve wired to `slug` — required before any story UI

**⚠️ CRITICAL**: No user story route/link work until this phase is complete

- [x] T002 Create `supabase/migrations/019_quiz_friendly_slug.sql`: add `quizzes.slug`, SQL `quiz_friendly_slug(title, id)` per `specs/027-quiz-slug-urls/research.md` §2, backfill existing rows, `NOT NULL`, unique index `(created_by, slug)`, `BEFORE INSERT` trigger that sets slug only when null (never overwrite on `UPDATE`)
- [x] T003 [P] Add `slug: string` to `Quiz` in `src/types/database.ts`
- [x] T004 [P] Append `slug` to `QUIZ_LIST_SELECT` in `src/lib/perf-selects.ts`
- [x] T005 Implement `buildQuizSlug`, `isQuizUuidParam`, and `teacherQuizHref` in `src/lib/teacher-quiz-path.ts` matching `specs/027-quiz-slug-urls/contracts/routing-and-links.md`
- [x] T006 [P] Add `[TEACH-017]` unit tests for Latin/Arabic slugs, empty title → `id8` only, 48-char truncation, reserved exact `new`, UUID detect, and href query/hash extras in `tests/features/teach-017-quiz-slug.test.ts`
- [x] T007 Change `createQuiz` in `src/actions/teacher.ts` to insert without `slug` (trigger fills), `.select("id, slug")`, and return `{ id, slug }`
- [x] T008 Add `resolveTeacherQuizParam(param)` in `src/actions/teacher.ts`: UUID → `getTeacherQuizById`; else `.eq("slug", param).eq("created_by", session.profileId)`; include Trash rows; miss → `null`
- [x] T009 Confirm `getTeacherQuizById` and `getTeacherQuizzes` in `src/actions/teacher.ts` return `slug` via `QUIZ_LIST_SELECT` (no `select *`); keep `created_by` filters

**Checkpoint**: Foundation ready — DB has slugs; helpers + resolve exist; list/create payloads include `slug`

---

## Phase 3: User Story 1 — Open a quiz from a readable address (Priority: P1) 🎯 MVP

**Goal**: Teacher opens an owned quiz at `/teacher/quizzes/{slug}`; editor loads; refresh is durable; `?setup=` / `#quiz-questions` still work on the friendly path.

**Independent Test**: «اختباراتي» → tap a titled quiz → address is name + 8-hex fragment (not a raw UUID) → same editor; refresh keeps the slug URL.

### Tests for User Story 1

- [x] T010 [P] [US1] Extend `tests/features/teach-017-quiz-slug.test.ts` with owner-scoped resolve cases: slug hit, wrong teacher → null, empty param → null (mock `requireTeacher` / admin client like `tests/features/teach-003-quiz-flags.test.ts`)

### Implementation for User Story 1

- [x] T011 [US1] Rename `src/app/teacher/(portal)/quizzes/[id]/` to `src/app/teacher/(portal)/quizzes/[slug]/` (`page.tsx` + `loading.tsx`); `params: Promise<{ slug: string }>`
- [x] T012 [US1] In `src/app/teacher/(portal)/quizzes/[slug]/page.tsx` call `resolveTeacherQuizParam`, `notFound()` on miss, load questions by `quiz.id`, pass `quiz.id` into settings/trash and `quiz.slug` into `QuizQuestionsDashboard`
- [x] T013 [US1] Set `editHref` to `teacherQuizHref(quiz.slug)` in `src/components/teacher/QuizListItem.tsx` (active and Trash modes)

**Checkpoint**: MVP — list → friendly URL → editor; `/teacher/quizzes/new` still create

---

## Phase 4: User Story 2 — Every teacher quiz link uses the friendly address (Priority: P1)

**Goal**: Create-and-continue, import return, questions dashboard, Trash/edit, and `revalidatePath` all use slug hrefs — copied links are never raw UUID.

**Independent Test**: Create a quiz → land on `{slug}?setup=import`; finish import / back-to-quiz / list open — all show the friendly path.

### Tests for User Story 2

- [x] T014 [P] [US2] Update `tests/features/teach-003-quiz-flags.test.ts` so `createQuiz` asserts `{ id, slug }` (not a bare id string)

### Implementation for User Story 2

- [x] T015 [US2] In `src/components/teacher/QuizCreateWizard.tsx` push `teacherQuizHref(created.slug, { query: { setup: "import" } })`
- [x] T016 [US2] Add `quizSlug` prop to `src/components/teacher/QuizQuestionsDashboard.tsx`; `router.replace` finish-setup and `?imported=` via `teacherQuizHref`
- [x] T017 [US2] Add `quizSlug` to `src/components/teacher/EditQuizBulkImportSection.tsx` (replace/back `#quiz-questions`); thread slug from dashboard/import header; update comment in `src/components/teacher/import/ImportSectionHeader.tsx`
- [x] T018 [US2] In `src/actions/teacher.ts` select `slug` alongside `id` on trash/flag/import mutations and `revalidatePath(teacherQuizHref(slug))` instead of `/teacher/quizzes/${quizId}`
- [x] T019 [P] [US2] Update `[id]` comment to `[slug]` in `src/components/layout/TeacherHeaderNav.tsx`

**Checkpoint**: No in-app teacher quiz href interpolates `quiz.id` into `/teacher/quizzes/…`

---

## Phase 5: User Story 3 — Old raw-ID bookmarks still open (Priority: P2)

**Goal**: Owned UUID teacher URLs still open the quiz, then 308 to the canonical slug (query string preserved). Wrong teacher / unknown id → not found.

**Independent Test**: Open `/teacher/quizzes/{uuid}` (and `?setup=import`) as owner → same editor → address bar is slug; as another teacher → not found.

### Tests for User Story 3

- [x] T020 [P] [US3] Assert `isQuizUuidParam` true/false fixtures in `tests/features/teach-017-quiz-slug.test.ts`; assert `resolveTeacherQuizParam` UUID branch calls id lookup (mock)

### Implementation for User Story 3

- [x] T021 [US3] In `src/app/teacher/(portal)/quizzes/[slug]/page.tsx`, when `isQuizUuidParam(param)` and quiz found, `permanentRedirect` to `teacherQuizHref(quiz.slug)` plus original search string (`setup`, `imported`); do not put a hash on `Location`

**Checkpoint**: Legacy bookmarks hop to slug; isolation unchanged

---

## Phase 6: User Story 4 — Duplicate and Arabic titles (Priority: P2)

**Goal**: Duplicate titles get distinct slugs; Arabic stays in the path; existing rows are backfilled; title/column updates never rewrite `slug`.

**Independent Test**: Two quizzes with the same Arabic title → two distinct slug URLs, each loads the matching quiz; pre-feature rows have slugs without a manual rename.

### Tests for User Story 4

- [x] T022 [P] [US4] In `tests/features/teach-017-quiz-slug.test.ts` assert identical titles + different UUIDs → different slugs sharing the title part; Arabic letters preserved; `buildQuizSlug` is deterministic for the same `(title, id)`

### Implementation for User Story 4

- [x] T023 [US4] Align SQL `quiz_friendly_slug` in `supabase/migrations/019_quiz_friendly_slug.sql` with `buildQuizSlug` in `src/lib/teacher-quiz-path.ts` (shared examples from T006/T022); confirm trigger `WHEN (NEW.slug IS NULL)` / equivalent skip on UPDATE
- [x] T024 [US4] Grep `src/actions/teacher.ts` and confirm no `update({ slug` on title/flag/trash paths so FR-007 holds without a slug editor

**Checkpoint**: US4 uniqueness + stability locked by tests + migration

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Registry, student-path freeze, build, quickstart

- [x] T025 [P] Mark `TEACH-017` implemented in `.speckit/spec.yaml` (acceptance, files, routes `[slug]`); note TEACH-003 post-create path as `/teacher/quizzes/[slug]?setup=import` and legacy UUID redirect
- [x] T026 [P] Confirm student exam links stay `/quiz/${quiz.id}` in `src/components/dashboard/QuizCarouselCard.tsx`, `src/components/student/StudentQuizGridCard.tsx`, and `src/app/(student)/quiz/[id]/page.tsx`
- [x] T027 Run `npx vitest run tests/features/teach-017-quiz-slug.test.ts tests/features/teach-003-quiz-flags.test.ts`, `node scripts/verify-migrations.mjs`, and `npm run build`
- [x] T028 [P] Walk `specs/027-quiz-slug-urls/quickstart.md` manual QA (list, Arabic duplicates, create+setup, UUID hop, isolation, Trash, student UUID)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** → no blockers
- **Phase 2 (Foundational)** → after Setup; **blocks all stories**
- **Phase 3 (US1)** → after Foundational — **MVP**
- **Phase 4 (US2)** → after US1 page + `quiz.slug` on list/create (extends same route)
- **Phase 5 (US3)** → after US1 page exists (adds redirect branch)
- **Phase 6 (US4)** → after Foundational helpers + migration (tests can start once T005–T006 exist; create/list from US1 needed for full manual QA)
- **Phase 7 (Polish)** → after desired US1–US4 scope

### User Story Dependencies

- **US1**: Needs T002–T009; delivers MVP (list → slug editor)
- **US2**: Needs US1 `quizSlug` on the edit page; remaining hrefs + `createQuiz` consumers
- **US3**: Needs US1 page; independent of US2 logically (can ship after T012)
- **US4**: Mostly algorithm + SQL (Foundational); Vitest can run before UI; manual duplicate-title QA needs US1 list links

### Parallel Opportunities

- T001 anytime in Setup
- T002 / T003 / T004 / T005 in parallel after T001 (T002 is SQL-only)
- T006 after T005; T007–T009 after T003–T005 (same `teacher.ts` — do sequentially)
- T010 parallel with T011 once T008 exists
- T014 parallel with T015–T019 after T007
- T016 then T017 (dashboard threads slug into import)
- T020 parallel with T021
- T022 parallel with T023/T024
- T025 / T026 / T028 parallel after tests; T027 after implementation

### Parallel example (after Foundational)

```bash
# Parallel after T005:
# - tests/features/teach-017-quiz-slug.test.ts (T006)
# - src/types/database.ts (T003) if not done
# Then sequential in teacher.ts: T007 → T008 → T009
# Then US1: rename route (T011) → page (T012) → QuizListItem (T013)
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Phase 1–2 (migration + helpers + resolve + create return)
2. Complete Phase 3 (rename `[slug]`, page load, list href)
3. **STOP and VALIDATE**: tap quiz from list → friendly URL → editor
4. Then US2 (all remaining links) before calling the feature done for SC-002

### Incremental Delivery

1. Setup + Foundational → slugs exist
2. US1 → MVP demo
3. US2 → no leftover UUID hrefs
4. US3 → bookmark compatibility
5. US4 → Arabic/duplicate hardening
6. Polish → registry + build

### Parallel Team Strategy

1. Together: Phase 1–2
2. Then: Dev A US1+US3 (page + redirect); Dev B US2 (client hrefs) after T012 passes `quizSlug`; Dev C US4 tests/SQL alignment

---

## Notes

- `[P]` = different files, no dependencies on incomplete tasks
- Do **not** change `src/app/(student)/quiz/[id]/` or student `href={`/quiz/${quiz.id}`}`
- Mutations keep UUID `quizId`; only paths and list/create payloads use `slug`
- Apply migration locally (`npx supabase db push`) before manual QA
- Commit after each task or logical group when asked
- Format check: every task has checkbox, `Tnnn`, optional `[P]`/`[USn]`, and at least one file path
