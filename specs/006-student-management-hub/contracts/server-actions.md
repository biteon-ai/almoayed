# Server Action Contracts: TEACH-001 Hub

**Module**: `src/actions/teacher.ts`  
**Auth**: Every action starts with `requireTeacher()`; scope with `teacher_id = session.profileId`.

Result shape (new mutating helpers):

```ts
type ActionResult = { ok: true } | { ok: false; error: string };
```

Arabic `error` strings for UI toasts/inline alerts.

---

## Existing (reuse)

| Action | Notes |
|--------|--------|
| `getTeacherStudents(filters?)` | Keep; page continues to load full scoped list. Optional: map `groupId`. |
| `getTeacherGroups()` | Unchanged |
| `createTeacherGroup(groupName)` | Unchanged (TEACH-002) |
| `updateStudentStatus(linkId, status)` | Call only with `active` \| `deactivated` from hub |
| `updateStudentTier(linkId, tier)` | Pro approve → `pro`; revoke → `free` |
| `approveProUpgrade(linkId)` | Keep as thin wrapper |
| `assignStudentToGroup(groupId, studentId)` | Replace with replace-semantics helper or wrap (see below) |

---

## `createStudentManually`

```ts
createStudentManually(input: {
  fullName: string;
  whatsappNumber: string;
}): Promise<ActionResult>
```

- Normalize WhatsApp; validate name + WhatsApp.
- Create profile if needed (`role: student`).
- Insert `student_teachers` `{ status: "active", tier: "free" }` or error if link exists.
- `revalidatePath("/teacher/students")`.

---

## `updateStudentInfo`

```ts
updateStudentInfo(input: {
  linkId: string;
  fullName: string;
  groupId: string | null; // null = clear («بدون مجموعة»)
}): Promise<ActionResult>
```

- Verify link ownership.
- Update `profiles.full_name` for linked student (**not** WhatsApp).
- Apply group replace/clear for this teacher.
- Revalidate path.

---

## `toggleStudentStatus` (optional thin wrapper)

```ts
toggleStudentStatus(
  linkId: string,
  status: "active" | "deactivated"
): Promise<ActionResult>
```

- Reject any other status.
- Delegate to `updateStudentStatus` (+ existing `is_subscribed` on activate).
- Prefer returning `ActionResult` for toast-friendly errors; may keep void + throw if matching current style — implementer picks one style consistently for new actions.

---

## `deleteStudentLink`

```ts
deleteStudentLink(linkId: string): Promise<ActionResult>
```

- Ownership check.
- Delete this teacher’s `teacher_group_members` for that student.
- Delete `student_teachers` row.
- Do not delete `profiles`.
- Revalidate path.

---

## `setStudentGroup` / clear

```ts
setStudentGroup(input: {
  studentId: string;
  groupId: string | null;
}): Promise<ActionResult>
```

- If `groupId` set: verify group `teacher_id`; remove student from all groups owned by this teacher; insert membership.
- If `null`: remove from all this teacher’s groups only.
- Prefer updating `assignStudentToGroup` callers to this replace semantics (or change `assignStudentToGroup` in place and add `clearStudentGroup(studentId)`).

---

## `getPaginatedStudents` (not required for v1)

Spec named this action; **research deferred server pagination**. Optional alias that returns `{ rows, total, page, pageSize }` over in-memory slice is unnecessary if UI paginates — skip unless tasks prefer a pure helper in `src/lib/` for testability:

```ts
paginateStudents(rows: TeacherStudentRow[], page: number, pageSize = 8)
```

---

## Multi-tenant invariants (tests)

1. Teacher A cannot update/delete Teacher B’s `linkId`.
2. Teacher A cannot assign into Teacher B’s `groupId`.
3. Unlink never removes another teacher’s `student_teachers` row.
