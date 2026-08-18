# Feature Specification: Admin Global Platform Settings

**Feature Branch**: `025-admin-platform-settings`

**Created**: 2026-08-18

**Status**: Draft

**Feature IDs**: `ADMIN-002` (runtime platform flags)

**Extends**: `ADMIN-001` · `AUTH-001` · `AUTH-002` · `AUTH-006` · `FIX-AUTH-001`

**Input**: User description: "Super Admin platform settings panel to toggle global Demo Mode and Fixed WhatsApp OTP at runtime without redeploying, including a customizable test verification code, Arabic RTL admin UI, and strict Super Admin–only access."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Super Admin opens platform settings and sees current flags (Priority: P1)

As a Super Admin, I want a dedicated platform settings screen in the admin area that shows the current Demo Mode and Fixed OTP state (and the active test code) so I can understand what the live product is doing before I change anything.

**Why this priority**: Viewing current configuration is the smallest independently valuable slice. Operators cannot safely toggle flags if they cannot see what is already on.

**Independent Test**: Sign in as Super Admin, open Platform Settings, and confirm both switches and the test-code field reflect the saved platform values, with Arabic labels and helper text.

**Acceptance Scenarios**:

1. **Given** a signed-in Super Admin, **When** they open Platform Settings (`/admin/settings`), **Then** they see an Arabic RTL panel with: Demo Mode («تفعيل وضع التجربة»), Fixed WhatsApp OTP («تفعيل رمز التحقق الثابت»), and the current test verification code.
2. **Given** saved platform values, **When** the page loads, **Then** each switch and the code field match those saved values (not a stale hardcoded default that ignores the last save).
3. **Given** the settings page on a phone-sized screen, **When** viewed, **Then** switches and the code field are readable, right-to-left, and easy to tap, consistent with the existing admin emerald/teal style.
4. **Given** a Super Admin who is impersonating a teacher, **When** they try to open Platform Settings, **Then** they are blocked from changing platform flags (impersonation is a teacher context, not Super Admin operations).

---

### User Story 2 - Super Admin toggles Demo Mode for public login (Priority: P1)

As a Super Admin, I want to turn Demo Mode on or off immediately so I can hide or show the public «تجربة» demo-login tab without a new deployment.

**Why this priority**: This is the first operational control: public demo access is a live safety and marketing switch.

**Independent Test**: Toggle Demo Mode off, confirm the login «تجربة» tab is gone for a signed-out visitor; toggle it on, confirm the tab returns; each save shows Arabic success or error feedback.

**Acceptance Scenarios**:

1. **Given** Demo Mode is on, **When** a signed-out visitor opens student login, **Then** the «تجربة» demo tab (or equivalent one-click demo entry) is visible.
2. **Given** the Super Admin turns Demo Mode off and the save succeeds, **When** a signed-out visitor opens student login, **Then** the «تجربة» tab is hidden and demo one-click login is not offered.
3. **Given** Demo Mode is off, **When** someone still tries to use a demo shortcut (bookmark, hidden action, or direct demo login), **Then** demo login is refused and they remain on the normal WhatsApp login path.
4. **Given** the Super Admin taps the Demo Mode switch, **When** the save is in progress, **Then** they see a loading state and cannot double-submit; on success they see an Arabic confirmation toast; on failure the previous value is restored and an Arabic error toast is shown.
5. **Given** Demo Mode is turned off, **When** a visitor uses normal WhatsApp login or teacher/admin login, **Then** those flows still work; only demo shortcuts are suppressed.

---

### User Story 3 - Super Admin enables Fixed OTP sandbox verification (Priority: P1)

As a Super Admin, I want to turn on a global Fixed OTP mode so testers and operators can complete WhatsApp login and confirmation with one known test code, without sending a real WhatsApp message.

**Why this priority**: Sandbox verification unblocks staging and support without depending on the live messaging provider. This is independently testable from Demo Mode.

**Independent Test**: Turn Fixed OTP on with a known code, request a WhatsApp login code, confirm no real WhatsApp message is required, and sign in by entering that code; turn Fixed OTP off and confirm a real verification is required and the test code is rejected.

**Acceptance Scenarios**:

1. **Given** Fixed OTP is on and a test code is configured, **When** any student or teacher starts WhatsApp login/confirmation, **Then** the product does **not** dispatch a real WhatsApp verification message, and entering the configured test code succeeds.
2. **Given** Fixed OTP is on, **When** the person enters a wrong code, **Then** verification fails with the usual Arabic OTP-error treatment (the test mode does not accept arbitrary codes).
3. **Given** the Super Admin turns Fixed OTP off and the save succeeds, **When** someone starts WhatsApp login, **Then** a real WhatsApp verification message is sent through the existing provider, and the previously configured test code is **not** accepted.
4. **Given** Fixed OTP is toggled, **When** save is in progress or fails, **Then** the Super Admin sees Arabic loading/success/error feedback and a failed save does not leave login in an unknown half-applied state.
5. **Given** Fixed OTP is on, **When** an existing student is sent to WhatsApp OTP from trial-join or other existing OTP-required paths (`AUTH-001` / `AUTH-008` after first visit), **Then** those paths also accept the configured test code and do not send a real WhatsApp message.
6. **Given** Fixed OTP is off, **When** the same OTP-required paths run, **Then** they require real provider verification as they do today.

---

### User Story 4 - Super Admin sets the active test verification code (Priority: P2)

As a Super Admin, I want to change the global test code used in Fixed OTP mode so I can rotate the sandbox secret without a deployment.

**Why this priority**: Useful operational control, but the feature still delivers value with the default code if this story ships slightly later.

**Independent Test**: Change the code, save, then verify the old code is rejected and the new code is accepted while Fixed OTP remains on.

**Acceptance Scenarios**:

1. **Given** Fixed OTP is on, **When** the Super Admin enters a new valid test code and saves, **Then** subsequent WhatsApp confirmations accept only the new code.
2. **Given** an empty, too-short, or non-numeric code, **When** they try to save, **Then** Arabic validation blocks the save and the previous code remains in effect.
3. **Given** Fixed OTP is off, **When** they change the stored code, **Then** the new value is saved for later use but does **not** start accepting that code until Fixed OTP is turned on.
4. **Given** a successful code save, **When** it completes, **Then** an Arabic success toast is shown; failures show an Arabic error and keep the last good code.

---

### User Story 5 - Non-admins cannot view or change platform settings (Priority: P1)

As a platform owner, I want only Super Admins to open or change Platform Settings so students, teachers, and anonymous visitors cannot turn on sandbox OTP or hide/show demo access.

**Why this priority**: These flags change authentication behavior globally. Unauthorized access would be a security incident.

**Independent Test**: Attempt `/admin/settings` and settings-save actions as anonymous, student, teacher, and Super Admin; only Super Admin succeeds; others are denied without leaking current secret values.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor, **When** they open `/admin/settings`, **Then** they are sent to admin login and do not see flag values or the test code.
2. **Given** a signed-in student or teacher, **When** they open `/admin/settings` or attempt a settings save, **Then** access is denied (redirect or generic Arabic refusal) and no flags are changed.
3. **Given** a Super Admin, **When** they open and save settings, **Then** the change persists and is used by login immediately after the save succeeds.
4. **Given** the public login page, **When** it shows or hides «تجربة», **Then** it may observe Demo Mode for display only; it MUST NOT expose the test verification code or allow changing any flag.

---

### Edge Cases

- Settings store is temporarily unavailable: Demo Mode falls back to the existing environment demo switch; Fixed OTP is treated as **off** (real WhatsApp verification required). Login still works; the admin page shows an Arabic load-error and does not pretend flags were saved.
- Two Super Admins save different values at the same time: last successful save wins; the next page load shows the persisted values.
- Super Admin session expires mid-save: the save is rejected; no partial update; they are asked to sign in again.
- Fixed OTP is on but the stored code is missing or invalid: treat Fixed OTP as unusable (do not accept empty codes; do not send a real message either until an operator fixes the code or turns the mode off); show Arabic admin guidance.
- Teacher email/password login (`ADMIN-001`) and Super Admin email login are unchanged: Fixed OTP applies only to WhatsApp verification, not to email passwords.
- Demo Mode off does not delete demo accounts; it only hides and refuses the public demo shortcut. Seeded demo users can still sign in via WhatsApp OTP (or Fixed OTP if that mode is on).
- Turning Fixed OTP on does not skip first-time trial-join OTP-free signup (`AUTH-008`); it only replaces WhatsApp message + dynamic code **when OTP is already required**.
- Inactive teacher/student rules (`AUTH-007`) still block sessions even if the test code is correct.
- Device session lock (`AUTH-003`) still applies after a successful Fixed OTP login.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST persist global platform flags that Super Admins can change at runtime: Demo Mode, Fixed OTP on/off, and the active test verification code.
- **FR-002**: Only authenticated Super Admin users MUST be able to view the Platform Settings screen and change those flags. Students, teachers, anonymous users, and impersonation sessions MUST NOT read the test code or update flags.
- **FR-003**: Super Admins MUST be able to toggle Demo Mode on or off from `/admin/settings` with Arabic helper text explaining that off hides public demo login options.
- **FR-004**: When Demo Mode is on, student login MUST show the «تجربة» demo entry. When Demo Mode is off, that entry MUST be hidden and demo shortcut login MUST be refused.
- **FR-005**: Super Admins MUST be able to toggle Fixed OTP on or off and MUST be able to set the test verification code (default **123456** until changed).
- **FR-006**: When Fixed OTP is on, WhatsApp login and confirmation MUST accept the configured test code and MUST NOT send a real WhatsApp verification message via the existing provider.
- **FR-007**: When Fixed OTP is off, WhatsApp login and confirmation MUST send and verify real provider codes; the stored test code MUST NOT grant access.
- **FR-008**: Fixed OTP, when on, MUST apply to every WhatsApp OTP-required path (standard login, registration confirmation, and later visits that already require OTP), without weakening OTP-free trial join for brand-new numbers.
- **FR-009**: Settings saves MUST show Arabic loading, success, and error feedback. A failed save MUST leave the previous effective flags unchanged.
- **FR-010**: Login MUST read current flags with low delay so a successful admin save is reflected on the next login attempt (no wait for a new deployment).
- **FR-011**: If flags cannot be loaded, the product MUST fail closed for Fixed OTP (real verification required) and MAY fall back to the existing environment demo switch for Demo Mode.
- **FR-012**: Existing Super Admin dashboard, teacher management, student WhatsApp login, teacher email login, demo-account identities, and session lock MUST keep working except where this spec explicitly changes Demo Mode visibility or OTP dispatch.
- **FR-013**: Platform Settings UI MUST be Arabic, RTL, mobile-first, and touch-friendly, matching the existing admin visual language.
- **FR-014**: Each flag change MUST record when it was last updated and by which Super Admin (for later audit), without exposing that audit trail on public pages.
- **FR-015**: Feature registry (`ADMIN-002`) and in-product help hooks MUST be updated when this ships so the new settings surfaces can be documented without overwriting `ADMIN-001`.

### Key Entities

- **Platform setting**: A named global flag or value that applies to the whole product (not to one teacher or student). v1 keys: Demo Mode, Fixed OTP enabled, Fixed OTP code.
- **Demo Mode**: Master switch for public one-click demo login («تجربة»). Off hides and refuses that shortcut; it does not delete demo users.
- **Fixed OTP mode**: Sandbox switch. On: WhatsApp verification uses the configured test code and does not send a real message. Off: real WhatsApp verification.
- **Test verification code**: The single global numeric code accepted while Fixed OTP is on. Visible and editable only to Super Admins.
- **Settings change record**: Who last changed a flag and when. Used for operator accountability.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A Super Admin can open Platform Settings and complete a Demo Mode or Fixed OTP toggle, including confirmation feedback, in under 30 seconds.
- **SC-002**: After a successful Demo Mode save, 100% of immediately following signed-out login visits show or hide «تجربة» according to the new value.
- **SC-003**: After Fixed OTP is turned on, 100% of test WhatsApp login attempts that enter the configured code succeed without a real WhatsApp message being required.
- **SC-004**: After Fixed OTP is turned off, 100% of attempts that enter the stored test code fail, and real WhatsApp verification is required.
- **SC-005**: In 100% of access tests, students, teachers, and signed-out visitors cannot open Platform Settings or change flags; Super Admins can.
- **SC-006**: At least 95% of valid settings saves succeed on the first try (no unexplained failure after a complete, valid action).
- **SC-007**: Settings and login screens remain fully Arabic and usable one-handed on a typical phone; review finds no English-only primary controls on those screens.

## Assumptions

- Registry ID is **`ADMIN-002`**. `ADMIN-001` (Super Admin dashboard) stays as implemented and is the parent admin shell this screen lives in.
- Default seed: Demo Mode **on** (so existing demo-tab behavior remains until an operator turns it off), Fixed OTP **off**, test code **123456**.
- Until a settings row exists or while the settings store cannot be read, Demo Mode follows today’s environment demo switch; Fixed OTP is off.
- The public login page may read Demo Mode solely to show or hide «تجربة». The test code is never shown on `/login` or other non-admin screens.
- Fixed OTP replaces provider **send + verify** for WhatsApp codes only. It does not bypass inactive-account checks, device lock, teacher email passwords, or Super Admin email login.
- Trial join (`AUTH-008`) still skips OTP for a never-registered WhatsApp number. Fixed OTP only substitutes when OTP is already required.
- Teacher portal, student dashboards, quizzes, billing, and other admin tools are unchanged.
- The test code is a numeric string of 4–8 digits; v1 does not support per-user codes or multiple concurrent codes.
- Changing flags does not force existing sessions to log out; it affects the next login/OTP attempt.
- Spekit/help hooks will be added for the settings panel, both switches, the code field, and save feedback when the feature is implemented.

## Dependencies

- Existing Super Admin authentication and admin portal (`ADMIN-001`).
- Existing WhatsApp OTP login and confirmation (`AUTH-001` / `AUTH-002`) and demo shortcut (`FIX-AUTH-001`).
- Existing inactive-account and device-lock rules (`AUTH-007`, `AUTH-003`).

## Out of Scope (v1)

- Additional platform flags beyond Demo Mode, Fixed OTP, and the test code.
- Per-teacher or per-student OTP exceptions.
- Displaying the test code on the public login page.
- Forcing logout of already signed-in users when a flag changes.
- A full audit-log viewer (recording last updater is enough for v1).
- Changing demo WhatsApp numbers or demo account data from this screen.
- SMS, email OTP, or any channel other than the existing WhatsApp verification path.
