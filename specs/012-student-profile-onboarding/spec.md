# Feature Specification: Student Profile Onboarding & Completion Gate

**Feature Branch**: `012-student-profile-onboarding`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description: "Student Profile Onboarding & Mandatory Profile Completion Gate (PROFILE-002): progressive profiling — lightweight first onboarding after register/first login, then a mandatory profile completion gate after a quiz-completion threshold before starting new quizzes."

**Feature ID**: `PROFILE-002`

## Clarifications

### Session 2026-07-24

- Q: When the profile gate is active, what quiz access is blocked? → A: Block **new / not-yet-completed** quizzes only; completed quizzes stay open for review.
- Q: How should the mandatory profile-completion experience be presented? → A: Full-page blocking screen (student cannot use chrome behind it until done).
- Q: Who may view the new student demographic fields? → A: Student + linked teachers + platform admins (scoped to that teacher’s students).
- Q: For existing/teacher-created students who never saw first onboarding, when should the wizard run? → A: Force first onboarding on next login/app open for anyone with onboarding incomplete (same as new signups).
- Q: If a student later clears/invalidates a required field in settings, what happens to the quiz gate? → A: Flip required-profile to incomplete; gate applies again until required fields are valid.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mandatory profile gate before new quizzes (Priority: P1)

As a student who has already completed a small number of quizzes but has not finished the required profile, I want to be blocked from starting another quiz until I complete the required personal details so the platform can build a trustworthy student record without interrupting the very first learning attempts.

**Why this priority**: This is the core progressive-profiling control — it protects data quality while still allowing early quiz access, and it is independently valuable even without the lightweight wizard.

**Independent Test**: With a student who has ≥2 completed quizzes and an incomplete required profile, attempt to open/start a quiz; the gate appears with required fields; after successful save, the same quiz becomes accessible without re-prompting.

**Acceptance Scenarios**:

1. **Given** a logged-in student with fewer than 2 completed quizzes and an incomplete required profile, **When** they open a quiz, **Then** they are allowed into the quiz flow (gate does not block).
2. **Given** a logged-in student with 2 or more completed quizzes and required profile still incomplete, **When** they attempt to open or start a quiz they have **not** completed yet, **Then** they are redirected to a **full-page** mandatory profile-completion screen (not a dismissible overlay) with clear Arabic guidance (including the “one step left” message).
3. **Given** the same incomplete-profile student, **When** they open a quiz they have **already completed**, **Then** they can review answers/results and the gate does not block that review.
4. **Given** the mandatory profile form is open, **When** required fields (full name, birth date, province, city, education stage) are missing or invalid, **Then** Arabic validation messages appear and the student cannot submit.
5. **Given** valid required fields (and optional email/address if provided), **When** the student submits, **Then** the profile is marked complete, a success confirmation is shown, and they proceed seamlessly into the **new** quiz they originally requested.
6. **Given** a student whose required profile is already complete, **When** they open any quiz, **Then** the gate never appears.
7. **Given** the student has an active teacher context, **When** they save profile data via the gate, **Then** their active teacher relationship and current teacher selection remain unchanged.

---

### User Story 2 - Lightweight first onboarding after signup (Priority: P2)

As a newly registered student, I want a short mobile-first onboarding right after signup/first login so the app learns my study stage, how I found my teacher, and my main subject without a long form.

**Why this priority**: Improves early personalization and attribution; valuable independently, but secondary to the quiz gate that enforces the fuller demographic record.

**Independent Test**: Register or first-login as a student who has not finished first onboarding; complete the 3-step wizard; confirm those answers persist and the student reaches the normal student home without being asked again.

**Acceptance Scenarios**:

1. **Given** a student who just finished registration (or any login/app open) and has not completed first onboarding — including legacy and teacher-created accounts — **When** authentication succeeds, **Then** they are taken to the first-onboarding flow before the main student experience.
2. **Given** the onboarding wizard, **When** the student completes step 1 (education stage), step 2 (referral source), and step 3 (primary subject), **Then** answers are saved and first onboarding is marked done.
3. **Given** a student who already completed first onboarding, **When** they log in again, **Then** they are not forced through the wizard again.
4. **Given** onboarding is in progress, **When** the student is on a phone-sized screen, **Then** each step is touch-friendly, RTL Arabic, and usable without raw native browser select widgets for the provided choice lists.

---

### User Story 3 - Review and update profile later (Priority: P3)

As a student, I want to review or correct the profile details collected during onboarding/gate from settings so my information stays accurate over time.

**Why this priority**: Completes the lifecycle of profile data; not required for the MVP gate to work if create/update happens only via onboarding + gate.

**Independent Test**: Open student settings after profile completion, change an allowed field (e.g., city or primary subject), save, reload; the new value is shown.

**Acceptance Scenarios**:

1. **Given** a student with a completed profile, **When** they open settings/profile, **Then** they can view the stored demographic fields relevant to students.
2. **Given** editable profile fields, **When** they save valid changes that still satisfy all required profile fields, **Then** updates persist and required-profile completion remains true.
3. **Given** the student clears or invalidates a required field (e.g., empty city or missing birth date), **When** they attempt to save, **Then** either the save is rejected with Arabic validation **or** if saved as incomplete, required-profile completion becomes false and the quiz gate applies again for not-yet-completed quizzes.
4. **Given** WhatsApp identity is already established, **When** viewing profile, **Then** WhatsApp remains read-only (consistent with existing profile behavior).

---

### User Story 4 - Linked teacher can see student demographics (Priority: P3)

As a teacher linked to a student, I want to see that student’s demographic profile details in student management so I can understand stage, location context, and subject focus for coaching — without seeing students I am not linked to.

**Why this priority**: Access rules must be clear for privacy; a dedicated teacher UI can be thin in v1 but the visibility rule is part of the feature contract.

**Independent Test**: As Teacher A, open a linked student’s record and confirm demographics are visible; as Teacher B with no link to that student, confirm those fields are not accessible.

**Acceptance Scenarios**:

1. **Given** Teacher A is linked to Student S, **When** Teacher A views S’s student record, **Then** S’s demographic fields are available to Teacher A.
2. **Given** Teacher B is not linked to Student S, **When** Teacher B attempts to access S’s demographics, **Then** access is denied / fields are not returned.
3. **Given** a platform admin, **When** they view student records in admin tools, **Then** demographics are available under existing admin privileges.

---

### Edge Cases

- Student reaches the quiz gate via a deep link: after successful completion, they land on that same quiz, not a generic home page.
- Student already has a full name from registration: the gate pre-fills it and still requires a non-empty name.
- Optional email provided with invalid format: submit is blocked with Arabic validation; leaving email empty is allowed.
- Student switches teachers after completing profile: profile remains complete; gate does not re-trigger solely due to teacher switch.
- Existing students created before this feature: on next login they must complete first onboarding if unfinished; the quiz gate still applies later when the completed-quiz threshold is met and required profile is incomplete.
- Student with exactly 2 completed quizzes who abandons the gate: they still cannot start **new** (not-yet-completed) quizzes until they finish; reviewing past results and already-completed quiz review remains allowed.
- Retake of a previously completed quiz counts as starting a new attempt and **is blocked** by the gate until the required profile is complete (same as a brand-new quiz).
- Student abandons the full-page gate via browser back: they must not land inside a blocked not-yet-completed quiz; safe destinations are dashboard, results, settings, or the gate page again.
- Student later clears a required field in settings: required-profile completion becomes false (or save is blocked); not-yet-completed quizzes are gated again until required fields are restored.
- Unlinked teacher must not receive another teacher’s student demographic fields via any list or detail API.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store student demographic and profiling attributes on the student account: birth date, education stage, province, city, address, email, referral source, primary subject, first-onboarding completion state, and required-profile completion state.
- **FR-002**: System MUST support education-stage values covering primary through university (including baccalaureate) plus an “other” path usable from onboarding.
- **FR-003**: System MUST support referral-source values for institute/school, WhatsApp group, friend, social media, and other.
- **FR-004**: After successful student authentication (new registration, returning login, or app open with a valid session that lands in the student shell), if first onboarding is not done, the system MUST route the student into a 3-step onboarding flow before the main student shell — including legacy and teacher-created students.
- **FR-005**: First onboarding MUST collect, in order: education stage, referral source, and primary subject (selectable common subjects with free-text allowed).
- **FR-006**: Completing first onboarding MUST persist those answers and mark first onboarding done without necessarily marking the full required profile as complete.
- **FR-007**: When a student attempts to open or start a quiz they have **not yet completed**, if they have **2 or more unique completed quizzes** and required profile is not complete, the system MUST block that attempt and route them to a **full-page** mandatory profile-completion screen (blocking; not a dismissible modal/sheet).
- **FR-008**: The mandatory profile experience MUST require: full name, birth date, province (from a Syria province list), city, and education stage; and MAY accept optional email and detailed address.
- **FR-009**: Successful submission of the mandatory profile MUST mark the required profile complete and allow immediate continuation into the intended **new** quiz.
- **FR-010**: Students with required profile already complete MUST never be blocked by this gate.
- **FR-011**: Profile saves MUST NOT change or clear the student’s active teacher selection or teacher-link status.
- **FR-012**: All student-facing copy for this feature MUST be Arabic RTL with clear validation and the completion nudge: «بقي خطوة واحدة لاستكمال حسابك ومتابعة الاختبارات».
- **FR-013**: Choice lists and date entry MUST be touch-friendly and must not rely on raw native browser select/file widgets for the province/stage/referral controls.
- **FR-014**: Students MUST be able to view and update profile demographics later from settings. Saving a state where any required profile field is missing or invalid MUST set required-profile completion to **false** (or reject the save); once incomplete again, the quiz gate MUST re-apply per FR-007.
- **FR-015**: When the gate is active, the system MUST still allow: dashboard browsing, results list, settings, teacher switching, and **review of already-completed quizzes** (including answer review). It MUST block only not-yet-completed quizzes and retakes.
- **FR-016**: Product instrumentation hooks MUST expose the profile-completion full-page experience for enablement tooling (`profile-completion-modal` id may be retained as the hook name for continuity, applied to the full-page root).
- **FR-017**: Attempting to **retake** a previously completed quiz while the gate is active MUST be treated as a blocked new attempt (same as opening an incomplete quiz).
- **FR-018**: The profile-completion full page MUST NOT be dismissible via back-navigation into the blocked quiz without completing the form; leaving to dashboard/results/settings remains allowed.
- **FR-019**: Demographic fields MUST be readable by: the student themselves; teachers who have an active (or otherwise linked) relationship to that student, limited to their own linked students; and platform admins. Teachers MUST NOT see demographics of students they are not linked to.
- **FR-020**: v1 does not require a new teacher demographics dashboard, but student detail / existing teacher student views MAY surface these fields when implemented; storage and access rules above still apply.

### Key Entities

- **Student Profile (extended)**: Account-level demographics and flags — birth date, education stage, province, city, address, email, referral source, primary subject, first-onboarding done, required-profile completed. Extends the existing student identity (name, WhatsApp).
- **First Onboarding Session**: One-time progressive capture of stage, referral, and subject after signup.
- **Profile Completion Gate**: Full-page enforcement screen before starting a not-yet-completed quiz (or retake) once the completed-quiz threshold is reached and required profile is incomplete.
- **Completed Quiz Count**: Number of distinct quizzes the student has already finished (account-wide) used only as the gate threshold trigger.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: ≥90% of students who hit incomplete-onboarding routing (new or returning) complete the 3-step first onboarding within the same session without support intervention.
- **SC-002**: Students can finish first onboarding in under 60 seconds on a typical mobile connection.
- **SC-003**: 100% of attempts to start **not-yet-completed** quizzes (including retakes) by students who meet the threshold and lack a completed required profile are blocked until the form is successfully submitted (zero silent bypass); completed-quiz review remains unblocked.
- **SC-004**: After a successful mandatory profile save, ≥95% of students reach their intended quiz on the first continuation without manually re-finding it.
- **SC-005**: Among students who hit the gate, ≥85% complete the required profile on the first presentation (valid submit without abandoning the session).
- **SC-006**: Teacher switch / active-teacher context remains correct for 100% of profile saves in multi-teacher accounts (no accidental teacher context loss).
- **SC-008**: In multi-tenant checks, 100% of sampled unlinked teacher→student demographic access attempts are denied.

## Assumptions

- Student identity continues to live on the existing student/user profile record (not a separate students-only table); new demographic fields extend that record. Fields such as email/address that already exist are reused rather than duplicated.
- First onboarding is **mandatory once** (no “skip forever” in v1); it is separate from required-profile completion.
- A dedicated **first-onboarding completed** flag is stored so the wizard is not inferred only from sparse fields.
- The quiz gate threshold is exactly **2 unique completed quizzes**, account-wide (not per teacher).
- “Completed quiz” means a finished submission for a distinct quiz (retakes of the same quiz do not increase the count).
- Education-stage onboarding labels (e.g., تاسع / بكالوريا / جامعة / غير ذلك) map to the stored stage vocabulary (primary through university including baccalaureate, plus other).
- Syrian province list is a fixed product list in Arabic for selection; city remains free text.
- Minimum plausible age for birth date validation defaults to **6 years** (school-age lower bound); future dates are invalid.
- Optional email is validated only when non-empty.
- Results review, dashboard, settings, teacher switching, and **completed-quiz review** stay available while the gate is pending; only not-yet-completed quizzes and retakes are blocked.
- This feature does not change Free/Pro gating, quiz content gatekeeping (answers before submit), or teacher-owned group assignment.
- Existing students default to incomplete onboarding/profile flags until they complete the new flows; **incomplete first onboarding is enforced on the next login/app open** for every student account type (self-registered or teacher-created).
- First onboarding remains mandatory once per student; it is not limited to brand-new self-registrations.
- Required-profile completion is **not permanent**: it remains true only while all required fields stay valid; clearing/invalidating them re-opens the quiz gate.
- Demographic visibility is limited to the student, their linked teachers (own students only), and platform admins (FR-019).
- PROFILE-001 settings remain the long-term edit surface for the student; this feature adds onboarding + gate entry points that write the same profile fields.
- First onboarding uses a dedicated multi-step screen; the required-profile gate uses a **separate full-page** form (not a modal).

## Scope Boundaries

**In scope**

- Progressive first onboarding on next login for any student with incomplete onboarding (new, legacy, teacher-created)
- Mandatory profile completion before starting new quizzes after the threshold
- Persisting demographics for later personalization and teacher/admin insight
- Demographic read access for student, linked teachers, and admins
- RTL mobile UX and enablement hooks for the gate/onboarding

**Out of scope (v1)**

- Parent/guardian contact capture
- Notification preference center beyond profile fields listed
- Using demographics to auto-filter quizzes in this release (storage only; personalization can follow)
- Teacher-facing demographic dashboards as a dedicated product area (fields may still appear on existing student detail views under FR-019/020)
- Changing WhatsApp number or multi-device session lock rules
