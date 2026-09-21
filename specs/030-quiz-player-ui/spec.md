# Feature Specification: Mobile Quiz Player Redesign

**Feature Branch**: `030-quiz-player-ui`

**Created**: 2026-09-20

**Status**: Draft

**Feature IDs**: `UI-016` (immersive mobile quiz player)

**Extends**: `QUIZ-001` · `QUIZ-004` · `UI-001` · `UI-014` · `OFFLINE-001`

**Input**: User description: "Redesign the active test and quiz-taking page (`/quiz/...`) to look and feel like a modern professional mobile learning app (Udemy-style course player). Sticky header with exit confirmation and countdown; clean question card with numbered badge and lettered A/B/C/D choice rows in brand green; collapse the question grid into a bottom sheet or horizontal pager; sticky bottom bar with progress plus submit CTA; 44px touch targets and question-switch animations."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Stay focused with a clean header and countdown (Priority: P1)

A student opens an in-progress quiz on their phone. The top of the screen is a slim sticky bar: a clear back/exit control on one side and, when the quiz is timed, a prominent remaining-time readout such as «07:46 الوقت المتبقي». Decorative brand/title cards and large progress rings no longer sit above the question. If time is running low, the timer uses a soft warning accent. Tapping exit asks in Arabic whether they really want to leave, and explains that progress will be saved.

**Why this priority**: The first impression of the exam is currently cluttered. A calm header plus a trustworthy timer is the foundation of a professional player; without it, the rest of the redesign still feels like a busy web page.

**Independent Test**: Open a timed quiz and an untimed quiz on a phone-width screen. Confirm the sticky header, exit confirm copy, timer presence/absence, low-time warning, and that the question area is immediately visible without scrolling past extra brand cards.

**Acceptance Scenarios**:

1. **Given** a signed-in student opens a quiz they are allowed to take, **When** the player loads, **Then** a slim sticky header stays visible while they scroll the question, and the current question is the primary visual focus (no large title/progress/brand cards competing above it).
2. **Given** that header, **When** they tap the back/exit control, **Then** a confirmation dialog appears in Arabic equivalent to: «هل أنت متأكد أنك تريد الخروج؟ سيتم حفظ تقدّمك.» with distinct confirm and cancel actions.
3. **Given** they confirm exit, **When** they leave, **Then** they return to the previous student destination (typically quizzes or dashboard), and answers already chosen are still there if they reopen the same in-progress attempt.
4. **Given** they cancel the dialog, **When** it closes, **Then** they remain on the same question with selections unchanged.
5. **Given** a timed quiz with remaining time, **When** they view the header, **Then** remaining time is shown as `MM:SS` with the Arabic label «الوقت المتبقي» (minutes may exceed 59 for long exams), matching existing countdown fairness rules.
6. **Given** remaining time is 2 minutes or less and still greater than zero, **When** they view the timer, **Then** it uses a soft warning accent so urgency is obvious without covering the question.
7. **Given** an untimed quiz, **When** they view the header, **Then** no countdown is shown; the exit control remains.
8. **Given** time reaches `00:00`, **When** expiry is detected, **Then** existing auto-submit and lock behavior still runs (Arabic expiry notice, answers locked, attempt submitted); the new header does not let them keep editing after expiry.

---

### User Story 2 - Answer on an immersive question card (Priority: P1)

The student sees one question at a time in a full-width, clean card with generous padding and a light shadow. A compact badge such as «السؤال 2» sits at the top of the card. Multiple-choice options appear as large rows, each with a circular letter badge (A, B, C, D, …). Tapping a row selects it; the selected row and its letter badge highlight smoothly in Al-Moayed primary dark green (`#065f46`). Correct answers and explanations stay hidden until the attempt is submitted.

**Why this priority**: This is the actual exam work. If choices are hard to tap or the card feels cramped, the header redesign does not help.

**Independent Test**: Open a multi-question multiple-choice quiz, select and change answers, confirm letter badges and selected-state green, confirm no solution leak before submit, and confirm images/math in the stem still display.

**Acceptance Scenarios**:

1. **Given** the player shows an in-progress question, **When** the student looks at the main area, **Then** they see a single full-width question card (not a cramped stacked list of every question) with generous inner spacing and a subtle raised/shadowed surface on a calm background.
2. **Given** that card, **When** it loads, **Then** a clean badge shows the current number in Arabic, e.g. «السؤال 2», without extra decorative chips crowding the stem (category/tag chips remain for post-submit review only, not during answering).
3. **Given** multiple-choice options, **When** they are shown, **Then** each option is a large tappable row at least 44px tall, with a distinct circular letter badge (A, B, C, D, …) on the start side in RTL.
4. **Given** an unselected option, **When** the student taps its row or badge, **Then** that option becomes selected, previous selection on the same question clears, and the selected row/badge uses the primary brand dark green highlight with a short, smooth transition.
5. **Given** they change their mind, **When** they tap another option, **Then** the highlight moves to the new choice without a page reload.
6. **Given** the attempt is not yet submitted, **When** they view any question, **Then** they still cannot see which choice is correct, nor any explanation (existing gatekeeper promise).
7. **Given** a question with a stem image or formatted math, **When** the card renders, **Then** that content remains readable inside the card; the new layout does not crop or hide it.

---

### User Story 3 - Jump questions and submit from a compact bottom chrome (Priority: P1)

The old full question-number grid that occupied a large panel is gone from the main view. Students jump between questions with a compact horizontal numbered pager (scrollable when there are many items). For longer quizzes they can also open a sleek bottom sheet of all numbers. A persistent sticky bar shows progress (answered count or percent) next to a prominent primary button «تسليم الإجابات وإنهاء الاختبار». The bar stays above the student tab bar on phones.

**Why this priority**: Navigation and submit are how an exam is finished. Collapsing the grid recovers vertical space for the question without removing jump-to-question.

**Independent Test**: Take a 10-question quiz on a phone: jump via pager, open the all-questions sheet if present, watch progress update as answers are chosen, submit with the sticky CTA, and confirm unanswered-submit is still blocked with the existing Arabic message.

**Acceptance Scenarios**:

1. **Given** an in-progress quiz with multiple questions, **When** the player is shown on a phone, **Then** the large always-visible number grid / progress-ring side panel is not occupying the main column; jumping uses a compact horizontal pager of question numbers.
2. **Given** that pager, **When** the student taps number 7, **Then** question 7 becomes the visible card; the pager marks the current number distinctly and shows which numbers already have an answer.
3. **Given** more numbers than fit on screen (for example 10+), **When** they swipe the pager, **Then** they can reach every question without leaving the player.
4. **Given** they want an overview, **When** they open the compact all-questions control, **Then** a bottom sheet lists every question number for one-tap jump and can be dismissed; it does not permanently cover the question card.
5. **Given** they are answering, **When** they look at the sticky bottom bar, **Then** they see progress such as answered-count-of-total or percent complete, plus the primary CTA «تسليم الإجابات وإنهاء الاختبار».
6. **Given** they tap submit with unanswered questions, **When** validation runs, **Then** submit is blocked and they see the existing Arabic instruction to answer every question first; they stay in the player.
7. **Given** every question is answered and they tap submit, **When** the attempt succeeds, **Then** they reach the existing post-submit review/score experience; solutions remain hidden until that successful submit.
8. **Given** a phone with the student tab bar, **When** the sticky actions show, **Then** the submit bar sits above those tabs and remains tappable (not hidden behind them).
9. **Given** previous/next controls, **When** they use them (if still present as a compact complement to the pager), **Then** they move one question at a time and disable at the first/last question.

---

### User Story 4 - Comfortable mobile motion and touch (Priority: P2)

Switching questions feels like a polished learning app: a short fade or slight slide between cards. Every primary control (exit, choices, pager numbers, sheet rows, submit) is easy to tap with a thumb (at least 44px tall). Students who prefer reduced motion get an instant switch without animation. Dark/light appearance already chosen on the device continues to apply to the player chrome.

**Why this priority**: Motion and tap size make the player feel native, but they are polish on top of a usable P1 layout.

**Independent Test**: Jump between questions on a phone, measure that choice rows and bar buttons are easy to tap, enable reduced-motion (or equivalent) and confirm no distracting animation, toggle appearance if available and confirm the player still reads clearly.

**Acceptance Scenarios**:

1. **Given** the student jumps from question 2 to question 3 via the pager, **When** the card changes, **Then** they see a short opacity fade and/or slight slide; the new stem and options are fully readable when the motion ends.
2. **Given** the device requests reduced motion, **When** they jump questions, **Then** the next question appears immediately with no slide/fade.
3. **Given** any primary tap target (exit, choice row, pager chip, sheet row, submit), **When** measured, **Then** its tappable height is at least 44px.
4. **Given** the student already chose dark or light appearance for the app, **When** they take a quiz, **Then** header, card, pager, and bottom bar follow that appearance rather than a hard mismatched white/black island.
5. **Given** the player is used in RTL Arabic, **When** they scan the screen, **Then** letters, numbers, timer, and actions align start-side-first; motion does not reverse reading order into LTR.

---

### Edge Cases

- Empty quiz (no questions): keep the existing calm empty message and a way back to the dashboard; do not show a fake pager or enabled submit.
- Offline in-progress: header, card, pager, and save-on-exit still work; submit continues to follow existing offline “save for later sync” behavior and copy.
- Time expiry during navigation: choices lock; pager may still be used to look at questions but not to change answers; auto-submit proceeds.
- Accidental system Back / swipe-back while in progress: same Arabic save-and-exit confirmation as the header exit control (cancel stays in the quiz).
- Very long quizzes (30+ questions): pager remains horizontally scrollable; the all-questions sheet is the overview, not a giant grid on the main canvas.
- Post-submit review on the same page: submit bar hides; explanations and correctness may appear on the card as they do today; the pager can still jump; this feature does not redesign the separate results list.
- Pending-sync after offline submit: existing “saved on this device” message remains; player does not pretend the server has graded yet.
- Image-heavy or long stems: the card scrolls under the sticky header and above the sticky bar so neither chrome covers the stem or the last choice.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The in-progress quiz-taking screen MUST present a slim sticky header with a back/exit control and, for timed quizzes only, a remaining-time display labeled «الوقت المتبقي» in `MM:SS`.
- **FR-002**: Exit (header or in-progress system Back) MUST show an Arabic confirmation that progress will be saved, with confirm leaving and cancel staying.
- **FR-003**: Confirming exit MUST leave the quiz without submitting for grading, while preserving already-chosen answers for the same in-progress attempt.
- **FR-004**: Timed quizzes MUST keep existing countdown fairness: remaining time does not reset on refresh; warning accent at 2 minutes or less; expiry still auto-submits and locks answers.
- **FR-005**: Untimed quizzes MUST omit the countdown entirely.
- **FR-006**: The main canvas MUST focus on a single current-question card; large always-on title/progress/brand panels MUST not sit above the question on phone layouts.
- **FR-007**: The question card MUST show a compact «السؤال N» badge, the stem, and large lettered choice rows (A, B, C, D, …).
- **FR-008**: Selected choice rows and their letter badges MUST highlight in Al-Moayed primary dark green (`#065f46`) with a smooth visual change; unselected rows stay visually quieter.
- **FR-009**: Until a successful submit, the player MUST NOT reveal correct answers or explanations.
- **FR-010**: Students MUST be able to jump to any question via a compact horizontal numbered pager that indicates the current item and which items already have answers.
- **FR-011**: Students MUST be able to open a dismissible all-questions bottom sheet for overview jump, instead of a permanent full grid on the main canvas.
- **FR-012**: A sticky bottom bar MUST show progress (answered count of total and/or percent) and the primary CTA «تسليم الإجابات وإنهاء الاختبار».
- **FR-013**: Submit MUST remain blocked until every question has an answer, with the existing Arabic validation message.
- **FR-014**: Successful submit MUST still grade, then show the existing on-page review/score path; gatekeeper timing is unchanged.
- **FR-015**: Primary tap targets (exit, choices, pager items, sheet rows, submit) MUST be at least 44px tall.
- **FR-016**: Question changes via the pager MUST use a short fade and/or slight slide, skipped when the student prefers reduced motion.
- **FR-017**: The player MUST remain RTL Arabic, readable in the student’s current light/dark appearance, and usable with the existing student tab bar (submit bar not obscured).
- **FR-018**: Empty quizzes, offline draft/sync, and time-lock states MUST keep their existing student-facing outcomes; only the surrounding chrome is restyled.
- **FR-019**: Teacher quiz create/edit screens and the student results list are out of scope.

### Key Entities

- **In-progress attempt**: The student’s unfinished quiz session — chosen answers, current question, and remaining time if timed. Exit saves this; submit grades it.
- **Question card**: The one question currently on screen — number badge, stem (text/image/math), and choice rows.
- **Choice**: A lettered option (A, B, C, …) that is either idle or selected; correctness is not a visible state before submit.
- **Question pager**: Ordered numbers 1…N used to jump; each number is current, answered, or unanswered.
- **Timer readout**: Remaining exam time for timed attempts only, with a low-time warning state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a typical phone (~390px wide), a student can see the current question stem without first scrolling past extra title/progress/brand cards, on at least 9 of 10 first opens.
- **SC-002**: From opening a timed quiz, remaining time and the current question number are identifiable within 2 seconds.
- **SC-003**: Selecting a choice and jumping to another question via the pager each complete in a single tap, with no extra confirmation.
- **SC-004**: 100% of primary controls on the player (exit, each choice row, pager numbers, submit) meet a minimum 44px tap height.
- **SC-005**: In usability checks, at least 9 of 10 students can exit-and-return and still find their previous answers, and can submit a fully answered 10-question quiz without hunting for the submit button.
- **SC-006**: Zero pre-submit leaks of correct answers or explanations in the redesigned player (same bar as today’s exam promise).
- **SC-007**: Timed expiry still ends the attempt without student action; the new chrome does not add a way to keep answering after `00:00`.

## Assumptions

- Audience is signed-in students on the existing quiz-taking route; teachers/admins are unchanged.
- Copy is Arabic throughout; the English phrases in the request are intent, not on-screen text.
- Letter badges stay Latin A, B, C, D (common exam convention in the product today).
- Low-time warning remains the existing 2-minute threshold.
- Saving on exit reuses the current in-progress draft behavior; this feature does not invent a new cloud “resume later” product.
- One question on screen at a time remains the model; this is not a return to a long scrolling list of every question.
- Horizontal pager is the always-visible jump control; the bottom sheet is the overview for scanning all numbers.
- Previous/next may remain as compact extras; they are not required if the pager alone is clear.
- Post-submit review on this page keeps today’s scoring, share, and explanation behavior; visual tokens may match the new player, but the student results list is a different feature.
- Reduced-motion follows the device/accessibility preference already used elsewhere in the app.
- No new question types, no change to attempt limits, and no database/policy change to grading or teacher scoping.

## Out of Scope

- Teacher quiz builder, timer settings, or attempt-limit settings.
- Redesign of `/results` cards or WhatsApp share content.
- New question formats (essay, matching, etc.).
- Changing who may take which quiz, or when solutions unlock.
- Replacing the student bottom tab bar on other pages.
