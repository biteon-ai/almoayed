# Feature Specification: Teacher Login Recovery

**Feature Branch**: `028-teacher-login-recovery`

**Created**: 2026-09-14

**Status**: Draft

**Feature IDs**: `AUTH-009` (teacher login recovery: back navigation, forgot password, magic link)

**Extends**: `ADMIN-001` · `AUTH-003` · `AUTH-007`

**Input**: User description: "Enhance the Teacher Login page (`/teacher/login`) with a subtle back-to-main-login control, a Forgot Password flow that emails a secure reset link when the teacher email exists (and a safe Arabic error when it does not), a one-time magic-link sign-in option, and RTL UI that matches the existing Arabic teacher login card (teal primary actions, rounded card, clean inputs, loading and success/error feedback)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Return to the main platform login (Priority: P1)

As a teacher (or a visitor who opened the teacher login by mistake), I want a clear, unobtrusive way to leave `/teacher/login` and go back to the main platform login so I am not stuck on the teacher-only form.

**Why this priority**: Navigation is the smallest independently valuable change. It unblocks students and visitors who landed on the wrong screen, without waiting for email recovery.

**Independent Test**: Open teacher login as a signed-out visitor, use the back control, and confirm arrival at the main login (`/login`) with the existing student/WhatsApp login experience unchanged.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor on Teacher Login, **When** they look at the form header or the area immediately around it, **Then** they see a subtle Arabic control such as «العودة لتسجيل الدخول الرئيسي» (or equivalent), styled as a quiet text/icon action rather than a second primary teal button.
2. **Given** that control, **When** they activate it, **Then** they navigate to the main platform login (`/login`) without submitting the teacher form.
3. **Given** the page is viewed in Arabic RTL on a phone, **When** the back control is shown, **Then** it sits on the start side of the layout (near the header), remains easy to tap, and does not crowd the email or password fields.
4. **Given** a teacher who still wants to sign in with email and password, **When** they ignore the back control, **Then** the existing «دخول المدرس» flow works as today.

---

### User Story 2 - Reset a forgotten password by email (Priority: P1)

As an admin-provisioned teacher who forgot their password, I want to request a reset from Teacher Login, receive a message at my registered email if that address belongs to an active teacher, and set a new password from a secure time-limited link so I can sign in again without contacting support.

**Why this priority**: Password recovery is the main reason teachers get locked out of `/teacher/login` today (the page has email and password only, with no recovery path).

**Independent Test**: From Teacher Login, request a reset for a known active teacher email and complete a new password from the emailed link; repeat with an unknown email and confirm no message is sent and a clear Arabic error is shown.

**Acceptance Scenarios**:

1. **Given** Teacher Login, **When** the password field is shown, **Then** a «نسيت كلمة المرور؟» (or equivalent) link appears below it and does not look like the primary «دخول المدرس» button.
2. **Given** that link, **When** the teacher activates it, **Then** they can enter their email (pre-filled from the login field when already typed) and submit a reset request.
3. **Given** the submitted email matches an **active teacher** account, **When** the request succeeds, **Then** the platform sends a password-reset message to that address containing a single-use, time-limited link, and the teacher sees Arabic success feedback that a message was sent.
4. **Given** the submitted email does **not** match a teacher account, **When** the request is processed, **Then** no reset message is sent, and the teacher sees a clear, calm Arabic error that no teacher account was found for that email.
5. **Given** the email matches a teacher whose account is **inactive**, **When** they request a reset, **Then** no reset message is sent, no session is created, and they see the existing inactive-account Arabic message (they are not told a reset was sent).
6. **Given** a valid unused reset link opened before it expires, **When** the teacher sets a new password that meets the platform’s password rules and confirms it, **Then** the password is updated, the link cannot be reused, and they can sign in on Teacher Login with the new password.
7. **Given** an expired, already-used, or tampered reset link, **When** it is opened, **Then** the teacher is not signed in, the password is not changed, and they see Arabic guidance to request a new reset.
8. **Given** a reset request is in progress, **When** the teacher waits, **Then** they see a loading state and cannot double-submit; success and failure use the same style of Arabic toasts/alerts as the rest of teacher login.

---

### User Story 3 - Sign in with a one-time magic link (Priority: P2)

As an admin-provisioned teacher, I want to request a one-time login link to my email so I can open Teacher Home with a single tap, without typing a password.

**Why this priority**: Valuable alternative to passwords, but the page still delivers value if password reset ships first.

**Independent Test**: Request a magic link for a known active teacher email, open the link once, and land signed in on the teacher dashboard; confirm unknown/inactive emails never produce a working login.

**Acceptance Scenarios**:

1. **Given** Teacher Login, **When** the form is shown, **Then** an alternative action such as «أرسل لي رابط دخول لمرة واحدة» is visible (secondary to password sign-in, not competing with the teal primary button).
2. **Given** the teacher submits a magic-link request with an email that matches an **active teacher**, **When** the request succeeds, **Then** the platform emails a single-use, time-sensitive sign-in link, and they see Arabic success feedback that a message was sent.
3. **Given** that unused link is opened on the same device before it expires, **When** it is accepted, **Then** the teacher is signed in as that teacher (device lock still applies) and is taken to the teacher dashboard without entering a password.
4. **Given** the email does **not** match a teacher account, **When** they request a magic link, **Then** no sign-in message is sent and they see the same style of clear Arabic “no teacher account” error as forgot-password.
5. **Given** the teacher account is **inactive**, **When** they request or open a magic link, **Then** they are not signed in and they see the inactive-account Arabic message.
6. **Given** an expired, already-used, or tampered magic link, **When** it is opened, **Then** no session is created and they see Arabic guidance to request a new link from Teacher Login.
7. **Given** a magic-link request is in progress, **When** the teacher waits, **Then** they see a loading state and Arabic success/error feedback without a full-page freeze.

---

### User Story 4 - Keep the existing Arabic teacher-login look and feel (Priority: P2)

As a teacher using the page on a phone, I want the new controls to feel like the same Al-Moayed teacher login (Arabic RTL, teal primary action, rounded card, large clean fields) so the extra options do not look like a different product.

**Why this priority**: Visual consistency is required for launch quality but does not by itself recover access.

**Independent Test**: Compare Teacher Login before and after on a phone-width screen: primary sign-in still dominates; back, forgot-password, and magic-link actions are quieter; loading and errors remain Arabic and readable.

**Acceptance Scenarios**:

1. **Given** Teacher Login on a phone, **When** the enhanced page loads, **Then** the title remains «دخول المدرس», the helper line still explains this is for teachers created by Super Admin, and email/password fields stay large and left-to-right for the typed values while surrounding labels stay Arabic RTL.
2. **Given** the new links, **When** they are shown, **Then** they use muted/subtle styling; the only full-width teal primary button remains «دخول المدرس» (or the active submit of the current sub-flow).
3. **Given** success or error, **When** feedback appears, **Then** it is Arabic, appears near the form or as the platform’s usual toast, and does not cover the back control or make fields untappable.
4. **Given** a teacher who only uses email and password, **When** they sign in successfully, **Then** they still reach the teacher dashboard as today.

---

### Edge Cases

- Empty, malformed, or whitespace-only email on reset or magic-link request: show Arabic validation, send nothing.
- Student or Super Admin emails entered on Teacher Login recovery: treated as “no teacher account” (no message sent, no session).
- Rapid repeat requests for the same email: extra messages are throttled; the teacher still sees Arabic feedback (success if a teacher match was already accepted, or the same not-found/inactive error).
- Opening a valid link in a second browser after it was already used: refused; teacher must request a new link.
- Opening a reset or magic link while already signed in as someone else: existing session is replaced only after the new link is accepted as that teacher (device lock still applies); otherwise the teacher is asked to continue from Teacher Login.
- Network or mail-delivery failure after a valid teacher email was accepted: Arabic error that the message could not be sent; password is unchanged; no partial sign-in.
- Reset password mismatch or too-weak password: Arabic field error; link remains usable until it expires or succeeds.
- Magic link on a device that already has another teacher session: completing the link signs in the teacher named in the link (AUTH-003 device lock).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Teacher Login MUST show a subtle Arabic back control that navigates to the main platform login (`/login`) without submitting credentials.
- **FR-002**: Teacher Login MUST keep email/password sign-in for admin-provisioned teachers as the primary action.
- **FR-003**: Teacher Login MUST show a «نسيت كلمة المرور؟» action below the password field.
- **FR-004**: Teachers MUST be able to submit a password-reset request by email from that flow.
- **FR-005**: When the email matches an **active teacher** account, the platform MUST send a password-reset message to that address with a single-use, time-limited link (default lifetime: 60 minutes).
- **FR-006**: When the email does not match a teacher account, the platform MUST NOT send a message and MUST show a clear Arabic error that no teacher account was found for that email.
- **FR-007**: When the email matches an **inactive** teacher, the platform MUST NOT send a reset or magic-link message, MUST NOT create a session, and MUST show the existing inactive-account Arabic copy.
- **FR-008**: A valid reset link MUST let the teacher set a new password (with confirmation) and then sign in with that password on Teacher Login.
- **FR-009**: Expired, used, or invalid reset/magic links MUST NOT change the password or create a session, and MUST explain in Arabic how to request a new link.
- **FR-010**: Teacher Login MUST offer a secondary «أرسل لي رابط دخول لمرة واحدة» (magic link) action.
- **FR-011**: When the email matches an **active teacher**, the platform MUST email a single-use, time-sensitive sign-in link (default lifetime: 15 minutes).
- **FR-012**: Opening a valid unused magic link MUST sign the teacher in and send them to the teacher dashboard without requiring a password, while still enforcing device lock (AUTH-003).
- **FR-013**: Reset and magic-link requests MUST apply only to **teacher** accounts; student and Super Admin emails MUST be handled as “no teacher account.”
- **FR-014**: All new copy, errors, and confirmations MUST be Arabic. Email and password values stay left-to-right inside the fields.
- **FR-015**: Loading, success, and error feedback MUST be visible within the form or as the platform’s usual toast pattern; submit controls MUST disable while a request is in progress.
- **FR-016**: The enhanced page MUST preserve RTL layout, rounded card, teal primary action, and large tap targets consistent with the current Teacher Login.
- **FR-017**: Reset and magic-link messages MUST come from the platform’s existing teacher-facing sender identity (the same branded From address used for other platform mail).
- **FR-018**: Repeat reset or magic-link requests for the same email MUST be rate-limited (default: at most 3 successful sends per email per 15 minutes).
- **FR-019**: Reset and magic links MUST work on the current public origins (production `https://almoayed.app`, development `https://dev.almoayed.app`) using the environment’s public app origin, including `www` as an alias of production.

### Key Entities

- **Teacher account**: Admin-provisioned teacher identified by email, with active or inactive status. Only active teachers may receive recovery or magic-link messages or complete those links.
- **Password reset request**: A one-time, time-limited grant tied to one teacher email, used only to set a new password. Consumed on success; useless after expiry or tampering.
- **Magic sign-in request**: A one-time, shorter-lived grant tied to one teacher email, used only to start a teacher session. Consumed on success; useless after expiry or tampering.
- **Teacher session**: The signed-in teacher context after password login or a successful magic link, subject to device lock.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A signed-out visitor can leave Teacher Login and reach the main login in under 5 seconds using only the on-page back control (no browser chrome required).
- **SC-002**: In moderated tests, at least 90% of teachers who forgot their password complete reset (request → email → new password → sign-in) on the first try without contacting support.
- **SC-003**: For a known active teacher email, the reset or magic-link confirmation appears on screen within 3 seconds of submit, and the matching message arrives in the inbox during the test window.
- **SC-004**: 100% of requests using an email that is not an active teacher account send **no** recovery or sign-in message, and the person sees an Arabic error before they leave the page.
- **SC-005**: A valid magic link signs the teacher into the teacher dashboard in one tap, without typing a password, in under 10 seconds after the message is opened.
- **SC-006**: Inactive teachers cannot reset a password or sign in via magic link in 100% of test attempts.
- **SC-007**: Teachers who only use email and password still complete sign-in on the enhanced page without extra required steps.
- **SC-008**: On a phone-width view, testers rate the enhanced Teacher Login as the same product family as today (Arabic RTL, one primary action, quiet secondary links) in at least 4 out of 5 reviews.

## Assumptions

- This feature applies only to **Teacher Login** (`/teacher/login`) and its recovery/magic-link completion screens. Student WhatsApp login, Super Admin login, and emergency fallback are unchanged.
- Admin-provisioned teachers already sign in with email and password; this extends that existing teacher-email exception and does not introduce email/password for students.
- The back control goes to **`/login`** (main platform login), not the marketing home, unless a later clarification prefers the public home.
- Unknown or non-teacher emails show an explicit “no teacher account” error, as requested, rather than a generic “if this email exists…” message.
- Inactive teachers see the existing inactive-account wording, not the not-found wording, and receive no email.
- Password-reset links expire after **60 minutes**; magic-link sign-in links expire after **15 minutes**; both are single-use.
- New passwords follow the same strength rules already used when Super Admin creates a teacher password.
- Recovery and magic-link messages use the platform’s existing transactional email sender and the current public app origin for links.
- Device lock (AUTH-003) still applies after magic-link sign-in: a new session on a second device invalidates the previous one.
- Rate limiting of 3 sends per email per 15 minutes is enough to limit abuse without blocking a teacher who mistypes once or twice.
- Visual language stays the current teacher login: teal primary button, rounded elevated card, large inputs, Arabic labels.
