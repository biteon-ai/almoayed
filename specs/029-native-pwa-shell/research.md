# Research: Native Home-Screen App Experience

**Date**: 2026-09-20  
**Status**: Complete — all Technical Context items resolved

## 1. Theme switcher without a new framework package

**Decision**: Small client `AppearanceProvider` that writes `localStorage["almoayed-appearance"]` (`light` | `dark` | `system`), toggles `class="dark"` on `<html>`, and injects a blocking inline script in `src/app/layout.tsx` to prevent a light flash. Reuse existing `.dark` CSS variables in `globals.css`. Update `theme-color` / splash via `document.querySelector('meta[name="theme-color"]')` and keep `viewport.themeColor` media queries as the SSR default.

**Rationale**: `globals.css` already defines a full `.dark` token set, but nothing applies the class today. `next-themes` would duplicate that and violate minimal-diff. Device-local storage matches the spec (works offline; no new `profiles` column).

**Alternatives considered**:
- `next-themes` — extra dependency; FOUC script still required.
- Server-persisted preference — needs a migration and fails offline before settings save.

## 2. Tab motion on Next.js 14 App Router

**Decision**: Keep App Router navigations (do **not** convert student tabs to a client SPA). Persist chrome in `(student)/layout.tsx`. Add `src/app/(student)/template.tsx` with a short CSS slide/fade on `{children}` keyed by route. Honor `prefers-reduced-motion: reduce` (instant swap). Progressively wrap `StudentNavLink` `router.push` in `document.startViewTransition` when the API exists.

**Rationale**: Header + bottom nav already survive navigation; the “hard reload” feel is the un-animated `main` swap plus `loading.tsx`. A `template.tsx` remounts per navigations while the layout stays mounted — the Next 14-native way to animate page children. View Transitions API is Chromium/Safari 18+ only, so CSS is the baseline.

**Alternatives considered**:
- Full client-side tab panels without routing — breaks deep links, back button, and existing `/quizzes` `/results` `/settings` pages.
- `experimental.viewTransition` (Next 15) — we are on Next 14.2.35.

## 3. Service worker registration scope

**Decision**: Move `ServiceWorkerRegister` from `(student)/layout.tsx` to the **root** layout so login, teacher, and admin share installability and static-asset caching. Keep IndexedDB quiz packages student-only. Bump SW cache names to `APP_SHELL_CACHE_v3` / `RUNTIME_CACHE_v3` when precache URLs or strategy change. Continue **network-first navigations** (visited student routes) and **cache-first static assets**. Never intercept Server Action POSTs. Do not precache session-gated HTML at install time.

**Rationale**: Chromium `beforeinstallprompt` (UI-010 + UI-015) typically requires a registered worker. 009 scoped SW to students; this spec’s shared shell (FR-001–FR-004) includes teachers. Dynamic RSC HTML still cannot be enumerated at build time (same 009 finding).

**Alternatives considered**:
- Workbox / `next-pwa` — rejected in 009; still too heavy.
- Precache `/dashboard`, `/quizzes`, … at install — session cookies + RSC payloads make this brittle and risk leaking another user’s HTML.

## 4. Native drawer implementation

**Decision**: New `StudentProfileDrawer` client overlay (fixed panel from **inline-start** in RTL, dimmed backdrop, Escape / backdrop / swipe-close). Reuse existing `Dialog` a11y patterns (focus trap, `role="dialog"`, `aria-modal`). Do **not** add a new Sheet/Vaul package unless Dialog cannot meet swipe-close; v1 may omit swipe if backdrop + close button + Escape work.

**Rationale**: No `sheet.tsx` in the UI kit. Gear currently `<Link href="/settings">` — intercept on phone to open the drawer; keep bottom-tab «الإعدادات» as the full `PROFILE-001` page.

**Alternatives considered**:
- Navigate to `/settings` (status quo) — fails FR-005.
- Full-screen settings duplicate — rejected by FR-010.

## 5. Haptics

**Decision**: Pure helper `hapticPulse(pattern?: number | number[])` in `src/lib/haptic.ts`: call `navigator.vibrate` inside try/catch; no-op when missing, denied, or in-flight. Default 10–20 ms on answer tap; slightly longer on submit. Never `await` a delay before state updates.

**Rationale**: Spec allows silent degradation (iOS Safari historically has no `vibrate`). Must not slow `handleAnswer` / `handleSubmit`.

**Alternatives considered**:
- Vibration API polyfills / Cordova — out of scope for a web PWA.

## 6. Sticky quiz submit bar

**Decision**: **Keep** the existing `fixed … bottom-16` bar in `QuizRunner.tsx` (already above `StudentBottomNav`). Restyle with semantic tokens (`bg-background/90`, `border-border`) so dark mode works; confirm quiz `main` padding clears the bar; add haptic on the submit button. Do not rebuild the runner.

**Rationale**: FR-014 is largely implemented; the gap is theme + overlap polish, not a new layout.

## 7. Offline saved-items list

**Decision**: Add `listQuizPackages()` using existing `idbGetAll(quizPackages)`. Filter by `teacherId === currentTeacherId` (pass id from dashboard/layout client context or a tiny session-derived prop). Sort by `openedAt` descending. Reuse `assertGatekeeperCompliance` only when reading a package to start a quiz (already in `saveQuizPackage`). Empty Arabic state in the drawer.

**Rationale**: Packages already exist (OFFLINE-001). Surfacing them is a list UI + MT-002 filter. No schema version bump required.

**Alternatives considered**:
- New IndexedDB store — unnecessary duplication.
- Server-fetched “cached” list — fails offline.

## 8. Add to Home Screen sheet vs UI-010

**Decision**: New `PwaInstallSheet` (bottom sheet / Dialog) mounted from student layout **except** `/quiz/[id]`. Reuse `isPwaStandalone`, `usePwaInstall`, and the existing iOS/Android step copy from `PwaInstallPrompt`. Eligibility: not standalone, phone-width, signed-in student, not dismissed this session, `localStorage["almoayed-a2hs-dismissed-at"]` older than 24h (or missing). Login CTAs stay.

**Rationale**: Spec FR-019–FR-021. UI-010 is login-only; students who skipped it never see a reminder.

## 9. Manifest, icons, viewport

**Decision**: Keep `display: "standalone"` (already set). Align `background_color` with light shell (`#f8fafc` / `--background`) and keep `theme_color` `#0d9488`. Confirm `icon-192`, `icon-512`, `apple-touch-icon` (180) via existing `npm run generate:brand`. Add any missing `purpose: "maskable"` padding by regenerating if the current icons crop on Android; do not invent a second brand. Viewport already has `userScalable: false` + `maximumScale: 1` + `overscroll-y-none`; keep those and document OS accessibility zoom still applies.

**Rationale**: UI-001/UI-003/UI-010 already shipped most of FR-001–FR-004. This feature **closes gaps** (theme-matched splash, maskable/Apple completeness, header/nav still hard-coded white).

## 10. Contact and share

**Decision**: Share: `navigator.share({ title, text, url: "https://almoayed.app" })` when available, else `clipboard.writeText` + toast. Contact: WhatsApp to `TEACHER_WHATSAPP` / `NEXT_PUBLIC_TEACHER_WHATSAPP` with a short Arabic help message (same number already used for activation), plus visible `EMAIL_SUPPORT_EMAIL` (`almoayed@biteon.nl`) as copy/mailto fallback.

**Rationale**: Spec forbids a new inbox. Those two channels already exist in the product.

## 11. App version label

**Decision**: Export `APP_VERSION` from `src/lib/constants.ts` kept in sync with `package.json` `version` (currently `0.1.0`). Drawer shows «الإصدار {APP_VERSION}». Do not hard-code `1.0.1` unless product bumps the package version in the same change.

**Rationale**: Spec says `1.0.1` is an example of the label format.
