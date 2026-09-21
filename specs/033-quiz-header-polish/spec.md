# Feature Specification: Quiz Header Polish

**Feature Branch**: `033-quiz-header-polish`

**Created**: 2026-09-21

**Status**: Draft

**Feature ID**: `UI-018` (compact header submit, right-aligned stepper, timer countdown bar)

**Extends**: `UI-017` · `UI-016` · `QUIZ-004` · `QUIZ-001`

**Input**: User description: "Apply final UI and logic refinements to the active quiz interface: (1) keep the pagination stepper strictly on the right of the card header; place a compact submit control («تسليم» or icon) on the left of that row, always visible but disabled until every question is answered; (2) add a thin decreasing linear countdown bar with the remaining-time readout; (3) polish the «كل الأسئلة» header control so it looks modern and balanced with the timer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compact submit beside a right-aligned stepper (Priority: P1)

A student answering on a phone sees the question-number stepper packed to the **visual right** of the question card header. On the **visual left** of that same header row sits a short submit control (label «تسليم», with a small check or flag mark). The button is always there—not only on the last question—but it looks faded and refuses taps until every question has an answer. As soon as the last blank is filled, it becomes fully tappable. Tapping it still uses the existing “are you sure / you cannot undo” confirmation before grading.

**Why this priority**: Crowded long submit copy and a stepper that drifts off the right edge make the exam chrome feel unfinished. Gating submit until 100% answered is the safety rule; compact placement is what makes the row usable.

**Independent Test**: On a ~390px-wide in-progress quiz, the stepper sits on the visual right of the card header and submit on the visual left of that row. With one question blank, submit is faded and a tap does not grade. After answering all, submit enables; confirm/cancel still work; time expiry still auto-ends without this button.

**Acceptance Scenarios**:

1. **Given** an in-progress quiz with more than one question, **When** the student looks at the question card header, **Then** the number stepper is aligned to the **visual right** of that header (not centered, not stretched across the full width).
2. **Given** that same header row, **When** they look to the **visual left** of the stepper, **Then** they see a compact submit control labeled «تسليم» (short text, optionally with a small check or flag mark)—not the long sentence «تسليم الإجابات وإنهاء الاختبار».
3. **Given** at least one question has no selected answer, **When** they view that compact control, **Then** it is visibly faded and not tappable (disabled), and tapping it does not open confirm and does not grade.
4. **Given** they answer the last remaining question, **When** the header updates, **Then** the compact submit becomes fully enabled without leaving the player.
5. **Given** the quiz is complete, **When** they tap enabled «تسليم», **Then** the existing Arabic confirmation still appears (they cannot undo after confirm); cancel stays in the quiz; confirm grades as today.
6. **Given** they are on question 1 of a long quiz (not the last item), **When** some questions are still unanswered, **Then** the compact submit is still visible in the header (not hidden until the last question) and remains disabled.
7. **Given** a timed quiz reaches `00:00`, **When** auto-submit runs, **Then** it does not wait for this compact button or its confirmation (existing expiry behavior).
8. **Given** an empty quiz, **When** the player shows the empty message, **Then** compact submit does not offer a successful grade.

---

### User Story 2 - See time running out on a countdown bar (Priority: P1)

On a timed quiz, the student still sees remaining time such as `03:13` with «الوقت المتبقي». Directly under or immediately beside that readout, a thin line shows how much of the allowed time is left: full at the start, shrinking smoothly toward empty as the clock runs down. When time is low, the bar shares the same sense of urgency as the existing timer warning. Untimed quizzes have no countdown bar.

**Why this priority**: Minutes and seconds alone are easy to glance past; a shrinking bar makes remaining time felt without changing fairness rules.

**Independent Test**: Open a timed quiz near the start (bar nearly full) and again with little time left (bar nearly empty, warning accent if already used for the digits). Untimed quiz: no bar.

**Acceptance Scenarios**:

1. **Given** a timed in-progress quiz, **When** the student views the top timer area, **Then** they still see remaining time as `MM:SS` with «الوقت المتبقي».
2. **Given** that timer area, **When** it is shown, **Then** a thin linear bar represents remaining time as a fraction of the **full duration for this attempt** (full at start, empty at `00:00`).
3. **Given** time is passing, **When** they watch the bar, **Then** it decreases in proportion to remaining time (not a fake loop, not tied to how many questions are answered).
4. **Given** remaining time is in the existing low-time warning window, **When** they view the bar, **Then** it uses a warning accent consistent with the timer digits so urgency is obvious.
5. **Given** an untimed quiz, **When** they view the header, **Then** no countdown bar is shown.
6. **Given** the attempt is submitted or the expiry notice is showing, **When** they view the top bar, **Then** the live countdown bar is not still counting as if they could keep answering.

---

### User Story 3 - A cleaner «كل الأسئلة» control (Priority: P2)

The student still opens the all-questions overview from «كل الأسئلة» in the top header. The control looks calmer and more finished: similar visual weight to the timer cluster, easy to tap, not a heavy or leftover-looking chip. Behavior is unchanged: tap opens the number grid, tap a number jumps, dismiss returns to the question.

**Why this priority**: The header now has timer, bar, and compact submit; a rough «كل الأسئلة» control would still make the chrome feel uneven. This is polish, not a new exam rule.

**Independent Test**: Open a timed and an untimed quiz. «كل الأسئلة» sits comfortably with the timer (or alone if untimed), opens the overview, jump still works.

**Acceptance Scenarios**:

1. **Given** an in-progress quiz with multiple questions, **When** they view the top header, **Then** «كل الأسئلة» is clearly tappable and visually balanced with the timer cluster (not oversized, not a faint text-only leftover).
2. **Given** they activate «كل الأسئلة», **When** the overview opens, **Then** they can jump to a number and dismiss as today.
3. **Given** a timed quiz, **When** timer, countdown bar, and «كل الأسئلة» share the header, **Then** none of them overlap or hide the others on a typical phone width.
4. **Given** an untimed quiz, **When** there is no timer, **Then** «كل الأسئلة» remains easy to find and still opens the overview.

---

### Edge Cases

- What if only one question? → Stepper can show a single current number on the right; compact submit enables as soon as that one question is answered.
- What if they un-answer? (no clear-choice today) → If the product later allows clearing a choice, submit must disable again; today there is no clear control, so enable stays once complete unless answers are reset by a new attempt.
- What if they rotate or use a wider phone? → Stepper stays visually right in the card header; submit stays visually left of it; the row must not wrap into an unreadable stack on a typical phone; on very narrow widths the compact label «تسليم» must remain fully visible.
- What if time expires with blanks? → Existing auto-submit still runs; compact submit is irrelevant once expiry lock starts.
- What if the quiz is untimed? → No timer digits, no countdown bar; header still has exit, «كل الأسئلة», and the card-header stepper + compact submit.
- What if they open «كل الأسئلة» while submit is disabled? → Overview still works; submit stays disabled until all answered.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The question-number stepper in the card header MUST sit on the **visual right** of that header row.
- **FR-002**: A compact submit control MUST sit on the **visual left** of the same card-header row as the stepper (beside it, not in a separate full-width bar).
- **FR-003**: Compact submit MUST use short Arabic copy «تسليم» (optional small check or flag mark). It MUST NOT use the long sentence «تسليم الإجابات وإنهاء الاختبار» in this header slot.
- **FR-004**: Compact submit MUST be visible for the whole taking session (not only on the last question).
- **FR-005**: Compact submit MUST stay disabled—visibly faded and not tappable—until every question has a selected answer. A tap MUST NOT confirm or grade while disabled.
- **FR-006**: Compact submit MUST become enabled as soon as every question has an answer, without a page reload.
- **FR-007**: Enabled compact submit MUST still open the existing irreversible-confirm copy before grading; cancel MUST not grade; timed auto-submit MUST skip this confirm.
- **FR-008**: For a timed attempt, the header MUST show remaining `MM:SS` and «الوقت المتبقي» plus a thin linear bar whose filled length equals remaining time ÷ this attempt’s full duration.
- **FR-009**: The countdown bar MUST shrink as time elapses and MUST use the same low-time warning treatment as the digits when remaining time is in the existing warning window.
- **FR-010**: Untimed quizzes MUST NOT show a countdown bar.
- **FR-011**: The «كل الأسئلة» header control MUST remain available, tappable (at least 44px), and visually balanced with the timer cluster; jump-and-dismiss behavior MUST stay as today.
- **FR-012**: Exit confirm, gatekeeper (no solutions until submit), and RTL Arabic layout MUST remain intact.

### Key Entities

- **Card-header action row**: The strip at the top of the question card holding compact «تسليم» (visual left) and the number stepper (visual right).
- **Attempt completeness**: Whether every question in the current attempt has a selected answer; drives enable/disable of compact submit.
- **Time remaining fraction**: Remaining seconds divided by the attempt’s full duration; drives the thin countdown bar (timed attempts only).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In **100%** of phone-width checks (~390px), the stepper is on the visual right of the card header and compact «تسليم» is on the visual left of that row without overflowing or covering choice rows.
- **SC-002**: In **100%** of incomplete taking states tested, compact submit is disabled and a tap does not grade; in **100%** of complete taking states, it enables within **1 second** of the last answer.
- **SC-003**: At least **90%** of students in a short usability pass understand «تسليم» is the finish action without needing the old long label.
- **SC-004**: On timed attempts, the countdown bar is within **5 percentage points** of true remaining-time fraction at sampled moments (start, mid, ≤2 minutes left, expiry).
- **SC-005**: Students can open «كل الأسئلة» and jump in **under 3 seconds** of looking at the header; the control is not mistaken for the timer.
- **SC-006**: Existing confirm-on-manual-submit and auto-submit-on-expiry continue to pass in **100%** of regression checks (no solutions before a successful submit).

## Assumptions

- **Visual left/right** means physical left and right on screen, as specified (RTL does not swap those words in this spec).
- **Confirm dialog** from the current player stays; this feature only compactifies and relocates the taking CTA and its enable rule.
- **«تسليم»** is the compact label; the confirm dialog may keep longer explanatory copy.
- **Submit is always shown while taking**, including mid-quiz, and only *enables* at 100% answered (not hidden until last question).
- **Countdown bar uses this attempt’s duration** (the same duration the digits already use), including leftover time after leave/return.
- **No teacher setting** for these chrome tweaks; they apply to all student taking views.
- **Review-after-submit** does not need the compact taking submit or a live shrinking bar.
- **Touch size**: compact does not mean below a comfortable tap height (~44px).

## Dependencies

- **UI-017**: Completeness gating, confirm copy, stepper in the card header, «كل الأسئلة» overview.
- **UI-016**: Sticky player header, exit confirm, immersive card.
- **QUIZ-004**: Remaining time, warning window, auto-submit at zero.
- **QUIZ-001**: No solutions until that attempt is submitted.

## Out of Scope

- Changing scoring, shuffle, attempt limits, or offline sync rules.
- Redesigning the jump-sheet grid itself (only the header button that opens it).
- A new full-width sticky submit bar under the card.
- Showing the countdown bar on untimed quizzes as fake progress of questions answered.
