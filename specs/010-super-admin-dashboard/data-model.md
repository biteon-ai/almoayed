# Data Model: Super Admin Dashboard

**Date**: 2026-07-23  
**Migration**: `supabase/migrations/006_super_admin.sql` (proposed)

## Schema changes

### Enum extensions

```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

CREATE TYPE teacher_account_status AS ENUM ('active', 'inactive');
```

### `profiles` extensions

| Column | Type | Rules |
|--------|------|-------|
| `email` | `TEXT` | Nullable; `UNIQUE` partial index where `email IS NOT NULL` |
| `password_hash` | `TEXT` | Nullable; required for `SUPER_ADMIN` and email-auth teachers |
| `phone_number` | `TEXT` | Nullable; E.164-ish digits; optional at create |
| `teacher_account_status` | `teacher_account_status` | Default `active`; only meaningful when `role = TEACHER` |
| `max_quiz_limit` | `INTEGER` | Nullable; `CHECK (max_quiz_limit IS NULL OR max_quiz_limit > 0)` |
| `auth_method` | `TEXT` | `whatsapp` \| `email`; default inferred on insert |

**WhatsApp constraint relaxation**:

```sql
ALTER TABLE profiles ALTER COLUMN whatsapp_number DROP NOT NULL;
-- Replace full unique with partial: unique when not null/empty placeholder
CREATE UNIQUE INDEX profiles_whatsapp_unique_not_null
  ON profiles (whatsapp_number) WHERE whatsapp_number IS NOT NULL AND whatsapp_number <> '';
```

Admin-created teachers without phone: `whatsapp_number = NULL` until provided.

### `subject_catalog` (new)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `name_ar` | TEXT NOT NULL | Display label (e.g. «رياضيات») |
| `slug` | TEXT UNIQUE | Stable key |
| `sort_order` | INTEGER | Admin UI ordering |
| `is_active` | BOOLEAN DEFAULT TRUE | Hide retired subjects from pickers |

### `teacher_subject_assignments` (new)

| Column | Type | Notes |
|--------|------|-------|
| `teacher_id` | UUID FK → profiles | ON DELETE CASCADE |
| `subject_id` | UUID FK → subject_catalog | ON DELETE RESTRICT |
| PK | `(teacher_id, subject_id)` | |

### `quizzes` extension

| Column | Type | Notes |
|--------|------|-------|
| `is_archived` | BOOLEAN DEFAULT FALSE | Set on teacher delete (archive path) |

### `admin_audit_log` (new)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `admin_id` | UUID FK → profiles | |
| `action` | TEXT | e.g. `teacher.create`, `impersonate.start`, `impersonate.end`, `teacher.delete` |
| `target_id` | UUID | Optional entity id |
| `metadata` | JSONB | `{ teacherId, disposition, ... }` |
| `created_at` | TIMESTAMPTZ | |

## Entity relationships

```text
profiles (SUPER_ADMIN)
    │
    ├── creates/manages ──► profiles (TEACHER)
    │                           ├── teacher_subject_assignments ──► subject_catalog
    │                           ├── quizzes (created_by)
    │                           └── student_teachers ◄── profiles (STUDENT)
    │
    └── admin_audit_log (admin_id)
```

## Validation rules

| Rule | Enforcement |
|------|-------------|
| Email unique platform-wide | DB unique index + API pre-check |
| Email format | Server validation (RFC5322 simplified) |
| Password min length | 8 chars; optional auto-generate 12-char alphanumeric |
| Teacher create | Only `requireSuperAdmin()` |
| Inactive teacher | Block login, impersonation, quiz create |
| Delete with quizzes | Require `disposition: reassign \| archive`; reassign target must be active teacher ≠ deleted |
| Max quiz limit | Count `quizzes WHERE created_by = teacher AND is_archived = FALSE` before insert |

## Session projection (application layer)

Extended `SessionData` (not persisted in DB):

| Field | Purpose |
|-------|---------|
| `impersonation.adminProfileId` | Restore Super Admin on exit |
| `impersonation.teacherId` | Banner + audit |
| `impersonation.teacherName` | Arabic banner text |

During impersonation: `role = TEACHER`, `profileId = teacherId`.

## UI DTOs

### `AdminKpiSnapshot`

```ts
{
  totalUsers: number;
  totalTeachers: number;
  activeTeachers: number;
  inactiveTeachers: number;
  totalStudents: number;
  totalExams: number;        // non-archived
  publishedExams: number;    // is_active = true
  draftExams: number;        // is_active = false, not archived
  completedAttempts: number;
}
```

### `AdminTeacherRow`

```ts
{
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  status: "active" | "inactive";
  subjects: { id: string; nameAr: string }[];
  quizCount: number;
  maxQuizLimit: number | null;
  createdAt: string;
}
```

### `CreateTeacherInput` / `UpdateTeacherInput`

See [contracts/admin-api.md](./contracts/admin-api.md).

## State transitions — teacher account

```text
         create (Super Admin)
                │
                ▼
          ┌──────────┐
          │  active  │◄──── toggle activate
          └────┬─────┘
               │ toggle deactivate
               ▼
          ┌──────────┐
          │ inactive │  (login + impersonation blocked)
          └──────────┘
               │
               │ delete (confirmed + quiz disposition)
               ▼
          [removed]
```
