# Feature Specification: Quiz Attempt Limits & Category

**Feature Branch**: `019-quiz-attempt-limits`

**Created**: 2026-07-27

**Status**: Draft

**Feature ID**: `QUIZ-005` (extends `TEACH-003` · `QUIZ-001` · `GAMIF-001`)

**Input**: User description: "Add flexible quiz attempt limits (عدد محاولات الاختبار) and quiz category settings (نوع الاختبار) for teachers when creating/editing quizzes, and enforce these rules in the student app."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Teacher sets quiz category and attempt limit (Priority: P1)

As a teacher, I want to choose what kind of quiz I am publishing and how many times each student may attempt it, so practice homework feels different from a formal evaluation or a competitive challenge.

**Why this priority**: Without teacher configuration, no attempt rules exist; this is the enabling slice for all student enforcement.

**Independent Test**: On quiz create or edit, select «نوع الاختبار», set «عدد المحاولات المسموحة», save, reopen the quiz, and confirm both values persist with Arabic labels and sensible defaults per category.

**Acceptance Scenarios**:

1. **Given** a teacher on quiz create or edit, **When** the form loads, **Then** they see an Arabic section for «نوع الاختبار» with three choices: «تدريب / واجب», «اختبار تقييمي / نصفي», and «تحدي / مسابقة».
2. **Given** the teacher selects «تدريب / واجب», **When** the category is applied, **Then** «عدد المحاولات المسموحة» defaults to **غير محدود** (unlimited attempts).
3. **Given** the teacher selects «اختبار تقييمي / نصفي», **When** the category is applied, **Then** «عدد المحاولات المسموحة» defaults to **1** (single attempt).
4. **Given** the teacher selects «تحدي / مسابقة», **When** the category is applied, **Then** «عدد المحاولات المسموحة» defaults to **1** and the quiz is marked as eligible for a challenge leaderboard.
5. **Given** the teacher toggles off «غير محدود», **When** they enter a custom attempt count, **Then** they may choose any whole number from **1 to 10** inclusive.
6. **Given** an invalid attempt setting (empty custom value, zero, negative, non-integer, or greater than 10), **When** the teacher tries to save, **Then** save is blocked with a clear Arabic validation message.
7. **Given** a valid quiz owned by this teacher, **When** they save category and attempt settings, **Then** only that teacher’s quiz is updated and other teachers’ quizzes are unaffected (multi-tenant scoping).
8. **Given** a teacher changes category after initial save, **When** they save again, **Then** the attempt limit field updates to the new category’s default unless the teacher had explicitly customized the limit (custom value is preserved when switching categories).

---

### User Story 2 - Student attempt limits are enforced (Priority: P1)

As a student, I need the platform to allow or block new attempts based on the teacher’s rules, so exam integrity is preserved and practice quizzes remain reusable.

**Why this priority**: Student enforcement is the core product value; misconfigured limits undermine teacher trust.

**Independent Test**: Publish three quizzes (practice unlimited, evaluation 1 attempt, practice with 2 attempts). Complete attempts as a student and verify start/retake/review behavior matches each limit.

**Acceptance Scenarios**:

1. **Given** a quiz with unlimited attempts, **When** a student submits and later returns to the quiz, **Then** they may start a **new graded attempt** (not review-only).
2. **Given** a quiz with max attempts = **1**, **When** a student has already submitted once, **Then** they cannot start another graded attempt and see only **review of their last result** with a clear Arabic message that attempts are exhausted.
3. **Given** a quiz with max attempts = **N** where N > 1, **When** a student has submitted fewer than N times, **Then** they may start another attempt and the UI shows remaining attempts (e.g. «محاولة 2 من 3»).
4. **Given** a student reaches the max attempt count, **When** they open the quiz card or runner, **Then** the primary action becomes **«مراجعة النتيجة»** (or equivalent) and no new submission is accepted.
5. **Given** a student tries to bypass the UI (e.g., direct link, refresh, offline replay), **When** they have no attempts remaining, **Then** the server rejects a new submission with a clear Arabic error and no duplicate graded result is created.
6. **Given** QUIZ-001 gatekeeper rules, **When** a student is on a fresh attempt, **Then** correct answers and explanations remain hidden until successful submit; review mode after exhaustion may show prior attempt results per existing results rules.
7. **Given** a timed quiz (QUIZ-004) with remaining attempts, **When** a student starts a new attempt, **Then** a new timed session applies for that attempt only; prior submitted attempts do not reset the clock for a new one.
8. **Given** gamification progress (GAMIF-001), **When** a student retakes a quiz, **Then** completed-quiz count does **not** increase again for the same quiz and displayed/average scores use the **best** completed score for that quiz.

---

### User Story 3 - Challenge leaderboard for competition quizzes (Priority: P2)

As a student taking a «تحدي / مسابقة» quiz, I want to see how I rank against classmates after submitting, so the competition feels motivating and fair.

**Why this priority**: Leaderboard is category-specific value; attempt limits (P1) can ship without it, but challenge type is incomplete without visible ranking.

**Independent Test**: Publish a challenge quiz with 1 attempt; have two students submit different scores; confirm both see a ranked list scoped to the active teacher’s students who attempted that quiz.

**Acceptance Scenarios**:

1. **Given** a quiz categorized as «تحدي / مسابقة», **When** a student views the quiz before or after submit, **Then** they see an Arabic leaderboard section for that quiz (hidden or empty until at least one submission exists).
2. **Given** multiple students under the same teacher submitted the challenge quiz, **When** a student opens the leaderboard, **Then** entries are ranked by score (highest first), then by earlier submit time as tie-breaker, showing student display name and score percentage.
3. **Given** a quiz not categorized as challenge, **When** a student views it, **Then** no challenge leaderboard is shown.
4. **Given** a student who has not yet submitted a challenge quiz, **When** they view the leaderboard, **Then** they may see others’ ranks but their own row shows as not yet attempted (or is absent until submit—consistent product choice documented in Assumptions).
5. **Given** teacher multi-tenant scoping, **When** the leaderboard loads, **Then** it includes only students linked to the quiz’s owning teacher and never leaks another teacher’s class data.

---

### Edge Cases

- What happens when a teacher lowers max attempts after some students already exceeded the new limit? → Existing completed attempts remain valid; students who already used more attempts than the new limit cannot start additional attempts; no historical submissions are deleted.
- What happens when a teacher raises max attempts after a student exhausted the old limit? → The student may start new attempts up to the updated limit.
- What happens when max attempts is unlimited but the quiz is timed? → Each new attempt gets a fresh timed session; unlimited does not mean one endless session.
- What happens on offline submit when attempts were exhausted while offline? → Sync is rejected with a clear Arabic message; student sees review of last valid submission.
- What happens for existing quizzes created before this feature? → They migrate to «تدريب / واجب» with **1 attempt** (preserving today’s single-submission behavior) unless product chooses practice default—see Assumptions.
- How does this interact with existing audience quiz types (regular vs session group)? → Audience/access rules remain unchanged; category and attempt limits apply in addition, not as a replacement.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let teachers set **quiz category** («نوع الاختبار») on quiz create and edit with exactly three values: Practice/Homework (تدريب / واجب), Evaluation/Midterm (اختبار تقييمي / نصفي), Challenge/Competition (تحدي / مسابقة).
- **FR-002**: The system MUST let teachers set **max attempts** («عدد المحاولات المسموحة») per quiz as either **unlimited** or a custom whole number from **1 to 10**.
- **FR-003**: When a teacher selects a category, the system MUST apply these defaults unless the teacher has already set a custom attempt limit: Practice → unlimited; Evaluation → 1; Challenge → 1.
- **FR-004**: The system MUST persist category and max attempts on the quiz record, scoped to the owning teacher.
- **FR-005**: The system MUST count each **successful graded submission** as one used attempt toward the student’s limit for that quiz.
- **FR-006**: The system MUST allow a new graded attempt when used attempts < max attempts, or when max attempts is unlimited.
- **FR-007**: The system MUST block new graded attempts when used attempts ≥ max attempts (finite limit), on both client UX and server submission paths.
- **FR-008**: When attempts are exhausted, the student UI MUST offer **result review** only, with Arabic copy explaining that no attempts remain (replacing misleading «إعادة الاختبار» when retake is not allowed).
- **FR-009**: When attempts remain, the student UI MUST show attempt progress (e.g. current attempt number and remaining count) on the quiz card and/or runner entry.
- **FR-010**: For challenge-category quizzes, the system MUST expose a per-quiz **leaderboard** ranked by score (descending) with tie-break by earlier submission time, visible only to students authorized to access that quiz under the owning teacher.
- **FR-011**: Retakes MUST NOT increase gamification completed-quiz totals; best completed score per quiz MUST be used for averages and displayed «last/best» score on student surfaces (aligned with GAMIF-001).
- **FR-012**: Attempt-limit changes MUST apply to **future** attempts immediately; they MUST NOT delete or invalidate already-recorded submissions.
- **FR-013**: QUIZ-001 gatekeeper, MT-002 teacher scoping, and RTL Arabic UI MUST remain intact.

### Key Entities

- **Quiz Category (نوع الاختبار)**: Pedagogical classification of a quiz—practice, evaluation, or challenge—driving defaults and optional leaderboard. Distinct from audience/access quiz type (regular vs session group).
- **Max Attempts (عدد المحاولات المسموحة)**: Integer per quiz; **0 (or equivalent sentinel) means unlimited**; **1–10** means finite cap. Defines how many graded submissions each student may complete.
- **Student Attempt Usage**: Derived count of graded submissions per `(student, quiz)` pair compared against max attempts to allow or deny retakes.
- **Challenge Leaderboard Entry**: Ranked row for a challenge quiz showing student identity (display name), score percentage, and submit ordering metadata; scoped to the quiz’s teacher roster.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Teachers can configure category and attempt limit on quiz create/edit and see persisted values on reopen in **under 1 minute** without support.
- **SC-002**: In QA scenarios covering unlimited, single-attempt, and N-attempt quizzes, **100%** of server submission attempts respect the configured limit (no over-limit graded submissions).
- **SC-003**: Students with exhausted attempts see review-only state with clear Arabic messaging in **100%** of tested entry paths (grid card, dashboard carousel, direct URL).
- **SC-004**: Challenge leaderboard shows correctly ordered ranks for at least **10** participants in test data with no cross-teacher data visible.
- **SC-005**: After retakes on practice quizzes, gamification completed-quiz count for a given quiz increases **at most once** per student per teacher relationship.
- **SC-006**: **90%** of teachers in usability review correctly interpret the three category labels and attempt limit control without training.

## Assumptions

- **Naming**: UI label «نوع الاختبار» refers to pedagogical category (practice / evaluation / challenge), not the existing audience field «regular vs session group», which continues to control group access independently.
- **Unlimited encoding**: Unlimited attempts are stored as **0** (or an equivalent agreed sentinel) in persistence; only values **1–10** are valid finite limits.
- **Practice default**: New quizzes default to **Practice / unlimited** attempts; existing quizzes without these fields migrate to **Evaluation-equivalent behavior: 1 attempt** to preserve current single-submission production behavior.
- **Scoring on retake**: The **best** completed score is shown on student quiz cards and used for gamification averages; teachers may see attempt history in analytics as a follow-up (out of scope unless already present).
- **Leaderboard freshness**: Challenge leaderboard updates when students submit; live push/websocket updates are **not** required for v1—refresh or navigation reload is acceptable.
- **Pre-submit leaderboard**: Students who have not submitted may view the leaderboard but their own rank appears only after their first submission.
- **Challenge + timed**: Timed challenge quizzes use both QUIZ-004 timer rules and single-attempt (default) challenge limits without conflict.
- **Privacy**: Leaderboard shows student **display name** only (no phone/WhatsApp), consistent with existing student-facing surfaces.

## Dependencies

- **TEACH-003**: Quiz create/edit surfaces where settings are added.
- **QUIZ-001**: Gatekeeper and submission/results flow.
- **QUIZ-004**: Timed session behavior on retakes (if timer enabled).
- **GAMIF-001**: Best-score and unique-quiz counting rules on retakes.
- **MT-002**: Active-teacher scoping for leaderboard and access.

## Out of Scope

- Teacher analytics dashboard for per-attempt history export (future enhancement).
- Cross-quiz or cross-teacher global leaderboards.
- Admin `/admin/quizzes` parity unless that route already mirrors teacher quiz editor (teacher routes are the primary target).
- Changing audience/access quiz type (`regular` / `session_group`) semantics.
