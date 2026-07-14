# Feature Specification: User Profile & Settings

**Feature Branch**: `001-profile-settings`

**Created**: 2026-07-14

**Status**: Draft

**Input**: User description: "Create a new user profile and settings page at `/settings` (and `/teacher/settings` redirecting to or sharing the same core components) for logged-in users in the Al-Moayed application. Dual-role adaptive UI for students and teachers with editable name, session management, logout, tier/teacher-code display, and Spekit help hooks."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and update display name (Priority: P1)

As a logged-in student or teacher, I want a dedicated settings page where I can see my profile summary and update my display name so that my identity is correct across the app.

**Why this priority**: Name editing is the core self-service profile action and the minimum viable settings experience.

**Independent Test**: Log in as any role, open settings, change name, save, refresh — the new name appears on the settings page and in session-dependent UI (e.g., welcome text).

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they open `/settings` or `/teacher/settings`, **Then** they see their current display name and WhatsApp number.
2. **Given** a user on the settings page, **When** they edit the name and confirm save, **Then** the new name is persisted and shown immediately without requiring re-login.
3. **Given** a user on the settings page, **When** they view the WhatsApp field, **Then** it is visible but not editable (login identifier).

---

### User Story 2 - Role-specific profile information (Priority: P1)

As a student or teacher, I want the settings page to show information relevant to my role so that I can understand my account status at a glance.

**Why this priority**: Dual-role adaptation is a primary requirement and defines the page’s value for each persona.

**Independent Test**: Compare student vs teacher settings views — each shows role-appropriate fields without exposing the other role’s private controls.

**Acceptance Scenarios**:

1. **Given** a logged-in student on Free tier, **When** they open settings, **Then** they see their active teacher code, a Free tier badge, and a prominent option to request Pro upgrade.
2. **Given** a logged-in student on Pro tier, **When** they open settings, **Then** they see a Pro tier badge and no redundant upgrade prompt (or a disabled/completed state if a request is pending).
3. **Given** a logged-in teacher, **When** they open settings, **Then** they see their unique teacher code with a one-action copy control and no student-only Pro upgrade block.
4. **Given** a user visiting `/teacher/settings`, **When** the page loads, **Then** they receive the same core settings experience as `/settings` (shared layout and components, teacher-adaptive sections).

---

### User Story 3 - Session management and logout (Priority: P2)

As a security-conscious user, I want to see my active session status and control device access so that I can protect my account when I suspect another device is logged in.

**Why this priority**: Supports the existing one-active-device policy and reduces support burden for “someone else is using my account.”

**Independent Test**: Log in on one browser, use “log out other devices,” attempt to use a stale session elsewhere — stale session is rejected; current session remains valid until explicit logout.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they view the Active Sessions card, **Then** they see that the current device/session is active.
2. **Given** a logged-in user, **When** they choose to log out other devices, **Then** all other sessions for that account are invalidated while the current session remains usable.
3. **Given** a logged-in user, **When** they tap Logout and confirm, **Then** they are signed out and returned to the login page.

---

### Edge Cases

- User submits an empty or whitespace-only name → show validation message; do not save.
- Student has no active teacher context (edge onboarding state) → show clear empty state for teacher code, not a broken layout.
- Student already submitted a Pro upgrade request → show pending state instead of duplicate submission confusion.
- Copy teacher code fails (browser permission) → show fallback message so the code remains visible for manual copy.
- Unauthenticated access to `/settings` or `/teacher/settings` → redirect to login.
- Teacher opens `/settings` → show teacher-adaptive content (not student Pro UI).
- Network failure on save or session action → show Arabic error message; retain unsaved name in the form.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a settings page at `/settings` for all authenticated users.
- **FR-002**: System MUST provide `/teacher/settings` that reuses the same core settings experience as `/settings` (shared components; role-adaptive sections).
- **FR-003**: System MUST display the user’s display name and WhatsApp number; WhatsApp MUST be read-only on settings.
- **FR-004**: Users MUST be able to edit and save their display name from settings with explicit confirmation (Save action).
- **FR-005**: For students, system MUST display the active teacher code associated with their current teacher context.
- **FR-006**: For students, system MUST display subscription tier (Free or Pro) with a clear visual badge.
- **FR-007**: For students on Free tier, system MUST offer a prominent Request Pro action (consistent with existing upgrade workflow).
- **FR-008**: For teachers, system MUST display their unique teacher code and allow one-action copy to clipboard.
- **FR-009**: System MUST show an Active Sessions section indicating current session is active.
- **FR-010**: System MUST allow users to log out all other devices/sessions while keeping the current session valid (aligned with single active device policy).
- **FR-011**: System MUST provide Logout with a confirmation step before ending the session.
- **FR-012**: All settings UI MUST use Arabic RTL layout, mobile-first touch targets, and visual consistency with the rest of the Al-Moayed app.
- **FR-013**: System MUST expose identifiable help anchor points on: (a) tier badge, (b) teacher code copy area, (c) active sessions section — for in-app guidance tooling.

### Key Entities

- **Profile**: User identity — display name, WhatsApp number (immutable login id), role (Student/Teacher).
- **Student–Teacher link**: Active teacher context — teacher code, tier (Free/Pro), upgrade request state.
- **Teacher profile**: Teacher code (shareable identifier for student registration).
- **Session**: Current device session vs other invalidated sessions (single active device model).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of users can update their display name in under 30 seconds on first attempt (open settings → edit → save → see confirmation).
- **SC-002**: 100% of authenticated users see role-correct fields (student vs teacher) with zero cross-role control leakage in acceptance testing.
- **SC-003**: After “log out other devices,” 100% of previously active sessions on other devices are rejected on next action (within one request cycle).
- **SC-004**: Teacher code copy succeeds in one action on supported browsers; when copy fails, users can still read the code for manual copy (no dead-end state).
- **SC-005**: Settings page meets mobile touch-target guidelines (primary actions reachable without horizontal scroll on 360px-wide viewport).

## Assumptions

- WhatsApp number remains the permanent login identifier and cannot be changed from settings.
- Existing passwordless login and single-device session policy (AUTH-003) remain in force; this feature surfaces controls rather than changing the policy.
- Student Pro upgrade continues to use the existing request/approval workflow; settings only provides entry point and status display.
- Teachers do not have Free/Pro tier badges on this page (teacher-specific fields only).
- `/teacher/settings` may redirect to `/settings` or render the same shared component tree; behavior is equivalent from the user’s perspective.
- In-app help hooks are placement markers for guidance content, not user-visible features by themselves.
