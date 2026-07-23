# Research: Super Admin Dashboard

**Date**: 2026-07-23  
**Feature**: `010-super-admin-dashboard`  
**Feature ID (proposed)**: `ADMIN-001`

## R1 — Super Admin authentication model

**Decision**: Introduce a `SUPER_ADMIN` value on `user_role` and dedicated email + password login at `/admin/login`. Seed the first Super Admin via migration/env (`SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD_HASH` or bootstrap script).

**Rationale**: Spec requires a distinct platform operator role separate from students and teachers. Email is the natural admin identifier and aligns with teacher provisioning fields. Keeps public `/login` student-only (WhatsApp OTP).

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Reuse AUTH-005 WhatsApp + secret for Super Admin | Conflates emergency teacher fallback with platform governance; no durable admin identity |
| Env-only gate without DB role | No audit trail, no multi-admin path, hard to extend |
| Supabase Auth separate user pool | Adds second auth system; iron-session is established |

**AUTH-005 impact**: Move teacher emergency fallback from `/admin/login` to `/admin/emergency` (same form, new route). `/admin/login` becomes Super Admin only. Update `.speckit/spec.yaml` AUTH-005 route.

---

## R2 — Admin-provisioned teacher credentials (constitution exception)

**Decision**: Add optional `email` + `password_hash` on `profiles` for `TEACHER` rows created by Super Admin. Teacher sign-in at `/teacher/login` (email + password). Existing WhatsApp-based teachers (demo, legacy) keep WhatsApp OTP via existing flows where applicable.

**Rationale**: Spec FR-002/FR-005 require email-as-username and initial password for admin-created teachers. Scoped exception to constitution principle #5 (passwordless WhatsApp-only) — students unchanged.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Force synthetic WhatsApp for all teachers | Awkward UX; email is specified as login identifier |
| Magic-link email only | Still passwordless but adds email delivery dependency not in stack |
| Supabase Auth for teachers only | Dual auth stacks; session mismatch with iron-session |

**Password storage**: `bcrypt` via `bcryptjs` (already common in Node stack; no native bcrypt in edge — use Node runtime on admin routes).

---

## R3 — Teacher account status vs student link status

**Decision**: Add `teacher_account_status` enum (`active` | `inactive`) on `profiles` for `role = TEACHER`. Inactive blocks login and impersonation. Distinct from `student_teachers.status` (per-link enrollment).

**Rationale**: Spec FR-007/FR-008 require platform-level teacher on/off without deleting data. Student links remain for history; teacher cannot operate when inactive.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Reuse `student_teachers` pattern | Wrong granularity — one teacher, many students |
| Soft-delete flag only | Spec wants explicit active/inactive toggle UX |

---

## R4 — Subjects / departments catalog

**Decision**: New `subject_catalog` table (platform-managed labels, Arabic + slug) and `teacher_subject_assignments` junction (`teacher_id`, `subject_id`). Seed ~8–12 common subjects (رياضيات، فيزياء، كيمياء، …) in migration.

**Rationale**: Spec requires multi-select from platform catalog, not free text. Normalized junction supports filtering in admin table.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| JSONB array on profiles | Harder to filter/index; no shared catalog |
| Reuse `categories` table | Categories are quiz taxonomy per teacher, not platform departments |

---

## R5 — API Route Handlers vs Server Actions

**Decision**: Implement admin operations as **Next.js Route Handlers** under `src/app/api/admin/**` per user deliverables. Shared logic in `src/lib/admin/` and thin handlers. Use `requireSuperAdmin()` guard (reads iron-session, validates `SUPER_ADMIN` role).

**Rationale**: User explicitly specified REST endpoints; route handlers map 1:1 to contract docs and are easy to test with `fetch`. Constitution server-layer rule satisfied — handlers use `createAdminClient()` only, no client Supabase.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Server Actions only | User-requested API surface; actions still fine for page RSC loaders calling shared lib |
| External API server | Violates single Next.js app architecture |

---

## R6 — Impersonation session shape

**Decision**: Extend `SessionData` with optional impersonation payload:

```ts
impersonation?: {
  adminProfileId: string;
  adminRole: "SUPER_ADMIN";
  teacherId: string;
  teacherName: string;
  startedAt: string; // ISO
};
```

When impersonating, session `role` becomes `TEACHER`, `profileId` becomes target teacher, `currentTeacherId` null. Original admin context stored in `impersonation` for restore on `POST /api/admin/impersonate/exit`. Block nested impersonation (409 if already impersonating).

**Rationale**: Minimal change to existing `requireTeacher()` paths — impersonated session is a normal teacher session with a restore blob. Banner reads `impersonation` from client context (passed from layout RSC).

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Second cookie | Harder to sync/clear; two session sources |
| JWT-only impersonation | New token type; iron-session already handles cookies |

**Audit**: Log impersonation start/end to `admin_audit_log` table (action, admin_id, teacher_id, timestamp).

---

## R7 — Teacher deletion and quiz disposition

**Decision**:

- **Reassign**: `UPDATE quizzes SET created_by = :targetTeacherId WHERE created_by = :deletedTeacherId`
- **Archive**: `UPDATE quizzes SET is_archived = TRUE, is_active = FALSE WHERE created_by = :deletedTeacherId`
- Then delete teacher profile (CASCADE handles groups/links per FK rules; use transaction)

Add `quizzes.is_archived BOOLEAN DEFAULT FALSE`.

**Rationale**: Matches spec FR-010. `is_active = false` already means unpublished; archive adds explicit read-only semantics for historical quizzes.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Hard delete quizzes | Data loss; spec requires stewardship choice |
| Orphan quizzes | Breaks student result history |

---

## R8 — KPI aggregation strategy

**Decision**: Single `GET /api/admin/kpis` runs parallel count queries via admin client:

| Metric | Query |
|--------|-------|
| Total users | `COUNT(*) FROM profiles` + role breakdown |
| Teachers | `COUNT(*) WHERE role = TEACHER` + active/inactive on `teacher_account_status` |
| Students | `COUNT(*) WHERE role = STUDENT` |
| Exams | `COUNT(*) FROM quizzes WHERE is_archived = FALSE` (draft = `is_active = false`) |
| Completed attempts | `COUNT(*) FROM exam_submissions` |

Cache: none in v1; target SC-002 via indexed counts.

**Rationale**: Straightforward, testable, no materialized views needed at current scale.

---

## R9 — Max quiz limit enforcement

**Decision**: Nullable `profiles.max_quiz_limit INTEGER`. When set, `createQuiz` in `src/actions/teacher.ts` counts non-archived quizzes for teacher and rejects if at cap. When null, existing TIER/product defaults apply.

**Rationale**: Spec FR-017; hook at existing quiz creation action minimizes duplication.

---

## R10 — Middleware and route protection

**Decision**: Extend `src/middleware.ts` matcher for `/admin/dashboard`, `/admin/teachers`, `/admin/:path*` (exclude `/admin/login`, `/admin/emergency`). Require `session.role === SUPER_ADMIN` && `!session.impersonation` for admin UI routes. Teacher routes during impersonation use normal teacher guard.

**Rationale**: Consistent with existing student/teacher middleware pattern; FR-015 enforcement at edge.
