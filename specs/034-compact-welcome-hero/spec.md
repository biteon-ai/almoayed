# Feature Specification: Compact Welcome Hero

**Feature Branch**: `034-compact-welcome-hero`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "Optimize the large green welcome hero card on the main dashboard and mobile screens / other pages so it does not take excessive vertical screen space: reduce height and padding; condense or hide non-essential descriptive text on mobile; keep personalized greeting, name, and streak/goal progress; compact streak and progress layout without overflow or cramped appearance."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See essentials without scrolling past the fold (Priority: P1)

As a student on a small mobile phone, I want the green welcome card to be short so that interactive content below it (stats, quizzes, action tiles) is visible without scrolling past a tall decorative banner.

**Why this priority**: Reclaiming vertical space on the first screen is the core problem; everything else supports this outcome.

**Independent Test**: Open the student home dashboard on a typical phone-width viewport and confirm the welcome card uses noticeably less height than before while still showing greeting, name, and streak/goal, with other interactive cards visible sooner.

**Acceptance Scenarios**:

1. **Given** a logged-in student on a mobile-width screen, **When** they open the main dashboard home, **Then** the welcome card shows a personalized greeting with their name and the daily streak/goal progress without a multi-line motivational subtitle.
2. **Given** the same student on a mobile-width screen, **When** the welcome card is fully visible, **Then** at least one interactive region below the card (for example stats, quizzes, or action tiles) is partially or fully visible without scrolling.
3. **Given** a logged-in student on a larger (tablet/desktop) screen, **When** they view the same welcome card, **Then** the card remains visually balanced and not overly tall, while still presenting greeting, name, and streak/goal clearly.

---

### User Story 2 - Keep streak and goal readable in a compact card (Priority: P1)

As a student, I want my daily goal progress and study streak to stay easy to scan inside the smaller welcome card so motivation signals remain useful after the height reduction.

**Why this priority**: Compactness must not sacrifice the only functional widgets in the hero.

**Independent Test**: With a known streak and daily goal percentage, open the dashboard and verify both values remain fully visible, correctly labeled, and free of clipping or overflow at mobile and desktop widths.

**Acceptance Scenarios**:

1. **Given** a student with a non-zero study streak and a partial daily goal, **When** they view the welcome card on mobile, **Then** streak count and daily goal progress are both fully visible and aligned within the card bounds (no overflow, cut-off text, or overlapping elements).
2. **Given** a student whose daily goal is complete (100%), **When** they view the welcome card, **Then** the completed goal state is still clearly indicated in the compact layout.
3. **Given** a student with a zero-day streak, **When** they view the welcome card, **Then** the streak area still renders cleanly (empty/zero state) without breaking the compact layout.

---

### User Story 3 - Consistent compact hero wherever the welcome card appears (Priority: P2)

As a student navigating the app shell on mobile, I want the same compact welcome treatment on every screen that shows this green welcome hero so density feels consistent, not only on one dashboard route.

**Why this priority**: Uniform density across entry surfaces prevents regressing back into tall heroes on alternate student home entry points.

**Independent Test**: Visit each student screen that renders the shared welcome hero and confirm the same compact height, padding, and subtitle rules apply.

**Acceptance Scenarios**:

1. **Given** any student screen that displays the shared green welcome hero, **When** opened on a mobile-width viewport, **Then** it follows the same compact padding, essential-content-only, and streak/goal layout rules as the main dashboard.
2. **Given** a screen that does not use the welcome hero, **When** opened, **Then** this feature does not change that screen’s unrelated page headers or empty states.

---

### Edge Cases

- Very long student display names MUST truncate or wrap in a controlled way so the card height does not grow unexpectedly on mobile.
- Extreme streak values (e.g., large day counts) MUST remain readable without forcing the streak box to overflow the card.
- Right-to-left (Arabic) layout MUST remain correct after compaction; alignment of greeting, progress, and streak MUST stay coherent in RTL.
- If gamification data is temporarily unavailable or defaults to zeros, the compact card MUST still render without layout collapse or excessive empty padding.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The student welcome hero MUST use reduced vertical padding and overall height so it feels compact on mobile and leaves room for interactive content below.
- **FR-002**: On mobile viewports, the welcome hero MUST NOT show the long motivational sub-heading (multi-line descriptive copy). Only the essential personalized greeting, user name, and daily streak/goal progress MUST remain prominent.
- **FR-003**: On larger viewports, the welcome hero MAY show a shortened single-line supportive phrase, but MUST NOT restore a tall multi-line descriptive block that dominates the card.
- **FR-004**: The daily goal progress indicator and the streak summary MUST remain fully visible, correctly labeled, and tightly laid out within the reduced card bounds without overflow, clipping, or a cramped/overlapping appearance.
- **FR-005**: Compaction rules MUST apply consistently to every student surface that renders this shared welcome hero; unrelated headers and empty states on other pages MUST remain unchanged.
- **FR-006**: The compact welcome hero MUST preserve existing RTL Arabic presentation and touch-friendly tap targets for any interactive elements inside or immediately associated with the card.
- **FR-007**: Existing in-product help/tour targeting markers on the welcome hero MUST remain intact so guided tours and support tooling continue to find the card.

### Key Entities

- **Welcome Hero**: The personalized green greeting banner on the student home experience, containing greeting, name, optional short support text, daily goal progress, and study streak summary.
- **Daily Goal Progress**: The student’s progress toward today’s study goal (percentage and completion state).
- **Study Streak**: The count of consecutive study days shown beside the greeting.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a typical phone-width viewport (≈360–390px wide), the welcome hero’s occupied vertical space is reduced by at least ~40% compared with the pre-change tall layout (measured from card top to bottom edge including padding).
- **SC-002**: On the same phone-width viewport, after the page settles, at least one interactive card or primary action region below the welcome hero is visible without scrolling for a standard student with typical content.
- **SC-003**: 100% of welcome-hero acceptance scenarios for greeting/name visibility and streak/goal readability pass on mobile and desktop spot checks.
- **SC-004**: Zero layout defects reported in QA for overflow, clipped streak values, or overlapping progress/streak elements across tested name lengths and streak sizes.
- **SC-005**: Students can still identify their name and current streak/goal within 3 seconds of opening the dashboard (informal usability check with at least 3 testers or equivalent internal review).

## Assumptions

- The green welcome hero in scope is the shared student welcome banner used on the main student dashboard (and any other student screens that reuse that same banner). Teacher dashboards, login branding, and marketing landing heroes are out of scope.
- “Mobile” means narrow viewports typical of phones; tablet and desktop may keep slightly more breathing room while still avoiding the previous oversized height.
- Hiding the long descriptive subtitle on mobile is preferred over a collapsible “read more” control, to avoid adding another interaction and to maximize vertical savings.
- On larger screens, a single short supportive line is acceptable; if space is still tight, hiding it entirely remains allowed.
- No new user preferences, persistence, or backend fields are required; this is a presentation-density change only.
- Prior dashboard-density work that called for a one-line mobile greeting is treated as the intended product direction and is reinforced here for the welcome hero specifically.
