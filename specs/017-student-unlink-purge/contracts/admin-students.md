# Contracts: Admin Students API & Teacher Unlink (MT-003)

## Teacher Server Action (existing, tighten contract)

### `deleteStudentLink(linkId: string): Promise<ActionResult>`

1. `requireTeacher()`; `tid = session.profileId`
2. Load link: `student_teachers` where `id = linkId` AND `teacher_id = tid`
3. Delete `teacher_group_members` for `student_id` in this teacher’s groups only
4. Delete `student_teachers` row scoped to `tid`
5. **MUST NOT** call `profiles.delete` / update role / wipe submissions
6. `revalidatePath("/teacher/students")`

**Guarantees**: MT-002; FR-001/002/008.

---

## Admin library (`src/lib/admin/students.ts`)

### `listStudents(filters?: { q?: string }, pageInput?: PageInput): Promise<PagedResult<AdminStudentRow>>`

- Filter `profiles.role = 'STUDENT'`
- Optional `q` ilike on `full_name` / `phone_number`
- Include `teacherLinkCount` (aggregate or subquery count of `student_teachers`)
- Default `pageSize = 20`; clamp page
- Order `created_at DESC`

### `hardDeleteStudent(adminId, studentId, { confirm: boolean }): Promise<{ok}|{ok:false,error}>`

1. Require `confirm === true`
2. Load profile; if missing or `role !== 'STUDENT'` → Arabic error
3. Optionally read `teacherLinkCount` for audit metadata
4. `DELETE` profile (`id` + `role = STUDENT`)
5. `writeAdminAuditLog({ action: 'student.hard_delete', ... })`

---

## HTTP

### `GET /api/admin/students?q=&page=`

- Super Admin session required
- Returns `{ items, total, page, pageSize }` (or wrap `PagedResult`)

### `DELETE /api/admin/students/[id]`

- Body: `{ confirm: true }`
- Super Admin required
- Calls `hardDeleteStudent`
- 400 on validation; 404 if not found / not student

---

## UI contracts

### Teacher

- Control label: «إزالة من قائمتك»
- Dialog title/body per FR-003
- Spekit: `unlink-student-action`

### Admin

- Route: `/admin/students`
- Table: name, WhatsApp, teacher link count, created, purge action
- `DeleteStudentPurgeDialog`: two sequential confirms; step 1 shows «مرتبط بـ N مدرسين»
- Spekit (suggested): `admin-students-table`, `admin-student-purge-action`
