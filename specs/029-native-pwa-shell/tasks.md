---
description: "Task list for UI-012 Native Home-Screen App Experience"
---

# Tasks: Native Home-Screen App Experience (UI-012 · UI-013 · DASH-002 · UI-014 · UI-015)

**Input**: Design documents from `/specs/029-native-pwa-shell/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — plan requires Vitest `[UI-012]` / `[UI-013]` / `[DASH-002]` / `[UI-014]` / `[UI-015]` for pure helpers, plus Playwright RTL/phone smoke in `e2e/ui-012-native-pwa-shell.spec.ts`.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US7)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js app: `src/`, `tests/`, `e2e/`, `public/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Spekit + registry scaffolding for the five feature IDs

- [x] T001 [P] Add Spekit keys `nativeProfileDrawer`, `nativeDrawerClose`, `nativeThemeSwitcher`, `nativeOfflineList`, `nativeDrawerSettings`, `nativeShareApp`, `nativeContactUs`, `nativeAppVersion`, `dashboardActionTiles`, `dashboardTileProgress`, `dashboardTileQuizzes`, `dashboardTileResults`, `dashboardTileContinue`, `pwaInstallSheet`, `pwaInstallSheetAndroid`, `pwaInstallSheetGuide`, `pwaInstallSheetDismiss` to `SPEKIT` in `src/lib/spekit-targets.ts`
- [x] T002 [P] Mirror those selectors under UI-012/UI-013/DASH-002/UI-014/UI-015 sections in `.speckit/spekit-targets.yaml` (bump `meta.total_targets`)
- [x] T003 [P] Add draft `UI-012`, `UI-013`, `DASH-002`, `UI-014`, `UI-015` entries (status `partial`) in `.speckit/spec.yaml` linking `specs/029-native-pwa-shell/`, student routes, and extends `UI-001` `UI-003` `UI-010` `OFFLINE-001` `DASH-001` `PROFILE-001`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Device appearance, root SW registration, shared copy — required before story UI

**⚠️ CRITICAL**: No user-story UI until this phase is complete

- [x] T004 Add `APP_VERSION` (synced with `package.json`), Arabic app-share invite text, and support WhatsApp/mailto helpers using `TEACHER_WHATSAPP` / `EMAIL_SUPPORT_EMAIL` in `src/lib/constants.ts` (or `src/lib/native-share.ts` imported from constants)
- [x] T005 [P] Implement `parseAppearance`, `readAppearance`, `writeAppearance`, `resolveScheme`, `applyAppearanceClass`, and `APPEARANCE_STORAGE_KEY` in `src/lib/appearance.ts` per `specs/029-native-pwa-shell/contracts/client-storage.md`
- [x] T006 Create `AppearanceProvider` (listen to `prefers-color-scheme`, persist choice, update `theme-color` meta) in `src/components/providers/appearance-provider.tsx`
- [x] T007 Mount anti-FOUC inline script + `AppearanceProvider` + `ServiceWorkerRegister` in `src/app/layout.tsx` (keep existing viewport `userScalable: false` / `maximumScale: 1`)
- [x] T008 [P] Bump caches to `APP_SHELL_CACHE_v3` / `RUNTIME_CACHE_v3`, keep network-first navigations, cache-first static, **no POST intercept**, same precache list in `public/sw.js` per `specs/029-native-pwa-shell/contracts/service-worker.md`
- [x] T009 Remove `ServiceWorkerRegister` from `src/app/(student)/layout.tsx` so it is only registered at the root (depends on T007)
- [x] T010 [P] Add failing `[UI-012]` unit tests for `parseAppearance` / `resolveScheme` (unknown → system, system + prefersDark → dark) in `tests/features/ui-012-native-shell.test.ts`

**Checkpoint**: Foundation ready — theme class can apply, SW registers for all roles, stories can start

---

## Phase 3: User Story 1 — Launch as a full-screen home-screen app (Priority: P1) 🎯 MVP

**Goal**: Installed launch is standalone, icons/colors match Al-Moayed, pinch-zoom and rubber-band stay locked, student chrome uses theme tokens (not hard-coded white).

**Independent Test**: Add to Home Screen on a phone (or `display-mode: standalone` emulation) — no address bar, «المؤيد» icon, matching teal splash; pinch does not zoom; header/nav still readable in dark appearance.

### Tests for User Story 1

- [x] T011 [P] [US1] Add Playwright phone-viewport coverage that `manifest.json` is linked, viewport does not allow user scaling, and student header/nav use background tokens (no `bg-white` crash in dark) in `e2e/ui-012-native-pwa-shell.spec.ts`

### Implementation for User Story 1

- [x] T012 [US1] Align `display: "standalone"`, `theme_color` `#0d9488`, `background_color` `#f8fafc`, 192/512 `any`+`maskable`, and Apple 180 reference in `public/manifest.json` per `specs/029-native-pwa-shell/contracts/ui-components.md`
- [x] T013 [P] [US1] Replace hard-coded `bg-white` / `border-slate-100` with semantic tokens on `src/components/layout/StudentHeader.tsx`
- [x] T014 [P] [US1] Replace hard-coded white/slate chrome with semantic tokens on `src/components/layout/StudentBottomNav.tsx`
- [x] T015 [US1] Change student portal background from `from-slate-50/50 to-white` to theme tokens in `src/app/(student)/layout.tsx`
- [x] T016 [US1] Keep/confirm `appleWebApp`, `themeColor` light/dark media, and overscroll lock in `src/app/layout.tsx`
- [x] T017 [US1] Regenerate `icon-192.png`, `icon-512.png`, and `apple-touch-icon.png` via `scripts/generate-brand-assets.mjs` if maskable/Apple assets are cropped or missing in `public/`

**Checkpoint**: MVP — installed/emulated standalone shell looks like a native frame without the drawer or tiles

---

## Phase 4: User Story 2 — Open a native profile drawer from the gear (Priority: P1)

**Goal**: Header gear opens an RTL start-side drawer with appearance, settings/upgrade, share, contact, version; bottom-tab «الإعدادات» still opens `/settings`. Offline row may be a placeholder until US6.

**Independent Test**: Student phone width → gear → switch Dark/Light/System (persists on reload) → share/contact/settings rows work → close returns to the same page → bottom tab still opens full settings.

### Tests for User Story 2

- [x] T018 [P] [US2] Add failing `[UI-013]` tests for `writeAppearance` persistence key and share payload URL `https://almoayed.app` in `tests/features/ui-013-appearance-drawer.test.ts`

### Implementation for User Story 2

- [x] T019 [P] [US2] Implement `buildAppSharePayload` and `buildSupportWhatsAppUrl` in `src/lib/native-share.ts` (or extend `src/lib/constants.ts` if T004 already owns them — do not duplicate)
- [x] T020 [US2] Create RTL `role="dialog"` drawer (inline-start, backdrop, Escape, Spekit hooks, version footer `الإصدار {APP_VERSION}`) in `src/components/student/StudentProfileDrawer.tsx` per `specs/029-native-pwa-shell/contracts/ui-components.md`
- [x] T021 [US2] Change the header gear from `Link href="/settings"` to open `StudentProfileDrawer` on `src/components/layout/StudentHeader.tsx` (keep `aria-label`)
- [x] T022 [US2] Wire appearance segmented control to `writeAppearance` + `AppearanceProvider`, settings row to `/settings`, share (`navigator.share` / clipboard toast), and contact (WhatsApp + mailto fallback) in `src/components/student/StudentProfileDrawer.tsx`

**Checkpoint**: Native control center works without tiles, motion, or offline list contents

---

## Phase 5: User Story 3 — Zaker-style dashboard tile grid (Priority: P1)

**Goal**: الرئيسية shows a 2-column card-tile grid (daily progress, tests, results, continue/next) mapped to existing destinations; hero text CTAs are absorbed.

**Independent Test**: Open `/dashboard` at ~390px with and without quizzes/results — four tappable tiles, Arabic empty states, DASH-001 hero/KPIs/rewards/tabs still visible.

### Tests for User Story 3

- [x] T023 [P] [US3] Add failing `[DASH-002]` tests for tile href mapping and empty-state copy helpers in `tests/features/dash-002-action-tiles.test.ts`

### Implementation for User Story 3

- [x] T024 [US3] Create 2-column `min-h-12` `rounded-2xl` tile grid with Spekit ids in `src/components/dashboard/DashboardActionTiles.tsx` per `specs/029-native-pwa-shell/contracts/ui-components.md`
- [x] T025 [US3] Mount tiles after the hero and pass streak/goal/continue-quiz props from `src/components/dashboard/StudentDashboardView.tsx` and `src/app/(student)/dashboard/page.tsx` if the page must supply extra fields
- [x] T026 [US3] Remove duplicate «ابدأ اختباراً» / «نتائجي» text buttons from `src/components/dashboard/StudentDashboardHero.tsx` once tiles are mounted

**Checkpoint**: Home screen reads as a study-app grid; other stories still optional

---

## Phase 6: User Story 4 — Move between student tabs like a native app (Priority: P2)

**Goal**: الرئيسية / الاختبارات / نتائجي / الإعدادات swap with a short slide/fade; bottom bar stays mounted; reduced-motion users get an instant switch.

**Independent Test**: Tap the four bottom tabs in order and reverse — no blank white-out; system Back still works; OS reduced-motion disables the slide.

### Implementation for User Story 4

- [x] T027 [P] [US4] Add 180–280ms RTL-aware enter keyframes and `prefers-reduced-motion: reduce { animation: none }` in `src/app/globals.css`
- [x] T028 [US4] Add `src/app/(student)/template.tsx` that wraps `{children}` with the enter animation class (layout chrome stays in `src/app/(student)/layout.tsx`)
- [x] T029 [US4] Wrap `router.push` in `document.startViewTransition` when available in `src/components/layout/StudentNavLink.tsx` without breaking hash-only dashboard clicks

**Checkpoint**: Tab motion works even if tiles/drawer are missing (chrome already persists)

---

## Phase 7: User Story 5 — Sticky submit and haptic taps (Priority: P2)

**Goal**: Quiz answer/submit pulses on supporting devices; submit bar stays pinned above the bottom nav and follows dark tokens; QUIZ-001 unchanged.

**Independent Test**: Start a quiz on a phone — scroll; submit stays above the tab bar; Android vibrates on answer + submit; iOS does not error; answers stay hidden until submit.

### Tests for User Story 5

- [x] T030 [P] [US5] Implement `hapticPulse` (try/catch no-op) in `src/lib/haptic.ts` and add failing-then-passing `[UI-014]` tests that missing `navigator.vibrate` does not throw in `tests/features/ui-014-haptic.test.ts`

### Implementation for User Story 5

- [x] T031 [US5] Call `hapticPulse` from `handleAnswer` and submit (state updates in the same tick), restyle the existing `bottom-16` bar with `bg-background/90` / `border-border` in `src/components/quiz/QuizRunner.tsx`

**Checkpoint**: Quiz taking feels native without depending on the drawer

---

## Phase 8: User Story 6 — Keep studying from saved offline items (Priority: P2)

**Goal**: Drawer lists this teacher’s IndexedDB quiz packages; empty/signed-out Arabic states; open uses existing OFFLINE-001 rules and QUIZ-001.

**Independent Test**: Open a quiz online → airplane mode → relaunch → drawer list shows it → never-opened quiz stays unavailable; pending sync still works.

**Depends on**: US2 drawer shell (T020–T022)

### Tests for User Story 6

- [x] T032 [P] [US6] Add `listQuizPackages({ teacherId })` (filter + `openedAt` desc; `[]` if `teacherId` null) in `src/lib/offline/quiz-cache.ts` and `[UI-013]` tests that another teacher’s packages are excluded in `tests/features/ui-013-appearance-drawer.test.ts`

### Implementation for User Story 6

- [x] T033 [US6] Create Arabic list UI (loading, empty, متابعة / بانتظار المزامنة badges, no question bodies) in `src/components/student/OfflineSavedQuizzesList.tsx`
- [x] T034 [US6] Mount the list on the drawer offline row and `router.push(/quiz/{id})` in `src/components/student/StudentProfileDrawer.tsx`

**Checkpoint**: Offline value is discoverable from the native menu

---

## Phase 9: User Story 7 — Native Add to Home Screen prompt (Priority: P3)

**Goal**: Signed-in students in a browser (not standalone) see a dismissible Arabic bottom sheet; Android can `promptInstall`; iOS gets UI-010 steps; never on `/quiz/[id]` or more than once per session / 24h.

**Independent Test**: Student home in browser → sheet → «لاحقاً» hides it; quiz page never shows it; standalone emulation never shows it; `/login` UI-010 CTAs remain.

### Tests for User Story 7

- [x] T035 [P] [US7] Implement `shouldShowA2hsSheet` / `markA2hsDismissed` in `src/lib/a2hs-prompt.ts` and add failing-then-passing `[UI-015]` eligibility cases (standalone, quiz path, 24h snooze, sessionHidden) in `tests/features/ui-015-a2hs-eligibility.test.ts`

### Implementation for User Story 7

- [x] T036 [US7] Create the sheet (reuse `usePwaInstall` + iOS/Android steps from `src/components/pwa/PwaInstallPrompt.tsx`) in `src/components/pwa/PwaInstallSheet.tsx` per `specs/029-native-pwa-shell/contracts/ui-components.md`
- [x] T037 [US7] Mount `PwaInstallSheet` from `src/app/(student)/layout.tsx` so the component self-hides on `/quiz/*`, `md+` viewports, and standalone

**Checkpoint**: In-app install reminder complements login CTAs

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Registry, regressions, quickstart gates

- [x] T038 Mark `UI-012` `UI-013` `DASH-002` `UI-014` `UI-015` `implemented` with acceptance + file lists in `.speckit/spec.yaml` (set `UI-003` icons to implemented if the icon gap is closed)
- [x] T039 [P] Finish Playwright coverage for drawer open, four tiles, sticky submit `bottom-16`, and install sheet absent when `matchMedia('(display-mode: standalone)')` in `e2e/ui-012-native-pwa-shell.spec.ts`
- [x] T040 Run `npm run lint`, `npm run typecheck`, `npm run test:unit`, and `npm run test:e2e -- e2e/ui-012-native-pwa-shell.spec.ts` using `specs/029-native-pwa-shell/quickstart.md`
- [x] T041 [P] Confirm `[QUIZ-001]` still passes via `npm run test:unit -- tests/features/quiz-001-gatekeeper.test.ts`
- [x] T042 Walk the quickstart matrix (standalone, drawer/theme, tiles, tabs, quiz sticky/haptic, offline list, A2HS, teacher regression) in `specs/029-native-pwa-shell/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (P1)**: After Phase 2 — no dependency on US2–US7
- **US2 (P1)**: After Phase 2 — independent of tiles/motion
- **US3 (P1)**: After Phase 2 — independent of drawer
- **US4 (P2)**: After Phase 2 — independent (layout already persists chrome)
- **US5 (P2)**: After Phase 2 — independent (`QuizRunner` only)
- **US6 (P2)**: After **US2** drawer shell — fills the offline row
- **US7 (P3)**: After Phase 2 — independent of drawer/tiles
- **Polish**: After desired stories

### User Story Dependencies

- **US1**: Independent after foundation (manifest + tokenized chrome)
- **US2**: Independent of US3–US5/US7; shares `StudentHeader.tsx` with US1 (tokenize first, then gear)
- **US3**: Independent; `StudentDashboardHero.tsx` only after tiles mount
- **US4**: Independent; `StudentNavLink.tsx` also used by US1 nav (safe sequential if one agent)
- **US5**: Independent
- **US6**: Requires US2 `StudentProfileDrawer.tsx`
- **US7**: Independent; student layout also touched by US1/US2 hosts — sequential if one agent

### Within Each User Story

- Tests marked in the story MUST be written and fail before implementation (except T030/T035 where helper + tests are the same task)
- Helpers before UI
- Story complete before next overlapping file

### Parallel Opportunities

- T001, T002, T003 in parallel
- T005 and T008 in parallel after T004
- T013 and T014 in parallel
- After Phase 2, different agents can take US1 chrome, US3 tiles, US4 motion, US5 quiz, US7 A2HS in parallel
- T018 and T019 in parallel
- T032 list helper in parallel with T033 list UI before T034 wire-up

---

## Parallel Example: User Story 1

```bash
# After Phase 2:
Task: "Playwright viewport/manifest smoke in e2e/ui-012-native-pwa-shell.spec.ts"
Task: "Tokenize StudentHeader.tsx"
Task: "Tokenize StudentBottomNav.tsx"
```

## Parallel Example: After foundation (multi-agent)

```bash
Task: "US3 DashboardActionTiles in src/components/dashboard/DashboardActionTiles.tsx"
Task: "US5 hapticPulse in src/lib/haptic.ts"
Task: "US7 shouldShowA2hsSheet in src/lib/a2hs-prompt.ts"
Task: "US4 template.tsx motion"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Standalone/emulated shell + tokenized chrome
5. Demo if ready (drawer can follow)

### Incremental Delivery

1. Setup + Foundational → theme + root SW
2. US1 → native frame (MVP)
3. US2 → profile drawer (P1 control center)
4. US3 → dashboard tiles (P1 home)
5. US4 → tab motion
6. US5 → quiz haptics/sticky polish
7. US6 → offline list in drawer
8. US7 → in-app A2HS sheet
9. Polish → registry + CI + quickstart

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Then:
   - Dev A: US1 manifest/chrome (owns `layout.tsx` / header)
   - Dev B: US3 tiles (`DashboardActionTiles` / dashboard view)
   - Dev C: US5 haptic + QuizRunner
   - Dev D: US4 template + US7 A2HS (student layout last)
3. US2 drawer after US1 header tokenize; US6 after US2

---

## Notes

- `[P]` only when files do not conflict
- No new npm dependencies (`next-themes`, Workbox, Sheet/Vaul)
- No SQL migrations
- Saved list **must** filter `currentTeacherId` (MT-002)
- Cached packages stay exam-only (QUIZ-001)
- SW must not intercept Server Action POST
- Login UI-010 install CTAs stay
- Teachers: shared shell only — no drawer/tiles/sheet
- Next: `/speckit-implement`
