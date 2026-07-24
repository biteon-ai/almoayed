# Research: Student Unlink vs Admin Hard Delete (MT-003)

**Date**: 2026-07-24  
**Status**: Complete — all Technical Context items resolved

## 1. Teacher remove semantics

**Decision**: Keep existing `deleteStudentLink(linkId)` in `src/actions/teacher.ts`: delete scoped `student_teachers` row (`teacher_id = session.profileId`) + remove student from this teacher’s `teacher_group_members` only. Never `DELETE` from `profiles`.

**Rationale**: Already matches FR-001/002/008; MT-003 is primarily copy, Spekit, and admin purge — not a new soft-delete column.

**Alternatives considered**:
- Soft-delete flag on `profiles` — rejected (clarifications; orphans stay as full profiles for admin purge).
- Deactivate-only instead of unlink — rejected (spec wants list removal / unlink).

## 2. Teacher UX copy & Spekit

**Decision**:
- Primary CTA / table action: «إزالة من قائمتك» (replace «حذف الطالب»).
- Dialog title: «تأكيد الإزالة من قائمتك».
- Body: «سيتم إزالة الطالب من قائمة طلابك فقط، ولن يتم حذف حسابه أو سجل أداءه» (+ student name).
- Confirm button: «إزالة من قائمتك».
- Success toast: «تمت الإزالة من قائمتك.»
- Spekit: `unlink-student-action` on the trigger control (and optionally dialog root).

**Rationale**: Clarification Q3; reduces hard-delete misunderstanding.

**Alternatives considered**: Keep «حذف» wording — rejected by clarification.

## 3. Admin students surface placement

**Decision**: New route `/admin/students` under `src/app/admin/(portal)/students/`, nav link in admin layout next to teachers («إدارة الطلاب»). Mirror ADMIN-001 teachers table pattern.

**Rationale**: Spec FR-005 dedicated table; existing admin shell already uses portal layout + `requireSuperAdmin`.

**Alternatives considered**:
- Embed under dashboard only — weaker discoverability.
- Nested under teachers — wrong mental model.

## 4. Admin data access pattern

**Decision**: Follow teachers pattern:
- Domain logic in `src/lib/admin/students.ts` (`listStudents`, `hardDeleteStudent`).
- HTTP: `GET /api/admin/students`, `DELETE /api/admin/students/[id]` with Super Admin session check (same as teachers API).
- UI: client `AdminStudentsTable` fetching API (search + server/client page as needed).

Prefer **server-paged** list (`PagedResult`, default page size **20**, same as admin teachers) with search `q` on name/WhatsApp.

**Rationale**: Consistency with ADMIN-001; service-role admin client; constitution server layer. User prompt named `actions/admin.ts` — project already uses `src/lib/admin/*` + API routes for Super Admin; keep that convention rather than inventing a new `actions/admin.ts` unless a thin re-export is useful.

**Alternatives considered**:
- Pure Server Actions only — workable but diverges from teachers table client fetch.
- New `src/actions/admin.ts` — optional thin wrappers; not required if API + lib match teachers.

## 5. Hard delete cascade & role guard

**Decision**:
1. Load profile by id; require `role = 'STUDENT'`; else Arabic error (clarification Q5).
2. Count `student_teachers` for warn dialog metadata (return `teacherLinkCount` from GET detail or include on list row).
3. `DELETE FROM profiles WHERE id = ? AND role = 'STUDENT'`.
4. Rely on existing FKs: `student_teachers` / `teacher_group_members` / `exam_submissions` → `ON DELETE CASCADE` from student profile. Do not delete teacher profiles or quizzes.
5. `writeAdminAuditLog({ action: 'student.hard_delete', targetId, metadata: { teacherLinkCount, fullName } })`.
6. API requires `confirm: true` (and UI only sends after second dialog).

**Rationale**: Clarifications Q1/Q4/Q5; matches `deleteTeacher` confirm + audit style; schema already cascades student-owned rows.

**Alternatives considered**:
- Manual multi-table deletes — unnecessary with CASCADE.
- Block purge while links remain — rejected by clarification Q4.
- Type-to-confirm — rejected by clarification Q1.

## 6. Double-confirm UI

**Decision**: Stateful two-step AlertDialog (or two sequential dialogs) in `DeleteStudentPurgeDialog`:
- Step 1: warn + show «مرتبط بـ N مدرسين» + name/WhatsApp; Cancel / متابعة.
- Step 2: irreversible copy; Cancel / حذف نهائي → `DELETE` API.

**Rationale**: Clarification Q1; mobile-friendly; matches existing AlertDialog primitives.

## 7. Teacher hard-delete prohibition test

**Decision**: Vitest `tests/features/mt-003-student-unlink-purge.test.ts`:
- `deleteStudentLink` updates/deletes only `student_teachers` (+ group members); `profiles.delete` never called.
- `hardDeleteStudent` refuses non-STUDENT role; deletes student profile when role is STUDENT.

**Rationale**: SC-006 / SC-009.

## 8. Impersonation

**Decision**: No change — teacher UI uses `requireTeacher` / `deleteStudentLink` only. Super Admin purge requires `requireSuperAdmin` on API. Impersonated teacher session cannot call admin DELETE.

**Rationale**: Spec edge case; existing auth separation.
