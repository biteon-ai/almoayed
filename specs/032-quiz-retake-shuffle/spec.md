# Feature Specification: Quiz Retake Reset & Shuffle

**Feature Branch**: `032-quiz-retake-shuffle`

**Created**: 2026-09-21

**Status**: Draft

**Feature ID**: `QUIZ-006` (extends `QUIZ-001` · `QUIZ-004` · `QUIZ-005` · `UI-016` · `UI-017`)

**Input**: User description: "Please implement the state reset and randomization logic for when a student retakes a quiz (e.g., clicking «إعادة المحاولة» from the results page): (1) completely wipe stored answers, timers, and progress so the new attempt starts blank; (2) randomize question order and shuffle multiple-choice options (A, B, C, D) on every new attempt so students cannot rely on memorized choice positions."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start a completely blank new attempt (Priority: P1)

A student finishes a quiz, sees their result, and taps «إعادة المحاولة» (or the equivalent retake action from results or a quiz card). The next screen is a brand-new attempt: no previous answers are pre-selected, progress shows nothing answered, they are on the first question, and if the quiz is timed the clock starts from the full allowed duration—not leftover time from last time. It feels like opening the quiz for the first time.

**Why this priority**: If old answers or a leftover timer carry over, retake is not a real second try. This is the integrity baseline; shuffle only helps if the slate is actually clean.

**Independent Test**: Complete a multi-question timed quiz with mixed answers, open results, tap retake, and confirm every question is unanswered, progress is empty, and the timer (when enabled) is a full new countdown.

**Acceptance Scenarios**:

1. **Given** a student has a completed attempt and retakes are still allowed, **When** they tap «إعادة المحاولة» (or equivalent start-new-attempt action), **Then** they enter a new in-progress attempt with **no** answers selected on any question.
2. **Given** that new attempt, **When** they look at progress (answered count, percent, jump overview, previous/next), **Then** it reflects a blank start (zero answered, first question current).
3. **Given** a timed quiz, **When** the new attempt begins, **Then** remaining time equals the full duration configured for a new attempt; leftover or expired time from the previous attempt is not reused.
4. **Given** they had selected specific choices on the previous attempt, **When** they open each question on the new attempt, **Then** none of those previous choices appear selected.
5. **Given** they abandon the new attempt without submitting and later resume **this same in-progress attempt**, **When** they return, **Then** only answers chosen during **this** attempt are present—never answers from a prior completed attempt.
6. **Given** attempts are exhausted (QUIZ-005), **When** they would otherwise retake, **Then** no new attempt is created, no wipe of historical results occurs, and they stay in review-only.
7. **Given** the new attempt has not been submitted, **When** they view any question, **Then** correct answers and explanations remain hidden (existing gatekeeper promise).

---

### User Story 2 - Questions and choices appear in a new order (Priority: P1)

On each new attempt, the same question bank is presented in a different sequence, and each multiple-choice question shows its options in a different visual order. Letter badges remain sequential A, B, C, D (and onward if more options) in the order the student sees them. The student cannot pass by remembering “the answer was C” or “question 3 was the graph one.” Scoring still marks the option they actually chose, not the letter position.

**Why this priority**: Resetting answers without reshuffling still lets students memorize positions. This is the learning-integrity goal of the feature.

**Independent Test**: Take a quiz with at least four multiple-choice questions that each have four options. Note question sequence and option text under A/B/C/D. Submit, retake, and confirm both question sequence and per-question option order differ from the previous attempt, while grading of a known-correct choice still scores correctly.

**Acceptance Scenarios**:

1. **Given** a quiz with more than one question, **When** a student starts a **new** attempt, **Then** the questions appear in an order generated for that attempt (not guaranteed to match the teacher’s authored list order).
2. **Given** a multiple-choice question with two or more options, **When** that question is shown on a new attempt, **Then** the option texts appear in an order generated for that attempt, not necessarily the authored order.
3. **Given** displayed letter badges (A, B, C, D, …), **When** options are shuffled, **Then** letters follow **display order** (first shown option is A, second is B, and so on in RTL reading order)—letters are not glued to the original authored letters.
4. **Given** the student already completed a prior attempt of the same quiz, **When** a new attempt is generated, **Then** question order differs whenever there are two or more questions, and each question’s option order differs whenever that question has two or more options.
5. **Given** they select the option whose meaning is the correct answer (regardless of which letter it currently has), **When** they submit, **Then** that question is scored correct; a wrong-meaning choice is scored incorrect even if it now sits under a letter that was correct last time.
6. **Given** a new attempt, **When** questions are reordered, **Then** **all** questions in the published quiz still appear exactly once (no drop, duplicate, or extra question).
7. **Given** the attempt is not submitted, **When** options are shown in shuffled order, **Then** nothing about the presentation reveals which option is correct (no extra mark, sort-by-correctness, or explanation).

---

### User Story 3 - Order stays stable for the life of one attempt (Priority: P2)

If the student leaves mid-quiz, refreshes, or continues later on the same device for the **same in-progress attempt**, questions and options stay in the order they already started with. Shuffle happens when a **new** attempt is created, not on every page load.

**Why this priority**: Reshuffling mid-exam would move answers around and destroy trust. Stability within an attempt is required for the P1 shuffle to be usable.

**Independent Test**: Start an attempt, answer two questions, note order, leave to the dashboard, reopen the same quiz without submitting, and confirm the same question/option order and the same two answers.

**Acceptance Scenarios**:

1. **Given** an in-progress attempt, **When** the student leaves and returns before submit, **Then** question order and option order are unchanged from when that attempt started.
2. **Given** they already answered some questions on that in-progress attempt, **When** they return, **Then** those answers remain selected on the same option texts (not shifted to a different letter because of a reshuffle).
3. **Given** they complete and then start **another** attempt, **When** the new attempt loads, **Then** a new shuffle is applied and US1 blank-state rules apply.

---

### User Story 4 - Past results stay intact and reviewable (Priority: P2)

Retaking does not erase the previous graded result. From results, the student can still open review of an earlier attempt and see the questions and choices as they appeared **on that attempt**, with solutions according to existing post-submit rules. Teachers’ authored order when editing the quiz is unchanged.

**Why this priority**: Wipe must apply only to the **new** live attempt, not to academic history. Review that no longer matches what the student saw would cause disputes.

**Independent Test**: Submit attempt 1, retake and submit attempt 2, reopen attempt 1’s result review and confirm its content and presentation still match attempt 1; teacher edit view still shows original authored order.

**Acceptance Scenarios**:

1. **Given** a completed attempt, **When** the student starts a retake, **Then** the previous graded result remains in their results history and is still openable.
2. **Given** they open review of a **completed** attempt, **When** questions and options are shown, **Then** they appear in the order used during that attempt, and post-submit solutions follow existing gatekeeper/results rules.
3. **Given** a teacher opens the quiz to edit, **When** they view questions and options, **Then** they see the original authored order (student shuffle does not rewrite the teacher’s source quiz).
4. **Given** gamification and attempt limits, **When** a retake is started or submitted, **Then** existing best-score and unique-completed-quiz rules still apply; this feature does not extra-count completions.

---

### Edge Cases

- What happens if the student refreshes or relaunches during a **new** attempt? → Treat as resume of that in-progress attempt (stable order, only new-attempt answers), not as another retake.
- What happens if they double-tap «إعادة المحاولة»? → Only one new in-progress attempt is created; they do not get two overlapping live attempts for the same quiz.
- What happens when attempts are exhausted? → No new attempt, no new shuffle, historical results unchanged, review-only.
- What happens on a quiz with a single question? → Question order cannot change; options still shuffle when two or more exist.
- What happens on a question with fewer than two options, or a non-choice question? → Option shuffle is skipped for that question; other questions still shuffle.
- What happens if a shuffle could match the last attempt by chance (for example only two options)? → The new attempt MUST NOT reuse the immediately previous question order when there are two or more questions, and MUST NOT reuse a question’s previous option order when that question has two or more options. If there is only one possible order, reuse is allowed.
- What happens if the teacher added, removed, or edited questions between attempts? → The new attempt uses the **currently published** question set, shuffled as a new attempt. Review of older attempts still reflects what was presented then (or a clear fallback if a question no longer exists—do not silently grade old answers against a different item).
- What happens for an **in-progress** attempt that was never submitted? → Opening the quiz resumes it; it is not wiped or reshuffled. Wipe and reshuffle apply when starting a **new** attempt after a completed (or otherwise closed) previous attempt.
- What happens if a previous attempt is still waiting to sync (offline)? → Do not discard that queued submission. A new retake is not started until the prior attempt is resolved according to existing offline rules, or the student is shown a clear Arabic message that the previous attempt must finish syncing first.
- What happens to the profile completion gate? → If retakes are already blocked until the profile is completed, that block remains; no blank attempt is created.
- What happens for untimed quizzes? → No timer to reset; answers and progress still wipe; shuffle still applies.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a student starts a **new** graded attempt (including first attempt and allowed retake), the system MUST initialize that attempt with no selected answers and no inherited progress from any prior attempt.
- **FR-002**: Starting a new attempt MUST NOT copy previous in-progress answers, progress position, or remaining-time state into the new attempt.
- **FR-003**: For a timed quiz, each new attempt MUST receive a full fresh countdown consistent with existing timed-attempt rules (teacher duration snapshot for that attempt).
- **FR-004**: Each new attempt MUST present the quiz’s questions in a randomized order generated for that attempt.
- **FR-005**: Each new attempt MUST present each multiple-choice question’s options in a randomized order generated for that attempt.
- **FR-006**: Displayed choice letters (A, B, C, D, …) MUST follow the on-screen option order for that attempt, in RTL reading order.
- **FR-007**: Scoring MUST use the identity/meaning of the chosen option, not the displayed letter or position, so shuffle cannot change what is correct.
- **FR-008**: When the student has an immediately previous attempt of the same quiz, the new attempt’s question order MUST differ from that previous attempt whenever the quiz has more than one question, and each multiple-choice question’s option order MUST differ from that previous attempt whenever that question has more than one option.
- **FR-009**: Question and option order MUST remain unchanged for the lifetime of a single in-progress attempt (leave/return/refresh included).
- **FR-010**: A new attempt MUST include every currently published question of the quiz exactly once.
- **FR-011**: Completed attempts and their reviews MUST remain available; starting a retake MUST NOT delete or rewrite prior graded results.
- **FR-012**: Review of a completed attempt MUST present questions and options in the order that attempt used.
- **FR-013**: Teacher editing of the source quiz MUST continue to show authored question and option order; student shuffle MUST NOT reorder the teacher’s source material.
- **FR-014**: Shuffle and reset MUST NOT reveal correct answers or explanations before a successful submit for that attempt.
- **FR-015**: Existing attempt-limit, profile-gate, offline-sync, gatekeeper, and multi-tenant access rules MUST still decide whether a new attempt may start; this feature MUST NOT bypass them.
- **FR-016**: Students MUST be able to start an allowed retake from existing result surfaces that already offer «إعادة المحاولة» / «إعادة الاختبار» (results list, result detail, quiz card when retake is allowed).

### Key Entities

- **Quiz Attempt**: One student’s one run of a quiz, from start until submit (or expiry/auto-submit). Has its own answers, progress, timer (if any), and presentation order.
- **Attempt Presentation**: The question sequence and per-question option sequence used for one attempt. Stable until that attempt ends; independent of other attempts and of the teacher’s authored order.
- **Authored Quiz Content**: The teacher’s source questions and option texts. Unchanged by student shuffle. Used as the pool to present and to grade against.
- **Choice Selection**: The student’s picked option for a question, bound to that option’s identity, not to letter A/B/C/D.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In **100%** of tested retakes with remaining attempts, the new attempt opens with zero pre-selected answers and progress at the start (first question, nothing counted as answered).
- **SC-002**: In **100%** of tested timed retakes, the new attempt’s remaining time equals a full new duration, not leftover time from the prior attempt.
- **SC-003**: Across a QA sample of at least **10** retakes on quizzes with ≥4 questions and ≥4 options each, **100%** of new attempts differ from the immediately previous attempt in both question order and every question’s option order.
- **SC-004**: In **100%** of scored sample items, a known-correct option remains correct after shuffle, and a known-incorrect option remains incorrect, regardless of displayed letter.
- **SC-005**: After tapping an allowed retake control, students can see the first question of the blank new attempt in **under 5 seconds** on a typical phone connection (excluding unrelated login or profile-gate delays).
- **SC-006**: In usability checks, at least **90%** of students understand they are on a new try (no leftover answers) and cannot rely on “the answer is still C.”
- **SC-007**: **100%** of previously completed attempts in the test set remain openable for review after a retake, with that attempt’s presentation order preserved.

## Assumptions

- **Every new attempt is shuffled**, including the student’s first attempt of a quiz, not only retakes. Retake is the motivating case; the same generation rule keeps first attempts from sharing a single canonical order across classmates.
- **Always on**: There is no teacher toggle in this feature. All student-facing attempts of published quizzes shuffle. A future setting can be a follow-up.
- **Letters are positional**: A is always the first option the student sees on that question for that attempt.
- **Resume is not a retake**: Opening an unfinished attempt continues it. Reset + new shuffle run only when creating a new attempt after a previous attempt is completed or otherwise closed.
- **Same question bank**: This feature reorders the published set; it does not sample a subset, inject extras, or change difficulty.
- **RTL order**: “First” / “next” follow Arabic RTL reading order already used by the player (including A/B/C/D badges).
- **One live attempt per student per quiz**: Students do not run two in-progress attempts of the same quiz at once.
- **Historical reviews**: If an old question was later deleted from the quiz, review still shows what that completed attempt recorded rather than silently dropping the student’s answer without explanation.
- **Offline**: Queued unsynced submissions are not discarded by retake; existing offline conflict messaging applies.
- **Copy**: Existing Arabic retake labels («إعادة المحاولة» / «إعادة الاختبار») stay; this feature does not require new marketing copy beyond the existing actions.

## Dependencies

- **QUIZ-001**: Gatekeeper—no solutions until that attempt is submitted.
- **QUIZ-004**: Fresh timed session per new attempt.
- **QUIZ-005**: Attempt caps decide whether «إعادة المحاولة» may start a new attempt.
- **UI-016 / UI-017**: Student player chrome (progress, pager, submit) must reflect blank new-attempt state.
- **GAMIF-001**: Best score and unique-quiz counts on retakes stay as already specified.
- **PROFILE-002**: Profile gate may still block starting a retake.
- **OFFLINE-001**: Local drafts and pending sync must not resurrect old answers into a new attempt or delete an unsynced prior submission.

## Out of Scope

- Teacher control to disable shuffle or lock authored order for students.
- Drawing a random **subset** of questions from a larger bank.
- Changing attempt limits, scoring formulas, weak-points aggregation rules, or leaderboard ranking.
- Reordering questions on the teacher create/edit screens.
- Shuffle of non-option content (passage text, shared stimuli) beyond question sequence and choice rows.
- Guaranteeing unique shuffles across **different students** (only per student vs their own previous attempt).
