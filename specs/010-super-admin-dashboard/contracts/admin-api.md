# Admin API Contracts: ADMIN-001

**Base path**: `/api/admin`  
**Auth**: All routes require `SUPER_ADMIN` session via `requireSuperAdmin()` (iron-session cookie).  
**Runtime**: Node.js (bcrypto/bcrypt).  
**Errors**: JSON `{ error: string }` with Arabic messages; HTTP status codes below.

---

## Shared types

```ts
type ApiError = { error: string };

type TeacherStatus = "active" | "inactive";

type QuizDisposition = "reassign" | "archive";
```

---

## `GET /api/admin/kpis`

**Purpose**: Platform-wide KPI snapshot for dashboard cards.

**Response 200**:

```json
{
  "totalUsers": 1200,
  "totalTeachers": 45,
  "activeTeachers": 40,
  "inactiveTeachers": 5,
  "totalStudents": 1150,
  "totalExams": 320,
  "publishedExams": 280,
  "draftExams": 40,
  "completedAttempts": 8400
}
```

**Errors**: `401` not authenticated; `403` not Super Admin.

---

## `GET /api/admin/teachers`

**Purpose**: List teachers with quiz counts for management table.

**Query params** (optional):

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search name or email (case-insensitive) |
| `status` | `active` \| `inactive` \| `all` | Default `all` |

**Response 200**:

```json
{
  "teachers": [
    {
      "id": "uuid",
      "fullName": "أحمد محمد",
      "email": "ahmad@school.sy",
      "phoneNumber": "963912345678",
      "status": "active",
      "subjects": [{ "id": "uuid", "nameAr": "رياضيات" }],
      "quizCount": 12,
      "maxQuizLimit": 50,
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

## `POST /api/admin/teachers`

**Purpose**: Create admin-provisioned teacher account.

**Body**:

```json
{
  "fullName": "أحمد محمد",
  "email": "ahmad@school.sy",
  "password": "optional-if-generate",
  "generatePassword": true,
  "phoneNumber": "963912345678",
  "subjectIds": ["uuid", "uuid"],
  "status": "active",
  "maxQuizLimit": 50
}
```

**Validation**:

- `fullName`, `email` required
- `password` required unless `generatePassword: true`
- `email` unique; reject if used by any profile
- `subjectIds` must reference active catalog entries
- `status` defaults to `active`

**Response 201**:

```json
{
  "teacher": { /* AdminTeacherRow */ },
  "generatedPassword": "xK9mP2nQ4rTv"
}
```

`generatedPassword` present only when auto-generated (show once to admin).

**Errors**: `400` validation; `409` duplicate email.

---

## `PUT /api/admin/teachers/[id]`

**Purpose**: Update profile, subjects, status, password, quiz limit.

**Body** (all optional):

```json
{
  "fullName": "أحمد محمد",
  "email": "new@school.sy",
  "phoneNumber": "963912345678",
  "subjectIds": ["uuid"],
  "status": "inactive",
  "maxQuizLimit": 100,
  "newPassword": "reset-value",
  "generatePassword": false
}
```

**Response 200**: `{ "teacher": AdminTeacherRow }`

**Errors**: `404` not found; `409` email conflict.

---

## `DELETE /api/admin/teachers/[id]`

**Purpose**: Permanently delete teacher with quiz disposition.

**Body**:

```json
{
  "confirm": true,
  "disposition": "reassign",
  "reassignToTeacherId": "uuid"
}
```

- If teacher has **no quizzes**: `disposition` optional
- If teacher has quizzes: `disposition` required
- `reassign` requires `reassignToTeacherId` (active teacher, ≠ self)
- `archive` sets `quizzes.is_archived = true`, `is_active = false`

**Response 200**: `{ "ok": true, "deletedTeacherId": "uuid" }`

**Errors**: `400` missing disposition; `404` teacher/reassign target not found.

---

## `POST /api/admin/impersonate/[teacherId]`

**Purpose**: Start impersonation session as target teacher.

**Preconditions**: Target teacher `status = active`; caller not already impersonating.

**Response 200**:

```json
{
  "redirectTo": "/teacher/dashboard",
  "teacherName": "أحمد محمد"
}
```

Sets session: `role = TEACHER`, `profileId = teacherId`, stores `impersonation` blob.

**Errors**: `403` inactive teacher; `409` already impersonating.

---

## `POST /api/admin/impersonate/exit`

**Purpose**: Restore Super Admin session from impersonation.

**Response 200**:

```json
{
  "redirectTo": "/admin/teachers"
}
```

Clears impersonation fields; restores `role = SUPER_ADMIN`, `profileId = adminProfileId`.

**Errors**: `400` not currently impersonating.

---

## `GET /api/admin/subjects`

**Purpose**: Subject catalog for create/edit modals (helper endpoint).

**Response 200**:

```json
{
  "subjects": [{ "id": "uuid", "nameAr": "رياضيات", "slug": "math" }]
}
```

---

## Auth routes (non-REST, pages)

| Route | Purpose |
|-------|---------|
| `POST /api/admin/auth/login` | Super Admin email + password → session |
| `POST /api/admin/auth/logout` | Clear session |

Alternative: Server Action on `/admin/login` form — implementer may choose Action for login page only; KPI/teacher CRUD stay as Route Handlers per contract.

---

## Audit events (server-side, not exposed as API v1)

| Action | Trigger |
|--------|---------|
| `teacher.create` | POST teachers |
| `teacher.update` | PUT teachers |
| `teacher.delete` | DELETE teachers |
| `impersonate.start` | POST impersonate |
| `impersonate.end` | POST impersonate/exit |
