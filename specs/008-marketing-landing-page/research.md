# Research: LAND-001 Marketing Landing Page

**Date**: 2026-07-23  
**Feature**: `008-marketing-landing-page`

## R-001: Logged-out vs logged-in behavior at `/`

**Decision**: RSC session gate — if `session.isLoggedIn`, redirect by role (existing logic); else render full landing page.

**Rationale**: Preserves current authenticated UX while unlocking marketing for acquisition. Single route, no middleware change needed (`/` is already public).

**Alternatives considered**:
- Always show landing — rejected; returning users expect dashboard shortcut.
- Separate `/home` marketing route — rejected; user spec targets `src/app/page.tsx`.

---

## R-002: Guest CTA destinations

**Decision**:
| CTA | Target |
|-----|--------|
| تسجيل الدخول / ابدأ الآن / تجربة المنصة مجاناً | `/login` |
| تصفح الاختبارات | `/login?from=/quizzes` |
| Student/teacher audience CTAs | `/login` |

**Rationale**: `/quizzes`, `/dashboard` are middleware-protected. User spec linked hero to `/dashboard` but that would bounce guests to login anyway — direct `/login` is clearer with `from` for post-auth return.

**Alternatives considered**:
- Link hero primary to `/dashboard` — rejected; adds redirect hop for guests.
- Make `/quizzes` public preview — rejected; violates gatekeeper and auth model.

---

## R-003: Trust metrics data source

**Decision**: Static constants in `src/lib/landing-content.ts` with Arabic labels.

**Rationale**: No aggregation query needed for v1; avoids misleading live counts on small deployments.

**Alternatives considered**:
- Live Supabase counts — deferred; adds latency and exposes internal scale on empty DB.

---

## R-004: Component architecture

**Decision**: RSC `page.tsx` + mostly server-rendered sections; client components only for sticky nav scroll state and mobile menu toggle (`LandingNav`).

**Rationale**: Minimal JS bundle; aligns with Next.js 14 App Router defaults. Hero mockup is pure CSS/Tailwind (no images required for MVP).

**Alternatives considered**:
- Full `"use client"` page — rejected; unnecessary hydration cost.
- Screenshot image for preview — optional enhancement; CSS mockup sufficient for MVP.

---

## R-005: Sticky navigation and anchors

**Decision**: Section IDs: `#features`, `#students`, `#teachers`. Nav uses `<a href="#...">` with `scroll-mt-24` on sections to offset sticky header (~64px).

**Rationale**: No JS router needed for in-page nav; works with RTL scroll.

**Alternatives considered**:
- React scroll-spy library — rejected; over-engineering for three anchors.

---

## R-006: Brand reuse

**Decision**: Reuse `APP_NAME`, `APP_SLOGAN` from `@/lib/constants`; optional compact `BrandHeader` in nav logo area or inline wordmark matching login page.

**Rationale**: Consistent brand across login and landing.

**Alternatives considered**:
- New logo asset — not required; typographic wordmark matches existing login.

---

## R-007: Spekit and registry

**Decision**: Add `SPEKIT.landingPage = "landing-page"` on `LandingPageView` root; register `LAND-001` in `.speckit/spec.yaml` after implementation.

**Rationale**: ENABLE-001 constitution pattern for new public surface.

---

## R-008: Testing strategy

**Decision**:
- Vitest: assert `landing-content.ts` exports expected metric count and Arabic keys.
- Playwright: logged-out `/` shows hero headline; logged-in student session redirects to `/dashboard`.

**Rationale**: Lightweight coverage for static page without snapshot brittleness.
