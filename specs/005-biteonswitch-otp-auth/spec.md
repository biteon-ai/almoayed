# Feature Specification: BiteonSwitch OTP Auth & Admin Fallback

**Feature Branch**: `005-biteonswitch-otp-auth`

**Created**: 2026-07-21

**Status**: Draft

**Input**: User description: "Refactor authentication to integrate BiteonSwitch OTP for external hosted login/OTP verification, convert the main public login route into a Registration-only page, and establish a dedicated Admin Fallback Login so admins can still access the product if the external OTP provider is down. Preserve AUTH-002 teacher-code registration, AUTH-003 device session lock, RTL Arabic UX, server-side secret handling, and local demo account access."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Existing User Signs In via External OTP (Priority: P1)

An existing student or teacher opens the public entry page, chooses to sign in (not register), and is sent to the BiteonSwitch-hosted WhatsApp OTP experience. After successful verification they return to Al-Moayed already signed in and land on the correct home area for their role (student home or teacher home). Device session lock remains enforced: a new successful sign-in invalidates the previous device session.

**Why this priority**: Passwordless WhatsApp sign-in is the primary daily path for every returning user; without it the product is unusable for normal traffic.

**Independent Test**: With an existing profile and a successful OTP completion (or a controlled test completion), the user receives an active session and reaches the role-appropriate home screen; a second device sign-in ends the first session.

**Acceptance Scenarios**:

1. **Given** an existing student profile, **When** they start sign-in and complete BiteonSwitch OTP successfully, **Then** they are signed in and redirected to the student home.
2. **Given** an existing teacher profile, **When** they complete BiteonSwitch OTP successfully, **Then** they are signed in and redirected to the teacher home.
3. **Given** a user already signed in on device A, **When** the same WhatsApp identity completes OTP on device B, **Then** device A’s session is no longer valid and device B becomes the active session.
4. **Given** BiteonSwitch returns an invalid or expired verification result, **When** the app processes the return, **Then** no session is created and the user sees a clear Arabic error with a path to retry.

---

### User Story 2 - New Student Registers with Teacher Code (Priority: P1)

A new student uses the public page as a **registration** form: full name, WhatsApp number, and teacher code. On success they are linked to that teacher and guided to complete BiteonSwitch OTP so a real session can be minted. Existing users see clear Arabic guidance that registration is not for them and how to sign in via OTP instead.

**Why this priority**: Teacher-code onboarding (AUTH-002) is how students join a teacher’s classroom; converting the public page to registration-first must not break that funnel.

**Independent Test**: Submit valid name + WhatsApp + known teacher code for a new student; profile/link exists and the user is directed to OTP sign-in. Invalid teacher code shows a clear Arabic error and does not create a misleading “signed in” state.

**Acceptance Scenarios**:

1. **Given** a valid teacher code and a WhatsApp number not yet registered, **When** the student submits registration, **Then** a student profile is created (or completed), linked to that teacher, and the student is guided to BiteonSwitch OTP to finish sign-in.
2. **Given** an invalid or unknown teacher code, **When** the student submits registration, **Then** registration fails with a clear Arabic message and no teacher link is created.
3. **Given** a WhatsApp number that already belongs to a profile, **When** they attempt registration, **Then** they are told they already have an account and directed to OTP sign-in instead of creating a duplicate.
4. **Given** a visitor on the public registration page, **When** they are an existing user, **Then** they can find a prominent, RTL-friendly path to “sign in with WhatsApp OTP” without filling the registration form.

---

### User Story 3 - Admin Emergency / Fallback Sign-In (Priority: P2)

When BiteonSwitch is down or unreachable, an authorized admin can open a dedicated admin fallback sign-in entry (not shown on the student registration page) and authenticate with a strong admin secret / fallback credential. On success they receive a normal privileged session and can reach teacher/admin controls without using OTP.

**Why this priority**: Guarantees operational continuity for admins during provider outages; secondary to daily student/teacher OTP but critical for resilience.

**Independent Test**: With OTP treated as unavailable, complete admin fallback with the correct secret and reach teacher/admin area; wrong secret fails; students never see this entry on the registration page.

**Acceptance Scenarios**:

1. **Given** a correct admin fallback credential, **When** an authorized admin submits the dedicated fallback form, **Then** a session is minted for the admin’s privileged profile and they can open teacher/admin controls.
2. **Given** an incorrect fallback credential, **When** submitted, **Then** access is denied, no session is created, and a clear Arabic error is shown.
3. **Given** a student on the public registration/sign-in page, **When** they view the page, **Then** admin fallback fields and the admin route are not advertised or embedded in the student UI.
4. **Given** BiteonSwitch is unreachable, **When** an admin uses fallback successfully, **Then** they can still perform essential teacher/admin work without OTP.

---

### User Story 4 - Demo Accounts Remain Usable Locally (Priority: P3)

Local/demo testing continues to work for the known demo teacher and demo student WhatsApp identities so developers and trainers can exercise the product without depending on a live OTP provider for every run.

**Why this priority**: Protects day-to-day development and demos; does not block production OTP for real users.

**Independent Test**: Using demo teacher `963912345678` and demo student `963987654321` (and known demo teacher code), registration/sign-in paths needed for local demos still complete to a usable session.

**Acceptance Scenarios**:

1. **Given** the local/demo environment, **When** the demo teacher identity is used through the supported demo path, **Then** a teacher session is established and teacher home is reachable.
2. **Given** the local/demo environment, **When** the demo student identity (linked to the demo teacher) is used through the supported demo path, **Then** a student session is established and student home is reachable.

---

### Edge Cases

- BiteonSwitch callback/return arrives twice (replay): second processing must not corrupt the session or create duplicate profiles.
- Verification succeeds for a WhatsApp number with no profile and no pending registration: user is told to register with a teacher code first (or equivalent safe guidance), and no privileged session is minted.
- Teacher completes OTP but has no teacher role/profile: access is denied with a clear Arabic message.
- Admin fallback is attempted by someone without an authorized admin profile: access is denied even if they guess part of the secret flow.
- User abandons BiteonSwitch mid-flow and returns later: they can restart OTP without being stuck in a half-signed-in state.
- Network timeout while contacting BiteonSwitch: user sees a recoverable Arabic error; admin fallback remains available on its dedicated entry.
- Registration with malformed WhatsApp number: rejected with clear validation messaging before any external OTP step.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The public entry experience MUST primarily present **student registration** (name, WhatsApp number, teacher code) rather than a general password login form.
- **FR-002**: The public entry experience MUST provide clear Arabic guidance and a distinct action for **existing users** to authenticate via BiteonSwitch WhatsApp OTP (not by re-registering).
- **FR-003**: The system MUST use BiteonSwitch OTP as the primary passwordless authentication provider for students and teachers (AUTH-001 evolution).
- **FR-004**: After BiteonSwitch reports successful verification, the system MUST resolve the matching profile (create only when registration rules allow), enforce single-device session lock (AUTH-003), establish a server-side session with role and active teacher context when applicable, and redirect by role to student home or teacher home.
- **FR-005**: New student registration MUST validate the teacher code and link the student to that teacher before (or as part of) completing first sign-in (AUTH-002 preserved).
- **FR-006**: Registration MUST NOT create a duplicate profile for an already-registered WhatsApp number; instead it MUST steer the user to OTP sign-in.
- **FR-007**: A dedicated admin fallback sign-in entry (AUTH-005) MUST exist that bypasses BiteonSwitch and authenticates using a strong admin secret / fallback credential known only to authorized operators.
- **FR-008**: Admin fallback MUST NOT appear on the standard student registration / public OTP guidance UI.
- **FR-009**: Admin fallback success MUST grant access to teacher/admin controls even when BiteonSwitch is down or unreachable.
- **FR-010**: All verification of BiteonSwitch results, admin secrets, and session minting MUST occur only on the server; secrets MUST NOT be exposed to the browser as readable configuration for end users.
- **FR-011**: All user-facing copy for registration, OTP guidance, errors, and admin fallback MUST be natural Arabic and layout-safe under RTL.
- **FR-012**: Local demo teacher and student identities MUST remain usable for testing without breaking the production OTP-primary model.
- **FR-013**: Feature registry documentation MUST record updated AUTH-001 / AUTH-002 behavior and new AUTH-005 (admin emergency/fallback login) once this feature is accepted for planning/implementation tracking.
- **FR-014**: Public URL strategy MUST keep a stable registration entry for bookmarks/shared links: registration remains available at the existing public login path and/or an equivalent register path, with existing-user OTP clearly separated in the UX.

### Key Entities

- **Profile**: A person identified primarily by WhatsApp number; has a role (student, teacher, or admin-capable teacher) and display name.
- **Teacher link**: Relationship between a student profile and a teacher (via teacher code at registration); drives multi-tenant classroom context after sign-in.
- **Session**: Server-issued signed-in state including profile identity, role, session token for device lock, and active teacher context for students when applicable.
- **OTP verification result**: Proof returned from BiteonSwitch that a WhatsApp number completed OTP; consumed once to mint or refresh a session.
- **Admin fallback credential**: Secret used only on the dedicated admin path to mint a privileged session without OTP.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of returning users who complete OTP successfully reach the correct role home within 30 seconds of returning from the OTP provider (excluding provider-side delays outside product control).
- **SC-002**: 100% of new-student registrations with a valid teacher code result in a teacher link and a clear next step to complete OTP (no silent dead-end).
- **SC-003**: 0 duplicate profiles are created for the same WhatsApp number through the registration form.
- **SC-004**: When BiteonSwitch is simulated as unavailable, an authorized admin can still reach teacher/admin controls via fallback in under 1 minute.
- **SC-005**: In usability checks, at least 9 of 10 first-time students correctly choose registration vs sign-in without staff help (copy and layout clarity).
- **SC-006**: Device session lock continues to hold: after a second successful sign-in, the previous session is rejected on next protected action in 100% of test runs.
- **SC-007**: Demo teacher and demo student paths remain completable in local/demo setup for every release candidate of this feature.

## Assumptions

- BiteonSwitch is the mandated external OTP provider for production WhatsApp passwordless auth; product UX may say “تسجيل الدخول عبر واتساب” while operations configure BiteonSwitch credentials.
- `/login` remains a valid public URL for registration (backward-compatible); an additional `/register` alias is acceptable if it reduces confusion, as long as one primary registration URL is documented.
- Admin fallback authenticates an **existing** privileged admin/teacher profile; it does not invent a new anonymous superuser without a backing profile.
- Admin fallback is for operational continuity, not for student or ordinary teacher daily login.
- AUTH-003 single-device lock applies to OTP-minted sessions the same way as today’s session lock; admin fallback sessions also participate in device lock unless a later clarification carves out an exception (default: lock applies).
- Constitution principle of passwordless auth for normal users remains: no email/password student login is introduced; admin fallback is the only intentional secret-based exception and is scoped to admins.
- Environment configuration for BiteonSwitch and the admin fallback secret will be documented for operators (example env file) during implementation planning; exact secret names are an implementation concern.
- Existing multi-tenant rules (active teacher context) and quiz gatekeeper rules are unchanged by this feature.
- Spec registry update (`.speckit/spec.yaml`) is part of delivery acceptance for this feature, executed during implementation, not solely as prose in this document.
