# Data Model: Student Unlink vs Admin Hard Delete (MT-003)

**Date**: 2026-07-24  
**Related**: [spec.md](./spec.md) · [research.md](./research.md)

## Entities (no new tables)

### Student–teacher link (`student_teachers`)

| Field | Notes |
|-------|--------|
| `id` | Link id used by teacher unlink |
| `student_id` | → `profiles` ON DELETE CASCADE |
| `teacher_id` | → `profiles` ON DELETE CASCADE |
| status / tier / … | Unchanged on unlink of *other* teachers |

**Teacher unlink**: `DELETE` where `id = linkId AND teacher_id = session.profileId`.

### Student account (`profiles`)

| Field | Notes |
|-------|--------|
| `id` | PK |
| `role` | Must be `STUDENT` for admin purge |
| `full_name`, `phone_number` | Admin table columns |

**Admin hard delete**: `DELETE` profile where `id = studentId AND role = 'STUDENT'`.

### Cascaded on student profile delete (existing FKs)

- `student_teachers` (all teachers)
- `teacher_group_members`
- `exam_submissions` → `student_answers` (via submission cascade)

### Not deleted by this feature

- Teacher `profiles`
- `quizzes` / `questions` (owned by teachers; `quizzes.created_by` is RESTRICT from teachers — irrelevant to student purge)

### Orphan student

`profiles.role = STUDENT` with **zero** rows in `student_teachers`. Still listed in admin directory; eligible for hard delete.

## State transitions

```text
[Linked to Teacher T]
        │ teacher unlink (T only)
        ▼
[Still linked to others?]──yes──► [Linked to remaining teachers]
        │ no
        ▼
[Orphan student profile]──admin hard delete──► [Purged]
        ▲
        └── also reachable directly if still linked (admin allowed)
```

## Admin list row (logical)

```ts
type AdminStudentRow = {
  id: string;
  fullName: string | null;
  phoneNumber: string | null;
  createdAt: string;
  teacherLinkCount: number;
};
```

## Validation rules

- Teacher unlink: link must belong to active teacher; no profile delete.
- Admin purge: `role === 'STUDENT'`; Super Admin only; UI double-confirm; API `confirm: true`.
- Admin list: `role = 'STUDENT'` only (never teachers/admins in this table).
