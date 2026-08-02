# Feature Specification: Block Inactive Account Login

**Feature Branch**: `020-block-inactive-login`

**Created**: 2026-08-02

**Status**: Draft

**Feature ID**: `AUTH-007` (closes gap `FIX-AUTH-002`; extends `AUTH-001` · `AUTH-003` · `AUTH-004` · `AUTH-005` · `MT-001` · `ADMIN-001`)

**Input**: User description: "Prevent deactivated students and teachers from logging in. Block access at authentication before issuing a session; if an account becomes inactive while a session exists, force logout to /login with a clear Arabic message. Cover WhatsApp OTP and other login paths; surface the error in the existing RTL UI; document as AUTH-007 / FIX-AUTH-002; verify with Vitest and a clean production build."

## Clarifications

### Session 2026-08-02

- Q: How should pending-only students be treated vs deactivated students at login? → A: Option A — Pending-only students keep the limited post-OTP onboarding session (AUTH-002). Block login/session only when the student has zero active links **and** has been deactivated (e.g. all remaining links are `deactivated`).
- Q: How should the Arabic inactive message appear after mid-session forced logout? → A: Option A — Redirect to `/login` with a dedicated query flag (same family as existing `error` / `reason=device_lock`); login page shows the canonical Arabic inactive message via existing query-error handling.
- Q: If the session’s current teacher link is deactivated but another active teacher link remains, what happens mid-session? → A: Option A — Keep the student signed in and re-scope to an allowed active teacher (MT-002); force inactive logout only when zero active links remain.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inactive teacher cannot sign in (Priority: P1)

As a platform administrator, I want teachers whose accounts are marked inactive to be refused at login, so deactivated teaching accounts cannot regain access through WhatsApp OTP, email, emergency fallback, or demo paths.

**Why this priority**: Inactive teachers still completing login is a direct access-control failure and the highest-risk gap.

**Independent Test**: Mark a teacher account inactive, attempt each available teacher login path with valid credentials/OTP, and confirm every path fails with the Arabic inactive-account message and no authenticated session is created.

**Acceptance Scenarios**:

1. **Given** a teacher whose account status is inactive, **When** they complete WhatsApp OTP login successfully with the provider, **Then** the app refuses to create a signed-in session and shows a clear Arabic message that the account is inactive and they should contact administration.
2. **Given** an inactive teacher with email/password credentials, **When** they submit the teacher email login form, **Then** login is refused with the same Arabic inactive-account guidance (not a generic “wrong password” only).
3. **Given** an inactive teacher and a valid emergency fallback secret, **When** they attempt emergency login, **Then** login is refused and no session is established.
4. **Given** demo bypass is enabled and an inactive seeded teacher account, **When** demo teacher login is used, **Then** login is refused with the inactive-account message.
5. **Given** any refused inactive-teacher login, **When** the attempt finishes, **Then** the user’s device session identifier on the profile is **not** rotated/updated (device lock from AUTH-003 is not advanced for a rejected login).

---

### User Story 2 - Deactivated student cannot sign in (Priority: P1)

As a teacher or administrator, I want students who are no longer allowed to use the platform to be blocked at login, so deactivated learners cannot open the student hub or take quizzes.

**Why this priority**: Equal severity for student persona; without this, teacher “deactivate” actions feel ineffective.

**Independent Test**: Deactivate a student’s access so they have no remaining active teacher link, attempt WhatsApp OTP / demo student login, and confirm refusal with the Arabic inactive message and no session.

**Acceptance Scenarios**:

1. **Given** a student with **zero active links and at least one deactivated** teacher link, **When** they complete WhatsApp OTP login, **Then** the app refuses to create a session and shows the Arabic inactive-account message asking them to contact administration.
2. **Given** a student who still has **at least one active** teacher link and one or more deactivated links, **When** they log in, **Then** login succeeds and their session scopes to an allowed active teacher (existing multi-tenant behavior).
3. **Given** a **pending-only** student (teacher link(s) still pending, none deactivated), **When** they complete WhatsApp OTP after registration, **Then** they still receive the existing limited onboarding session (AUTH-002) and are **not** shown the inactive-account message.
4. **Given** demo bypass is enabled and a student account that is deactivated under the rule in scenario 1, **When** demo student login is used, **Then** login is refused with the inactive-account message.
5. **Given** a refused deactivated-student login, **When** the attempt finishes, **Then** no signed-in cookie/session is present and the profile’s device session identifier is not updated for that rejected attempt.

---

### User Story 3 - Mid-session deactivation forces logout (Priority: P2)

As an administrator or teacher who deactivates an account after the person is already signed in, I want their next protected navigation to end the session and send them to login, so deactivation takes effect without waiting for the cookie to expire.

**Why this priority**: Closes the “already logged in” loophole; slightly lower than login-time block because login-time block alone stops new access.

**Independent Test**: Sign in as an active user, deactivate the account (or remove all active student links) from another role, then request any protected page as the user and confirm redirect to `/login` with inactive messaging and cleared session.

**Acceptance Scenarios**:

1. **Given** a signed-in teacher who is later marked inactive, **When** they open or navigate within a protected teacher route, **Then** they are signed out and redirected to `/login` with a query flag that causes the login page to show the Arabic inactive-account message.
2. **Given** a signed-in student whose last active teacher link is later deactivated (zero active links remain), **When** they open or navigate within a protected student route, **Then** they are signed out and redirected to `/login` with that same inactive query flag and message.
3. **Given** a signed-in student whose **current** teacher link is deactivated while **another active** teacher link still exists, **When** they open or navigate within a protected student route, **Then** they remain signed in and the session re-scopes to an allowed active teacher (no inactive logout message).
4. **Given** a mid-session forced logout for inactivity, **When** the user lands on `/login`, **Then** they see the canonical Arabic inactive message from the query flag, cannot continue using hub pages, and must regain access before a successful login.

---

### User Story 4 - Clear RTL error presentation (Priority: P3)

As a deactivated user, I want to understand why I cannot enter the app in clear Arabic, presented in the normal right-to-left interface, so I know to contact administration rather than retry endlessly.

**Why this priority**: Improves supportability and reduces confusion; depends on P1 refusal behavior.

**Independent Test**: Trigger an inactive login on `/login` (and mid-session redirect if available) and confirm the Arabic copy appears via the existing toast/alert patterns with RTL-friendly alignment.

**Acceptance Scenarios**:

1. **Given** an inactive-account refusal on login (or mid-session redirect with the inactive query flag), **When** the error is shown, **Then** the message is Arabic, user-friendly, and equivalent in meaning to: «عذراً، هذا الحساب غير فعال. يرجى التواصل مع الإدارة».
2. **Given** the error is displayed, **When** viewed on a mobile viewport, **Then** layout remains RTL (`dir="rtl"`) with start-aligned text and no LTR-broken toast/alert.
3. **Given** a successful login by an active account, **When** the same UI is used, **Then** the inactive message does not appear and the user reaches their role hub as today.

---

### Edge Cases

- Active account with wrong OTP/password still fails with existing auth errors (inactive message must not leak for unknown numbers).
- Super-admin email portal login is out of scope unless it shares the same teacher/student profile inactivity rules; teacher WhatsApp/email/emergency/demo paths are in scope.
- Student with only `pending` links (never activated, none deactivated) keeps AUTH-002 limited onboarding session; AUTH-007 inactive refusal does **not** apply.
- Student with zero active links and only deactivated links is refused with the inactive-account message.
- Mid-session: current teacher deactivated but another active link remains → keep session and re-scope; do not show inactive logout.
- Re-activation: when a teacher is set active again, or a student regains an active link, the next valid login succeeds without residual “inactive” lockout.
- Concurrent deactivation during OTP round-trip: refusal is based on status at session-issuance time (after OTP success, before minting the app session).
- Offline PWA drafts do not grant a new authenticated session for inactive accounts; any later sync/auth still requires an active account.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST refuse to issue an authenticated student or teacher session when the account is inactive according to the product rules below.
- **FR-002**: For **teachers**, “inactive” MUST mean the teacher account status is inactive (the same status administrators already use to mark a teacher معطّل).
- **FR-003**: For **students**, “inactive” (AUTH-007 block) MUST mean the student has **zero active teacher links** and **at least one deactivated** teacher link at the moment of login or protected access check. Pending-only students MUST continue to receive the limited AUTH-002 onboarding session and MUST NOT receive the inactive-account refusal.
- **FR-004**: Inactive refusal MUST apply to all student/teacher login entry points in product scope: WhatsApp OTP (AUTH-001), registration-then-OTP completion when it would mint a session, teacher email login, emergency fallback (AUTH-005), and demo one-click login when enabled.
- **FR-005**: On inactive refusal at login, the system MUST NOT create or keep an authenticated session and MUST NOT update the profile’s device session identifier for that rejected attempt.
- **FR-006**: The system MUST return a clear Arabic user-facing error on inactive refusal, with meaning: the account is not active and the user should contact administration (canonical copy: «عذراً، هذا الحساب غير فعال. يرجى التواصل مع الإدارة»).
- **FR-007**: If a previously active session belongs to an account that becomes inactive (teacher status inactive, or student who no longer has any active links and has at least one deactivated link), the next protected app access MUST clear the session and redirect to `/login` with a dedicated inactive query flag (same family as existing login `error` / `reason` query handling) so the canonical Arabic inactive message is shown (AUTH-004-style logout outcome).
- **FR-007a**: If a student’s current teacher link is deactivated but at least one other active teacher link remains, the system MUST keep the session and re-scope to an allowed active teacher (MT-002); it MUST NOT force inactive logout in that case.
- **FR-008**: Active accounts MUST continue to log in and use the app without regression to AUTH-001/002/003 device lock, multi-tenant scoping (MT-002), or quiz gatekeeper rules (QUIZ-001).
- **FR-009**: Inactive-account errors MUST surface in the existing login query-error / alert UI patterns with RTL presentation (`dir="rtl"`, start-aligned text), including after mid-session redirects that carry the inactive query flag.
- **FR-010**: Automated regression coverage MUST prove inactive teacher and inactive student login refusals (and that active accounts still succeed), labeled with feature id AUTH-007 for traceability.
- **FR-011**: The product feature registry MUST list AUTH-007 as implemented when shipped, noting FIX-AUTH-002 as the alias for closing prior login-path gaps.

### Key Entities

- **User profile (teacher/student)**: Identity used at login; teachers carry an account status (active/inactive).
- **Teacher–student link**: Relationship that can be active, pending, or deactivated; student platform access for this feature depends on having at least one **active** link.
- **Authenticated session**: App session issued only after inactivity checks pass; must not be created for inactive accounts; must be cleared when mid-session inactivity is detected.
- **Device session identifier**: Profile field advanced on successful login for AUTH-003; must not advance on inactive refusal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of tested inactive-teacher login attempts across in-scope paths, no authenticated teacher session is created.
- **SC-002**: In 100% of tested student login attempts where the student is deactivated (zero active links and at least one deactivated link), no authenticated student session is created; pending-only registrants still complete AUTH-002 onboarding without the inactive message.
- **SC-003**: After mid-session deactivation that leaves the account inactive (teacher inactive, or student with zero active links), the next protected navigation ends on `/login` within one page transition; if a student still has another active teacher, they stay signed in under that teacher instead.
- **SC-004**: At least 95% of deactivated users shown the inactive message can correctly state that they need to contact administration (copy comprehension spot-check / support script).
- **SC-005**: Active teacher and student happy-path logins still succeed on first valid attempt in regression checks (no increase in false “inactive” refusals for active accounts).
- **SC-006**: Product documentation lists AUTH-007 as a shipped access-control rule before release, and release verification completes without new auth regressions for active users.

## Assumptions

- Teacher inactivity already exists as administrator-managed teacher account status (`active` / `inactive`); this feature enforces that status on **all** teacher login paths, not only email login.
- Student “deactivation” in the product today is modeled primarily as teacher-link status (`deactivated`), not a separate student profile flag; AUTH-007 blocks students only when they have **zero active links and at least one deactivated link** (multi-teacher students remain able to log in—and stay mid-session—if any link is still active, with automatic re-scope when the current link is deactivated).
- Pending-only students keep the existing limited AUTH-002 onboarding session; they are out of scope for the inactive-account refusal message.
- Mid-session enforcement may run during authenticated request validation (session/role guards) rather than requiring a database lookup inside the edge middleware layer; the **user-visible outcome** is redirect to `/login` with a cleared session **and** an inactive query flag consumed by the existing login error UI (parallel to `reason=device_lock`).
- Super-admin portal authentication is unchanged except where it would mint a **teacher** session for an inactive teacher.
- Canonical Arabic message may be reused across login and mid-session logout; minor wording variants are acceptable if meaning is unchanged.
- Existing Spekit login hooks remain; a new hook is optional unless a distinct inactive-error surface is added.
- Updating `.speckit/spec.yaml` with AUTH-007 / FIX-AUTH-002 and keeping a green production build are delivery gates (aligned with the request), without prescribing libraries in the success criteria beyond “build succeeds.”
