---
description: "Task list for UI-021 / UI-022 Teacher Portal PWA Login"
---

# Tasks: Teacher Portal PWA Login (UI-021 · UI-022)

**Input**: Design documents from `/specs/036-teacher-pwa-login/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — plan requires Vitest `[UI-021]` / `[UI-022]`, Playwright smoke, and an update to `tests/features/ui-020-app-version.test.ts` (teacher login must show `AppVersion`).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US4)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js app: `src/`, `public/`, `tests/`, `e2e/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Registry, Spekit hooks, and teacher brand constants shared by all stories

- [x] T001 [P] Add draft `UI-021` and `UI-022` entries (status `partial`) in `.speckit/spec.yaml` linking `specs/036-teacher-pwa-login/`, route `/teacher/login`, extends `UI-010` `UI-012` `UI-020` `AUTH-002` `AUTH-009`, and planned file/Spekit lists from `plan.md`
- [x] T002 [P] Add Spekit keys in `src/lib/spekit-targets.ts` and mirror in `.speckit/spekit-targets.yaml`: `teacherLoginBrandHeader`, `teacherLoginLandingBack`, `teacherPwaInstallButtons`, `teacherPwaInstallAndroid`, `teacherPwaInstallIos`, `teacherPwaInstallModal` (string values matching contracts)
- [x] T003 [P] Add teacher brand constants in `src/lib/constants.ts`: `TEACHER_APP_NAME` (e.g. «المؤيد للمدرسين»), `TEACHER_APP_SHORT_NAME`, `TEACHER_APP_THEME_COLOR` (`#4f46e5` or research indigo), keep student `APP_THEME_COLOR` unchanged

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Portal hint helper + teacher icon generation pipeline used by install and standalone stories

**⚠️ CRITICAL**: No user story work that depends on icons/portal hint until this phase completes

- [x] T004 Create `src/lib/pwa-portal.ts` with `PwaPortal` type (`"student" | "teacher"`), storage key `almoayed-pwa-portal`, `setPwaPortal(portal)`, `getPwaPortal(): PwaPortal` (default `"student"` when missing/SSR-safe)
- [x] T005 Extend `scripts/generate-brand-assets.mjs` (and template if needed) to emit indigo teacher assets `public/teacher-icon-192.png`, `public/teacher-icon-512.png`, `public/teacher-apple-touch-icon.png` without overwriting student icons; run the script once to write the PNGs
- [x] T006 [P] Add Vitest `[UI-021]` coverage for portal hint helpers in `tests/features/ui-021-teacher-pwa.test.ts` (get/set/default) — must fail or be incomplete until T004 lands, then pass

**Checkpoint**: Foundation ready — constants, Spekit, portal helper, and teacher icon files exist

---

## Phase 3: User Story 1 — Install Teacher Portal as its own home-screen app (Priority: P1) 🎯 MVP

**Goal**: Teacher Login advertises a separate install package (manifest, indigo theme, teacher icons) so Add to Home Screen creates a distinct teacher app without changing the student package.

**Independent Test**: On `/teacher/login`, document links `/teacher-manifest.json` and indigo theme-color; Application → Manifest shows `start_url` `/teacher/login` and teacher icons; `/login` still uses `/manifest.json` + teal `#0d9488`.

### Implementation for User Story 1

- [x] T007 [P] [US1] Create `public/teacher-manifest.json` per `specs/036-teacher-pwa-login/contracts/pwa-manifest.md` (`id` `/teacher`, teacher name/short_name from constants, `start_url` `/teacher/login`, `scope` `/`, `theme_color` = `TEACHER_APP_THEME_COLOR`, teacher icon paths, `lang` `ar`, `dir` `rtl`)
- [x] T008 [P] [US1] Create `src/app/teacher/login/layout.tsx` exporting Next.js `metadata` / `viewport`: `manifest: "/teacher-manifest.json"`, teacher `themeColor`, apple icons pointing at `/teacher-apple-touch-icon.png` (do not change root `src/app/layout.tsx` student manifest)
- [x] T009 [US1] Extend `src/components/pwa/PwaInstallPrompt.tsx` with `variant?: "student" | "teacher"` (default `student`): teacher uses indigo/`TEACHER_APP_THEME_COLOR` CTA chrome and Spekit `teacherPwaInstall*` ids; student defaults unchanged
- [x] T010 [US1] Mount `<PwaInstallPrompt variant="teacher" />` on Teacher Login (temporarily in current `src/app/teacher/login/page.tsx` or early form extract) so install CTAs appear when `ready && !installed`
- [x] T011 [P] [US1] Extend `public/sw.js` precache list to include `/teacher-manifest.json` and teacher icon URLs; bump cache name version when precache set changes
- [x] T012 [P] [US1] Assert teacher vs student manifest contracts in `tests/features/ui-021-teacher-pwa.test.ts` (parse JSON files: distinct `start_url`, theme colors, icon paths; student `public/manifest.json` untouched)

**Checkpoint**: MVP install identity — teacher package is linkable and distinguishable; student package unchanged

---

## Phase 4: User Story 2 — Standalone launch always opens Teacher Login (Priority: P1)

**Goal**: Installed teacher sessions do not stick on marketing `/`; cold start uses `/teacher/login`, and standalone visits to `/` respect the teacher portal hint.

**Independent Test**: Set portal hint to `teacher`, emulate standalone on `/` → client navigates to `/teacher/login`; hint `student` or missing → `/login`; non-standalone `/` unchanged.

### Implementation for User Story 2

- [x] T013 [US2] Extend `src/components/pwa/PwaStandaloneEntryRedirect.tsx` to `router.replace` `/teacher/login` when `isPwaStandalone()` and `getPwaPortal() === "teacher"`, else `/login` (preserve existing student behavior as default)
- [x] T014 [US2] Call `setPwaPortal("teacher")` when Teacher Login shell/page mounts (client effect in form or small `PwaPortalMarker` used by teacher login); call `setPwaPortal("student")` from student login shell/form mount in `src/app/login/` so hints stay accurate
- [x] T015 [P] [US2] Extend `tests/features/ui-021-teacher-pwa.test.ts` with `[UI-021]` cases for portal-aware redirect target selection (pure helper extract from redirect if needed, or document portal+target mapping)

**Checkpoint**: Standalone entry routing is portal-aware; FR-005/FR-006 satisfied

---

## Phase 5: User Story 3 — Compact Teacher Login shell like Student Login (Priority: P1)

**Goal**: `/teacher/login` matches student login density: sticky compact indigo header, tight gap to card, browser-only Home, version footer; AUTH-009 flows preserved.

**Independent Test**: Phone browser — sticky header, Home visible, tight layout, `v{version}` at footer; emulate standalone — Home absent; forgot/magic/back-to-main-login still work.

### Implementation for User Story 3

- [x] T016 [P] [US3] Create `src/components/login/TeacherLoginBrandingPanel.tsx` mirroring `LoginBrandingPanel` structure with indigo/slate gradient, Spekit `teacherLoginBrandHeader`, compact sticky `top-0 z-40` mobile mode, composing `LoginBrandHomeLink` + Home control wired to Spekit `teacherLoginLandingBack` (hide when `ready && installed` via existing `LoginLandingNav` / `usePwaInstall` patterns)
- [x] T017 [P] [US3] Create `src/app/teacher/login/teacher-login-page-shell.tsx` mirroring `src/app/login/login-page-shell.tsx` (desktop two-column + mobile compact panel + children)
- [x] T018 [US3] Extract client form from `src/app/teacher/login/page.tsx` into `src/app/teacher/login/teacher-login-form.tsx` (preserve AUTH-009 modes, Spekit recovery hooks, `HubToast`, actions); layout `items-start` + tight top padding (`pt-3` parity); footer copyright + `<AppVersion />`; keep `<PwaInstallPrompt variant="teacher" />`
- [x] T019 [US3] Refactor `src/app/teacher/login/page.tsx` to a server component: session check redirect signed-in teachers to teacher dashboard (parity with `src/app/login/page.tsx`); wrap `<TeacherLoginForm />` in `<TeacherLoginPageShell>`
- [x] T020 [US3] Remove obsolete `BrandHeader` / loose vertical centering from teacher login path; ensure AUTH-009 «العودة لتسجيل الدخول الرئيسي» remains available without conflicting with browser Home (Home → `/`, back control → `/login` as today)
- [x] T021 [P] [US3] Update `tests/features/ui-020-app-version.test.ts` to **require** `AppVersion` / version usage on teacher login files; add `tests/features/ui-022-teacher-login-shell.test.ts` with `[UI-022]` contracts for sticky/compact class flags, Home gating helpers, and Spekit ids present in teacher branding/form sources

**Checkpoint**: Teacher Login shell parity with UI-010 density + UI-020 version; recovery intact

---

## Phase 6: User Story 4 — Polished RTL and touch-friendly Teacher Login (Priority: P2)

**Goal**: Arabic RTL alignment, large touch targets, and responsive inputs match student login polish on common phone widths.

**Independent Test**: ~360–430px RTL — no horizontal scroll; fields/buttons `h-10`–`h-12` / `size="touch"`; header Home vs logo sides coherent; light/dark readable with indigo accents.

### Implementation for User Story 4

- [x] T022 [US4] Audit and fix RTL/`text-start` alignment on `TeacherLoginBrandingPanel`, `teacher-login-form.tsx`, and install CTAs so controls mirror student login start/end sides without LTR regressions
- [x] T023 [US4] Ensure primary inputs/buttons on `teacher-login-form.tsx` use touch-friendly sizing (`size="touch"` / `h-10`–`h-12`) and the card remains responsive without page-level horizontal overflow at ~360px
- [x] T024 [P] [US4] Spot-check light/dark contrast on indigo teacher header + form surfaces; adjust Tailwind classes only within teacher login shell files (do not retint signed-in teacher portal `brand-*`)

**Checkpoint**: US4 polish complete without breaking US1–US3 behavior

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: E2E, registry completion, student regression, quickstart gates

- [x] T025 [P] Add Playwright coverage in `e2e/ui-021-teacher-pwa-login.spec.ts`: phone viewport `/teacher/login` asserts teacher Spekit brand header, Home visible in browser, version text `v`, install region when not standalone; optional standalone emulation hides Home; `/login` still student emerald path smoke
- [x] T026 Mark `UI-021` and `UI-022` `implemented` in `.speckit/spec.yaml` with full acceptance criteria, file lists, and Spekit ids from contracts
- [x] T027 [P] Confirm student paths unchanged: `public/manifest.json`, `src/components/login/LoginBrandingPanel.tsx` emerald classes, default `PwaInstallPrompt` student Spekit ids — revert accidental diffs
- [x] T028 Run `specs/036-teacher-pwa-login/quickstart.md` manual checks + `npm run lint && npm run typecheck && npm run build` and unit/e2e commands listed in quickstart

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** US1–US4 work that needs icons/portal helper
- **User Story 1 (Phase 3)**: Depends on Foundational — **MVP** (install package)
- **User Story 2 (Phase 4)**: Depends on T004; works with or after US1 (manifest `start_url` strengthens cold start)
- **User Story 3 (Phase 5)**: Depends on Setup Spekit/constants; should follow US1 so install CTAs live in the new form; integrates portal marker from US2
- **User Story 4 (Phase 6)**: Depends on US3 shell existing (same teacher login files — sequential after T021)
- **Polish (Phase 7)**: Depends on US1–US4 implementation tasks

### User Story Dependencies

- **User Story 1 (P1)**: After T003–T005 — no dependency on shell rewrite
- **User Story 2 (P1)**: After T004; independent of full shell; coordinate T014 with US3 mount points
- **User Story 3 (P1)**: After Spekit/constants; consumes US1 install prompt variant; sets portal hint (US2)
- **User Story 4 (P2)**: After US3 files exist — polish-only on those files

### Within Each User Story

- Prefer contract/unit assertions alongside implementation where marked
- Manifest/icons before layout linkage (US1)
- Shell panel + page shell before form extract + server page (US3)
- Story complete before next priority when sharing the same files

### Parallel Opportunities

- T001, T002, T003 in parallel (Setup)
- T007 + T008 after icons exist; T011 + T012 in parallel with T009 once T007 exists
- T016 + T017 in parallel before T018
- T021, T025, T027 in parallel during polish (different files)

---

## Parallel Example: User Story 1

```bash
# After foundational icons (T005):
Task: "Create public/teacher-manifest.json per contracts/pwa-manifest.md"
Task: "Create src/app/teacher/login/layout.tsx with teacher metadata"

# After manifest exists:
Task: "Extend public/sw.js precache for teacher assets"
Task: "Assert teacher vs student manifest contracts in tests/features/ui-021-teacher-pwa.test.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Create TeacherLoginBrandingPanel.tsx (indigo sticky header)"
Task: "Create teacher-login-page-shell.tsx"
# Then sequentially:
Task: "Extract teacher-login-form.tsx"
Task: "Refactor page.tsx to server + shell"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (manifest + layout + install variant)
4. **STOP and VALIDATE**: Teacher vs student install packages distinguishable
5. Demo install identity even before shell rewrite

### Incremental Delivery

1. Setup + Foundational → shared primitives ready
2. US1 → separate teacher PWA identity (MVP)
3. US2 → standalone portal routing
4. US3 → compact login shell + version + Home gating
5. US4 → RTL/touch polish
6. Polish → e2e, registry `implemented`, quickstart + build

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After Foundational:
   - Developer A: US1 (manifest/layout/SW/tests)
   - Developer B: US2 (portal redirect + markers)
3. US3 should be single-threaded on teacher login files after US1 install variant exists
4. US4 after US3

---

## Notes

- [P] tasks = different files, no incomplete dependencies
- [Story] label maps to US1–US4 from `spec.md`
- Do not modify student `public/manifest.json` or emerald `LoginBrandingPanel` styling
- Preserve AUTH-009 recovery Spekit ids and Server Actions
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
- Next command: `/speckit-implement`
