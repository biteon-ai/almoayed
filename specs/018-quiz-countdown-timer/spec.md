# Feature Specification: Quiz Countdown Timer

**Feature Branch**: `018-quiz-countdown-timer`

**Created**: 2026-07-24

**Status**: Clarified

**Feature ID**: `QUIZ-004` (extends `TEACH-003` · `QUIZ-001`)

**Input**: User description: "Add quiz countdown timer functionality (teacher configuration + student live timer with auto-submit on expiry). Teacher enable-timer toggle and duration in minutes; student sticky MM:SS countdown with warning under 2 minutes; auto-submit at 00:00 with Arabic notice and results redirect; remaining time derived from attempt start + duration so refresh cannot reset the clock; RTL + Spekit quiz-timer. Do not break QUIZ-001 gatekeeper, MT-002 teacher scoping, RTL Tajawal, or privileged server writes."

## Clarifications

### Session 2026-07-24

- Q: When a student returns to a timed quiz and wall-clock time has already expired (attempt started earlier, still unsubmitted), what should happen? → A: Lock + Arabic expiry notice + auto-submit immediately on reopen
- Q: Must the server enforce the timed deadline (reject answer changes / accept only submit after expiry), or is client-side lock enough? → A: Server enforces: after deadline, reject answer mutations; allow submit (auto or retry) only
- Q: For quizzes longer than 59 minutes, how should remaining time be shown? → A: Always MM:SS (minutes may be ≥ 60, e.g. 125:05)
- Q: What maximum duration (minutes) may a teacher set when the timer is enabled? → A: 1–180 minutes
- Q: If a teacher changes a quiz’s duration (or turns the timer off) while a student already has an in-progress timed attempt, what duration applies to that attempt? → A: Snapshot at attempt start: in-progress attempt keeps original duration/timed rules until submit or expiry

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Teacher configures a timed quiz (Priority: P1)

As a teacher, I want to optionally enable a countdown duration on a quiz so exams I publish have a clear, fair time limit.

**Why this priority**: Without teacher configuration, no timed student experience exists; this is the enabling MVP slice.

**Independent Test**: On quiz create/edit, enable «تفعيل التوقيت», enter a positive duration in minutes, save; reopen the quiz and confirm timer remains enabled with the same duration; disable the toggle and confirm duration is cleared/not required.

**Acceptance Scenarios**:

1. **Given** a teacher on quiz create or edit, **When** the form loads, **Then** they see an Arabic «تفعيل التوقيت» toggle (off by default for new quizzes).
2. **Given** the toggle is off, **When** the teacher views the form, **Then** no duration field is required and the quiz is saved as untimed.
3. **Given** the teacher turns the toggle on, **When** the form updates, **Then** an Arabic «مدة الاختبار بالدقائق» input appears and must be a whole number greater than zero before save succeeds.
4. **Given** timer is enabled with an invalid duration (empty, zero, negative, non-integer, or greater than 180), **When** the teacher tries to save, **Then** save is blocked with a clear Arabic validation message and no partial timer settings are persisted.
5. **Given** a valid timed quiz owned by this teacher, **When** they save, **Then** the quiz is stored as timed with the chosen duration, scoped only to that teacher’s quizzes (other teachers cannot edit this quiz’s timer).
6. **Given** an existing timed quiz, **When** the teacher turns the toggle off and saves, **Then** the quiz becomes untimed for future attempts (students who already started under the old timer rules keep their original attempt clock — see Assumptions).

---

### User Story 2 - Student sees a live countdown while taking a timed quiz (Priority: P1)

As a student, I want a clear remaining-time display while I take a timed quiz so I can pace myself and trust the limit is fair.

**Why this priority**: The live timer is the core student-facing value of QUIZ-004 and pairs with teacher configuration for a complete MVP.

**Independent Test**: Open a timed quiz as a linked student; confirm a sticky timer badge shows `MM:SS` remaining; wait or advance the clock conceptually past the 2-minute threshold and confirm warning styling; refresh the page and confirm remaining time continues from the original start (does not reset).

**Acceptance Scenarios**:

1. **Given** a student opens a timed quiz they are allowed to take, **When** the quiz runner loads, **Then** a sticky floating timer badge is visible at the top of the quiz screen showing remaining time as `MM:SS` (minutes may exceed 59 for longer quizzes).
2. **Given** the quiz runner has just opened for a new timed attempt, **When** the countdown starts, **Then** remaining time equals the quiz duration from the recorded attempt start (not from a client-only clock that can be reset).
3. **Given** remaining time is greater than 2 minutes, **When** the student views the badge, **Then** it uses the normal (non-warning) visual state.
4. **Given** remaining time is 2 minutes or less (and greater than zero), **When** the student views the badge, **Then** the badge enters a warning state (e.g. amber/red emphasis with a slight pulse) so urgency is obvious on mobile.
5. **Given** an untimed quiz, **When** the student opens the runner, **Then** no countdown timer badge is shown.
6. **Given** a timed quiz in progress, **When** the student refreshes or returns to the same attempt, **Then** remaining time is recomputed from attempt start + duration and is never longer than before the refresh (no timer reset cheat).

---

### User Story 3 - Auto-submit when time expires (Priority: P1)

As a student (and as the platform), I need the exam to end cleanly at `00:00` with answers submitted and scored so time limits are enforceable and results remain trustworthy.

**Why this priority**: Without auto-submit, the timer is cosmetic and teachers cannot rely on the limit.

**Independent Test**: Start a short-duration timed quiz (or simulate expiry); at `00:00` confirm answers lock, Arabic expiry notice appears, submission completes, results page opens with a score, and correct answers/explanations were not visible before that submit.

**Acceptance Scenarios**:

1. **Given** remaining time reaches `00:00`, **When** expiry is detected, **Then** all answer selections are immediately disabled and further changes are ignored.
2. **Given** expiry has occurred, **When** auto-submit begins, **Then** the student sees a clear Arabic notice such as «انتهى الوقت المحدد للاختبار! جاري تسليم إجاباتك تلقائياً...»
3. **Given** auto-submit succeeds, **When** grading finishes, **Then** the student is taken to the attempt results view with score applied.
4. **Given** auto-submit is in progress or complete, **When** grading fields are considered, **Then** QUIZ-001 gatekeeper still holds: correct answers and explanations are not available before successful submit.
5. **Given** the student has already submitted (manually or via auto-submit), **When** they try to open the same quiz for another attempt under single-submission rules, **Then** they cannot start a new timed attempt that would reset the clock.
6. **Given** a student previously started a timed attempt and returns after the wall-clock deadline with answers still unsubmitted, **When** the quiz runner opens, **Then** answers are locked immediately, the Arabic expiry notice is shown, and auto-submit runs without allowing further edits (same outcome as hitting `00:00` while on screen).

---

### User Story 4 - RTL presentation and guided discovery (Priority: P2)

As Arabic-first teachers and students, I want timer controls and the live badge to feel native (RTL, Tajawal, touch-friendly) and discoverable for product guidance.

**Why this priority**: Required for ship quality on this RTL PWA; does not block core timer logic.

**Independent Test**: On a narrow viewport, configure a timed quiz and take it; confirm RTL layout, Arabic labels, sticky timer readability, and Spekit id `quiz-timer` on the student timer badge.

**Acceptance Scenarios**:

1. **Given** teacher timer controls or the student timer badge, **When** viewed on mobile, **Then** layout is RTL with Tajawal-consistent typography and touch-friendly controls.
2. **Given** the student live timer badge is shown, **When** inspected for product guidance, **Then** it exposes Spekit discovery id `quiz-timer`.

---

### Edge Cases

- Teacher enables timer but leaves duration empty or enters a value outside 1–180 → save blocked with Arabic validation.
- Duration of 1 minute → warning state appears for the last 2 minutes only when remaining ≤ 2:00 (for a 1-minute quiz, warning may apply for most/all of the attempt).
- Student has answered none of the questions when time expires → auto-submit still runs with empty/incomplete answers; score reflects unanswered items per existing grading rules.
- Student switches tabs or backgrounds the browser → remaining time still decreases based on attempt start + duration (wall clock), not pause-on-blur.
- Student returns after the deadline with an unsubmitted timed attempt → lock answers, show Arabic expiry notice, auto-submit immediately (no further editing).
- Network delay at expiry → UI still locks answers; if auto-submit fails transiently, student sees an Arabic error and can retry submit without unlocking editing after expiry. Server still rejects any post-deadline answer changes.
- A tampered client tries to change answers after expiry → server rejects those mutations; only final submit is accepted.
- Quiz becomes untimed or duration changes after a student already started a timed attempt → in-progress attempt keeps the snapshotted duration/start until submit or expiry; only new attempts use the updated quiz settings.
- Soft-deleted / inactive / inaccessible quizzes → existing catalog and attempt rules still apply; timer does not grant access.
- Multi-teacher student (MT-002) → timer settings come from the quiz of the active teacher context; switching teachers does not affect another teacher’s quiz attempts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Teachers MUST be able to enable or disable a per-quiz timer from quiz create and edit screens using an Arabic «تفعيل التوقيت» control.
- **FR-002**: When the timer is enabled, teachers MUST provide a duration in whole minutes from 1 through 180 inclusive via «مدة الاختبار بالدقائق»; empty, zero, negative, non-integer, or > 180 values MUST block save with Arabic feedback.
- **FR-003**: The system MUST persist whether a quiz is timed and its duration as part of that quiz’s teacher-owned settings (other teachers MUST NOT mutate another teacher’s quiz timer).
- **FR-004**: For timed quizzes, the student quiz runner MUST show a sticky floating timer badge with remaining time formatted as `MM:SS`, where minutes MAY be 60 or greater (e.g. `90:00`, `125:05`) — do not switch to an hours-based format.
- **FR-005**: Remaining time MUST be derived from a recorded attempt start time plus the quiz duration so refresh, tab switch, or client clock tricks cannot reset or extend the attempt.
- **FR-006**: When remaining time is ≤ 2 minutes and > 0, the timer badge MUST use a distinct warning visual state (urgent color + slight pulse).
- **FR-007**: At `00:00`, or when the student reopens an unsubmitted timed attempt after the wall-clock deadline, the system MUST disable further answer changes and auto-submit the current answers through the same privileged submit path used for manual submit.
- **FR-008**: On auto-submit start, the system MUST show an Arabic expiry notice (e.g. «انتهى الوقت المحدد للاختبار! جاري تسليم إجاباتك تلقائياً...»).
- **FR-009**: After successful auto-submit, the student MUST land on the results experience for that attempt with score calculated under existing grading rules.
- **FR-010**: QUIZ-001 gatekeeper MUST remain enforced: no correct answers or explanations before successful submit (including during the timed attempt and auto-submit).
- **FR-011**: Untimed quizzes MUST NOT show a countdown timer or auto-submit due to time.
- **FR-012**: Student timer UI MUST be Arabic RTL and expose Spekit id `quiz-timer` on the live timer badge.
- **FR-013**: Quiz create/edit and exam flows MUST continue to respect active-teacher / multi-tenant scoping (MT-002) and existing access rules (Pro/group/active flags, soft-delete catalog rules where applicable).
- **FR-014**: For timed attempts, the server MUST enforce the deadline: after expiry, reject further answer mutations while still accepting the final submit (auto-submit or retry after a failed submit). Client-only locking is not sufficient.
- **FR-015**: When a timed attempt starts, the system MUST snapshot the effective timed settings (timed on/off and duration minutes) for that attempt; later teacher edits to the quiz timer MUST affect only new attempts, not in-progress ones.

### Key Entities

- **Timed quiz settings**: Per-quiz flags for whether timing is enabled and the allowed duration in minutes; owned by the creating teacher.
- **Timed attempt clock**: Per student attempt start moment plus a snapshot of timed settings (duration / timed flag) used to compute remaining time until submit or expiry; later quiz edits do not alter this snapshot.
- **Quiz attempt / submission**: Existing exam attempt that receives answers on manual or automatic submit and produces a score afterward.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Teachers can enable a timer and save a valid duration (1–180) in under 1 minute during normal quiz create/edit.
- **SC-002**: On opening a timed quiz, students see the remaining-time badge within 2 seconds of the runner becoming interactive.
- **SC-003**: After a page refresh mid-attempt, recomputed remaining time is within 2 seconds of the true wall-clock remaining (no full reset to original duration).
- **SC-004**: When time hits zero, answer inputs become non-editable immediately and auto-submit is initiated without requiring an extra student tap.
- **SC-005**: 100% of successful auto-submits reach a results view with a score, and pre-submit screens never reveal correct answers/explanations (QUIZ-001).
- **SC-006**: On a typical mobile viewport (~390px wide), the timer badge remains readable and does not obscure primary question controls.
- **SC-007**: After the deadline, attempted answer changes via non-UI/tampered clients are rejected by the server at least 99% of the time in verification tests (submit-only path remains allowed).

## Assumptions

- Default for new quizzes is untimed (toggle off).
- Duration is whole minutes only; allowed range is **1–180** minutes. Display remains `MM:SS` even when remaining minutes ≥ 60.
- Attempt start is recorded the first time the student successfully opens the timed quiz runner for that quiz under single-attempt rules; subsequent refreshes reuse that start.
- Existing single-submission / no-retake rules still apply after auto-submit (including empty-answer auto-submit).
- Timer does not pause when the app is backgrounded; fairness is wall-clock based.
- Changing timer settings on the quiz affects **new** attempts only; an already-started timed attempt keeps the snapshotted duration/timed flag from when it began (FR-015).
- Feature registry id is `QUIZ-004`; Spekit hook id is `quiz-timer`.
- Constitution constraints remain in force: QUIZ-001 gatekeeper, MT-002 scoping, RTL Tajawal UX, privileged server-side writes for mutations.
- Out of scope for this feature: per-question timers, pause/resume controls, teacher live proctoring dashboards, different durations per student, and extending time after expiry.

## Out of Scope

- Per-question or section timers
- Student-controlled pause / teacher mid-exam time extension UI
- Bulk “make all quizzes timed” tools
- Changing QUIZ-001 to allow multiple graded attempts solely because a quiz is timed
