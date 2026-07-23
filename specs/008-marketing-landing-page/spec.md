# Feature Specification: Marketing Landing Page

**Feature Branch**: `008-marketing-landing-page`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "Create a modern, responsive landing page at `src/app/page.tsx` for the Al-Moayed (المؤيد) learning platform with sticky nav, hero, trust metrics, features grid, audience breakdown, and footer. Emerald/teal brand, Arabic RTL, Shadcn UI."

## Clarifications

### Session 2026-07-23

- Q: What should unauthenticated visitors see at `/` instead of the current login redirect? → A: Full marketing landing page; logged-in users still auto-redirect to role dashboard.
- Q: Where should primary CTAs route for guests? → A: `/login` (with optional `from` query for protected destinations like `/quizzes`).
- Q: Are trust metrics live or static? → A: Static marketing copy for v1 (no DB aggregation).
- Q: Does "ابدأ الآن" signup need a separate register flow? → A: No — link to `/login` (register alias already exists at `/register`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover the platform (Priority: P1)

As a prospective student or teacher visiting `/` while logged out, I want a compelling hero and navigation so I understand what المؤيد offers and can sign in or start for free.

**Why this priority**: `/` is the primary acquisition entry point replacing the login redirect.

**Independent Test**: Open `/` logged out — sticky header, hero headline, two primary CTAs, and dashboard preview mockup render without horizontal scroll on 390px width.

**Acceptance Scenarios**:

1. **Given** a logged-out visitor, **When** they open `/`, **Then** they see the marketing landing (not redirected to `/login`).
2. **Given** the sticky header, **When** the user scrolls, **Then** nav remains visible with logo, section anchors (المميزات, للطلاب, للمدرسين), تسجيل الدخول, and ابدأ الآن.
3. **Given** the hero, **When** displayed, **Then** title reads "اختبر مهاراتك، تتبع إنجازاتك، وحقق التميّز الدراسي" with subtitle and CTAs "تجربة المنصة مجاناً" and "تصفح الاختبارات".
4. **Given** a logged-in student, **When** they open `/`, **Then** they are redirected to `/dashboard`.
5. **Given** a logged-in teacher, **When** they open `/`, **Then** they are redirected to `/teacher/dashboard`.

---

### User Story 2 - Evaluate trust and features (Priority: P1)

As a visitor, I want quick proof points and feature highlights so I trust the platform before signing up.

**Why this priority**: Converts interest into login/register action.

**Independent Test**: Trust bar shows four metrics; features grid shows three cards (interactive tests, analytics, streak motivation).

**Acceptance Scenarios**:

1. **Given** the landing page, **When** rendered, **Then** trust bar displays: +10,000 active students, +500 tests, 98% satisfaction, instant grading (Arabic labels).
2. **Given** the features section, **When** displayed, **Then** three feature cards explain interactive tests, performance analytics, and study streak motivation with icons.
3. **Given** dark mode, **When** toggled at OS level, **Then** all sections remain readable with emerald/teal accents.

---

### User Story 3 - Choose audience path (Priority: P2)

As a visitor unsure whether المؤيد is for me, I want distinct student vs. teacher value cards so I pick the right entry.

**Why this priority**: Reduces signup friction for both personas.

**Independent Test**: Two audience cards with distinct copy and CTA links to `/login`.

**Acceptance Scenarios**:

1. **Given** the audience section, **When** displayed, **Then** separate cards exist for students and teachers with role-specific benefits.
2. **Given** footer, **When** displayed, **Then** copyright and quick links (login, features anchors) are present.

---

### Edge Cases

- Very small viewport (320px) — layout stacks; no clipped CTAs; touch targets ≥44px.
- Logged-out user taps "تصفح الاختبارات" — routes to `/login?from=/quizzes` (quizzes is auth-protected).
- Anchor nav on mobile — section IDs scroll smoothly; sticky header offset accounted for.
- Reduced motion preference — decorative animations respect `prefers-reduced-motion`.
- SEO — page has Arabic `metadata` title/description via RSC export.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace the logged-out `/` redirect-to-login behavior with a full marketing landing page composed in `src/app/page.tsx` (RSC shell) and client subcomponents as needed.
- **FR-002**: System MUST preserve logged-in redirect behavior: students → `/dashboard`, teachers → `/teacher/dashboard`.
- **FR-003**: Landing MUST include sticky navigation: platform logo/brand, anchor links (المميزات, للطلاب, للمدرسين), تسجيل الدخول → `/login`, ابدأ الآن → `/login`.
- **FR-004**: Hero MUST include headline, subtitle, CTAs ("تجربة المنصة مجاناً" → `/login`, "تصفح الاختبارات" → `/login?from=/quizzes`), and a styled dashboard preview mockup card (static UI, not live data).
- **FR-005**: Trust metrics bar MUST show four static stats: +10,000 students, +500 tests, 98% satisfaction, instant grading.
- **FR-006**: Features grid MUST present three cards: interactive tests, performance analytics, study streak motivation.
- **FR-007**: Audience section MUST show distinct student and teacher benefit cards with CTAs to `/login`.
- **FR-008**: Footer MUST include copyright (المؤيد) and quick links.
- **FR-009**: UI MUST use emerald (`#10b981`) / teal gradients, `rounded-3xl` cards, dark-mode compatible Tailwind tokens, Shadcn/Base UI primitives, Lucide icons.
- **FR-010**: Page MUST inherit RTL from root layout; copy is Arabic throughout.
- **FR-011**: System MUST add Spekit hook `landing-page` on root landing container and update `.speckit/spec.yaml` with feature `LAND-001`.

### Key Entities

- **LandingSection**: id anchor, title, body copy, optional CTA — static content only (no persistence).
- **TrustMetric**: label, value, icon — static marketing constants in `src/lib/landing-content.ts`.
- **AudienceCard**: role (student|teacher), benefits[], ctaHref.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Logged-out visitor sees complete landing (header through footer) on 390×844 without horizontal overflow.
- **SC-002**: Primary CTA ("تجربة المنصة مجاناً") reaches `/login` in one tap from hero.
- **SC-003**: Lighthouse mobile performance score ≥85 on `/` (static content, optimized images if any).
- **SC-004**: Logged-in users never see marketing content at `/` — redirect within one server round-trip.

## Assumptions

- No CMS; marketing copy lives in typed constants or component props.
- Trust metrics are aspirational static numbers, not audited live counts.
- No new API routes, Server Actions, or database migrations.
- `/register` continues to alias `/login`; landing signup CTA uses `/login`.
- Dashboard preview is decorative CSS mockup, not screenshot of real user data.
