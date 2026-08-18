# Feature Specification: Fast Student Trial Onboarding Link

**Feature Branch**: `024-trial-onboarding-link`

**Created**: 2026-08-18

**Status**: Draft

**Feature IDs**: `AUTH-008` (student trial join without first-time OTP) · `TEACH-015` (teacher trial invite tool)

**Extends**: `AUTH-001` · `AUTH-002` · `AUTH-003` · `AUTH-004` · `AUTH-007` · `MT-001` · `MT-002` · `PROFILE-002` · `TIER-001` · `TEACH-001` · `TEACH-005`

**Input**: User description: "Fast, low-friction trial onboarding via a unique shareable teacher link. New students join without WhatsApp OTP, create a profile, auto-link to the referring teacher, and take Free-tier quizzes. After logout, the same link and standard login both require WhatsApp OTP so an existing number cannot be hijacked."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Teacher copies and shares a trial invite link (Priority: P1)

As a teacher, I want a ready-made trial onboarding link in my portal, with copy and WhatsApp-share actions and a preset Arabic invitation, so I can send students into my classroom in one tap instead of walking them through the full registration-and-OTP path.

**Why this priority**: Without a teacher-facing invite surface, students have nothing to open. This is the smallest independently valuable slice: a working, shareable classroom join address.

**Independent Test**: Sign in as a teacher, open the invite tool, copy the link, and confirm it is a public join address unique to that teacher; open WhatsApp share and confirm the preset Arabic text includes the teacher’s name (or classroom identity) and the same link.

**Acceptance Scenarios**:

1. **Given** a signed-in active teacher, **When** they open the teacher home or students area, **Then** they see a trial onboarding invite card with their unique join link, a copy action, and a WhatsApp share action.
2. **Given** the invite card, **When** they tap copy, **Then** the full join address is placed on the clipboard and they receive a brief Arabic confirmation.
3. **Given** the invite card, **When** they tap share via WhatsApp, **Then** a WhatsApp share sheet or chat opens with preset Arabic invitation text that includes the join link and makes clear the student can start a trial with that teacher.
4. **Given** two different teachers, **When** each copies their link, **Then** the addresses are distinct and each lands on that teacher’s classroom only.
5. **Given** an inactive teacher account, **When** someone opens that teacher’s join address, **Then** joining is refused with clear Arabic guidance (consistent with inactive-account rules) and no student session is created.

---

### User Story 2 - New student joins from the link without OTP (Priority: P1)

As a student who received a teacher’s trial link and has never used the app, I want a short Arabic form (first name, last name, class/grade, date of birth, WhatsApp number) that signs me in immediately, so I can start Free quizzes under that teacher without waiting for a verification code.

**Why this priority**: This is the core student value — one-time OTP bypass for a brand-new learner — and it is independently testable even if share CTAs are still being polished.

**Independent Test**: Open a valid teacher join address while signed out, submit a WhatsApp number that has no existing student profile, and confirm a student session exists, the student is linked only to that referring teacher, and Free quizzes for that teacher are reachable without any OTP step.

**Acceptance Scenarios**:

1. **Given** a visitor with no session and a valid active teacher join address, **When** they open the link, **Then** they see a clean, RTL, mobile-first Arabic registration page (no signed-in shell required) that asks for first name, last name, class/grade, date of birth, and WhatsApp number.
2. **Given** valid required fields and a WhatsApp number that is not already registered, **When** they submit, **Then** a student profile is created, they are linked to the referring teacher, a signed-in student session is established (including device session lock), and they are taken to the student home (or quiz list) without WhatsApp OTP.
3. **Given** the new trial student, **When** they open the quiz list for the referring teacher, **Then** they can start every **Free** exam that teacher has published for their classroom.
4. **Given** the same student, **When** they open a **Pro** exam from that teacher, **Then** the exam remains locked and they see the existing upgrade/locked treatment (not full access).
5. **Given** missing or invalid fields (empty name, invalid WhatsApp format, missing class/grade, missing or impossible birth date), **When** they submit, **Then** Arabic validation messages appear, no profile is created, and no session is minted.
6. **Given** an unknown, malformed, or inactive teacher join address, **When** they open or submit the form, **Then** they see a clear Arabic error and cannot create a session tied to a non-existent or inactive teacher.
7. **Given** successful join, **When** the referring teacher opens their student list, **Then** the new student appears as a linked student of that teacher (same classroom roster as a normal join).

---

### User Story 3 - Logout ends the trial shortcut; return requires OTP (Priority: P1)

As a platform owner, I want the OTP skip to work **only for the first session of a new WhatsApp identity**, so that after logout (or any later visit) nobody can open an existing student’s account just by knowing the join link and typing that number.

**Why this priority**: This is the anti-hijack rule. Shipping join-without-OTP without this gate would create an account-takeover path.

**Independent Test**: Complete a first-time trial join, log out, then retry both the same join link (same number) and standard login; both paths must require WhatsApp OTP and must not mint a session until OTP succeeds.

**Acceptance Scenarios**:

1. **Given** a trial student who is signed in, **When** they log out, **Then** the session ends and they are treated as signed out (same as a normal logout).
2. **Given** that same WhatsApp number after logout, **When** they open the trial join link and submit the form (even with matching name/class/birth date), **Then** they are **not** signed in; they are sent to the standard WhatsApp OTP confirmation flow.
3. **Given** that same WhatsApp number after logout, **When** they use the normal login page, **Then** they must complete WhatsApp OTP; the trial link is not an alternate password.
4. **Given** a WhatsApp number that already belongs to a student (whether they originally joined via trial link or via normal registration), **When** anyone submits the trial join form with that number while signed out, **Then** no new session is minted and they are directed to OTP instead of overwriting or opening the existing profile.
5. **Given** OTP succeeds for that existing student, **When** they arrived from a **different** teacher’s join link than the one(s) they already have, **Then** after OTP they are linked to the referring teacher as well (multi-teacher join) and that teacher becomes the active classroom, without skipping OTP.
6. **Given** OTP succeeds for that existing student, **When** they already have an active link to the referring teacher, **Then** they are signed in to that classroom and no duplicate classroom membership is created.

---

### User Story 4 - Arabic mobile join experience (Priority: P2)

As a student on a phone, I want the join page and teacher share actions to feel like the rest of المؤيد — authentic Arabic, right-to-left, large tap targets — so I can finish onboarding without struggling with tiny controls or English-only copy.

**Why this priority**: Required for production quality, but the security and classroom-link behavior in P1 can be proven even if visual polish is still in progress.

**Independent Test**: Complete the join flow on a phone-sized screen using only Arabic labels, RTL layout, and touch-friendly controls; confirm copy/share on the teacher side is likewise Arabic and tappable.

**Acceptance Scenarios**:

1. **Given** the public join page, **When** viewed on a phone-sized screen, **Then** all labels, errors, and buttons are Arabic, layout is right-to-left, and primary actions are easy to tap (no cramped native-only file or select widgets for class/grade).
2. **Given** the teacher invite card, **When** viewed on a phone, **Then** copy and WhatsApp share are full-width or equivalently large touch targets with Arabic captions.
3. **Given** a validation or permission error (invalid number, inactive teacher, existing account needs OTP), **When** it is shown, **Then** the message is Arabic and does not expose internal identifiers or other students’ data.

---

### Edge Cases

- Visitor is already signed in as a **student** and opens a join link: stay signed in; if the link is a **new** teacher, offer or complete linking to that teacher without creating a second profile; if it is the **same** teacher, go to student home.
- Visitor is already signed in as a **teacher** and opens a join link: do not convert the teacher account into a student; show Arabic guidance to use a student identity (or sign out first).
- WhatsApp number already registered as a **teacher**: refuse student trial join with Arabic guidance to use teacher login; do not mint a student session for that number.
- Session expired (idle timeout) rather than explicit logout: treat as signed out; existing number requires OTP.
- Student has only deactivated classroom links (inactive student access): trial join and login both refuse a session, with the existing inactive-account Arabic message.
- Referring teacher has zero published Free exams: join still succeeds; the quiz list is empty or shows the usual empty state, not an error that undoes registration.
- Two devices submit the same new WhatsApp number at once: one student profile results; the second attempt follows the “already registered → OTP” rule.
- Join address with extra whitespace, wrong letter case, or an old bookmark: resolve using the teacher’s public classroom code when possible; otherwise show Arabic “link is invalid”.
- Student later unlinks from the referring teacher: they keep their profile; re-joining that teacher later requires OTP (they are no longer a first-time identity).
- Birth date in the future, or a class/grade outside the allowed list: reject with Arabic validation; no profile created.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Teachers MUST be able to view a unique, stable trial onboarding address for their own classroom from the teacher portal (home and/or students area).
- **FR-002**: Teachers MUST be able to copy that address to the clipboard and share it via WhatsApp with preset Arabic invitation text that includes the link.
- **FR-003**: The join address MUST identify exactly one referring teacher (the teacher who owns the classroom code) and MUST NOT expose other teachers’ students or exams.
- **FR-004**: The public join page MUST be usable without an existing session and MUST collect first name, last name, class/grade, date of birth, and WhatsApp number, all in Arabic RTL.
- **FR-005**: For a WhatsApp number with **no** existing profile, submitting a valid join form MUST create the student, link them to the referring teacher, start a student session (with device session lock), and send them to the student home or quiz list **without** WhatsApp OTP.
- **FR-006**: After that first session ends (logout or equivalent signed-out state), the same WhatsApp number MUST NOT be able to obtain a session from the join form; the product MUST send them through standard WhatsApp OTP (`AUTH-001`).
- **FR-007**: Submitting the join form with a WhatsApp number that already exists MUST NOT open that account, MUST NOT overwrite the existing profile, and MUST route the person to WhatsApp OTP.
- **FR-008**: Standard login (`AUTH-001`) MUST continue to require WhatsApp OTP for every existing student and teacher; this feature MUST NOT add a password or a second OTP-free login on `/login`.
- **FR-009**: Trial-joined students MUST immediately see and be able to start all Free exams of the referring teacher, and MUST remain blocked from Pro exams (`TIER-001`).
- **FR-010**: Exam content MUST still hide correct answers and explanations until the student submits (`QUIZ-001`).
- **FR-011**: Classroom membership created by this flow MUST follow existing multi-teacher rules (`MT-001` / `MT-002`): the referring teacher is the active classroom after join; additional teachers are added only through the defined link flows (including OTP-gated join for existing numbers).
- **FR-012**: Inactive teachers MUST NOT accept trial joins; students with no remaining active classroom access MUST NOT receive a session (`AUTH-007`).
- **FR-013**: The existing registration path that uses a teacher code **plus** OTP (`AUTH-002`) MUST keep requiring OTP; only the dedicated trial join page may skip OTP, and only for a never-before-registered WhatsApp number.
- **FR-014**: Completing the trial join form MUST be enough to reach Free quizzes on that first session (no extra blocking wizard before the first Free exam). Later profile-completion rules after repeated quiz use (`PROFILE-002`) MAY still apply for remaining demographic fields.
- **FR-015**: Invalid join addresses, validation failures, and “this number already exists” cases MUST show recoverable Arabic messages and MUST NOT leak whether a number belongs to a teacher vs student beyond what is needed to choose the correct next step (login vs student OTP vs teacher login).
- **FR-016**: Logout MUST continue to end the session and return the user to signed-out login (`AUTH-004`).

### Key Entities

- **Trial onboarding link**: A public, teacher-specific join address derived from the teacher’s existing unique classroom code. Stable for that teacher (not a one-time disposable token in this version). Anyone with the link can open the join page; only a **new** WhatsApp identity can complete OTP-free signup.
- **Referring teacher**: The classroom owner encoded in the link. All new trial students and their Free-exam access are scoped to this teacher until the student adds another teacher through existing multi-teacher flows.
- **Student profile**: The learner record created or reused by WhatsApp number. New profiles store first name, last name, class/grade, birth date, and WhatsApp identity.
- **Classroom membership**: The student–teacher association that grants access to that teacher’s exams and roster. Created automatically on successful trial join.
- **Student session**: Signed-in state after successful join or OTP. Subject to device session lock and destroyed on logout.
- **OTP-free eligibility**: A one-time property of a WhatsApp identity: eligible only when no profile exists yet. After the profile exists, every later entry requires WhatsApp OTP.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A teacher can locate, copy, and share their trial link (copy or WhatsApp) in under 30 seconds from the teacher portal.
- **SC-002**: A new student with a valid link can go from opening the page to a signed-in student home in under 2 minutes, with **zero** OTP messages required on that first visit.
- **SC-003**: In 100% of tests, a student who has logged out cannot regain that account from the trial link or from standard login without completing WhatsApp OTP.
- **SC-004**: In 100% of tests, a trial-joined student can open every Free exam of the referring teacher and cannot start that teacher’s Pro exams.
- **SC-005**: At least 90% of first-time join attempts with complete valid fields succeed on the first submit (no unexplained failure after the form is correctly filled).
- **SC-006**: Teachers report that invite-and-join is easier than dictating a teacher code plus OTP: target is that a pilot group can onboard a new student via the link without a live support call.
- **SC-007**: Join and invite screens remain fully Arabic and usable one-handed on a typical phone; usability review finds no LTR-only or English-only primary controls on those screens.

## Assumptions

- Registry IDs are **`AUTH-008`** (student trial join / OTP-bypass) and **`TEACH-015`** (teacher invite tool). The prompt’s `AUTH-007` / `TEACH-012` labels already belong to inactive-account login and import templates; those features stay unchanged.
- The join address uses the teacher’s existing public classroom code (the same unique code already used for `AUTH-002` and shown on the teacher dashboard). v1 does not add rotatable or revocable secret tokens.
- OTP skip is granted **only when no profile exists** for that WhatsApp number — not “until first logout” as a separate flag. Logout is simply the moment the one-time skip is no longer available because the profile now exists.
- After OTP, an existing student who arrived via another teacher’s join link is linked to that teacher (standard multi-teacher add), then signed in with that teacher as the active classroom.
- Class/grade uses the same education-stage / grade choices already used in student profiling, presented as a touch-friendly Arabic list.
- First and last name are stored as the student’s display name (combined for places that today show a single full name).
- Trial join does **not** skip Pro gating, quiz answer hiding, inactive-account blocking, or device session lock.
- The three-step first-onboarding wizard (`PROFILE-002`) is not forced before the first Free exam on this path; class/grade from the join form covers education stage for that session. The later mandatory profile gate after repeated quiz completions still applies if city/province (or other remaining required fields) are missing.
- Normal `/login` registration (`AUTH-002`) still requires OTP; this feature does not remove OTP from that path.
- Teachers cannot customize the WhatsApp invitation beyond the preset Arabic template (teacher/classroom identity + link).
- Demo and emergency login paths are unchanged and are not advertised on the public join page.
- Feature registry and in-product help hooks will be updated when this behavior ships so existing capabilities are not overwritten.
