# Data Model: Friendly Teacher Quiz URLs (TEACH-017)

**Date**: 2026-09-12  
**Storage**: New column on existing `quizzes`. No new tables.

## Entities

### Quiz (existing — extended)

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Internal PK. Still used for FKs, mutations, student `/quiz/[id]`. |
| `title` | TEXT | Display name. **Not** re-read to rebuild the URL after insert. |
| `created_by` | UUID | Teacher owner. **Required** on every slug/id lookup (MT-002). |
| `slug` | TEXT **NEW** | Canonical teacher path segment. Unique per `(created_by, slug)`. Stable. |
| `deleted_at` | TIMESTAMPTZ | TEACH-011 Trash. Slug still resolves while in Trash; gone after permanent delete. |

All other quiz columns unchanged.

### Friendly URL key (logical)

Equals stored `slug`. Shape: `{titleSlug}-{id8}` (see [research.md](./research.md) §2).

**Validation**:

- Non-empty after backfill / trigger.
- Must not be exactly `new` (or any future reserved sibling under `/teacher/quizzes/`).
- Length: title part ≤ 48 + hyphen + 8 hex ≈ 57; allow TEXT without a tight CHECK.
- Unicode letters allowed (Arabic).

**Uniqueness**: `UNIQUE (created_by, slug)`. Two teachers may share the same slug string; lookup always adds `created_by`.

### Canonical vs legacy address

| Kind | Path | Behavior |
|------|------|----------|
| Canonical | `/teacher/quizzes/{slug}` | RSC loads quiz; this is what in-app links copy. |
| Legacy | `/teacher/quizzes/{uuid}` | Same dynamic route; 308 to canonical; query string preserved. |

Student exam path `/quiz/{uuid}` is **not** an entity change.

## Generation rules

```text
INSERT quiz (title, id, …)
  → if slug IS NULL:
       slug = quiz_friendly_slug(title, id)
  → persist
UPDATE title
  → slug unchanged
DELETE (permanent)
  → slug gone with row (addresses 404)
```

TypeScript `buildQuizSlug(title, id)` **must match** SQL `quiz_friendly_slug` for tests and any client-side preview; production inserts rely on the trigger so seeds cannot skip the column.

## State transitions

```text
Existing quizzes (pre-feature)
  → migration backfill slug
  → list/edit links use slug

New quiz
  → insert → trigger sets slug → createQuiz returns { id, slug }
  → wizard navigates to /teacher/quizzes/{slug}?setup=import

Title edited
  → slug unchanged; old friendly URL still loads

Soft-delete
  → slug still resolves; Trash banner (TEACH-011)

Permanent delete
  → both slug and uuid paths notFound
```

## Relationships

- `Quiz.slug` 1—1 with canonical teacher address (per teacher).
- Questions, attempts, groups still reference `quizzes.id` only.
- No slug history table (FR-007: no rewrite, so no old-slug redirects except UUID).

## TypeScript

Extend `Quiz` (and thus `TeacherQuiz`) with `slug: string`.  
`createQuiz` return type: `{ id: string; slug: string }` (breaking vs current `string` — update wizard + TEACH-003 tests).
