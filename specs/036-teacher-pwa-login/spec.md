# Feature Specification: Teacher Portal PWA Login

**Feature Branch**: `036-teacher-pwa-login`

**Created**: 2026-09-24

**Status**: Draft

**Feature IDs**: `UI-021` (teacher portal install package & standalone entry) · `UI-022` (teacher login shell parity with student login)

**Extends**: `UI-010` · `UI-012` · `UI-020` · `AUTH-002` · `AUTH-009`

**Input**: User description: "Replicate the exact same student portal PWA architecture, design language, and recent UI/UX updates for the Teacher Portal login page (`/teacher/login`), while making it completely separate with distinct configuration, theme colors, and icons: dedicated teacher Web App Manifest and install identity; distinct non-green theme/background colors; separate home-screen icons; `start_url` at `/teacher/login` with standalone routing guard (iOS standalone + display-mode); sticky compact header with tight spacing; browser-only Home control hidden when installed; app version at the bottom of the login container; RTL/touch/responsive polish matching the student portal."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Install Teacher Portal as its own home-screen app (Priority: P1)

A teacher on a phone opens Teacher Login and adds المؤيد للمدرسين (or an equivalent teacher-branded label) to the home screen. The installed shortcut uses teacher-specific icons and theme colors that are clearly different from the student app (not the student green package). Opening that shortcut launches directly into Teacher Login in a full-screen standalone frame, not the marketing home page or the student login.

**Why this priority**: Without a separate install identity and correct entry URL, teachers either share the student app icon or land on the wrong screen—blocking the entire teacher portal experience when used as an installed app.

**Independent Test**: From `/teacher/login` on a supported phone browser, add to home screen; confirm distinct icon/label/theme; launch the installed shortcut and land on Teacher Login in standalone mode. Confirm the existing student install path and student icons are unchanged.

**Acceptance Scenarios**:

1. **Given** a visitor on Teacher Login in a supported mobile browser, **When** they add the Teacher Portal to the home screen, **Then** the home-screen icon and install identity are teacher-specific (distinct artwork from the student app) and the visible theme/background colors use a professional non-green accent (e.g. dark/indigo family), not the student brand-green package.
2. **Given** that teacher install was completed, **When** the teacher opens the app from the home-screen icon, **Then** it launches in a standalone full-screen frame (no browser address bar) starting at Teacher Login (`/teacher/login`).
3. **Given** the same device may also have the student app installed, **When** both icons are on the home screen, **Then** a teacher can tell them apart by icon and/or label without opening either app.
4. **Given** Teacher Login is viewed in the browser (not yet installed), **When** the page loads, **Then** the page’s install/theme chrome advertises the teacher package (teacher theme color and teacher manifest linkage), not the student green install package.
5. **Given** the student login and student install flow (`UI-010` / `UI-012`), **When** this feature ships, **Then** student install identity, student icons, student theme colors, and student start behavior remain unchanged.

---

### User Story 2 - Standalone launch always opens Teacher Login (Priority: P1)

A teacher who installed the Teacher Portal opens it from the home screen. Even if the last browser visit was the marketing site or another public page, the standalone session opens Teacher Login. A client-side standalone routing guard detects installed mode (standard standalone display mode and iOS home-screen standalone) and keeps the teacher from being dropped on the marketing home page.

**Why this priority**: Incorrect start destination is a hard launch-blocker for daily teacher use; it must work on both Android-style standalone and iOS home-screen mode.

**Independent Test**: Install the teacher app; from a cold start, open the home-screen icon; confirm Teacher Login. Repeat after previously visiting `/` in the browser. Simulate or exercise both standard standalone display-mode and iOS standalone detection.

**Acceptance Scenarios**:

1. **Given** the Teacher Portal was installed with start destination Teacher Login, **When** the teacher cold-starts the app from the home-screen icon, **Then** the first meaningful screen is Teacher Login—not the marketing landing page and not student login.
2. **Given** the app is running in installed standalone mode (including iOS home-screen standalone), **When** a launch would otherwise surface the marketing home page, **Then** the standalone routing guard redirects or lands the teacher on Teacher Login instead.
3. **Given** the same site opened in a normal browser tab (not installed), **When** the visitor navigates to `/` or other public pages, **Then** normal browser navigation is unchanged (the guard does not force Teacher Login on ordinary browsing).
4. **Given** a teacher who is already signed in and opens the installed teacher app, **When** session routing applies, **Then** they still reach the appropriate teacher destination without being stuck on a public marketing page; signed-out teachers see Teacher Login.

---

### User Story 3 - Use a compact Teacher Login shell like Student Login (Priority: P1)

A teacher opens `/teacher/login` on a phone. They see a sticky/fixed compact brand header with tight spacing so the login card sits close under the header without a large empty gap that forces unnecessary scrolling. In a regular browser, a minimalist Home control returns to the marketing landing page; when the same page is opened as an installed PWA, that Home control is strictly hidden. The app version appears clearly at the bottom of the login container.

**Why this priority**: This is the day-to-day first screen for teachers; matching the student portal’s recent login density and PWA chrome rules is the core UX parity ask.

**Independent Test**: Open `/teacher/login` at phone width in a browser: sticky header, tight gap, Home visible, version visible. Open the same URL in standalone/installed mode: Home hidden, version still visible, no large empty scroll gap.

**Acceptance Scenarios**:

1. **Given** Teacher Login on a typical phone width in a browser, **When** the page paints, **Then** a compact brand header stays sticky/fixed at the top while the teacher scrolls the form.
2. **Given** that header and the teacher login card, **When** they are laid out, **Then** vertical whitespace between header and card is tight (parity with the optimized student login), so the primary email/password fields are reachable without an unnecessary long empty scroll.
3. **Given** Teacher Login in a regular browser (not standalone / not iOS home-screen standalone), **When** the header is shown, **Then** a minimalist circular Home control is available (opposite the logo) with an accessible Arabic label such as «العودة للصفحة الرئيسية», and activating it goes to the marketing landing page (`/`).
4. **Given** Teacher Login opened as an installed standalone app (display-mode standalone or iOS `navigator.standalone`), **When** the header is shown, **Then** the Home control is strictly omitted (and logo does not act as a home escape that undermines the installed teacher root).
5. **Given** the login container, **When** the teacher scrolls to or views the bottom of the form area, **Then** the release version is clearly shown (same version indicator style family as student login / `UI-020`, e.g. `v{version}`).
6. **Given** existing teacher recovery actions on the page (`AUTH-009`: back to main login, forgot password, magic link), **When** the shell is updated, **Then** those flows remain available and usable; visual polish does not remove them.

---

### User Story 4 - Feel polished RTL and touch-friendly on Teacher Login (Priority: P2)

A teacher uses Teacher Login on a phone with Arabic RTL layout. Inputs, buttons, and spacing feel as polished as the student portal login: large enough touch targets, correct RTL alignment, and responsive fields that remain usable in landscape and common phone widths without horizontal page scrolling or cramped controls.

**Why this priority**: Completes parity and quality bar; the feature still delivers install + shell value if shipped slightly after P1 stories.

**Independent Test**: Walk Teacher Login on ~360–430px RTL phone widths and a short landscape pass; confirm alignment, tap targets, and no broken overflow; compare side-by-side with student login density/feel.

**Acceptance Scenarios**:

1. **Given** Teacher Login in Arabic RTL, **When** the header, form fields, primary action, and secondary recovery links are shown, **Then** text and controls align correctly for RTL (start/end sides make sense; no LTR-only icon or gap regressions).
2. **Given** primary fields and actions, **When** the teacher taps them on a phone, **Then** targets are comfortably tappable (consistent with the platform’s large touch-target practice) and do not feel cramped relative to student login.
3. **Given** common phone widths, **When** the page is viewed, **Then** inputs and the login card resize responsively without forcing horizontal scrolling of the page.
4. **Given** light and dark appearance where the page already supports them, **When** Teacher Login is shown, **Then** teacher theme accents remain distinct from the student green package while text contrast stays readable.

---

### Edge Cases

- Teacher opens an old shared bookmark to `/` while the teacher PWA is installed: standalone guard still prefers Teacher Login; ordinary browser tabs to `/` still show marketing.
- Teacher has both student and teacher apps installed: icons/labels/themes remain distinguishable; installing one does not overwrite the other’s identity.
- Teacher Login opened inside an in-app browser that does not support install prompts: page remains fully usable for email/password and recovery; missing install UI does not block sign-in.
- iOS home-screen mode without standard `display-mode: standalone` media query: Home control still hides and start behavior still treats the session as installed.
- Signed-in teacher cold-starts the installed teacher app: they are not forced to remain on login if existing session routing already sends them to the teacher dashboard; they are never dumped on marketing home.
- Very short viewports / large system font scaling: sticky header and version remain usable; form remains scrollable without large decorative empty gaps.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose a dedicated Teacher Portal install package (separate Web App Manifest / install configuration) linked from Teacher Login, independent of the student install package.
- **FR-002**: Teacher install package MUST declare Teacher Login as the explicit start destination (`/teacher/login`).
- **FR-003**: Teacher install package MUST use distinct theme color and background color values that are not the student brand-green theme (professional dark/indigo or equivalent distinctive teacher accent).
- **FR-004**: Teacher install package MUST provide separate home-screen / touch icons so the installed teacher app is visually distinguishable from the student app on the device.
- **FR-005**: System MUST apply a client-side standalone routing guard for the teacher install experience that detects installed mode via standard standalone display-mode and iOS home-screen standalone, and prevents marketing-home landings on installed teacher launches.
- **FR-006**: Standalone routing guard MUST NOT alter normal browser (non-installed) navigation to the marketing site or other public pages.
- **FR-007**: Teacher Login MUST present a sticky/fixed compact brand header on mobile with reduced vertical gap above the login card, matching the density of the optimized student login shell.
- **FR-008**: In non-installed browser sessions, Teacher Login MUST show a minimalist Home control in the header that navigates to the marketing landing page.
- **FR-009**: In installed standalone sessions (including iOS home-screen standalone), Teacher Login MUST strictly hide the Home control.
- **FR-010**: Teacher Login MUST display the app release version clearly at the bottom of the login container.
- **FR-011**: Teacher Login MUST preserve existing teacher authentication and recovery capabilities (`AUTH-002` / `AUTH-009`) while applying the shell and PWA updates.
- **FR-012**: Teacher Login MUST remain Arabic RTL, touch-friendly, and responsively usable on common phone widths at parity with student login polish.
- **FR-013**: Student Portal install package, student icons, student theme colors, and student login shell behavior (`UI-010` / `UI-012` / `UI-020` on `/login`) MUST remain unchanged.

### Key Entities

- **Teacher Install Package**: The installable Teacher Portal identity (name/label, icons, theme/background colors, start destination) advertised from Teacher Login and used when the teacher adds the app to the home screen.
- **Student Install Package**: The existing student/home-screen identity (`UI-010` / `UI-012`); remains separate and must not be replaced by the teacher package.
- **Standalone Session**: A launch where the app runs without browser chrome, detected via standalone display-mode and/or iOS home-screen standalone; drives Home-control hiding and teacher start routing.
- **Teacher Login Shell**: The mobile header + login card + version footer composition on `/teacher/login`, aligned with student login density and PWA chrome rules.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a supported phone, a teacher can add Teacher Portal from `/teacher/login` and, within one cold start from the home-screen icon, land on Teacher Login in standalone mode 100% of test launches (not marketing home, not student login).
- **SC-002**: Side-by-side on one device, student and teacher installed icons are distinguishable by icon and/or label in every reviewed install test (no identical student-green packaging for the teacher app).
- **SC-003**: On a ~390px-wide phone browser, Teacher Login shows the sticky compact header and keeps the first primary field reachable with no large empty scroll gap comparable to the pre-optimization teacher layout (parity with student login density).
- **SC-004**: In browser mode the Home control is visible and reaches `/`; in installed standalone mode (including iOS standalone) the Home control is absent in 100% of reviewed cases.
- **SC-005**: The release version string is visible on Teacher Login without opening Settings, in both browser and installed modes.
- **SC-006**: Existing teacher sign-in and recovery paths (password login, forgot password, magic link, back to main login) complete successfully after the shell/PWA changes in regression checks.
- **SC-007**: Student install and student login chrome pass unchanged smoke checks after teacher PWA work ships.

## Assumptions

- Scope is Teacher Login install identity + standalone entry + login shell parity; a full redesign of all signed-in teacher dashboard chrome is out of scope unless required to honor standalone start routing.
- Teacher theme colors follow a professional dark/indigo (or clearly non-green) accent family; exact hex tokens can be chosen during planning as long as they are distinct from student brand-green.
- App version on Teacher Login reuses the same release version already shown on student login / settings (`UI-020`), not a separate teacher versioning scheme.
- Teacher authentication credentials, device lock, and inactive-account rules remain as today (`AUTH-002` / `AUTH-003` / `AUTH-007` / `AUTH-009`).
- “Completely separate” means separate install configuration and visual identity, not a separate deployed host or domain.
- Student PWA start behavior and student homepage standalone guard remain the source of truth for the student app; this feature adds a parallel teacher path rather than replacing the student path.
- Install prompts / “Add to Home Screen” guidance on Teacher Login may mirror the student login install UX patterns where useful, but must advertise the teacher package.
- Spekit DOM hooks will be added for new teacher PWA/login-shell controls during implementation (ENABLE-001), following project convention.
