---
description: "Task list for LAND-001 marketing landing page"
---

# Tasks: LAND-001 Marketing Landing Page

**Input**: Design documents from `specs/008-marketing-landing-page/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`  
**Tests**: Included per plan (Vitest content smoke + Playwright e2e) — run in Polish phase after implementation.

**Organization**: Tasks grouped by user story for independent delivery and testing.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm design artifacts and environment before implementation

- [x] T001 Review acceptance criteria in `specs/008-marketing-landing-page/spec.md` and UI contracts in `specs/008-marketing-landing-page/contracts/ui-components.md`
- [x] T002 [P] Confirm branch `008-marketing-landing-page` and dev server (`npm run dev`) per `specs/008-marketing-landing-page/quickstart.md`
- [x] T003 [P] Read file layout and technical approach in `specs/008-marketing-landing-page/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Static content module, Spekit hook, and RSC session gate — blocks all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create typed static marketing copy in `src/lib/landing-content.ts` per `specs/008-marketing-landing-page/data-model.md` (`LANDING_HERO`, `LANDING_TRUST_METRICS`, `LANDING_FEATURES`, `LANDING_AUDIENCE`, `LANDING_NAV_LINKS`, `LANDING_FOOTER`)
- [x] T005 [P] Add `landingPage: "landing-page"` to `SPEKIT` in `src/lib/spekit-targets.ts` and register hook in `.speckit/spekit-targets.yaml`
- [x] T006 Refactor `src/app/page.tsx` to export Arabic `metadata`, call `getSession()`, redirect logged-in users by role, and render landing shell for guests (replace redirect-to-login-only behavior)

**Checkpoint**: Foundation ready — content constants exist; `/` gates session; Spekit id reserved

---

## Phase 3: User Story 1 — Discover the platform (Priority: P1) 🎯 MVP

**Goal**: Logged-out visitors see sticky nav, hero with headline/CTAs, and dashboard preview mockup; logged-in users redirect to role dashboard.

**Independent Test**: Open `/` logged out at 390×844 — sticky header, hero headline "اختبر مهاراتك، تتبع إنجازاتك، وحقق التميّز الدراسي", two CTAs, mockup visible, no horizontal overflow; logged-in student/teacher redirects work.

### Implementation for User Story 1

- [x] T007 [P] [US1] Create decorative `DashboardPreviewMockup` in `src/components/landing/DashboardPreviewMockup.tsx` (static emerald/teal `rounded-3xl` card, no live data)
- [x] T008 [P] [US1] Create client `LandingNav` in `src/components/landing/LandingNav.tsx` (sticky header, anchor links المميزات/للطلاب/للمدرسين, تسجيل الدخول + ابدأ الآن → `/login`, mobile hamburger, touch targets ≥44px)
- [x] T009 [US1] Create `LandingHero` in `src/components/landing/LandingHero.tsx` using `LANDING_HERO` (headline, subtitle, CTAs → `/login` and `/login?from=/quizzes`, includes `DashboardPreviewMockup`)
- [x] T010 [US1] Create `LandingPageView` in `src/components/landing/LandingPageView.tsx` composing `LandingNav` + `LandingHero` with `data-spekit={SPEKIT.landingPage}` on root
- [x] T011 [US1] Wire `LandingPageView` in `src/app/page.tsx` for logged-out visitors (verify FR-002 redirect paths unchanged)

**Checkpoint**: US1 complete — MVP landing with nav + hero live at `/` for guests

---

## Phase 4: User Story 2 — Evaluate trust and features (Priority: P1)

**Goal**: Trust metrics bar (4 stats) and features grid (3 cards) with dark-mode-compatible styling.

**Independent Test**: Scroll landing — trust bar shows +10,000 students, +500 tests, 98% satisfaction, instant grading; features section `#features` has three icon cards; dark mode readable.

### Implementation for User Story 2

- [x] T012 [P] [US2] Create `LandingTrustBar` in `src/components/landing/LandingTrustBar.tsx` rendering four tiles from `LANDING_TRUST_METRICS`
- [x] T013 [P] [US2] Create `LandingFeatures` in `src/components/landing/LandingFeatures.tsx` with `id="features"` and `scroll-mt-24`, three-column responsive grid from `LANDING_FEATURES`
- [x] T014 [US2] Integrate `LandingTrustBar` and `LandingFeatures` into `src/components/landing/LandingPageView.tsx` below hero

**Checkpoint**: US2 complete — trust + features sections render on landing

---

## Phase 5: User Story 3 — Choose audience path (Priority: P2)

**Goal**: Distinct student vs. teacher value cards and footer with copyright + quick links.

**Independent Test**: Audience section shows two cards with role-specific benefits and `/login` CTAs; footer shows copyright and links; anchor `#students` / `#teachers` work with sticky nav offset.

### Implementation for User Story 3

- [x] T015 [P] [US3] Create `LandingAudience` in `src/components/landing/LandingAudience.tsx` with student card `id="students"` and teacher card `id="teachers"` from `LANDING_AUDIENCE`
- [x] T016 [P] [US3] Create `LandingFooter` in `src/components/landing/LandingFooter.tsx` with copyright and links from `LANDING_FOOTER`
- [x] T017 [US3] Complete `src/components/landing/LandingPageView.tsx` with audience + footer sections (full page scroll header → footer)

**Checkpoint**: US3 complete — full landing page with all sections

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Registry, tests, build verification, and quickstart validation

- [x] T018 Register `LAND-001` feature (routes, files, acceptance, status) in `.speckit/spec.yaml`
- [x] T019 [P] Add Vitest smoke test for `landing-content.ts` exports in `tests/features/land-001-landing-content.test.ts` (4 metrics, 3 features, 2 audience cards)
- [x] T020 [P] Add Playwright e2e in `e2e/landing-page.spec.ts` (logged-out hero visible; logged-in student redirects to `/dashboard`)
- [x] T021 Run `npm run build` and execute manual checklist in `specs/008-marketing-landing-page/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational — MVP deliverable
- **User Story 2 (Phase 4)**: Depends on Foundational; integrates into `LandingPageView` (best after US1 shell exists)
- **User Story 3 (Phase 5)**: Depends on Foundational; completes `LandingPageView`
- **Polish (Phase 6)**: Depends on US1–US3 (or US1-only for minimal ship)

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on US2/US3 — independently testable after Phase 2
- **User Story 2 (P1)**: Adds sections to shared `LandingPageView` — sequential after US1 recommended to avoid merge conflicts
- **User Story 3 (P2)**: Adds final sections — sequential after US2 recommended

### Within Each User Story

- Content constants (Phase 2) before components
- Parallel components (`[P]`) before integration task in `LandingPageView`
- `page.tsx` wired in US1; later stories only extend `LandingPageView`

### Parallel Opportunities

- **Phase 1**: T002 ∥ T003
- **Phase 2**: T005 ∥ T004 (after T004 types defined) — T004 should complete before T005 if spekit references content; actually independent
- **Phase 3**: T007 ∥ T008, then T009 → T010 → T011 sequential
- **Phase 4**: T012 ∥ T013, then T014
- **Phase 5**: T015 ∥ T016, then T017
- **Phase 6**: T019 ∥ T020

---

## Parallel Example: User Story 1

```bash
# Parallel component scaffolding:
Task T007: "Create DashboardPreviewMockup in src/components/landing/DashboardPreviewMockup.tsx"
Task T008: "Create LandingNav in src/components/landing/LandingNav.tsx"

# Then sequential integration:
Task T009: "Create LandingHero in src/components/landing/LandingHero.tsx"
Task T010: "Create LandingPageView in src/components/landing/LandingPageView.tsx"
Task T011: "Wire LandingPageView in src/app/page.tsx"
```

---

## Parallel Example: User Story 2

```bash
Task T012: "Create LandingTrustBar in src/components/landing/LandingTrustBar.tsx"
Task T013: "Create LandingFeatures in src/components/landing/LandingFeatures.tsx"
# Then:
Task T014: "Integrate into LandingPageView.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Guest sees nav + hero at `/`; logged-in redirect works
5. Demo/deploy partial landing if needed

### Incremental Delivery

1. Setup + Foundational → session gate + content ready
2. User Story 1 → Nav + Hero MVP
3. User Story 2 → Trust + Features
4. User Story 3 → Audience + Footer (full page)
5. Polish → Registry, tests, build

### Suggested MVP Scope

**Phases 1–3 only** (T001–T011): Delivers primary acquisition path (nav, hero, CTAs, session redirect). Trust/features/audience can follow without breaking MVP.

---

## Notes

- No database migrations or Server Actions beyond existing `getSession()`
- Guest CTAs use `/login`; quizzes CTA uses `/login?from=/quizzes` per research R-002
- Trust metrics are static marketing copy — do not query Supabase
- Match dashboard aesthetic: emerald `#10b981`, teal gradients, `rounded-3xl`
- Preserve root layout RTL — do not override `dir` unless needed for a subsection
- Run `npm run build` before marking feature complete (constitution)
