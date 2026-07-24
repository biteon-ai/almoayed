# Feature Specification: Student Unlink vs Admin Hard Delete

**Feature Branch**: `017-student-unlink-purge`

**Created**: 2026-07-24

**Status**: Clarified

**Feature ID**: `MT-003` (extends `TEACH-001` & `ADMIN-001`)

**Input**: User description: "Restrict hard deletion of student records to Super Admin only; teacher student removal only unlinks the student-teacher relationship without losing profile or performance data. Admin panel gets a platform-wide student table with permanent purge under double confirmation. Preserve multi-tenant links, teacher scoping, Server Actions, gatekeeper, and RTL UX."

## Clarifications

### Session 2026-07-24

- Q: How should Super Admin double confirmation for permanent student delete work? → A: Two sequential AlertDialogs (first warn, then final irreversible confirm).
- Q: Which students appear in the Super Admin platform students table? → A: All student-role profiles (including zero teacher links / orphans).
- Q: What should the teacher-facing remove control say? → A: Rename primary CTA to «إزالة من قائمتك» (and matching dialog title); body keeps the account-safe copy.
- Q: If a student still has active teacher links, may Super Admin hard-delete them immediately? → A: Allow purge anytime; first dialog must show active teacher-link count.
- Q: Which profiles may Super Admin hard-delete via the students purge action? → A: Only student-role profiles; refuse all other roles.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Teacher removes a student by unlinking only (Priority: P1)

As a teacher, I want to remove a student from my roster without destroying their account or exam history so I can clean my list safely and the student can still exist for other teachers or future re-linking.

**Why this priority**: Correct teacher-side safety is the core of MT-003 and protects student data integrity.

**Independent Test**: On `/teacher/students`, remove a linked student after confirmation; the student disappears from this teacher’s list; the student profile and past scores remain in the system; other teachers’ links (if any) are unchanged.

**Acceptance Scenarios**:

1. **Given** a teacher viewing their student list, **When** they choose «إزالة من قائمتك» for a student, **Then** an Arabic confirmation (title aligned with إزالة) explains that the student will be removed from *their list only* and that the account and performance history will not be deleted (e.g. «سيتم إزالة الطالب من قائمة طلابك فقط، ولن يتم حذف حسابه أو سجل أداءه»).
2. **Given** the confirmation dialog is open, **When** the teacher cancels, **Then** the student remains on the roster unchanged.
3. **Given** the confirmation dialog is open, **When** the teacher confirms, **Then** only this teacher’s relationship to the student is removed (under the active teacher context); the student’s core account and submitted quiz/score history remain intact.
4. **Given** a student linked to Teacher A and Teacher B, **When** Teacher A unlinks, **Then** Teacher B’s link and that student’s data remain intact.
5. **Given** any teacher-facing remove action, **When** inspected for product guidance, **Then** it exposes Spekit id `unlink-student-action`.
6. **Given** the students table/card actions, **When** the teacher reads the remove control, **Then** the primary label is «إزالة من قائمتك» (not «حذف الطالب» as a hard-delete implication).

---

### User Story 2 - Super Admin can hard-delete a student platform-wide (Priority: P1)

As a Super Admin, I want a dedicated students table in the admin panel and a carefully gated permanent delete so I can purge accounts that must leave the platform entirely.

**Why this priority**: Hard delete must exist but only under Super Admin; without it, irreversible cleanup is impossible; without gating, data loss risk is unacceptable.

**Independent Test**: In `/admin` students management, locate a student, start permanent delete, cancel once (still present), confirm twice (account and associated student records are gone platform-wide).

**Acceptance Scenarios**:

1. **Given** a Super Admin, **When** they open the admin student management surface, **Then** they see a table of all student-role profiles across the platform — including students with no current teacher links (orphans) — not limited to one teacher’s roster.
2. **Given** an admin selects permanent delete for a student who still has teacher links, **When** the first Arabic AlertDialog appears, **Then** it warns of irreversible loss and shows the active teacher-link count (e.g. «مرتبط بـ N مدرسين»); cancel leaves the student unchanged.
3. **Given** the admin confirms the first dialog, **When** a second AlertDialog appears stating the action is irreversible, **Then** only after confirming that second dialog does the permanent purge run; canceling the second step leaves the student unchanged.
4. **Given** permanent delete succeeds (including when the student had multiple teacher links), **When** the admin refreshes the student table (and related teacher rosters), **Then** that student account no longer appears and cannot be restored from the teacher unlink flow.
5. **Given** a purge request for a non-student role profile, **When** the admin student purge action runs, **Then** it is refused with an Arabic error and no profile is deleted.

---

### User Story 3 - Teachers cannot hard-delete profiles (Priority: P1)

As the platform operator, I need assurance that no teacher-accessible action can delete a student profile/account row so multi-tenant history cannot be wiped by a single teacher.

**Why this priority**: Safety invariant for MT-003; complements US1.

**Independent Test**: Audit/teacher Server Actions: teacher remove path never deletes profile/account rows; only relationship (and this-teacher group membership cleanup as needed) is removed.

**Acceptance Scenarios**:

1. **Given** a logged-in teacher, **When** they use any student remove/delete control in the teacher app, **Then** the system does not delete the student’s core account record.
2. **Given** code review / automated checks of teacher Server Actions, **When** remove-student is exercised, **Then** no teacher-role path performs a profile/account hard delete.

---

### User Story 4 - RTL admin/teacher UX consistency (Priority: P2)

As Arabic-first users (teacher and admin), I want unlink and purge dialogs to be RTL, clear, and touch-friendly.

**Why this priority**: Required for ship quality; does not block safety logic.

**Independent Test**: Open teacher unlink and admin double-confirm dialogs on a narrow viewport; copy Arabic; layout RTL.

**Acceptance Scenarios**:

1. **Given** teacher unlink or admin purge dialogs, **When** viewed on mobile, **Then** layout is RTL with touch-friendly primary actions and Tajawal-consistent shell typography.

---

### Edge Cases

- Teacher unlinks last student on a page → empty Arabic state; pagination remains coherent.
- Student has submissions under this teacher → after unlink, history remains in DB; student may no longer see that teacher’s active catalog until re-linked.
- Teacher group membership for this teacher’s groups is cleaned on unlink; other teachers’ groups untouched.
- Admin hard-deletes a student still linked to multiple teachers → allowed after two dialogs; first dialog shows link count; all links and cascading student-owned records are purged.
- Admin purge requested for a non-student role profile → refused with Arabic error; no deletion.
- Admin cancels either of the two sequential confirmation dialogs → no purge.
- Impersonating admin-as-teacher (if present) still cannot hard-delete profiles via teacher UI — only true Super Admin student purge path can.
- Teacher unlinks last remaining teacher link for a student → student becomes an orphan profile (still listed in admin students table for possible hard delete).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Teacher remove/delete on the students hub MUST only unlink the student from the active teacher’s relationship record (scoped to that teacher), not delete the student’s core account.
- **FR-002**: Teacher unlink MUST leave the student’s quiz attempts, scores, and other historical performance data intact in the system.
- **FR-003**: Teacher unlink MUST show an Arabic AlertDialog titled for list removal (e.g. «تأكيد الإزالة من قائمتك») whose body clearly states list-only removal and preservation of account/performance history (example: «سيتم إزالة الطالب من قائمة طلابك فقط، ولن يتم حذف حسابه أو سجل أداءه»). The teacher primary remove control label MUST be «إزالة من قائمتك» (not «حذف الطالب» as the primary label).
- **FR-004**: Teacher unlink control MUST expose Spekit discovery id `unlink-student-action`.
- **FR-005**: Super Admin MUST have a dedicated platform-wide students management table under the admin panel listing **all student-role profiles**, including those with zero teacher links (orphans after unlink).
- **FR-006**: Super Admin MUST be able to permanently purge a **student-role** account (even if teacher links remain) and cascade-clean associated student records when explicitly requested. The purge path MUST refuse non-student roles (e.g. teacher / Super Admin) with an Arabic error.
- **FR-007**: Super Admin permanent delete MUST require two sequential Arabic AlertDialogs (warn, then irreversible confirm) before purge executes; canceling either step MUST leave the student unchanged. Typed passphrase confirmation is not required. The first (warn) dialog MUST display the student’s active teacher-link count.
- **FR-008**: No Server Action reachable by the teacher role MUST be able to hard-delete a student core account (`profiles` / equivalent user record).
- **FR-009**: All mutations MUST use Server Actions (or existing admin privileged server paths) with proper role checks (`requireTeacher` vs Super Admin).
- **FR-010**: Multi-tenant relationship structures remain the source of teacher–student linkage; unlink removes only the scoped relationship for the active teacher.
- **FR-011**: Teacher and admin UI for these flows MUST be Arabic RTL and touch-friendly.
- **FR-012**: QUIZ-001 gatekeeper behavior for remaining exams MUST stay unchanged.

### Key Entities

- **Student–teacher link**: Relationship row tying one student to one teacher; teacher “delete” removes only this link (for that teacher).
- **Student account**: Core identity/profile retained after teacher unlink; removable only by Super Admin hard delete.
- **Performance history**: Submissions/scores retained after unlink; removed only as part of admin hard-delete cascade when specified.
- **Admin student directory**: Platform-wide list of **all** student-role profiles for Super Admin management and purge (includes orphans).
- **Orphan student**: Student-role profile with zero `student_teachers` links after all teachers unlinked; still visible to Super Admin for hard delete.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of teacher remove confirmations use Arabic copy that states list-only removal (not account deletion), and the primary control reads «إزالة من قائمتك».
- **SC-002**: After teacher unlink, student profile and prior submission records for that student still exist in the system (verifiable in admin or DB checks).
- **SC-003**: In multi-teacher checks, unlinking under Teacher A never removes Teacher B’s link (0 cross-teacher link losses).
- **SC-004**: 100% of Super Admin permanent deletes require two sequential AlertDialog confirmations; the first dialog shows teacher-link count; canceling either step leaves the student present.
- **SC-005**: After admin hard delete, the student no longer appears in the admin student table or any teacher roster (0 residual links).
- **SC-006**: Automated or review checks find 0 teacher-role code paths that hard-delete student profile/account rows.
- **SC-007**: Unlink and purge primary controls remain usable on phone-width RTL layouts.
- **SC-008**: Admin students table can locate a student with zero teacher links after full unlink (orphan still listed).
- **SC-009**: Attempts to hard-delete a non-student profile via the admin student purge path fail with 0 successful deletions.

## Out of Scope

- Soft-deleting student profiles (admin purge is hard delete only).
- Advanced admin student analytics beyond locate + purge.
- Changing QUIZ-001 gatekeeper behavior.
- Requiring teachers to unlink before admin can purge.

## Assumptions

- Existing teacher relationship-unlink behavior (delete scoped `student_teachers` row + this-teacher group membership cleanup) remains the correct teacher semantic; MT-003 aligns confirmation copy, CTA label, Spekit, and success toast («تمت الإزالة من قائمتك») — not a soft-delete column on profiles.
- Teacher-facing remove CTA uses «إزالة من قائمتك» terminology to avoid implying account hard-delete; success toast prefers «تمت الإزالة من قائمتك».
- “Double confirmation” means **two sequential Arabic AlertDialogs** (warn → final irreversible confirm), not a typed passphrase.
- Admin hard delete is allowed even when teacher links remain; teachers need not unlink first. First warn dialog includes teacher-link count.
- Admin hard delete cascades student-owned links, group memberships, submissions/answers, and related student rows consistent with referential integrity; purge is limited to student-role profiles only (never teacher / Super Admin accounts via this path).
- Platform uses `profiles` as the student identity store (no separate `users` table required for acceptance if that is the project model).
- Feature registry and Spekit maps are updated for MT-003; `npm run build` is part of the implementation gate.
- Admin students table lists all student-role profiles (including orphans with zero teacher links); advanced analytics remain out of scope. Basic search + columns (name, WhatsApp, teacher-link count) are sufficient for locate-and-purge.

