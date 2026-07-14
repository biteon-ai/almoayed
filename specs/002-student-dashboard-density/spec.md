# Feature Specification: Student Dashboard Mobile Density

**Feature Branch**: `002-student-dashboard-density`

**Created**: 2026-07-14

**Status**: Draft

**Input**: User description: "Refactor the Student Dashboard (`/dashboard`) layout to minimize vertical scrolling on mobile screens. Implement a high-density, horizontal-scroll and tabbed layout structure with Quick Stats Header, Horizontal Quiz Carousel, and Bottom Tabbed Section (My Scores, Weak Points, Teachers). Preserve RTL styling."

## Clarifications

### Session 2026-07-14

- Q: How should Pro-locked quizzes appear in the horizontal carousel? → A: Inline in the same carousel as distinct compact locked cards (dimmed styling + upgrade CTA instead of Start/Continue).
- Q: What should the My Scores tab show? → A: Last 5 completed quizzes for the current teacher only, sorted newest first.
- Q: How much Weak Points content should the tab show? → A: Compact list only — category tag, success percentage, and weak/strong indicator per row (no rings grid or recommendation blocks).
- Q: What should happen to the welcome block on mobile? → A: One-line compact greeting (name only, no subtitle).
- Q: How should Overall Average Score be calculated? → A: Mean of completed quiz submission scores (`exam_submissions.score`) for the current teacher, 0–100, rounded.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See key stats at a glance (Priority: P1)

As a student on mobile, I want tier, completed quiz count, and overall average score visible in a compact horizontal row so I understand my status without scrolling.

**Why this priority**: Stats are the primary orientation layer for the redesigned dashboard.

**Independent Test**: Open `/dashboard` on a mobile viewport — three mini-stat cards appear in one horizontal row without wrapping below the fold.

**Acceptance Scenarios**:

1. **Given** a logged-in student, **When** they open `/dashboard`, **Then** they see mini-cards for Current Tier (Free/Pro), Completed Quizzes count, and Overall Average Score.
2. **Given** a student with no completed quizzes, **When** they view stats, **Then** completed count shows 0 and average score shows 0% (or equivalent empty state).
3. **Given** a student with completed submissions for the current teacher, **When** they view stats, **Then** Overall Average Score equals the rounded mean of those submission scores (0–100).

---

### User Story 2 - Browse and start quizzes via carousel (Priority: P1)

As a student, I want available quizzes in a horizontally scrollable carousel with compact cards so I can start or continue a quiz without scrolling through a long vertical list.

**Why this priority**: Quiz access is the primary action on the dashboard.

**Independent Test**: Multiple quizzes render as horizontal snap-scroll cards; each shows title, question count, and Start/Continue button.

**Acceptance Scenarios**:

1. **Given** accessible quizzes exist, **When** the student views the dashboard, **Then** quizzes appear in a horizontal carousel (`overflow-x-auto`, snap scrolling).
2. **Given** a quiz card, **When** displayed, **Then** it shows Quiz Title, question count, and a primary Start or Continue action.
3. **Given** a quiz with an in-progress submission, **When** the card renders, **Then** the action reads Continue (or equivalent) instead of Start.
4. **Given** a Free-tier student and Pro-locked quizzes, **When** they scroll the carousel, **Then** locked quizzes appear inline with accessible ones as dimmed cards showing an upgrade action (not Start/Continue).

---

### User Story 3 - Access scores, weak points, and teachers via tabs (Priority: P1)

As a student, I want secondary dashboard content organized in bottom tabs so the main viewport stays compact while I can still reach scores, weak-point analysis, and teacher switching.

**Why this priority**: Consolidates QUIZ-002 weak points and MT-001/002 teacher switcher without vertical bloat.

**Independent Test**: Three Shadcn tabs — نتائجي, نقاط الضعف, أساتذتي — switch content without page navigation; teacher switcher works from Teachers tab.

**Acceptance Scenarios**:

1. **Given** a logged-in student, **When** they tap "نتائجي", **Then** they see up to 5 most recently completed quizzes (current teacher) with per-quiz scores, newest first.
2. **Given** a student with performance data, **When** they tap "نقاط الضعف", **Then** they see a compact list of categories with success percentage and weak/strong indicator (no mastery rings or recommendation cards).
3. **Given** a student linked to one or more teachers, **When** they tap "أساتذتي", **Then** they can view and switch active teacher (MT-001/002).

---

### Edge Cases

- No quizzes available → carousel shows empty state; stats still render.
- No completed quizzes → My Scores tab shows empty state.
- No weak-point data yet → Weak Points tab shows onboarding empty state (as today).
- Single teacher → Teachers tab shows read-only teacher info (no confusing switcher).
- Pro-locked quizzes on Free tier → shown inline in the same carousel as locked-styled cards with upgrade CTA (replaces vertical `ProUpgradeCard` list).
- Welcome header on mobile → one-line greeting only; subtitle hidden (desktop may retain full welcome block).
- RTL layout → all horizontal scroll and tab order respect `dir="rtl"`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST refactor `/dashboard` to a high-density mobile-first layout minimizing vertical scroll on typical mobile viewports.
- **FR-002**: System MUST display a horizontal Quick Stats row with: Current Tier (Free/Pro), Completed Quizzes count (current teacher), and Overall Average Score (rounded mean of `exam_submissions.score` for current teacher; 0% when none completed).
- **FR-003**: System MUST render all quizzes (accessible and Pro-locked) in one horizontal carousel: accessible cards show title, question count, and Start/Continue; locked cards show title, question count, and upgrade CTA with distinct locked styling.
- **FR-004**: System MUST provide a bottom tabbed section (Shadcn Tabs) with three tabs: "نتائجي" (My Scores), "نقاط الضعف" (Weak Points), "أساتذتي" (Teachers).
- **FR-005**: My Scores tab MUST list the 5 most recently completed quizzes for the current teacher, sorted newest first, each showing quiz title and score (0–100).
- **FR-006**: Weak Points tab MUST show a compact categorized list from QUIZ-002 data: each row displays category tag, success percentage, and weak/strong indicator; mastery rings and smart recommendation blocks MUST NOT appear in this tab.
- **FR-007**: Teachers tab MUST host the teacher switcher (MT-001/002); the top-of-page teacher switcher MUST be removed to avoid duplication.
- **FR-008**: On mobile viewports, the welcome section MUST show a one-line greeting (`أهلاً {name}`) only; the subtitle MUST be hidden.
- **FR-009**: System MUST preserve full RTL styling (`dir="rtl"`) including carousel scroll direction and tab order.
- **FR-010**: Primary actions (stats + quiz carousel + tab labels) MUST be visible on a 390×844 mobile viewport without scrolling.

### Key Entities

- **Dashboard Stats**: Tier (free|pro), completed_quiz_count, overall_average_score — all scoped to current teacher; average is rounded mean of completed submission scores (0–100).
- **Quiz Carousel Item**: quiz id, title, question_count, access state (accessible|locked), in_progress flag.
- **Recent Score Row**: quiz title, score (0–100), completed_at — up to 5 rows for current teacher, newest first.
- **Category Performance**: existing QUIZ-002 entity (category_tag, success_percentage, counts).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a 390×844 mobile viewport, student sees Quick Stats, at least one quiz carousel card (or empty state), and all three tab labels without scrolling.
- **SC-002**: Vertical scroll depth on `/dashboard` (mobile) reduced by at least 50% compared to current layout when 5+ quizzes exist.
- **SC-003**: Quiz start/continue remains one tap from carousel card.
- **SC-004**: Teacher switch from Teachers tab completes in ≤2 taps with page refresh showing new teacher's quizzes.

## Assumptions

- Existing data sources: `getAvailableQuizzes`, `getWeakPoints`, `getStudentTeachers`, student tier from session/teacher link.
- New server query needed for completed quiz count, overall average, and recent scores (not yet exposed on dashboard).
- Desktop layout may use same structure with wider carousel; mobile density is the primary driver.
- Welcome subtitle may remain visible on desktop (`md:` breakpoint and above).
