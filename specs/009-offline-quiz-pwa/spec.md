# Feature Specification: Offline Quiz PWA

**Feature Branch**: `009-offline-quiz-pwa`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "Implement offline quiz capabilities for our PWA so users can load the app shell and take quizzes even without an active internet connection. Cache the app shell and static assets, cache quiz content for previously viewed quizzes, preserve student answers locally when offline, and automatically sync submissions when connectivity returns."

## Clarifications

### Session 2026-07-23

- Q: Can a student start offline a quiz that appears in a cached quiz list but was never individually opened while online? → A: No — only quizzes explicitly opened at least once while online are offline-startable; list-only visibility does not grant offline access.
- Q: If session expires offline with pending submissions, what happens after re-login? → A: Auto-sync all pending submissions immediately after successful re-login when online.
- Q: Should students have a manual sync control in addition to automatic sync? → A: Yes — automatic sync plus a manual "Sync now" action for pending submissions.
- Q: If teacher changed the quiz after cache, how should offline submission sync be handled? → A: Accept answers only for unchanged question IDs; reject full attempt if required questions are missing or quiz is inactive.
- Q: If session expires offline during an in-progress quiz, can the student keep answering and submit locally? → A: Yes — continue in-progress quiz offline, allow local submit, sync waits until re-login when online.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Student Opens the App Without Connectivity (Priority: P1)

A signed-in student who has used the app before opens Al-Moayed on their phone with no internet connection. The core app shell loads (navigation, branding, Arabic RTL layout) instead of a blank browser error. They can reach areas that were previously visited or prepared for offline use, and see a clear Arabic message when they try to open content that was never available locally.

**Why this priority**: Without a usable offline shell, the PWA feels broken the moment connectivity drops — common for students in Syria with unstable networks.

**Independent Test**: With network disabled after at least one prior online visit, the student can open the installed or bookmarked app and see the familiar Arabic student interface within a few seconds, not a generic browser failure page.

**Acceptance Scenarios**:

1. **Given** a student who opened the student home at least once while online, **When** they reopen the app fully offline, **Then** the student shell loads with RTL Arabic layout and primary navigation visible.
2. **Given** a student is offline, **When** they navigate to a page that was never cached or visited before, **Then** they see a dedicated Arabic offline fallback with a retry action instead of a broken blank screen.
3. **Given** a student is offline, **When** they tap retry after connectivity returns, **Then** the requested page loads normally without requiring a full app reinstall.

---

### User Story 2 - Student Takes a Previously Opened Quiz Offline (Priority: P1)

A signed-in student opens a quiz while online, then loses connectivity before or during the attempt. They can continue viewing the quiz questions, select answers, and submit the attempt. The app confirms the attempt is saved locally and will be sent when the network is back. They do not see correct answers or explanations until the server accepts the submission (same gatekeeper rule as online).

**Why this priority**: Completing quizzes offline is the core product value; shell caching alone does not help exam preparation.

**Independent Test**: Open a quiz online, disable network, answer all questions, submit, and verify the student sees a clear Arabic confirmation that the attempt is queued — without revealing grading content pre-sync.

**Acceptance Scenarios**:

1. **Given** a student opened an active quiz at least once while online and authenticated, **When** they go offline and reopen that quiz, **Then** the question set loads from local storage and remains answerable.
2. **Given** a student is answering offline, **When** they change answers or leave and return to the quiz, **Then** their in-progress answers are preserved on the same device.
3. **Given** a student completes all required questions offline, **When** they submit, **Then** the app saves the attempt locally, shows Arabic confirmation that sync is pending, and does not display correct answers or explanations yet.
4. **Given** a student is offline, **When** they try to open a quiz they never opened while online (including one visible only in a cached quiz list), **Then** the app explains in Arabic that the quiz is unavailable offline and suggests reconnecting.
5. **Given** a student submits offline, **When** they view results before sync completes, **Then** they see a pending-sync state rather than final scores or explanations.
6. **Given** the student session expired while offline during an in-progress quiz, **When** they continue answering and submit locally, **Then** the attempt is queued for sync and will send only after they sign in again when online.

---

### User Story 3 - Pending Quiz Attempts Sync Automatically (Priority: P2)

When connectivity returns, the app sends queued offline quiz attempts to the server without requiring the student to redo the quiz. Successful sync updates the student to the normal post-submit experience (score, weak points, explanations per existing rules). Failures show a recoverable Arabic message and keep the attempt queued for retry.

**Why this priority**: Local saving only delivers value if attempts reliably reach the teacher and grading pipeline.

**Independent Test**: Complete a quiz offline, restore network, and verify one server-side submission appears with matching answers and normal post-submit results — without duplicate submissions on refresh.

**Acceptance Scenarios**:

1. **Given** one or more pending offline quiz attempts on the device, **When** the app detects connectivity is restored, **Then** it automatically attempts to sync each pending attempt in order.
2. **Given** a pending attempt syncs successfully, **When** the student returns to that quiz, **Then** they see the standard post-submit results experience already used online.
3. **Given** sync fails due to a temporary server or network error, **When** the failure occurs, **Then** the attempt remains queued, the student sees an Arabic retry-oriented message, and a later reconnect retries sync.
4. **Given** the server already has a submission for that student and quiz (e.g., submitted on another device while offline), **When** sync runs, **Then** the local pending attempt is discarded safely, the student is informed in Arabic, and no duplicate submission is created.
5. **Given** sync succeeds, **When** the student refreshes or reopens the app, **Then** the pending queue no longer contains that attempt.
6. **Given** pending offline submissions exist and the student session expired while offline, **When** the student signs in again while online, **Then** the app automatically attempts to sync all pending submissions without requiring a manual retry.
7. **Given** one or more pending submissions failed automatic sync while online, **When** the student taps a manual "Sync now" action, **Then** the app retries syncing pending submissions without requiring them to re-enter answers.
8. **Given** a pending offline submission references question IDs that no longer exist or the quiz is inactive, **When** sync runs, **Then** the server rejects the full attempt with clear Arabic messaging and the local pending entry is retained for manual retry or support.

---

### User Story 4 - Clear Offline Status While Taking Quizzes (Priority: P3)

During an offline session, the student always understands whether they are offline, whether their work is saved locally, and whether results are waiting to sync — without technical jargon.

**Why this priority**: Reduces anxiety and support questions during exam prep; supports trust in the PWA.

**Independent Test**: Toggle airplane mode mid-quiz and verify visible Arabic status indicators for offline mode, saved progress, and pending sync.

**Acceptance Scenarios**:

1. **Given** the device loses connectivity during a quiz, **When** the student continues answering, **Then** a visible Arabic indicator shows they are offline and work is being saved on this device.
2. **Given** a pending submission exists, **When** the student views their dashboard or quiz list, **Then** they can see which attempts are awaiting sync (without blocking navigation of cached areas).
3. **Given** connectivity returns while the app is open, **When** sync starts, **Then** the student receives unobtrusive Arabic feedback that sync is in progress or complete.
4. **Given** pending submissions exist after a failed automatic sync, **When** the student views dashboard or quiz list, **Then** a manual "Sync now" action is available in Arabic alongside pending-status indicators.

---

### Edge Cases

- Student starts quiz online, submits online on another device while first device is still offline with a pending local attempt: server wins; local queue entry is cleared with explanation.
- Student session expires while offline: in-progress answers and pending submissions remain on device; student MAY continue an in-progress quiz and submit locally offline; starting new protected flows requires re-login; pending submissions auto-sync after successful re-login when online; user sees Arabic guidance.
- Teacher updates or deactivates a quiz after it was cached: on sync, accept answers only for unchanged question IDs that still exist; reject the full attempt if required questions were removed or the quiz is inactive; student sees clear Arabic rejection and queued data is retained for manual retry or support.
- Pro-locked or group-restricted quiz: offline access is allowed only if the student was authorized when the quiz was cached; sync re-validates tier and group rules server-side.
- Partial quiz (zero questions): submit remains blocked with the same Arabic empty-quiz message as online.
- Storage limit reached on device: student is warned in Arabic before data loss; oldest non-critical cache may be evicted per product policy without deleting unsynced attempts.
- App closed mid-quiz offline: answers and pending submission persist across app restarts on the same device.
- Long offline period (days): queued attempts remain until successfully synced or explicitly rejected by server rules; student can still see pending status.
- Student taps a quiz from a cached offline quiz list they never opened while online: start is blocked with Arabic guidance to reconnect and open the quiz online first.
- Automatic sync fails but device is online: pending items remain queued; student can tap manual "Sync now" without re-entering answers.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The PWA MUST cache enough of the student app shell and static presentation assets that a returning student can open the app offline and see a familiar Arabic RTL interface.
- **FR-002**: The system MUST provide a dedicated Arabic offline fallback when a student requests uncached content without connectivity, including a retry action after reconnect.
- **FR-003**: When a student explicitly opens an active quiz while online and authenticated, the system MUST store exam-safe quiz content locally so that same quiz can be loaded offline later on that device. Mere appearance in a cached quiz list MUST NOT make a quiz offline-startable. Cached exam content MUST NOT include correct answers or explanations before a valid submission exists (QUIZ-001 gatekeeper preserved).
- **FR-004**: Students MUST be able to select and change answers on a locally loaded quiz while offline, with progress persisted on the device until submit or sync. This MUST remain allowed for an in-progress quiz even if the server session expired while offline.
- **FR-005**: When a student submits a quiz offline, the system MUST save the full attempt locally, show Arabic confirmation that submission is pending sync, and MUST NOT reveal grading results until server acceptance. If the session expired before submit, the attempt MUST queue locally and sync only after successful re-login when online.
- **FR-006**: When connectivity is restored, the system MUST automatically attempt to sync all pending quiz attempts from that device without requiring the student to re-enter answers. If the session expired while offline, sync MUST run automatically immediately after successful re-login when online.
- **FR-007**: After successful sync, the student MUST receive the same post-submit outcomes as an online submission (score, explanations, weak points, share flows) subject to existing product rules.
- **FR-008**: If sync fails temporarily, pending attempts MUST remain queued and retried on subsequent online events until success or a definitive server rejection. Students MUST also be able to trigger a manual "Sync now" retry for pending submissions while online.
- **FR-009**: If the server already records a submission for the same student and quiz, the system MUST NOT create a duplicate submission; the local pending entry MUST be resolved with clear Arabic messaging.
- **FR-010**: On sync, the server MUST reject the full pending attempt with clear Arabic messaging if the quiz is inactive or any question ID from the cached submission no longer exists on the live quiz. If all submitted question IDs still exist and the quiz is active, the server MUST accept and grade the attempt normally.
- **FR-011**: Offline quiz access MUST respect existing authorization at cache time (signed-in student, active teacher context, tier/group eligibility); sync MUST re-validate on the server.
- **FR-012**: All offline-related user messaging (offline mode, pending sync, sync success/failure, unavailable quiz) MUST be natural Arabic and RTL-safe.
- **FR-013**: Teacher quiz authoring, bulk import, and dashboard management are out of scope for offline support in v1; only student quiz-taking and student-facing navigation benefit from offline capabilities.
- **FR-014**: Feature registry documentation MUST record this capability once accepted for planning/implementation tracking.

### Key Entities

- **Offline app shell cache**: Locally stored student UI framework (layout, navigation, styling assets) enabling startup without network.
- **Cached quiz exam package**: Exam-safe quiz metadata and questions for one quiz, tied to the student’s active teacher context at cache time; excludes grading fields pre-submission.
- **In-progress quiz state**: Per-quiz, per-device map of selected answers and navigation progress while the attempt is not yet submitted.
- **Pending quiz submission**: A completed attempt stored locally with quiz identifier, student context, answers, and timestamps until the server confirms receipt.
- **Sync status**: Per pending submission state — queued, syncing, synced, rejected, or failed-retryable — surfaced to the student in Arabic.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In controlled tests, 95% of repeat visits to the student app while offline show the student shell within 5 seconds on mid-range mobile devices.
- **SC-002**: 100% of quiz attempts completed offline for previously cached quizzes persist across app restarts on the same device until synced or definitively rejected.
- **SC-003**: 100% of pending offline attempts sync automatically within 2 minutes of stable connectivity returning, without manual re-submission by the student.
- **SC-004**: 0% of pre-submit offline caches or offline UI states expose correct answers or explanations to the student (gatekeeper compliance).
- **SC-005**: 0 duplicate server submissions are created when a pending offline attempt syncs after the student already submitted the same quiz elsewhere.
- **SC-006**: In usability checks, at least 9 of 10 students correctly understand offline vs pending-sync status from Arabic messaging alone.
- **SC-007**: When requesting uncached routes offline, 100% of tests show the Arabic offline fallback rather than a blank or generic browser error.

## Assumptions

- Primary users for offline quiz-taking are **students**; teacher workflows remain online-only in v1.
- A student must have signed in and **explicitly opened** a quiz at least once while online before that quiz is offline-startable on that device; seeing it in a cached quiz list alone is insufficient.
- Existing single-submission-per-student-per-quiz rule remains; offline sync is idempotent and deferential to an existing server submission.
- Existing QUIZ-001 gatekeeper, multi-tenant teacher scoping, and Pro/tier gating rules apply at cache time and are re-checked at sync time.
- Session validity follows current iron-session behavior: expired sessions block new protected flows, but in-progress offline quizzes remain editable and submittable locally; pending submissions auto-sync after re-login when online.
- Only one device’s pending queue is in scope per session; cross-device merge of partial offline progress is not required in v1.
- Quiz list browsing offline is best-effort (show last cached list if available); list entries for never-opened quizzes are display-only offline until the student opens them once while online.
- Storage eviction policies prioritize retaining unsynced pending submissions over optional cached quiz lists or stale shell assets.
