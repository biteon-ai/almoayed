# Feature Specification: Super Admin Dashboard

**Feature Branch**: `010-super-admin-dashboard`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "Build a full Super Admin Dashboard for platform-level management. Teachers cannot self-register—only Super Admins may create, edit, activate, deactivate, or delete teacher accounts. Includes KPI analytics overview, searchable teacher management table with create/edit modals, account status toggling, safe deletion with quiz handling, and one-click teacher impersonation with a return banner. UI must match Al-Moayed emerald/teal RTL style with dark mode support."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View platform health at a glance (Priority: P1)

As a Super Admin, I want to open the admin dashboard and see key platform metrics so I can understand overall usage and growth without drilling into individual accounts.

**Why this priority**: Executive visibility is the primary entry point for platform oversight; without KPIs the admin area delivers no immediate value.

**Independent Test**: Log in as Super Admin, open the dashboard, and verify all five metric cards display accurate counts with Arabic labels and active/inactive breakdowns where applicable.

**Acceptance Scenarios**:

1. **Given** a logged-in Super Admin, **When** they open the admin dashboard, **Then** they see metric cards for: total users (students + teachers + admins), total teachers (with active vs inactive breakdown), total students, total exams created (published and draft), and total completed exam attempts.
2. **Given** platform data exists, **When** the dashboard loads, **Then** each metric reflects current platform-wide totals (not scoped to a single teacher).
3. **Given** the dashboard on mobile or desktop, **When** viewed in RTL Arabic layout, **Then** cards are readable, touch-friendly, and consistent with the existing Al-Moayed emerald/teal visual style including dark mode.

---

### User Story 2 - Create teacher accounts exclusively via Super Admin (Priority: P1)

As a Super Admin, I want to create new teacher accounts with all required profile fields so teachers can access the platform without ever self-registering on the public login page.

**Why this priority**: Teacher provisioning is the core governance constraint—public sign-up remains student-only; this story enforces platform control over who may teach.

**Independent Test**: Open create-teacher flow, submit a valid form with all required fields, and confirm the new teacher can log in with the assigned email and initial password while no public teacher sign-up path exists.

**Acceptance Scenarios**:

1. **Given** a Super Admin on teacher management, **When** they open «إضافة مدرس جديد», **Then** a modal/form collects: full name (required), email (required, unique login identifier), initial password (required, with option to auto-generate or enter manually), phone number (optional), assigned subjects/departments (multi-select), account status (active/inactive), and optional max quiz limit.
2. **Given** valid required fields and a unique email, **When** the Super Admin confirms creation, **Then** a new teacher account is created with status «نشط» or «معطّل» per selection and a success confirmation appears in Arabic.
3. **Given** a duplicate email, **When** creation is attempted, **Then** a clear Arabic validation error is shown and no duplicate account is created.
4. **Given** missing or invalid required fields, **When** creation is attempted, **Then** inline Arabic validation prevents submission.
5. **Given** a newly created active teacher, **When** they sign in with email and initial password, **Then** they reach the teacher workspace; public `/login` remains student-only with no teacher self-registration option.

---

### User Story 3 - Browse, search, and filter the teacher roster (Priority: P1)

As a Super Admin, I want to search and filter all teacher accounts in one table so I can quickly find and act on specific teachers across the platform.

**Why this priority**: Daily operations depend on finding teachers efficiently; the table is the operational hub for all management actions.

**Independent Test**: With multiple teachers in mixed statuses, use search and filters; verify matching rows, quiz counts per teacher, and empty-state messaging.

**Acceptance Scenarios**:

1. **Given** teachers exist on the platform, **When** the Super Admin opens teacher management, **Then** they see a searchable, filterable table listing all teachers with relevant columns (name, email, status, subjects, quiz count, and action controls).
2. **Given** a search query (name or email), **When** typed, **Then** the list narrows to matching teachers with practical tolerance for spacing and case.
3. **Given** status filters (active/inactive/all), **When** applied, **Then** only teachers matching the selected status appear.
4. **Given** filters or search matching nobody, **When** results update, **Then** a clear Arabic empty state is shown instead of a broken layout.

---

### User Story 4 - Activate, deactivate, and edit teacher accounts (Priority: P2)

As a Super Admin, I want to update teacher profiles, reset passwords, adjust subject assignments, and toggle account status so I can manage access without deleting accounts.

**Why this priority**: Lifecycle management after creation is essential for support and compliance; deactivation preserves data while blocking access.

**Independent Test**: Edit a teacher's profile, toggle inactive then active, reset password; verify each change persists and login behavior matches status.

**Acceptance Scenarios**:

1. **Given** a teacher row, **When** the Super Admin opens edit, **Then** they can update profile fields, subject assignments, optional quiz limit, and reset the password.
2. **Given** an active teacher, **When** the Super Admin toggles «تعطيل الحساب», **Then** the teacher's status becomes inactive immediately and they cannot access the platform on next login attempt.
3. **Given** an inactive teacher, **When** the Super Admin toggles «تفعيل الحساب», **Then** status becomes active and the teacher can log in again without re-creating the account.
4. **Given** a successful edit or toggle, **When** the action completes, **Then** the table row and any dashboard KPI counts reflect the updated state.

---

### User Story 5 - Impersonate a teacher for support (Priority: P2)

As a Super Admin, I want to sign in as a specific teacher temporarily so I can reproduce issues and verify their experience exactly as they see it, then return safely to my admin session.

**Why this priority**: Support and troubleshooting require seeing the teacher view; impersonation must be safe, obvious, and reversible.

**Independent Test**: Click impersonate on a teacher, confirm teacher UI loads with sticky banner showing teacher name and exit control; exit restores Super Admin session without data loss.

**Acceptance Scenarios**:

1. **Given** a teacher in the roster, **When** the Super Admin chooses «تسجيل الدخول كـ مدرس», **Then** they are placed in that teacher's session and see the app exactly as that teacher would (scoped to that teacher's data).
2. **Given** an active impersonation session, **When** the Super Admin navigates the app, **Then** a sticky floating banner remains visible: «تسجيل الدخول بصفتك المدرس: [اسم المدرس] - انقر هنا للعودة للوحة الأدمن».
3. **Given** the impersonation banner, **When** the Super Admin clicks to return, **Then** the original Super Admin session is restored and they land back in the admin area.
4. **Given** an inactive teacher, **When** impersonation is attempted, **Then** the system blocks impersonation with a clear Arabic explanation (inactive accounts cannot be impersonated).

---

### User Story 6 - Delete a teacher with quiz data handling (Priority: P3)

As a Super Admin, I want to permanently remove a teacher account with explicit confirmation and a choice for their quizzes so I can offboard teachers without orphaning or losing student work unexpectedly.

**Why this priority**: Deletion is destructive and less frequent; it must be deliberate with data stewardship options.

**Independent Test**: Initiate delete, confirm dialog, choose reassign or archive for quizzes; verify teacher removed and quizzes handled per choice.

**Acceptance Scenarios**:

1. **Given** a teacher row, **When** the Super Admin chooses «حذف حساب المدرس», **Then** a confirmation dialog explains consequences and requires explicit confirmation before proceeding.
2. **Given** a teacher with created quizzes, **When** deletion is confirmed, **Then** the Super Admin must choose either: reassign quizzes to another active teacher, or archive quizzes (retained read-only, no new student attempts).
3. **Given** confirmed deletion with a chosen quiz disposition, **When** complete, **Then** the teacher account is removed from the roster, dashboard KPIs update, and quizzes follow the selected path.
4. **Given** a teacher with no quizzes, **When** deletion is confirmed, **Then** the account is removed without requiring quiz disposition.

---

### Edge Cases

- What happens when a Super Admin tries to access admin routes without a Super Admin session? Access is denied with a generic Arabic message and redirect to admin login; no partial data is exposed.
- What happens when creating a teacher with an email already used by a student profile? Creation is rejected with a clear uniqueness error.
- What happens when deactivating a teacher who has linked students? Students retain their accounts but lose active access to that teacher's exams until the teacher is reactivated; no student accounts are deleted.
- What happens when deleting a teacher and no other teacher exists for reassignment? Archive is offered as the default or only option when reassignment is impossible.
- What happens when impersonation is triggered while already impersonating? The system either blocks a second impersonation or ends the prior session first, with a clear prompt—never nested ambiguous sessions.
- What happens when optional phone is omitted but alerts are later enabled? Alert delivery remains disabled until a valid phone number is added on edit.
- What happens when max quiz limit is reached for a teacher? The teacher cannot create new quizzes beyond the limit; Super Admin can raise the limit via edit.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST restrict teacher account creation, editing, activation, deactivation, and deletion to authenticated Super Admin users only.
- **FR-002**: System MUST keep public sign-up/login (`/login`) available exclusively for students; teachers MUST NOT have any self-registration path.
- **FR-003**: System MUST provide a Super Admin dashboard showing platform-wide KPIs: total users, total teachers (active vs inactive), total students, total exams (published + draft), and total completed exam attempts.
- **FR-004**: System MUST provide a teacher management view with search, status filtering, and per-teacher quiz counts.
- **FR-005**: System MUST collect and validate on teacher creation: full name (required), email (required, unique platform-wide, login identifier), initial password (required, auto-generatable or manual), phone (optional), subjects/departments (multi-select from platform catalog), account status (active/inactive), and optional max quiz limit.
- **FR-006**: System MUST allow Super Admins to edit teacher profile fields, subject assignments, optional quiz limit, and password reset.
- **FR-007**: System MUST allow Super Admins to toggle teacher account status between active and inactive without deleting account data.
- **FR-008**: System MUST block inactive teachers from signing in and from being impersonated.
- **FR-009**: System MUST require explicit confirmation before deleting a teacher account.
- **FR-010**: System MUST offer quiz disposition on teacher deletion: reassign to another active teacher OR archive (read-only retention, no new attempts).
- **FR-011**: System MUST support one-click teacher impersonation that loads the teacher experience scoped to that teacher's data.
- **FR-012**: System MUST display a persistent impersonation banner in Arabic with the impersonated teacher's name and a control to return to the Super Admin session.
- **FR-013**: System MUST restore the original Super Admin session when exiting impersonation without requiring re-authentication unless the session expired.
- **FR-014**: System MUST present all Super Admin UI in Arabic RTL layout, matching the existing Al-Moayed emerald/teal design language with dark mode compatibility and rounded, touch-friendly controls.
- **FR-015**: System MUST enforce role-based access so non–Super Admin users cannot reach admin dashboard or teacher management capabilities.
- **FR-016**: System MUST show Arabic validation and success/error feedback for all create, edit, toggle, delete, and impersonation actions.
- **FR-017**: System MUST enforce optional max quiz limits when configured, preventing teachers from exceeding their allocation until a Super Admin raises the limit.

### Key Entities

- **Super Admin**: Platform operator with full cross-tenant visibility; distinct from teachers and students; authenticates through a dedicated admin login path (not public student login).
- **Teacher Account (admin-managed)**: Educator profile created only by Super Admin; attributes include full name, unique email (login), password credentials, optional phone, assigned subjects/departments, active/inactive status, optional max quiz limit, and audit-relevant timestamps.
- **Subject/Department Assignment**: Label from a platform-managed catalog (e.g., Mathematics, Physics, Chemistry) linked to a teacher; supports multiple selections per teacher.
- **Platform KPI Snapshot**: Aggregated counts across all tenants—users by role, teacher status breakdown, student totals, exam totals by lifecycle state, and completed attempt counts.
- **Impersonation Session**: Temporary context where Super Admin acts as a specific teacher; preserves return path to the original admin session; visibly indicated in UI at all times.
- **Quiz Disposition (on delete)**: Decision record for a deleted teacher's quizzes—either transferred to another teacher or archived for read-only retention.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Super Admins can create a fully configured teacher account (all required fields) in under 3 minutes on first attempt.
- **SC-002**: Dashboard KPI cards display all five metric groups within 5 seconds of page load under normal platform load.
- **SC-003**: Teacher search and filter return updated results within 1 second for rosters up to 500 teachers.
- **SC-004**: 100% of teacher lifecycle changes (create, edit, activate, deactivate, delete) are performed only through Super Admin flows—no public teacher registration exists.
- **SC-005**: Impersonation start and safe return to Super Admin session each complete within 10 seconds with the banner visible throughout the impersonated session.
- **SC-006**: 95% of Super Admin management tasks (create, toggle status, edit) complete successfully on first submission when data is valid.
- **SC-007**: Super Admin UI passes visual consistency review against existing Al-Moayed RTL emerald/teal patterns in both light and dark modes.

## Assumptions

- Super Admin is a distinct platform role with dedicated secure authentication separate from student public login and separate from the existing teacher WhatsApp OTP flow used elsewhere in the product.
- Admin-provisioned teachers authenticate with email and password (email serves as username); this is the primary login method for Super Admin–created teacher accounts.
- Phone number is optional at account creation; SMS/WhatsApp alert features remain disabled for that teacher until a valid phone number is provided.
- Subjects/departments are selected from a predefined platform catalog maintained by the product (not free-text tags in v1).
- «Total users» includes students, teachers, and Super Admin accounts; inactive accounts are included in totals but broken out where status breakdown is shown.
- «Total exams created» counts all quizzes platform-wide regardless of publishing state (draft + published).
- «Total completed attempts» counts student submissions that reached a completed/submitted state.
- Impersonation is intended for support and auditing; all impersonation start/end events should be auditable (exact retention policy follows platform standards).
- Deactivating a teacher does not delete linked students or historical attempt data; it blocks the teacher's access and new activity under that account.
- Archive on delete means quizzes remain viewable for historical reference but cannot accept new student attempts.
- Max quiz limit is an optional per-teacher cap; when unset, teachers follow existing platform default limits (e.g., free-tier caps already in the product).
- Super Admin dashboard and teacher management are in scope for v1; student management, billing, and content moderation at platform level are out of scope unless added in a future feature.

## Dependencies

- Existing multi-tenant teacher/student/quiz data model and iron-session (or equivalent) session management.
- Existing Al-Moayed UI component library, RTL layout patterns, and dark mode theming.
- AUTH-005 admin login route as a foundation; extended or replaced to support Super Admin role distinction from teacher emergency fallback.
- Platform-wide aggregation queries across teachers, students, quizzes, and attempts.

## Out of Scope (v1)

- Student account management from Super Admin dashboard.
- Super Admin management of other Super Admin accounts (single-tier admin assumed unless extended later).
- Teacher self-service registration or profile claiming via public login.
- Bulk CSV import of teachers.
- Platform billing, invoicing, or subscription management.
- Editing quiz content while impersonating (impersonation is view/support oriented; destructive teacher actions while impersonating follow normal teacher permissions only).
