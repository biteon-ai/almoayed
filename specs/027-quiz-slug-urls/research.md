# Research: Friendly Teacher Quiz URLs (TEACH-017)

**Date**: 2026-09-12  
**Status**: Complete — all Technical Context items resolved

## 1. Persist a `slug` column vs generate on the fly

**Decision**: Persist `quizzes.slug` (TEXT, NOT NULL after backfill). Generate once from title + quiz id fragment. Never rewrite on title change.

**Rationale**: FR-007 requires title edits not to break copied addresses. On-the-fly `slugify(currentTitle)+id` would change after rename. On-the-fly from id alone is not readable (FR-002). A stored key is unique, backfillable (FR-008), and queryable with a simple equality filter.

**Alternatives considered**:
- Compute slug only in the app with no column — rejected (cannot index, cannot stay stable if the formula or title changes, harder uniqueness).
- Store slug = full UUID — rejected (not friendly).
- Update slug whenever title changes + redirect table of old slugs — rejected (extra table; spec prefers stability over always-matching-latest-title).

## 2. Slug format (name + unique fragment)

**Decision**: `{titleSlug}-{id8}` where:

| Part | Rule |
|------|------|
| `titleSlug` | NFC trim; Latin lowercased; whitespace/`_` → `-`; keep Unicode letters (including Arabic) and digits; drop other punctuation; collapse `--`; strip edge `-`; max **48** chars |
| `id8` | First 8 hex characters of the quiz UUID with hyphens removed (stable, opaque, unique enough) |
| Empty title after strip | Use `id8` alone |
| Exact reserved segment | If the **entire** slug equals a reserved path (`new`), prefix `quiz-` (combined form `title-id8` almost never equals `new`) |

Example: title `Arabic Quiz` + id `dd000018-aaaa-…` → `arabic-quiz-dd000018`.  
Arabic title `اختبار الوحدة 1` → `اختبار-الوحدة-1-dd000018`.

**Rationale**: Matches the spec example `arabic-quiz-abc123xyz`. Duplicate titles stay distinct via `id8`. Arabic letters stay in the path (FR-003). Static route `/teacher/quizzes/new` stays a sibling of the dynamic segment; Next.js prefers the static `new` folder over `[slug]`.

**Alternatives considered**:
- ASCII transliteration of Arabic — rejected (teachers would not recognize their own titles; extra dependency).
- Nanoid random suffix — rejected (must persist anyway; UUID slice needs no extra generator and is deterministic for backfill).
- Unique globally vs per teacher — uniqueness **per `created_by`** is required; lookup always adds `created_by = session.profileId` (MT-002). A unique index on `(created_by, slug)` is enough. Global unique is unnecessary.

## 3. Next.js routing: `[id]` → `[slug]`

**Decision**: Rename `src/app/teacher/(portal)/quizzes/[id]/` to `src/app/teacher/(portal)/quizzes/[slug]/` (page + loading). Param type `{ slug: string }`. Do **not** add a second route folder.

**Rationale**: One dynamic segment can resolve both friendly keys and legacy UUIDs. Keeping `[id]` as the folder name while reading slugs is misleading. Student `src/app/(student)/quiz/[id]/` is untouched (FR-011).

**Legacy UUID hop (FR-006 / FR-013)**:
1. If `params.slug` matches RFC 4122 UUID → `getTeacherQuizById` (owner-scoped, includes Trash).
2. If found → `permanentRedirect` (308) to `/teacher/quizzes/{quiz.slug}` with the same query string (`setup`, `imported`, …).
3. Else → `notFound()`.
4. If not a UUID → lookup by `slug` + `created_by`; miss → `notFound()`.

Hash fragments (`#quiz-questions`) are not sent to the server; browsers keep the original hash across 3xx when `Location` has no hash — do not put a hash on the redirect URL.

**Alternatives considered**:
- Middleware rewrite UUID → slug — rejected (needs a DB hit in middleware or a slug map; constitution prefers Server Actions/RSC for privileged reads).
- Parallel `[id]` and `[slug]` routes — rejected (Next.js conflict; two pages to maintain).

## 4. Supabase lookup

**Decision**:

| Call | Filter |
|------|--------|
| Canonical load | `.from("quizzes").eq("slug", param).eq("created_by", profileId)` |
| UUID compatibility | `.eq("id", uuid).eq("created_by", profileId)` (existing `getTeacherQuizById`) |
| Mutations | Keep using **UUID `id`** internally (FKs, questions, trash). Select `slug` when revalidating paths. |

Add `slug` to `QUIZ_LIST_SELECT`. `createQuiz` inserts without sending slug (DB trigger fills it) and **returns `{ id, slug }`**. Page uses a resolver `resolveTeacherQuizParam(param)` that branches UUID vs slug.

Admin client remains the only privileged reader; always `requireTeacher()` + `created_by` (no client Supabase).

**Alternatives considered**:
- App-only slug generation with no trigger — workable, but seed SQL / dashboard inserts would forget slugs. Trigger `BEFORE INSERT` sets slug only when `NEW.slug IS NULL`; **never** overwrite on UPDATE (FR-007).
- RPC for resolve — overkill for a single equality select.

## 5. Link generation

**Decision**: One helper `teacherQuizHref(slug, extras?)` in `src/lib/teacher-quiz-path.ts`:

```ts
teacherQuizHref(slug: string, extras?: { query?: Record<string, string>; hash?: string }): string
// → `/teacher/quizzes/${slug}` + `?setup=import` / `?imported=N` + `#quiz-questions`
```

Pass **slug** (not id) into every teacher navigation:

| Surface | Change |
|---------|--------|
| `QuizListItem` | `editHref = teacherQuizHref(quiz.slug)` |
| `QuizCreateWizard` | `router.push(teacherQuizHref(slug, { query: { setup: "import" } }))` |
| `QuizQuestionsDashboard` / `EditQuizBulkImportSection` | New `quizSlug` prop; replace/back links use helper |
| `revalidatePath` in `src/actions/teacher.ts` | `revalidatePath(teacherQuizHref(slug))` after selecting `slug` with `id` |

Do not encode the slug twice; Next.js `Link` encodes Unicode path segments.

**Alternatives considered**:
- Scatter `` `/teacher/quizzes/${quiz.slug}` `` — rejected (easy to miss `setup`/`imported`/`#` extras).
- Keep linking by id and rely on redirect — rejected (FR-004 / SC-002: copied href must already be friendly).

## 6. Backfill and seeds

**Decision**: Migration `019_quiz_friendly_slug.sql`:

1. Add nullable `slug`.
2. Create `public.quiz_friendly_slug(p_title text, p_id uuid) RETURNS text` mirroring the TS algorithm.
3. `UPDATE quizzes SET slug = quiz_friendly_slug(title, id) WHERE slug IS NULL`.
4. `ALTER COLUMN slug SET NOT NULL`.
5. Unique index `quizzes_created_by_slug_key` on `(created_by, slug)`.
6. `BEFORE INSERT` trigger: if `NEW.slug` is null, set from function.

Existing seed inserts (`002`, `004`, `seed.sql`) need no row edits if the trigger runs on future inserts; backfill covers current rows.

## 7. Tests and registry

**Decision**: Vitest `[TEACH-017]` for slug builder (Arabic, duplicates, reserved, empty title, truncation) + UUID detect + `teacherQuizHref`. Action tests: `createQuiz` returns slug; `getTeacherQuizById` / new resolver are owner-scoped. No student exam tests change. Registry: new `TEACH-017`; TEACH-003 acceptance/routes note the friendly path (keep `[id]` mention only as legacy redirect).

**Spekit**: No new DOM hook (address bar is not a control). Existing `teacher-quiz-edit-page` stays on the renamed page.
