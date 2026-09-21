# Feature Specification: Quiz Navigation and Safe Submit

**Feature Branch**: `031-quiz-nav-submit`

**Created**: 2026-09-21

**Status**: Draft

**Feature IDs**: `UI-017` (quiz prev/next, centered player, gated submit + confirm)

**Extends**: `UI-016` · `QUIZ-001` · `QUIZ-004`

**Input**: User description: "Update the active quiz interface with clear RTL السابق/التالي under the question card (disabled at first/last), centered headers/badges/timer, keep the كل الأسئلة jump drawer, show or fully activate تسليم الإجابات وإنهاء الاختبار only after every question is answered, and confirm submit with «هل أنت متأكد من تسليم الإجابات؟ لا يمكنك التراجع بعد التأكيد»."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Step through questions with clear السابق / التالي (Priority: P1)

A student taking a quiz sees a prominent Previous and Next pair under the current question. In Arabic RTL, «التالي» always moves to the next question number (forward in the exam) and «السابق» always moves to the previous number. On question 1, Previous is disabled; on the last question, Next is disabled. They can still jump with the existing numbered pager and «كل الأسئلة» overview.

**Why this priority**: Stepping one question at a time is the main exam motion. If Next/Previous feel reversed or easy to miss, the rest of the player polish does not help.

**Independent Test**: Open a 3+ question quiz on a phone. From question 1, Previous is disabled and Next goes to 2. From the last question, Next is disabled and Previous goes back. Pager and «كل الأسئلة» still jump.

**Acceptance Scenarios**:

1. **Given** a student is on an in-progress quiz with more than one question, **When** they look below the question card, **Then** they see a clear pair of controls labeled «السابق» and «التالي» (easy to tap, not a tiny text-only pair).
2. **Given** they are on question 1, **When** the pair is shown, **Then** «السابق» is disabled and «التالي» is enabled.
3. **Given** they tap «التالي», **When** the card updates, **Then** they see the next question number (e.g. 1 → 2).
4. **Given** they tap «السابق», **When** the card updates, **Then** they see the previous question number (e.g. 2 → 1).
5. **Given** they are on the last question, **When** the pair is shown, **Then** «التالي» is disabled and «السابق» is enabled.
6. **Given** RTL layout, **When** they scan the pair, **Then** the labels and motion match Arabic exam order (التالي = forward, السابق = back); icons must not contradict those labels.
7. **Given** they use «كل الأسئلة» or the number pager, **When** they jump, **Then** Previous/Next enable/disable to match the new position.

---

### User Story 2 - Submit only when complete, then confirm (Priority: P1)

The primary «تسليم الإجابات وإنهاء الاختبار» action is not fully usable until every question has an answer. When it is usable and the student taps it, they first see an Arabic confirmation they cannot undo after confirming. Cancel leaves them in the quiz with answers unchanged. Successful confirm still grades only after submit, and solutions stay hidden until then.

**Why this priority**: Accidental submit is costly. Gating plus a last confirmation protects the student without changing scoring rules.

**Independent Test**: Leave one question blank — submit is not fully active. Answer all — tap submit — cancel stays; confirm grades. Auto-end on time expiry still does not wait for this new dialog.

**Acceptance Scenarios**:

1. **Given** at least one question has no answer, **When** the student views the player, **Then** «تسليم الإجابات وإنهاء الاختبار» is not fully active (hidden or clearly disabled) and does not start grading.
2. **Given** submit is inactive, **When** they look for guidance, **Then** they can tell they still need to answer remaining questions (short Arabic hint is enough).
3. **Given** every question has a selected answer, **When** they view the player, **Then** the submit action is fully active and easy to tap.
4. **Given** they tap the active submit action, **When** the confirmation appears, **Then** they see Arabic equivalent to: «هل أنت متأكد من تسليم الإجابات؟ لا يمكنك التراجع بعد التأكيد.» with distinct confirm and cancel.
5. **Given** they cancel the dialog, **When** it closes, **Then** they remain on the same question with the same answers; nothing is graded.
6. **Given** they confirm, **When** submit succeeds, **Then** they reach the existing post-submit review/score; correct answers were not visible before that success.
7. **Given** a timed quiz reaches `00:00`, **When** auto-submit runs, **Then** it does **not** wait for this new confirmation (existing expiry notice and lock still apply).

---

### User Story 3 - Centered, balanced player on the phone (Priority: P2)

On a typical phone width, the question number badge (e.g. «السؤال 2»), the question content, and the timer/header sit in a clean centered, symmetrical layout rather than looking left- or right-heavy.

**Why this priority**: Visual balance makes the player feel finished; it does not change exam rules.

**Independent Test**: Open a quiz at ~390px width. Badge, stem, and timer/header read as centered/balanced; Previous/Next and submit from US1–US2 still work.

**Acceptance Scenarios**:

1. **Given** the player on a phone-width screen, **When** a question is shown, **Then** the «السؤال N» badge and primary question content are centered (or evenly inset) in the content column, not stuck to one edge.
2. **Given** a timed quiz, **When** they view the top bar, **Then** the remaining-time readout and exit control feel balanced/symmetrical rather than crowding one side.
3. **Given** dark or light appearance, **When** they view the player, **Then** the centered layout remains readable.
4. **Given** a long stem or image, **When** they scroll, **Then** sticky chrome (header / submit area) does not cover the last choice or the Previous/Next pair.

---

### User Story 4 - Keep jumping via كل الأسئلة (Priority: P2)

Students who want to skip around still open the all-questions overview from a clear control (copy «كل الأسئلة») and tap a number to jump. This does not replace Previous/Next.

**Why this priority**: Jumping is already valuable; this story only preserves it while the new step controls and submit gate ship.

**Independent Test**: From mid-quiz, open «كل الأسئلة», tap a number, land on that question; dismiss the overview; Previous/Next still match the new index.

**Acceptance Scenarios**:

1. **Given** an in-progress quiz with multiple questions, **When** they activate «كل الأسئلة», **Then** an overview of all question numbers appears and can be dismissed.
2. **Given** that overview, **When** they tap a number, **Then** that question becomes current and the overview closes.
3. **Given** the overview is available, **When** Previous/Next and the submit gate are present, **Then** the overview remains reachable (not removed).

---

### Edge Cases

- Single-question quiz: Previous and Next both disabled (or Next disabled and Previous disabled); submit becomes active after that one answer; confirmation still required.
- Empty quiz: no fake Next/Previous/submit; existing empty message remains.
- Offline submit path: confirmation still appears before saving for later sync; cancel does not enqueue.
- Time expiry during the confirmation dialog: expiry auto-submit wins; the dialog does not block lock/submit.
- Changing an answer after all were filled: submit stays active; if they clear a choice (if clearing exists) it becomes inactive again. If choices cannot be cleared, only switching answers applies.
- Post-submit review: submit and the new confirm dialog are gone; Previous/Next (or pager) may still move between questions for review.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The in-progress player MUST show a clear «السابق» and «التالي» pair under the question card (or equally reachable near the bottom without hiding choices).
- **FR-002**: «التالي» MUST move to the next question number; «السابق» MUST move to the previous question number.
- **FR-003**: «السابق» MUST be disabled on the first question; «التالي» MUST be disabled on the last question.
- **FR-004**: RTL presentation MUST keep those labels truthful (no swapped meaning via icons).
- **FR-005**: Students MUST still be able to open «كل الأسئلة» and jump to any question.
- **FR-006**: «تسليم الإجابات وإنهاء الاختبار» MUST NOT start grading until every question has an answer.
- **FR-007**: Until every question is answered, that submit action MUST be not fully active (disabled and/or not shown as a primary enabled button), with a short Arabic hint that answers remain.
- **FR-008**: Tapping the active submit action MUST show a confirmation: «هل أنت متأكد من تسليم الإجابات؟ لا يمكنك التراجع بعد التأكيد.» with confirm and cancel.
- **FR-009**: Cancel on that dialog MUST leave the attempt unsubmitted; confirm MUST run the existing submit path (including offline save-for-sync copy when disconnected).
- **FR-010**: Timed auto-submit on expiry MUST NOT require this confirmation.
- **FR-011**: Until successful submit, correct answers and explanations MUST stay hidden.
- **FR-012**: On a typical phone width, question badge, question content, and header/timer MUST appear centered and visually balanced.
- **FR-013**: Primary tap targets for Previous, Next, كل الأسئلة, and submit (when active) MUST remain at least 44px tall.
- **FR-014**: Teacher quiz builder and the student results list are out of scope.

### Key Entities

- **Question position**: Current index in 1…N; drives Previous/Next enabled state.
- **Answer completeness**: Whether every question has a selected answer; drives submit availability.
- **Submit confirmation**: One-time intent check before grading; not stored as its own record.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a 10-question quiz, 9 of 10 students can move from question 1 to 10 using only «التالي», and back using only «السابق», without using the pager.
- **SC-002**: 100% of attempts with a blank question cannot be graded via the primary submit button (button not fully active; no accidental tap-through).
- **SC-003**: 100% of manual submits from a complete attempt show the confirmation; cancel rate is possible (no auto-confirm).
- **SC-004**: On a ~390px-wide phone, the question badge sits visually centered in the card header on first paint.
- **SC-005**: Timed expiry still ends the attempt without the student tapping the new confirmation.
- **SC-006**: Zero pre-submit leaks of correct answers in this player.

## Assumptions

- Audience is signed-in students on the existing quiz-taking screen (`UI-016` player).
- Copy is Arabic; «كل الأسئلة» spelling is the product form (not «كل الأسئله»).
- Submit stays **visible but disabled** until complete (so students know how the exam ends), rather than disappearing entirely.
- Previous/Next sit **below the question card**; the sticky bottom bar keeps progress + gated submit + كل الأسئلة.
- Confirmation is for **manual** submit only; QUIZ-004 auto-submit is unchanged.
- One question on screen at a time remains; no return to a long scrolling list.
- No new quiz types, attempt-limit changes, or database/policy changes.

## Out of Scope

- Teacher quiz create/edit and timer settings.
- Redesign of `/results` or WhatsApp share.
- Changing when solutions unlock, or who may take which quiz.
- Replacing the student bottom tab bar on other pages.
