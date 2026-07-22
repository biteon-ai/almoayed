# Feature Specification: Teacher Student Management Hub

**Feature Branch**: `006-student-management-hub`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Refactor and enhance `/teacher/students` into a Student Management Hub: manual add student, search/filter (tier, status, study group), scannable student cards with status/Pro/group/edit/delete actions, confirmation dialogs for destructive actions, pagination at 8 students per page, multi-tenant scoping to the active teacher, Arabic RTL UX."

## Clarifications

### Session 2026-07-22

- Q: On edit, may teachers change WhatsApp identity, or only name/group? → A: Name and group only; WhatsApp is read-only after link creation (correct via unlink + re-add if needed).
- Q: What can teachers do with status «معلق»? → A: Filter + resolve only (activate → نشط or deactivate → معطل); teachers cannot manually set status back to معلق.
- Q: Can teachers clear a study-group assignment? → A: Yes — group selector includes clear/unassign («بدون مجموعة»).
- Q: Does revoking Pro need a confirmation dialog? → A: No confirm — revoke immediately; show success toast only.
- Q: How should the roster present on phone vs wider screens? → A: Unified card/row list at all widths (responsive density only; no separate desktop table).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and find students quickly (Priority: P1)

As a teacher, I want to open my students page and immediately search or filter my roster so I can find the right student without scrolling endlessly.

**Why this priority**: Discovery is the daily job of the page; without search, filters, and pagination the hub does not improve on the basic list.

**Independent Test**: With a roster larger than one page, apply search text and each filter type; results update to matching students only, paginated at eight per page, with a clear empty state when nothing matches.

**Acceptance Scenarios**:

1. **Given** a logged-in teacher on «إدارة الطلاب», **When** the page loads on mobile or desktop, **Then** they see the Arabic page title, an «إضافة طالب جديد» action, a search field, tier/status/group filters, and up to eight students as a unified card/row list (not a separate desktop table layout).
2. **Given** students on the roster, **When** the teacher types part of a name or WhatsApp number in search, **Then** the list shows only matching students (case- and whitespace-tolerant for practical use).
3. **Given** students of mixed tiers, **When** the teacher chooses مجاني or Pro, **Then** only students of that tier appear; «الكل» shows all tiers.
4. **Given** students of mixed account statuses, **When** the teacher filters نشط / معلق / معطل (or «كل الحالات»), **Then** only students with that status appear.
5. **Given** students assigned to different study groups, **When** the teacher filters by a study group, **Then** only students in that group appear.
6. **Given** more than eight matching students, **When** the teacher uses «التالي» / «السابق», **Then** they move between pages and see «الصفحة X من Y» with RTL-friendly controls.
7. **Given** filters/search that match nobody, **When** results update, **Then** they see «لا يوجد طلاب يطابقون خيارات البحث» (or equivalent clear Arabic empty copy) instead of a blank or broken layout.

---

### User Story 2 - Add a student manually (Priority: P1)

As a teacher, I want to add a student by name and WhatsApp so they appear on my roster without relying only on bulk import or student self-registration.

**Why this priority**: Manual enrollment is a core hub capability and unblocks teachers who onboard students one-by-one.

**Independent Test**: Open add-student flow, submit valid name + WhatsApp; student appears under this teacher with default free/active (or product-default) status and a success confirmation.

**Acceptance Scenarios**:

1. **Given** a teacher on the students hub, **When** they tap «إضافة طالب جديد», **Then** a modal opens with fields «اسم الطالب» and «رقم الواتساب».
2. **Given** valid name and WhatsApp, **When** they confirm create, **Then** the student is linked to the teacher’s roster with default tier مجاني and status نشط (unless an existing link already exists—see edge cases), and a success toast/alert appears.
3. **Given** incomplete or invalid fields, **When** they attempt to create, **Then** validation messages appear in Arabic and no roster change occurs.
4. **Given** a successful create, **When** the modal closes, **Then** the list reflects the new student (searchable/filterable like any other).

---

### User Story 3 - Manage status, tier, and study group inline (Priority: P1)

As a teacher, I want to activate/deactivate a student, approve or revoke Pro, and assign a study group from the list row/card so I can manage day-to-day enrollment without leaving the page.

**Why this priority**: These are the existing TEACH-001/002 management actions; the hub must keep them obvious, touch-friendly, and safe.

**Independent Test**: Toggle status (with confirmation on deactivate), change Pro, change group; each persists and updates badges; deactivated students cannot take exams under this teacher context per existing product rules.

**Acceptance Scenarios**:

1. **Given** an active student card, **When** the teacher chooses تعطيل and confirms the deactivation dialog (explaining temporary lock of exam access), **Then** status becomes معطل and the UI shows clear deactivated feedback.
2. **Given** a deactivated or pending student, **When** the teacher chooses تفعيل, **Then** status becomes نشط without requiring a destructive-style confirmation.
3. **Given** a pending student, **When** the teacher chooses تعطيل and confirms, **Then** status becomes معطل (pending is resolved, not restored later by the teacher).
4. **Given** a free student, **When** the teacher approves Pro, **Then** the tier badge shows Pro and the change is reflected on refresh.
5. **Given** a Pro student, **When** the teacher revokes Pro, **Then** the tier badge returns to مجاني immediately with a success toast and without an AlertDialog confirmation.
6. **Given** available study groups, **When** the teacher picks a group on the student row, **Then** the assigned-group badge updates to the selected group.
7. **Given** a student already in a group, **When** the teacher chooses «بدون مجموعة» (or equivalent clear option) on the group control, **Then** the student has no study-group assignment and the badge reflects unassigned.

---

### User Story 4 - Edit student details (Priority: P2)

As a teacher, I want to edit a student’s name and/or group from an «تعديل» flow so I can correct display and grouping mistakes without deleting and recreating the link.

**Why this priority**: Correction is common but secondary to browse/add/status for MVP value.

**Independent Test**: Open edit, change name and/or group, save; list and badges show updated values; WhatsApp remains unchanged; success feedback appears.

**Acceptance Scenarios**:

1. **Given** a student on the roster, **When** the teacher taps تعديل, **Then** a modal shows editable name and group, and WhatsApp as a read-only identifier.
2. **Given** edited valid name/group values, **When** the teacher saves, **Then** those changes persist, WhatsApp is unchanged, a success toast appears, and the list updates.
3. **Given** invalid name input, **When** save is attempted, **Then** Arabic validation errors appear and prior values remain until fixed.
4. **Given** a wrong WhatsApp was entered at create time, **When** the teacher needs to fix identity, **Then** they unlink and re-add with the correct number (edit does not change WhatsApp).

---

### User Story 5 - Remove student from my list safely (Priority: P2)

As a teacher, I want to remove a student from my roster only after a clear confirmation so I do not unlink someone by accident.

**Why this priority**: Destructive action must be safe; frequency is lower than daily status management.

**Independent Test**: Start delete, cancel once (no change), confirm once (student leaves this teacher’s list); other teachers’ links (if any) are unaffected.

**Acceptance Scenarios**:

1. **Given** a student on the roster, **When** the teacher taps حذف / إلغاء الربط, **Then** an alert dialog asks «هل أنت أؤكد حذف هذا الطالب من قائمتك؟» (or equivalent confirmed Arabic copy).
2. **Given** the confirm dialog open, **When** the teacher cancels, **Then** the student remains on the list unchanged.
3. **Given** the confirm dialog open, **When** the teacher confirms, **Then** the student is removed from this teacher’s roster, success feedback appears, and pagination/filters remain coherent (e.g., empty page advances or shows empty state).

---

### Edge Cases

- Search/filter combination yields zero results → Arabic empty state; pagination hidden or disabled appropriately.
- Changing filters/search while on page 2+ → results reset to page 1 of the new result set.
- Adding a WhatsApp that already exists as a profile → link to this teacher if not already linked; if already linked to this teacher, show a clear Arabic message (no duplicate row).
- Adding a WhatsApp already linked to another teacher → still allow link under multi-tenant rules (student can have multiple teachers); do not expose other teachers’ private data.
- Deactivating a student → exam access under this teacher is locked until reactivated (existing product behavior).
- Teacher has no study groups → group filter and inline group control show an empty/disabled Arabic state without crashing.
- Teacher has zero students → friendly empty roster message distinct from “no search matches,” plus the add-student CTA still available.
- Concurrent edit/delete of the same student → show recoverable Arabic error; list can be refreshed to truth.
- Unauthenticated or non-teacher access to `/teacher/students` → redirect/deny per existing teacher auth.
- Attempts to view or mutate another teacher’s students → must fail; only the active teacher’s roster is visible/editable.
- Teacher attempts to set status explicitly to معلق → not offered in UI; any such request is rejected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Teachers MUST access a Student Management Hub at `/teacher/students` titled «إدارة الطلاب» with a primary «إضافة طالب جديد» control.
- **FR-002**: Teachers MUST be able to create/link a student using name and WhatsApp; new links default to tier مجاني and status نشط unless an existing relationship already defines otherwise.
- **FR-003**: Teachers MUST be able to search the roster in real time by student name or WhatsApp number.
- **FR-004**: Teachers MUST be able to filter by tier (الكل / مجاني / Pro), account status (كل الحالات / نشط / معلق / معطل), and study group.
- **FR-005**: The hub MUST present each student in a unified scannable card/row pattern at all breakpoints (responsive density only—no separate desktop table), showing name, WhatsApp, study-group badge, tier badge, and account-status badge, with polished Arabic typography suitable for RTL.
- **FR-006**: Teachers MUST be able to activate (→ نشط) or deactivate (→ معطل) a student from the list, including resolving معلق students via those same actions; deactivation MUST require a confirmation dialog that explains temporary lock of exam access. Teachers MUST NOT be able to manually set status to معلق.
- **FR-007**: Teachers MUST be able to approve Pro or revoke Pro from the list with clear visual feedback after the change. Revoking Pro MUST NOT require a confirmation dialog (success toast only). Approving Pro likewise needs no confirmation dialog.
- **FR-008**: Teachers MUST be able to assign, change, or clear a student’s study group from the list; clear MUST be available as an explicit «بدون مجموعة» (or equivalent) option.
- **FR-009**: Teachers MUST be able to edit student name and assigned group via an edit flow with success feedback on save; WhatsApp MUST remain read-only on edit (identity corrections use unlink + re-add).
- **FR-010**: Teachers MUST be able to remove (unlink) a student from their roster only after confirming via an alert dialog with the agreed Arabic copy.
- **FR-011**: Successful create/update/status/tier/group/delete operations MUST show a brief success toast or equivalent non-blocking confirmation.
- **FR-012**: The hub MUST paginate results at exactly eight students per page with «الصفحة X من Y», «السابق», and «التالي» in RTL layout.
- **FR-013**: When search/filters match no students, the hub MUST show a helpful Arabic empty message (e.g. «لا يوجد طلاب يطابقون خيارات البحث»).
- **FR-014**: All reads and writes for this hub MUST be scoped strictly to the teacher’s active teacher identity (multi-tenant safety); no cross-teacher roster leakage.
- **FR-015**: Interactive controls on the hub MUST meet touch-friendly sizing (minimum height equivalent to comfortable thumb targets on mobile).
- **FR-016**: All user-visible strings for this feature MUST be natural Arabic and laid out for `dir="rtl"`.

### Key Entities

- **Teacher roster link**: Relationship between a teacher and a student on that teacher’s list; holds status (نشط / معلق / معطل), tier flags relevant to this teacher context, and optional study-group assignment. معلق is an inbound/resolvable state; teacher actions only transition to نشط or معطل.
- **Student profile**: Display name and WhatsApp identity shown on cards; WhatsApp is set at create/link time and is not editable from the hub edit flow; profile may be shared across teachers via separate links.
- **Study group**: Teacher-owned group used for filtering and assignment on the hub.
- **Roster filters**: Combined search text + tier + status + group that define the current result set before pagination.
- **Pagination window**: Current page of eight students within the filtered result set.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Teachers can locate a known student by name or WhatsApp via search in under 10 seconds on a roster of at least 24 students.
- **SC-002**: Teachers can complete manual add (open → fill → confirm → see student on list) in under 60 seconds on a typical mobile viewport.
- **SC-003**: Destructive remove never occurs without an explicit confirm step; cancel leaves the roster unchanged 100% of observed attempts in acceptance testing.
- **SC-004**: Filtered or full result sets never show more than eight students on a single page; page indicator matches total pages of the current filter set.
- **SC-005**: In multi-teacher fixtures, Teacher A never sees or mutates Teacher B’s links via this hub (0 cross-tenant leaks in acceptance tests).
- **SC-006**: Primary hub actions (add, filter, deactivate-with-confirm, edit, unlink-with-confirm) remain usable on a ~390×844 mobile viewport without horizontal scrolling of the main content; the same card/row pattern remains usable on a typical desktop width without switching to a table layout.

## Assumptions

- This feature upgrades the existing Student Management capability (TEACH-001) and continues to coexist with study groups (TEACH-002) and bulk import (TEACH-004); bulk import is out of scope for this hub redesign except that imported students appear in the same list.
- «حذف / إلغاء الربط» removes the student from **this teacher’s** roster only; it does not erase the student’s global account or other teachers’ links.
- Default for newly added students: tier مجاني, status نشط.
- After create/link, WhatsApp is immutable on the edit flow; teachers correct a wrong number by unlinking and adding again.
- Reactivation (تفعيل) does not require a heavy destructive confirmation; only deactivation and delete/unlink do. Pro approve and Pro revoke also require no confirmation dialog (toast only).
- «معلق» maps to the product’s existing pending account/relationship status; teachers may filter by it and resolve it via تفعيل/تعطيل only—they cannot assign معلق manually.
- Study group assignment is optional; teachers can clear it via «بدون مجموعة» on the group control (and via edit when group is editable there).
- Pro approve/revoke follows existing teacher Pro management rules (TIER-002) and only affects the link under the active teacher.
- WhatsApp normalization follows existing app login/identifier rules (digits / country conventions already used elsewhere).
- Pagination may be applied after filtering either on the server or in the client as long as the teacher always sees at most eight students per page and correct page counts; planning will choose the approach.
- Unauthenticated and non-teacher access continues to follow existing teacher-area guards.
- Spekit hooks for filters/cards/activate/deactivate should be preserved or remapped so enablement tours keep working (ENABLE-001); exact hook IDs are a planning concern.
- Roster presentation is a single card/row list across breakpoints; planning may tighten spacing on wide screens but must not introduce a distinct table UI.
