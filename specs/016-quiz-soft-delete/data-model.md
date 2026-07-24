# Data Model: Quiz Soft Delete & Trash (TEACH-011)

**Date**: 2026-07-24  
**Related**: [spec.md](./spec.md) · [research.md](./research.md)

## Entity: Quiz (extended)

Existing `quizzes` row gains a teacher Trash lifecycle marker.

| Field | Type | Notes |
|-------|------|--------|
| `id` | UUID PK | unchanged |
| `title` | TEXT | unchanged |
| `created_by` | UUID → profiles | owner; all trash ops scoped here |
| `is_active` / `is_free` / `is_archived` / `quiz_type` / … | existing | **unchanged on soft delete/restore** |
| **`deleted_at`** | `TIMESTAMPTZ NULL` | **NEW** — `NULL` = not in Trash; non-NULL = soft-deleted at that instant |

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by_deleted_at
  ON quizzes (created_by, deleted_at);
```

Optional partial indexes (implementation may choose either composite above or):

```sql
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by_active_not_deleted
  ON quizzes (created_by, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_quizzes_created_by_trash
  ON quizzes (created_by, deleted_at DESC)
  WHERE deleted_at IS NOT NULL;
```

### Validation / invariants

- Soft delete: set `deleted_at = now()` only if `created_by = session teacher` and currently `deleted_at IS NULL`.
- Restore: set `deleted_at = NULL` only if currently soft-deleted and owned by teacher.
- Permanent delete: physical `DELETE` only if owned and `deleted_at IS NOT NULL`.
- Indefinite retention: no TTL job on `deleted_at`.
- `is_archived` (admin) remains independent; student catalogs should exclude `is_archived = true` **or** `deleted_at IS NOT NULL` as applicable to each path.

## Related entities (unchanged schema)

| Entity | Relationship on permanent delete |
|--------|----------------------------------|
| `questions` | `ON DELETE CASCADE` from `quizzes` |
| `exam_submissions` | `ON DELETE CASCADE` from `quizzes` |
| `student_answers` | cascade via `exam_submissions` / `questions` |

No new tables.

## State transitions

```text
                  softDelete
   [Active] ──────────────────► [Trash]
      ▲                            │
      │         restore            │
      └────────────────────────────┘
                                   │ permanentlyDelete
                                   ▼
                              [Purged]
                         (row + cascades gone)
```

| From | Action | To | Side effects |
|------|--------|-----|--------------|
| Active (`deleted_at` null) | Soft delete | Trash | Set `deleted_at`; leave flags; hide from active teacher list + student catalogs |
| Trash | Restore | Active | Clear `deleted_at`; flags unchanged |
| Trash | Permanent delete (after confirm) | Purged | `DELETE` row; cascade questions/attempts |
| Active | Permanent delete | **Forbidden** | Must soft-delete first |
| Any | Cross-teacher mutate | **Forbidden** | MT-002 |

## TypeScript (`src/types/database.ts`)

Extend `Quiz`:

```ts
deleted_at: string | null;
```

Extend `QUIZ_LIST_SELECT` / lean selects to include `deleted_at`.

## Views / filters (logical)

| Consumer | Filter |
|----------|--------|
| Teacher active list | `created_by = teacher AND deleted_at IS NULL` |
| Teacher Trash | `created_by = teacher AND deleted_at IS NOT NULL` |
| Student catalog / home | teacher scope + `is_active` + `deleted_at IS NULL` (+ existing free/group rules) |
| Teacher dashboard KPI SQL | existing filters + `deleted_at IS NULL` |
| `max_quiz_limit` count | `created_by` + `is_archived = false` (soft-deleted **still counted**) |
| `getQuizForStudent` / submit | **no** `deleted_at` rejection (mid-exam); still `is_active` + access rules |
