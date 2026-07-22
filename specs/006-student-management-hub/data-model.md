# Data Model: Teacher Student Management Hub

**Date**: 2026-07-22  
**Status**: No schema migration — reuse existing TEACH-001/002 tables

## Entities (existing)

### Profile (`profiles`)

| Field | Role in hub |
|-------|-------------|
| `id` | Student identity |
| `full_name` | Editable via hub edit |
| `whatsapp_number` | Set at create; **read-only** on edit; search key |
| `role` | Must be `student` for roster rows |
| `is_subscribed` | Set `true` when link activated (existing behavior) |

### Teacher–student link (`student_teachers`)

| Field | Values / rules |
|-------|----------------|
| `id` | `linkId` in UI |
| `student_id` / `teacher_id` | UNIQUE pair; all hub ops scoped by `teacher_id = session.profileId` |
| `status` | `pending` \| `active` \| `deactivated` |
| `tier` | `free` \| `pro` |
| `upgrade_requested` | Cleared on tier update (existing) |

**Create defaults**: `status = active`, `tier = free`, `upgrade_requested = false`.

### Study group (`teacher_groups` + `teacher_group_members`)

| Entity | Notes |
|--------|-------|
| `teacher_groups` | Owned by teacher; used in filter + selectors |
| `teacher_group_members` | Hub enforces **at most one** group membership per student among this teacher’s groups |

## Status lifecycle

```text
                  ┌──────────────┐
     (inbound)    │   pending    │
                  └──────┬───────┘
           activate │    │ deactivate (+confirm)
                    ▼    ▼
              ┌─────────┐   ┌──────────────┐
              │ active  │◄─►│ deactivated  │
              └─────────┘   └──────────────┘
                 ▲ activate      │
                 └───────────────┘

Teacher NEVER writes status = pending from hub.
```

## Validation rules

| Rule | Behavior |
|------|----------|
| Name required | Non-empty trimmed `full_name` on create/edit |
| WhatsApp required on create | Normalize via `normalizeWhatsAppNumber`; reject empty/invalid |
| Duplicate link | Same WhatsApp already linked to this teacher → Arabic error |
| Cross-tenant | Mutations verify `student_teachers.teacher_id` (and group `teacher_id`) match session |
| Status write | Only `active` or `deactivated` |
| Unlink | Delete link (+ this teacher’s group memberships); keep profile |

## UI projection (`TeacherStudentRow`)

Existing type remains the list DTO. Hub may treat `groupNames[0]` (or first membership) as the singular badge; after assign/clear actions, at most one name for this teacher.

Optional enrichment (no DB change): expose `groupId: string | null` on the row for select value binding — derived when mapping `getTeacherStudents`.

## Pagination (application layer)

Not persisted. Client state:

- `page` (1-based), `pageSize = 8`
- Filtered array → `slice((page-1)*8, page*8)`
- Reset `page` to 1 when search/filters change
