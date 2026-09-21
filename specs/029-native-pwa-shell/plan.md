# Implementation Plan: Native Home-Screen App Experience

**Branch**: `029-native-pwa-shell` | **Date**: 2026-09-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/029-native-pwa-shell/spec.md`

**Feature IDs (registry)**: `UI-012` · `UI-013` · `DASH-002` · `UI-014` · `UI-015`  
**Extends**: `UI-001` · `UI-003` · `UI-010` · `OFFLINE-001` · `DASH-001` · `PROFILE-001` · `QUIZ-001`

## Summary

Make Al-Moayed feel like an installed educational phone app: complete standalone shell (icons, theme-matched chrome, locked viewport), a Zaker-style student profile **drawer** (theme, offline saved quizzes, upgrade/settings, share, contact, version), dashboard **card tiles**, tab **slide/fade**, quiz **haptics** + sticky submit polish, stronger SW registration, and an in-app **Add to Home Screen** sheet. Teachers share the installed frame only.

**Technical approach**:
1. Close PWA shell gaps in `public/manifest.json`, root viewport/theme, and semantic (not hard-coded white) student chrome; register `sw.js` from the root layout; bump SW caches to `v3`.
2. Device-local appearance (`localStorage` + `.dark` class already in `globals.css`) — no `next-themes`, no DB.
3. `StudentProfileDrawer` from the header gear; list IndexedDB packages via new `listQuizPackages()` filtered by `currentTeacherId`.
4. `DashboardActionTiles` 2-column grid on الرئيسية mapping to existing destinations; absorb hero text-link CTAs.
5. `(student)/template.tsx` CSS motion + optional View Transitions on `StudentNavLink`.
6. Keep existing `QuizRunner` sticky bar (`bottom-16`); theme tokens + `hapticPulse()`.
7. `PwaInstallSheet` reusing UI-010 helpers; 24h dismiss; never on `/quiz/[id]` or standalone.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for all educational levels and subjects

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC + client islands |
| **Database** | **None new** — IndexedDB `almoayed-offline-v1` already used by OFFLINE-001 |
| **Data access** | Existing Server Actions only; no client Supabase |
| **Session / auth** | iron-session; drawer is student-only |
| **UI** | Tailwind, existing `.dark` tokens, Dialog patterns, RTL |
| **PWA** | `public/manifest.json` + `public/sw.js` + `usePwaInstall` |
| **Testing** | Vitest `[UI-012]`… + Playwright RTL/phone smoke |
| **Target platform** | Mobile-first PWA — production `https://almoayed.app` |

**Feature-specific overrides**:

- **Primary Dependencies**: none beyond stack defaults (no `next-themes`, Workbox, or Sheet package required)
- **Storage / tables touched**: `localStorage` (`almoayed-appearance`, `almoayed-a2hs-dismissed-at`); IndexedDB `quizPackages` **read** for the drawer list. No SQL.
- **Performance Goals**: Drawer open &lt; 100ms perceived; tab swap without a blank white-out; haptic must not delay answer selection; offline shell + saved list in &lt; 10s (SC-007)
- **Constraints**: QUIZ-001 on cached packages; MT-002 filter saved list by `currentTeacherId`; RTL drawer from start side; OS accessibility zoom kept while in-app pinch stays off
- **Scale/Scope**: Student home/shell/quiz chrome. Teacher/admin IA unchanged aside from shared SW + theme class + manifest

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries / session | PASS — saved-quiz list filters `teacherId === currentTeacherId`; no new cross-tenant reads |
| QUIZ-001 | No answer leakage pre-submit | PASS — list/open uses existing gatekeeper-safe packages; no new exam fields |
| Server layer | Privileged data via Server Actions | PASS — theme/A2HS/share are client-local; quizzes still via existing actions |
| RTL UX | Arabic RTL, touch targets | PASS — drawer inline-start, tiles `min-h-12`, Arabic copy |
| Passwordless | WhatsApp identity | PASS — no new auth |
| Minimal diff | Match existing patterns | PASS — extend SW, PWA install helpers, QuizRunner bar, dashboard view; no new PWA framework |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — no SQL; IndexedDB contract is a read projection; SW still ignores POST; pinch-zoom lock is already in viewport and does not disable OS text scaling.

## Project Structure

### Documentation (this feature)

```text
specs/029-native-pwa-shell/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ui-components.md
│   ├── client-storage.md
│   └── service-worker.md
└── tasks.md                    # via /speckit-tasks
```

### Source Code (planned touch points)

```text
public/manifest.json                          # EXTEND — colors, apple/maskable completeness
public/sw.js                                  # EXTEND — cache v3, root registration still /sw.js

src/app/layout.tsx                            # EXTEND — appearance script, SW register, theme-color
src/app/(student)/layout.tsx                  # EXTEND — tokenized chrome, drawer + install sheet hosts
src/app/(student)/template.tsx                # NEW — tab enter motion
src/app/(student)/dashboard/page.tsx          # EXTEND — pass continue-quiz into tiles if needed

src/lib/constants.ts                          # EXTEND — APP_VERSION, share/contact copy
src/lib/appearance.ts                         # NEW — read/write/resolve scheme
src/lib/haptic.ts                             # NEW — vibrate no-op helper
src/lib/a2hs-prompt.ts                        # NEW — eligibility + 24h dismiss
src/lib/pwa-install.ts                        # USE
src/lib/offline/quiz-cache.ts                 # EXTEND — listQuizPackages()
src/lib/spekit-targets.ts                     # EXTEND
.speckit/spekit-targets.yaml
.speckit/spec.yaml                            # UI-012, UI-013, DASH-002, UI-014, UI-015

src/components/providers/appearance-provider.tsx   # NEW
src/components/layout/StudentHeader.tsx            # EXTEND — gear opens drawer
src/components/layout/StudentBottomNav.tsx         # EXTEND — semantic colors + motion-safe
src/components/layout/StudentNavLink.tsx           # EXTEND — optional startViewTransition
src/components/student/StudentProfileDrawer.tsx    # NEW
src/components/student/OfflineSavedQuizzesList.tsx # NEW
src/components/dashboard/DashboardActionTiles.tsx  # NEW
src/components/dashboard/StudentDashboardHero.tsx  # EXTEND — drop duplicate text CTAs
src/components/dashboard/StudentDashboardView.tsx  # EXTEND — mount tiles
src/components/pwa/PwaInstallSheet.tsx             # NEW
src/components/pwa/ServiceWorkerRegister.tsx       # MOVE host to root layout
src/components/quiz/QuizRunner.tsx                 # EXTEND — haptic + tokenized sticky bar

tests/features/ui-012-native-shell.test.ts
tests/features/ui-013-appearance-drawer.test.ts
tests/features/dash-002-action-tiles.test.ts
tests/features/ui-014-haptic.test.ts
tests/features/ui-015-a2hs-eligibility.test.ts
e2e/ui-012-native-pwa-shell.spec.ts           # RTL drawer, tiles, sticky submit, no install in standalone mock
```

**Structure decision**: Client-local UX on top of existing student layout and OFFLINE-001. Pure helpers (`appearance`, `haptic`, `a2hs-prompt`, `listQuizPackages`) stay in `src/lib/` so Vitest does not need JSDOM for every case.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| none | — | — |

## Phase 0: Research

See [research.md](./research.md). All technical unknowns resolved (theme without `next-themes`, `template.tsx` motion, SW at root, drawer vs settings, haptics no-op, A2HS vs UI-010, list projection of existing IDB).

## Phase 1: Design

See [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

**Key decisions**:
1. Appearance is **localStorage only**; apply `.dark` with an inline anti-FOUC script.
2. Saved quizzes = `listQuizPackages()` filtered by `currentTeacherId`.
3. Student `template.tsx` for CSS tab motion; View Transitions optional.
4. Sticky submit **already exists** (`bottom-16`) — polish only.
5. SW cache bump `v3`; register from root; still no POST intercept, no build-time route precache.
6. A2HS sheet: 24h + per-session dismiss; skip quiz routes and standalone.

## Phase 2: Task planning

Deferred to `/speckit-tasks`.
