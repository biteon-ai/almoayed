# Feature Specification: Teacher-Driven Gamification & Ranking

**Feature Branch**: `011-teacher-gamification`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "Custom Teacher-Driven Gamification & Ranking System (GAMIF-001): Teachers configure level tiers, rewards (badges/cups/diamonds/etc.), and progression rules based on quizzes completed and score thresholds. Students linked to that teacher see their calculated level, progress toward the next level, and unlocked icons on dashboard (and results), scoped to the active teacher (MT-002)."

**Feature ID**: `GAMIF-001`

## Clarifications

### Session 2026-07-23

- Q: How are “completed quizzes” counted for leveling? → A: Count **unique quizzes** completed under that teacher (one per quiz). Average score uses the **best** completed score for each quiz (retakes do not inflate the completed-quiz total).
- Q: How should progress toward the next level be shown? → A: Single progress bar uses the **bottleneck** (minimum of quiz-count progress and average-score progress toward the next tier); Arabic copy lists remaining quizzes and/or score gap still needed.
- Q: When the active teacher has no gamification tiers, what should students see? → A: **Hide** all gamification UI (level card and badge gallery) on dashboard and results; no empty-state card and no fabricated levels.
- Q: Is teacher gamification configuration available to all teachers or Pro-only? → A: **All teachers** (free and Pro) can configure and use gamification; no Pro gate on this feature.
- Q: What is the maximum number of level tiers a teacher may define? → A: Soft maximum of **20** tiers per teacher; saves that would exceed 20 are rejected with clear Arabic validation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Teacher configures level tiers and rewards (Priority: P1)

As a teacher, I want to create and manage named level tiers with minimum quiz-completion and average-score requirements and a reward icon so I can define how students progress under my teaching.

**Why this priority**: Without teacher-configurable rules there is no gamification to display; this is the configuration foundation for every student-facing view.

**Independent Test**: Open the gamification settings screen, add several levels with names/thresholds/icons, save, reload; the same ordered list is shown and only that teacher’s levels are visible.

**Acceptance Scenarios**:

1. **Given** a logged-in teacher, **When** they open gamification settings, **Then** they see an Arabic RTL screen to view, add, edit, reorder, and remove their level tiers.
2. **Given** the teacher is adding or editing a level, **When** they fill «اسم المستوى», «عدد الاختبارات المكتملة», «المعدل المطلوب (%)», and «نوع الأيقونة/المكافأة», **Then** they can choose among كأس، ألماس، نجمة، درع، and وسام (or equivalent labeled icons).
3. **Given** valid level data, **When** the teacher saves, **Then** the configuration persists and a clear Arabic success confirmation appears.
4. **Given** incomplete or invalid fields (e.g., empty name, negative counts, average outside 0–100), **When** save is attempted, **Then** Arabic validation messages appear and no partial corrupt save occurs.
5. **Given** two or more levels, **When** a higher level number has *stricter* requirements than a lower one is allowed only as «greater or equal effort», **Then** saving is blocked if a higher level requires *less* effort than a lower level (fewer quizzes *and* lower average would fail; equal effort is allowed).
6. **Given** Teacher A has configured tiers, **When** Teacher B opens gamification settings, **Then** Teacher B never sees Teacher A’s tiers (strict teacher isolation).
7. **Given** a free-tier teacher account, **When** they open gamification settings, **Then** they can configure tiers the same way as a Pro teacher (no upgrade wall for this feature).
8. **Given** a teacher already has 20 tiers, **When** they attempt to add another, **Then** save/add is blocked with clear Arabic validation that the maximum is 20.

---

### User Story 2 - Student sees current level and progress (Priority: P1)

As a student linked to a teacher who configured gamification, I want to see my current level name, reward icon, and how close I am to the next level on my dashboard so I am motivated to complete more quizzes and improve my average.

**Why this priority**: Student visibility is the primary product value of the feature; configuration alone does not deliver engagement.

**Independent Test**: With known completed-quiz counts and averages for a student under a teacher with defined tiers, open the student dashboard and confirm level name, icon, and next-level progress message match the rules.

**Acceptance Scenarios**:

1. **Given** an active teacher with at least one tier and a student who meets that tier’s thresholds via completed quizzes, **When** the student opens the dashboard under that teacher, **Then** they see a Level Progress card with the current level name and its reward icon.
2. **Given** the student has not yet reached the highest tier, **When** they view the progress card, **Then** a single progress bar reflects the **bottleneck** dimension (the lesser of quiz-count progress and average-score progress toward the next tier), and Arabic copy states remaining quizzes and/or score gap still needed.
3. **Given** the student has reached the highest configured tier, **When** they view the progress card, **Then** they see they are at the top level (no misleading “next level” that does not exist).
4. **Given** the teacher has not configured any tiers, **When** the student opens the dashboard, **Then** the Level Progress card and badge gallery are **not rendered** (no empty card, no fabricated levels, no errors).
5. **Given** only fully completed quiz attempts count toward progress, **When** the student has unfinished or non-submitted attempts, **Then** those do not increase completed-quiz count or average used for leveling.
6. **Given** a student completes the same quiz more than once, **When** progress is calculated, **Then** that quiz counts as **one** completed quiz and the average uses the **best** completed score for that quiz.

---

### User Story 3 - Student browses unlocked vs locked rewards (Priority: P2)

As a student, I want a badge / hall-of-fame gallery of the teacher’s reward icons so I can see which rewards I have unlocked and which remain locked.

**Why this priority**: Gallery reinforces goals after the progress card; valuable but secondary to knowing current level.

**Independent Test**: Configure multiple tiers with different icons; set student stats so some tiers are achieved and some are not; gallery shows unlocked vs locked accordingly.

**Acceptance Scenarios**:

1. **Given** multiple teacher tiers with icons, **When** the student views the badge gallery on the dashboard, **Then** each configured reward appears with a clear unlocked or locked visual state.
2. **Given** the student meets a tier’s quiz-count and average-score rules, **When** they refresh the gallery, **Then** that tier’s icon is unlocked.
3. **Given** the student does not meet a tier’s rules, **When** they view the gallery, **Then** that icon remains locked (no spoiler of “earned” state).

---

### User Story 4 - Progress follows the active teacher (Priority: P2)

As a student linked to more than one teacher, I want my level, progress, and badges to reflect the *currently selected* teacher’s rules when I switch teachers so multi-teacher context stays correct.

**Why this priority**: Multi-tenant teacher switching already exists; gamification must respect it or students will see wrong rewards.

**Independent Test**: Link a student to two teachers with different tier configs and different quiz history; switch active teacher and confirm level/gallery update to that teacher’s rules and stats.

**Acceptance Scenarios**:

1. **Given** a student with two teachers who each have different gamification configs, **When** the student switches the active teacher, **Then** level name, icon, progress, and gallery update to the newly selected teacher’s rules and that teacher’s quiz history only.
2. **Given** Teacher A has tiers and Teacher B has none, **When** the student selects Teacher B, **Then** they do not continue seeing Teacher A’s levels or badges.

---

### User Story 5 - Results page reflects the same status (Priority: P3)

As a student reviewing results, I want to see my level/rewards summary so motivation continues after finishing a quiz, not only on the main dashboard.

**Why this priority**: Extends visibility; dashboard remains the primary surface.

**Independent Test**: After submissions that change level eligibility, open results under the active teacher and see the same current level (and unlocked state) consistent with the dashboard.

**Acceptance Scenarios**:

1. **Given** a student with a calculable level under the active teacher, **When** they open the results experience, **Then** they see a consistent level/reward summary aligned with dashboard rules for that teacher.
2. **Given** no tiers configured for the active teacher, **When** they open results, **Then** no gamification summary is shown (same hide behavior as the dashboard).

---

### Edge Cases

- Student with zero completed quizzes under the active teacher: show the lowest tier only if its minimums are 0/0; otherwise show “not yet leveled” / locked gallery and progress toward the first tier.
- Teacher deletes a mid-tier or reorders levels: student status recalculates from the new ordered rules on next view; unlocked state is always derived from current rules, not a permanent historical grant.
- Teacher tightens requirements so a previously “unlocked” tier is no longer met: the student loses that unlocked state on recalculation (rules are live, not snapshot grants).
- Average score with no completed quizzes: treat average as 0 (or “not applicable”) and do not invent a perfect average.
- Multiple completed submissions for the same quiz: count once toward `total_quizzes_completed`; average uses the best score among completed attempts for that quiz.
- Duplicate level numbers or gaps after reorder: system presents a clear ordered sequence; save normalizes order so each level has a unique ascending position.
- Student not linked to the teacher whose ID is requested: no gamification data is returned for that pair.
- Extremely large tier lists: capped at 20; UI remains usable on mobile (scrollable list; touch-friendly controls) within that limit.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Teachers MUST be able to create, view, edit, reorder, and delete level tiers that belong only to their own account. Access MUST NOT require a Pro subscription (available to free and Pro teachers alike). A teacher MUST NOT be allowed more than **20** level tiers.
- **FR-002**: Each level tier MUST include: display name, minimum completed quizzes, minimum average score (0–100%), reward icon type (cup, diamond, star, shield, badge), and an ordered level position.
- **FR-003**: The system MUST reject saves where a higher-positioned level requires strictly less effort than a lower-positioned level (effort = completed-quiz minimum and average-score minimum; equal effort across consecutive levels is allowed).
- **FR-016**: The system MUST reject adding or saving a configuration that would exceed 20 tiers for that teacher, with Arabic validation feedback.
- **FR-004**: Teachers MUST never see or modify another teacher’s gamification configuration.
- **FR-005**: Student progress MUST be computed per student–teacher relationship using only completed quiz attempts under that teacher.
- **FR-006**: For leveling, the system MUST use: (a) count of **distinct quizzes** with at least one completed attempt under that teacher, and (b) average of the **best** completed score percentage per distinct quiz. Retakes MUST NOT increase the completed-quiz count.
- **FR-007**: A student’s current level MUST be the highest ordered tier whose minimum completed quizzes and minimum average score are both satisfied.
- **FR-008**: Students MUST see current level name, reward icon, and progress toward the next unmet tier (or top-tier state) on the student dashboard when the active teacher has tiers. Progress bar fill MUST equal the **minimum** of (a) progress on distinct completed quizzes toward the next tier’s quiz minimum and (b) progress on average score toward the next tier’s average minimum; accompanying copy MUST name the remaining quizzes and/or score gap. When the active teacher has **zero** tiers, the dashboard MUST omit the level card and gallery entirely.
- **FR-009**: Students MUST see a gallery of the active teacher’s reward icons with unlocked vs locked states based on whether each tier’s thresholds are met (only when at least one tier exists).
- **FR-010**: When the student changes the active teacher, all gamification displays MUST refresh to that teacher’s tiers and that teacher’s completion/score stats only.
- **FR-011**: The results experience MUST show a gamification summary consistent with the dashboard for the same active teacher, and MUST omit it entirely when that teacher has no tiers.
- **FR-012**: Incomplete or non-completed quiz attempts MUST NOT count toward completed-quiz totals or averages used for gamification.
- **FR-013**: All gamification reads and writes MUST enforce teacher isolation and student–teacher link ownership; unauthorized access MUST fail without leaking other teachers’ data.
- **FR-014**: Gamification UI MUST be Arabic RTL, touch-friendly, and consistent with the product’s existing mobile-first visual language.
- **FR-015**: New student- and teacher-facing gamification controls MUST be tagged for product guidance/help discovery (feature registry `GAMIF-001`).

### Key Entities

- **Gamification Tier**: A teacher-owned level definition (name, order, minimum completed quizzes, minimum average score %, reward icon type).
- **Student Gamification Status**: Derived view for a student under one teacher — distinct completed quiz count, best-score average %, current tier, next tier (if any), bottleneck progress toward next tier, remaining quizzes/score gap hints, and per-tier unlocked flags.
- **Completed Quiz Attempt**: A finished submission under a teacher that is eligible for gamification counting (excludes in-progress / non-completed attempts). For leveling aggregates, attempts collapse to one row per quiz (best score wins).
- **Reward Icon**: Visual reward category attached to a tier (cup, diamond, star, shield, badge) shown unlocked or locked in the gallery.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A teacher can define a set of at least 5 level tiers (name, thresholds, icon) and persist them in under 3 minutes on a phone-sized screen (up to the soft maximum of 20).
- **SC-002**: After saving, 100% of that teacher’s reloads show the same ordered tiers; another teacher’s account shows 0 of those tiers.
- **SC-003**: Given fixed completed-quiz counts and averages, student current level and unlocked icons match the teacher’s rules on every dashboard load (deterministic recalculation).
- **SC-004**: Switching the active teacher updates level name and gallery to the other teacher’s config within one navigation/refresh cycle with no leftover badges from the previous teacher.
- **SC-005**: Students with no completed quizzes under the active teacher never appear as having unlocked higher tiers that require completed quizzes.
- **SC-006**: At least 90% of teachers in usability review can correctly explain which student would unlock the next level after reading the progress card copy once (including when only one of quizzes/average is still blocking).
- **SC-007**: Validation prevents saving inverted effort ladders (higher level easier than lower) in 100% of attempted invalid saves during QA.
- **SC-008**: Attempts to exceed 20 tiers are blocked in 100% of QA cases with clear Arabic feedback.

## Assumptions

- “Rank” in this feature means the student’s **level tier** under the active teacher, not a competitive class leaderboard among peers (leaderboards are out of scope for v1).
- Only the **active** teacher’s configuration and that teacher’s quiz history drive what the student sees (aligned with existing teacher switcher behavior).
- Unlocked rewards are **rule-derived**, not permanently awarded: changing or deleting tiers can lock or unlock icons on recalculation.
- Average score is the mean of each distinct quiz’s **best** completed percentage under that teacher; with zero completions, average is treated as 0 for threshold checks. Retakes do not add extra completed-quiz credits.
- Progress toward the next tier uses a **bottleneck** model: bar fill = min(quiz-count progress, average-score progress); copy always clarifies what is still missing.
- “Greater or equal effort” for higher levels means each successive level’s quiz minimum and average minimum are each ≥ the previous level’s corresponding value.
- Results page shows a compact summary of the same status model as the dashboard (not a separate scoring system).
- Feature will be registered as `GAMIF-001` in the product feature registry and new UI surfaces will expose guidance hooks consistent with existing help/enablement practices.
- Existing auth, multi-tenant teacher links, and quiz completion semantics are reused; this feature does not change how quizzes are taken or graded.
- Gamification configuration is **not** gated by Pro (TIER-001); it is available to every teacher account.
- Soft maximum of **20** level tiers per teacher.
- Default empty state when a teacher has never configured tiers: **omit** student gamification UI entirely (no invented default ladder, no empty marketing card).
