# Implementation Plan: Marketing Landing Page

**Branch**: `008-marketing-landing-page` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-marketing-landing-page/spec.md`

**Feature ID (registry)**: `LAND-001` — public marketing landing at `/` for logged-out visitors; preserves session redirect for authenticated users.

## Summary

Replace the current `/` page (redirect-only) with a modern Arabic RTL marketing landing page for acquisition. Split into an RSC `page.tsx` that checks session and either redirects or renders `LandingPageView`, plus focused client components for sticky nav scroll behavior and smooth anchor navigation. Static content constants in `src/lib/landing-content.ts`. No backend changes.

**Technical approach**: Server Component gate in `src/app/page.tsx` using existing `getSession()`; new `src/components/landing/` component tree; reuse `BrandHeader` patterns and dashboard aesthetic (emerald/teal, rounded-3xl). Add Spekit target `landing-page`. Vitest smoke for content constants; Playwright e2e for logged-out render and logged-in redirect.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for Syrian Baccalaureate math

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC shell + client islands |
| **Database** | **Supabase** — **N/A** (no reads/writes) |
| **Data access** | Session check only via `getSession()` in RSC |
| **Session / auth** | iron-session — redirect if `isLoggedIn` |
| **UI** | Tailwind CSS, Shadcn/Base UI, RTL, Lucide React |
| **Testing** | Vitest (`tests/features/`), Playwright (`e2e/`) |
| **Target platform** | Mobile-first PWA, desktop responsive |
| **Spec registry** | `.speckit/spec.yaml` (+ `LAND-001`) |

**Feature-specific overrides**:

- **Primary Dependencies**: None beyond stack defaults (`lucide-react`, existing `Button`, `Badge`, `Card`)
- **Storage / tables touched**: N/A
- **Performance Goals**: Static page; LCP <2.5s on 4G; no client Supabase
- **Constraints**: Public route — no privileged data; guest CTAs → `/login`; protected deep links use `?from=`
- **Scale/Scope**: 1 route refactor, ~6–8 component files, 1 content module, 1 Spekit hook, 2 test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md`

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries | N/A — no DB queries |
| QUIZ-001 | No answer leakage | N/A — no quiz data on landing |
| Server layer | Privileged data via Server Actions | PASS — session check only; no admin client |
| RTL UX | Arabic RTL, Tajawal, touch targets | PASS — inherits root `dir="rtl"`; CTAs `h-11`+ |
| Minimal diff | Match existing patterns | PASS — mirrors dashboard emerald hero styling |

**Feature compliance**: PASS — no justified exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/008-marketing-landing-page/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Static content types
├── quickstart.md        # Manual verification
├── contracts/
│   └── ui-components.md
└── spec.md
```

### Source Code (planned)

```text
src/
├── app/
│   └── page.tsx                              # RSC: session gate + metadata + LandingPageView
├── components/
│   └── landing/
│       ├── LandingPageView.tsx               # Client or RSC composition root
│       ├── LandingNav.tsx                    # Sticky header + mobile menu
│       ├── LandingHero.tsx                   # Headline, CTAs, preview mockup
│       ├── LandingTrustBar.tsx               # Four static metrics
│       ├── LandingFeatures.tsx               # Three feature cards
│       ├── LandingAudience.tsx               # Student vs teacher cards
│       ├── LandingFooter.tsx                 # Copyright + links
│       └── DashboardPreviewMockup.tsx        # Decorative hero visual
├── lib/
│   └── landing-content.ts                  # Typed static copy + metrics
└── lib/spekit-targets.ts                     # + landingPage hook

tests/
├── features/land-001-landing-content.test.ts
e2e/landing-page.spec.ts
```

**Structure decision**: Single-page marketing surface; no new routes. Session redirect logic stays in RSC `page.tsx` (same pattern as current file).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [none] | — | — |

## Phase 0 Output

See [research.md](./research.md) — all NEEDS CLARIFICATION items resolved.

## Phase 1 Output

- [data-model.md](./data-model.md) — static content types
- [contracts/ui-components.md](./contracts/ui-components.md) — component props and section contracts
- [quickstart.md](./quickstart.md) — verification steps

## Constitution Re-check (post-design)

All gates remain PASS. No server actions, no multi-tenant data, no quiz fields exposed.
