# Implementation Plan: Student Dashboard Mobile Density

**Branch**: `002-student-dashboard-density` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-student-dashboard-density/spec.md`

**Feature ID (registry)**: `DASH-001` — mobile-density refactor of `/dashboard` (extends QUIZ-002, MT-001/002, TIER-001 UI placement; no new backend tables)

## Summary

Refactor the student dashboard (`/dashboard`) into a high-density mobile-first layout: horizontal Quick Stats (tier, completed count, average score), horizontal snap-scroll quiz carousel (accessible + inline locked Pro cards), and a bottom Shadcn/Base UI tab panel for نتائجي / نقاط الضعف / أساتذتي. Remove the top teacher switcher; relocate weak points and scores into tabs with compact variants. Preserve RTL throughout.

**Technical approach**: Extend `src/actions/quiz.ts` with a teacher-scoped dashboard bundle query; add dashboard subcomponents under `src/components/dashboard/`; add `src/components/ui/tabs.tsx`; refactor `src/app/dashboard/page.tsx` as RSC shell composing new layout. No schema migration — reads `exam_submissions`, `quizzes`, `questions`, existing weak-points aggregation.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for Syrian Baccalaureate math

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC, Server Actions, `src/app/` routes |
| **Database** | **Supabase** PostgreSQL — schema in `supabase/migrations/`, RLS enabled |
| **Data access** | Server Actions + `createAdminClient()` — **no** client Supabase for privileged reads |
| **Session / auth** | iron-session (`requireStudent`), `currentTeacherId` tenant scope |
| **UI** | Tailwind CSS, Shadcn/Base UI, RTL (`dir="rtl"`, `text-start`), touch targets `h-10`–`h-12` |
| **Testing** | Vitest (`tests/features/`), Playwright (`e2e/`) |
| **Target platform** | Mobile-first PWA — primary viewport 390×844 |
| **Spec registry** | `.speckit/spec.yaml` (QUIZ-002, MT-001, TIER-001 dependencies) |

**Feature-specific overrides**:

- **Primary Dependencies**: `@base-ui/react` Tabs (new `tabs.tsx` primitive); existing `lucide-react`
- **Storage / tables touched**: `exam_submissions`, `quizzes`, `questions`, `student_teachers` (read-only); no migrations
- **Performance Goals**: Single server round-trip for dashboard data via bundled action; carousel renders ≤20 quiz cards without layout shift
- **Constraints**: All stats/scores filtered by `session.currentTeacherId` + `session.profileId` (MT-002); weak points unchanged aggregation logic
- **Scale/Scope**: 1 route refactor, ~8–10 component files, 1–2 new server functions, 1 UI primitive, Vitest + Playwright smoke

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md`

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries filter by `currentTeacherId` | PASS — stats, scores, quizzes scoped to active teacher |
| QUIZ-001 | No answer leakage | N/A — dashboard shows metadata only |
| Server layer | Privileged data via Server Actions + admin client | PASS — new reads in `quiz.ts` |
| RTL UX | Arabic RTL, Tajawal, touch targets | PASS — carousel + tabs use logical properties (`start`/`end`) |
| Minimal diff | Match existing patterns | PASS — reuse `TeacherSwitcher`, `requestProUpgrade`, `getWeakPoints` |

**Feature compliance**: PASS — no justified exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/002-student-dashboard-density/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 DTOs + queries
├── quickstart.md        # Manual verification
├── contracts/           # Server action + component contracts
│   ├── server-actions.md
│   └── ui-components.md
└── spec.md
```

### Source Code (planned)

```text
src/
├── app/
│   └── dashboard/
│       └── page.tsx                         # RSC: fetch bundle, compose layout
├── actions/
│   └── quiz.ts                              # + getStudentDashboardData, extend quiz list fields
├── components/
│   ├── dashboard/
│   │   ├── DashboardStatsRow.tsx            # Tier + count + average mini-cards
│   │   ├── QuizCarousel.tsx                 # Horizontal snap-scroll + QuizCarouselCard
│   │   ├── QuizCarouselCard.tsx             # Accessible + locked variants
│   │   ├── DashboardTabs.tsx                # Client: Shadcn tabs shell
│   │   ├── MyScoresTab.tsx                  # Last 5 scores list
│   │   ├── WeakPointsTab.tsx                # Compact category rows (replaces full card on page)
│   │   ├── TeachersTab.tsx                  # Wraps TeacherSwitcher
│   │   ├── WeakPointsCard.tsx               # Keep for reference; unused on dashboard or deprecated
│   │   └── ProUpgradeCard.tsx               # Logic extracted to QuizCarouselCard locked variant
│   └── ui/
│       └── tabs.tsx                         # New Base UI tabs primitive
├── types/
│   └── database.ts                          # + DashboardStats, RecentScoreRow, QuizCarouselItem
└── lib/
    └── spekit-targets.ts                    # Optional: dashboard tab/carousel hooks

tests/
├── features/dash-001-dashboard-density.test.ts
e2e/student-dashboard.spec.ts
```

**Structure decision**: One bundled server query reduces waterfall fetches on dashboard. Client components only where interaction required (tabs, Pro upgrade button, teacher switch).

## Phase 0: Research

See [research.md](./research.md). All technical unknowns resolved — no NEEDS CLARIFICATION remaining.

## Phase 1: Design

See [data-model.md](./data-model.md) and [contracts/](./contracts/).

**Key decisions**:
1. `getStudentDashboardData()` returns stats + recent scores + extended quiz list in one call.
2. Add Shadcn-compatible `tabs.tsx` using `@base-ui/react/tabs`.
3. Locked carousel cards reuse `requestProUpgrade()` — compact inline variant of `ProUpgradeCard`.
4. Weak Points tab uses new `WeakPointsTab` compact list; full `WeakPointsCard` not mounted on dashboard.
5. Top `TeacherSwitcher` removed from page; only in Teachers tab.

## Phase 2: Implementation Outline (for `/speckit-tasks`)

| Step | Task | Depends on |
|------|------|------------|
| 1 | Add types: `DashboardStats`, `RecentScoreRow`, extend `QuizListItem` with `questionCount`, `hasSubmission` | — |
| 2 | Implement `getStudentDashboardData()` in `quiz.ts` | 1 |
| 3 | Extend `getAvailableQuizzes` question count + submission flag (or fold into bundle) | 1 |
| 4 | Add `src/components/ui/tabs.tsx` | — |
| 5 | Build `DashboardStatsRow`, `QuizCarousel` + card variants | 2, 4 |
| 6 | Build `DashboardTabs`, `MyScoresTab`, `WeakPointsTab`, `TeachersTab` | 4, 5 |
| 7 | Refactor `src/app/dashboard/page.tsx` layout | 5, 6 |
| 8 | Vitest: stats average calculation, teacher scope filter | 2 |
| 9 | Playwright: mobile viewport smoke (stats + carousel + tabs visible without scroll) | 7 |
| 10 | Update `.speckit/spec.yaml` — add `DASH-001` | 9 |

**Out of scope (v1)**: Desktop-specific alternate layout; tab URL hash persistence; animated carousel indicators.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [none] | — | — |

## Post-Design Constitution Re-check

All gates still PASS. Teacher-scoped submission joins enforce MT-002. No new client-side Supabase access. Tab/carousel patterns follow existing RTL component conventions.
