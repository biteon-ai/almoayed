# Feature Specification: Native Home-Screen App Experience

**Feature Branch**: `029-native-pwa-shell`

**Created**: 2026-09-20

**Status**: Draft

**Feature IDs**: `UI-012` (standalone home-screen shell) · `UI-013` (native profile drawer) · `DASH-002` (dashboard action tiles) · `UI-014` (native tab motion, haptics, sticky quiz actions) · `UI-015` (in-app add-to-home-screen sheet)

**Extends**: `UI-001` · `UI-003` · `UI-010` · `OFFLINE-001` · `DASH-001` · `PROFILE-001` · `QUIZ-001` · `TIER-001`/`TIER-002`

**Input**: User description: "Refactor and enhance Al-Moayed (almoayed.app) so it feels like a native educational mobile app (inspired by Zaker): standalone home-screen shell, locked mobile viewport, native profile drawer with theme / offline items / upgrade / share / contact / version, Zaker-style dashboard card tiles, smooth tab transitions, haptic feedback, sticky quiz submit bar, stronger offline availability, and a custom Add to Home Screen bottom sheet."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Launch as a full-screen home-screen app (Priority: P1)

A student or teacher adds المؤيد to the phone home screen and opens it. The app fills the device frame: brand name and icons look correct on iOS and Android, the surrounding chrome matches the Al-Moayed colors, the browser address bar is gone, pinch-zoom and rubber-band bounce do not pull the layout off the “native” frame, and safe areas (notch / home indicator) remain usable.

**Why this priority**: Without a convincing installed shell, later native UI (drawer, tiles, animations) still feels like a website. This is the foundation of the Zaker-like experience.

**Independent Test**: Add the app to the home screen on a typical Android phone and an iPhone, launch it, and confirm full-screen framing, correct icons, matching background/status colors, and no pinch-zoom or overscroll bounce of the app chrome. Existing login and student/teacher flows still open.

**Acceptance Scenarios**:

1. **Given** a visitor or signed-in user on a supported phone browser, **When** they add المؤيد to the home screen, **Then** the home-screen icon uses a complete, sharp icon set suitable for both iOS and Android (including the Apple touch icon), and the label reads «المؤيد».
2. **Given** the app was added to the home screen, **When** the user opens it from the icon, **Then** it launches in a standalone full-screen frame without the browser address bar or browser tabs.
3. **Given** that standalone launch, **When** the first screen paints, **Then** the status/background colors match the current Al-Moayed theme (light or dark), not a mismatched white/black flash that looks like a different product.
4. **Given** the app is open in that full-screen frame, **When** the user tries to pinch-zoom or fling-scroll past the top/bottom of a main student screen, **Then** the layout stays locked to the device frame (no document zoom, no rubber-band revealing a browser backdrop).
5. **Given** a device with a notch or home-indicator inset, **When** the shell is shown, **Then** header, content, and bottom navigation remain tappable and not hidden under system UI.
6. **Given** a user who needs larger text via the phone’s accessibility / display-size settings, **When** they open the app, **Then** system-level text scaling still applies; only in-app pinch-zoom of the page is disabled.

---

### User Story 2 - Open a native profile drawer from the gear (Priority: P1)

A signed-in student taps the settings gear in the header and a sliding or full-screen native menu appears (dark, clean cards, RTL, educational-app style similar to Zaker). From that menu they can switch appearance (Dark / Light / System), open offline saved quizzes, go to profile/upgrade, share the app, contact the platform, and see the current app version at the bottom. Closing the menu returns them to the same screen.

**Why this priority**: This is the new “native app” control center. It is independently valuable even if dashboard tiles and motion ship later.

**Independent Test**: Sign in as a student on a phone-width screen, tap the header gear, walk each menu row, change theme, and dismiss the menu without losing the page underneath.

**Acceptance Scenarios**:

1. **Given** a signed-in student on a phone, **When** they tap the header gear icon, **Then** a native drawer or full-screen profile menu opens from the start side (RTL) instead of immediately navigating away; the page behind stays in place.
2. **Given** the menu is open, **When** they view it, **Then** they see Arabic rows for: appearance (Dark / Light / System), offline saved items, account upgrade / profile settings, share app, and contact us, with the app version (for example «الإصدار 1.0.1») pinned at the bottom.
3. **Given** the appearance row, **When** they choose Dark, Light, or System, **Then** the visible app chrome updates immediately and the choice persists on that device after closing and reopening the app.
4. **Given** System appearance, **When** the phone’s light/dark setting changes, **Then** the app follows the phone until the student picks Light or Dark explicitly.
5. **Given** «ترقية الحساب / إعدادات الملف», **When** they activate it, **Then** they reach the existing profile/settings and upgrade experience (`PROFILE-001`, `TIER-002`) without a duplicate settings product.
6. **Given** «مشاركة التطبيق», **When** they activate it, **Then** they can share a short Arabic invite plus `https://almoayed.app` (device share sheet when available; otherwise a copy-link success message).
7. **Given** «تواصل معنا», **When** they activate it, **Then** they reach the platform’s existing support channel (WhatsApp or the contact path already used on marketing/login), in Arabic.
8. **Given** the menu is open, **When** they tap outside it, swipe it closed, or activate the close control, **Then** it dismisses and focus returns to the previous student screen; the bottom tabs remain usable.
9. **Given** the existing bottom tab «الإعدادات», **When** they use it, **Then** the full settings page still opens as today (`PROFILE-001` is not replaced by the drawer).

---

### User Story 3 - Use a Zaker-style dashboard tile grid (Priority: P1)

A signed-in student opens الرئيسية and sees quick actions as large tappable card tiles (not a thin row of text links): daily progress, quizzes/interactive tests, results/summary, and continue-learning / next study. Tiles use the same clean card language as native educational apps, remain RTL, and deep-link to capabilities the student already has.

**Why this priority**: The home screen is the first impression after install. Tiles make the dashboard feel like a study app rather than a long web page, while reusing existing student destinations.

**Independent Test**: Open `/dashboard` on a ~390px-wide phone as a student with and without quizzes/results; confirm a tile grid is visible above the fold or after a short scroll, each tile navigates correctly, and existing hero/stats/rewards content still makes sense.

**Acceptance Scenarios**:

1. **Given** a signed-in student on الرئيسية, **When** the dashboard loads, **Then** quick actions appear as a grid of card tiles (not only small text buttons in the welcome banner).
2. **Given** those tiles, **When** they are shown, **Then** they include at least: daily progress (streak / daily goal), interactive tests (الاختبارات), a results or performance summary entry, and a continue/next-study entry mapped to the existing continue-learning quiz when one exists.
3. **Given** a tile, **When** the student taps it, **Then** they land on the matching existing student surface (quizzes list, results, continue quiz, or a progress/weak-points view) without inventing a new content library or calendar product.
4. **Given** empty states (no quizzes, no results, daily goal not started), **When** tiles render, **Then** each tile remains tappable and shows a calm Arabic empty/next-step hint instead of a broken or blank card.
5. **Given** a typical phone width, **When** the grid is shown, **Then** tiles are easy to tap (at least the platform’s usual large touch target), sit in a compact 2-column (or equivalent) grid, and do not require horizontal page scrolling.
6. **Given** existing dashboard blocks (welcome, KPIs, quiz carousel, rewards hall, scores/weak-points/teachers tabs), **When** tiles are added, **Then** those blocks remain available; tiles replace or absorb the old quick-action link cluster rather than hiding core `DASH-001` information.

---

### User Story 4 - Move between student tabs like a native app (Priority: P2)

A student taps الرئيسية، الاختبارات، نتائجي، الإعدادات in the bottom bar. The destination appears with a short slide or fade. They do not see a hard blank browser reload. Back/forward still works. Reduced-motion users get an instant switch without animation.

**Why this priority**: Tab motion is what makes the shell feel native day-to-day, but the app is still usable with today’s navigation if this ships after the drawer and tiles.

**Independent Test**: On a phone, tap each of the four student tabs in order and reverse; confirm Arabic labels, active state, no full white-out reload, and that browser/system back returns to the previous tab.

**Acceptance Scenarios**:

1. **Given** a signed-in student, **When** they switch among الرئيسية، الاختبارات، نتائجي، الإعدادات, **Then** the new screen arrives with a short directional slide or fade rather than a blank full-page flash.
2. **Given** a tab switch, **When** it completes, **Then** the correct tab is marked active, scroll position of the previous tab is not required to be restored in v1, and the bottom bar never unmounts or jumps.
3. **Given** the user activates system Back after switching tabs, **When** history allows, **Then** they return to the previous student tab/screen.
4. **Given** the device requests reduced motion, **When** tabs change, **Then** the switch is instant (no slide), still without a blank reload.

---

### User Story 5 - Take a quiz with sticky submit and haptic taps (Priority: P2)

A student in an active quiz taps answer choices and the primary submit control «تسليم الإجابات وإنهاء الاختبار». On phones that support vibration, each of those actions gives a short haptic pulse. The submit bar stays pinned just above the bottom navigation so they never lose the finish action behind the tab bar or under the last question.

**Why this priority**: Quiz taking is the core academic loop; native feel here matters, but it depends on the shell already being full-screen.

**Independent Test**: Start a quiz on a phone with bottom navigation visible; scroll through questions; tap answers; confirm the submit control stays above the tab bar; on a vibration-capable device, feel a short pulse on answer and submit without delaying the action.

**Acceptance Scenarios**:

1. **Given** an in-progress student quiz on a phone, **When** the student scrolls the question list, **Then** the primary finish action («تسليم الإجابات وإنهاء الاختبار» or the current equivalent) stays pinned above the bottom navigation and remains fully tappable.
2. **Given** that sticky bar, **When** a timed quiz also shows a timer, **Then** the timer remains readable and does not cover the submit control or answer choices (`QUIZ-004` still holds).
3. **Given** a device that supports haptic/vibration feedback, **When** the student selects an answer option, **Then** they feel a short confirmation pulse and the selection still registers immediately.
4. **Given** the same device, **When** they tap submit (or other primary quiz CTAs such as start/continue quiz from the runner), **Then** they feel a short pulse; submit behavior, validation, and auto-submit on timeout are unchanged.
5. **Given** a device that does not support vibration, **When** those taps occur, **Then** the quiz works exactly as today with no error, delay, or visual glitch.
6. **Given** an exam in progress, **When** answers are selected, **Then** correct answers and explanations remain hidden until a valid submission exists (`QUIZ-001`).

---

### User Story 6 - Keep studying from saved offline items (Priority: P2)

A student who previously used the app while online loses connectivity. The app still opens its main student frame. From the profile drawer they can see a list of quizzes saved on this device and open those that were already prepared for offline use. Unsaved destinations show a clear Arabic offline message. This extends the existing offline quiz capability rather than replacing it.

**Why this priority**: Unstable networks are common for the audience; surfacing saved items in the native menu makes offline value discoverable. Full offline taking/sync already exists and must not regress.

**Independent Test**: While online, open at least one quiz; go offline; relaunch; open the drawer’s saved-items list; resume that quiz; try a never-opened quiz and see the Arabic unavailable state. Confirm no grading content appears before a successful (or queued) submit.

**Acceptance Scenarios**:

1. **Given** a student who opened the student home at least once while online, **When** they reopen the app fully offline, **Then** the student shell (header, bottom tabs, drawer trigger) still appears instead of a generic browser failure.
2. **Given** they open the profile drawer offline, **When** they choose offline saved items, **Then** they see a list of quizzes cached on this device (title and a saved/offline status), including an empty Arabic state if none are saved.
3. **Given** a quiz they opened at least once while online, **When** they open it from that list while offline, **Then** they can continue answering under the existing offline rules (`OFFLINE-001`: only explicitly opened quizzes are startable offline; submit may queue; no answers/explanations before accepted submit).
4. **Given** a quiz they never opened while online, **When** they try to open it offline, **Then** they see a clear Arabic explanation that it is unavailable without a connection.
5. **Given** connectivity returns, **When** they use the app again, **Then** queued submissions still sync as today (automatic plus manual «مزامنة الآن» if pending).

---

### User Story 7 - Get a native Add to Home Screen prompt (Priority: P3)

A student using the app in a regular browser (not already installed) sees a custom Arabic bottom sheet that explains how to add المؤيد to the home screen. Android users who can install directly get a one-tap install action; iOS and others get short platform steps. The sheet is easy to dismiss and does not nag after install or after an explicit “not now.”

**Why this priority**: Login already has install buttons (`UI-010`). An in-app sheet helps students who skipped login CTAs, but the product already functions without it.

**Independent Test**: Open the student home in a mobile browser that is not in standalone mode; confirm the bottom sheet; complete or dismiss it; reopen after dismiss and after simulated install and confirm it does not block study.

**Acceptance Scenarios**:

1. **Given** a signed-in student on a phone browser who has not installed the app, **When** they land on الرئيسية (or another primary student screen) after login, **Then** they can see a custom Arabic bottom sheet inviting them to add المؤيد to the home screen — not a generic browser banner alone.
2. **Given** Android (or another platform) that offers a native install action, **When** they confirm from the sheet, **Then** the platform install flow starts.
3. **Given** iOS (or a browser without a native install action), **When** they open the sheet, **Then** they see short Arabic steps for «إضافة إلى الشاشة الرئيسية», consistent in spirit with the existing login install guide.
4. **Given** the student is already running the app from the home-screen icon, **When** they open any student screen, **Then** the install sheet does not appear.
5. **Given** they dismiss with «لاحقاً» (or equivalent), **When** they continue studying, **Then** the sheet closes immediately and does not reappear on every tab switch during that session; a later visit may remind them at most infrequently (not more than once per day).
6. **Given** login/signup, **When** this feature ships, **Then** the existing login install CTAs (`UI-010`) remain available and are not removed.

---

### Edge Cases

- Teacher or Super Admin sessions: they receive the same installed-app shell (icons, full-screen launch, viewport lock, theme colors). The Zaker-style student drawer, student tile grid, student tab motion, and quiz sticky bar are student-only; teachers keep their existing portal navigation.
- Desktop or wide screens: drawer may present as a side panel or overlay; tile grid can widen; bottom-tab motion does not apply where the bottom bar is hidden; install sheet is phone-oriented and should not block desktop teaching work.
- Theme applied on login and marketing pages: appearance preference, once set on a device, should not make login unreadable; if the user is signed out, System or last saved preference is acceptable.
- Vibration while the phone is in silent/Do Not Disturb modes: follow the device; never show an error if a pulse cannot play.
- Rapid double-taps on answers or submit: one haptic pulse per accepted tap; no double submit.
- Offline drawer list while signed out or with an expired session: do not expose another student’s cached quizzes; show Arabic sign-in guidance.
- Cached quiz whose teacher later deactivated it or changed questions: keep existing `OFFLINE-001` sync rejection rules and `QUIZ-001` gatekeeper.
- Install sheet during an active quiz: do not cover questions or the sticky submit bar; wait until the student is on a non-exam student screen.
- User already on `/settings` taps the header gear: open the drawer over settings rather than stacking a second settings page.
- Share or contact fails (no share support, WhatsApp missing): show a fallback Arabic message and keep the URL or number visible to copy.
- Very old browsers that cannot run as a standalone home-screen app: the mobile website remains usable; native extras degrade silently.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present the installed app as a standalone full-screen experience (no browser address bar) when launched from the home-screen icon.
- **FR-002**: System MUST supply a complete home-screen icon set for iOS and Android, including a dedicated Apple home-screen icon, at the sizes those platforms expect for a sharp result.
- **FR-003**: System MUST use Al-Moayed theme colors for the installed app’s background and status/chrome so the launch frame matches light and dark appearance.
- **FR-004**: System MUST lock the in-app viewport so pinch-zoom and rubber-band overscroll do not break the native frame on primary student (and shared shell) screens, while still honoring OS-level accessibility text/display scaling.
- **FR-005**: Signed-in students MUST be able to open a native profile/drawer menu from the header gear icon without leaving the current page.
- **FR-006**: The drawer MUST include Arabic actions for appearance (Dark / Light / System), offline saved items, account upgrade / profile settings, share app, and contact us, plus a visible app version at the bottom.
- **FR-007**: The appearance choice MUST apply immediately to the student shell and persist on that device; System MUST follow the phone’s light/dark setting.
- **FR-008**: Share app MUST offer a short Arabic invite with the public site `https://almoayed.app`.
- **FR-009**: Contact us MUST open the platform’s existing support channel rather than a new inbox product.
- **FR-010**: Students MUST still reach the full settings page from the bottom tab «الإعدادات»; the drawer complements `PROFILE-001`, it does not replace it.
- **FR-011**: Student الرئيسية MUST show a card-tile quick-action grid covering daily progress, interactive tests, results/summary, and continue/next study, mapped to existing student destinations (no new study-calendar or materials library in this feature).
- **FR-012**: Tile empty states MUST stay tappable and Arabic.
- **FR-013**: Switching among student tabs الرئيسية، الاختبارات، نتائجي، الإعدادات MUST use a short slide or fade and MUST NOT present a blank full-page reload; reduced-motion users get an instant switch.
- **FR-014**: During an active student quiz, the primary submit/finish control MUST stay pinned immediately above the bottom navigation.
- **FR-015**: On devices that support haptic/vibration feedback, the system MUST play a short pulse when the student selects an answer, submits a quiz, or taps a primary quiz CTA; unsupported devices MUST continue without errors.
- **FR-016**: Haptics and animations MUST NOT delay answer selection, validation, timed auto-submit, or grading; `QUIZ-001` MUST continue to hide answers and explanations until a valid submission exists.
- **FR-017**: The app MUST remain partially usable offline after a prior online visit: student shell, drawer, and the saved-quiz list MUST load; only previously opened quizzes are startable offline, consistent with `OFFLINE-001`.
- **FR-018**: Static branding/assets and core student routes that were already visited MUST remain available offline enough for the shell and saved-item list to appear; never-cached routes MUST show the existing Arabic offline fallback with retry.
- **FR-019**: Signed-in students who are not already in standalone mode MUST be able to see a custom Arabic Add to Home Screen bottom sheet with a direct install action when the browser provides one, and short iOS/other steps otherwise.
- **FR-020**: The install sheet MUST NOT appear when the app is already running from the home screen, MUST NOT interrupt an active quiz, MUST be dismissible, and MUST NOT show on every tab change in the same session (reminders at most once per day after dismiss).
- **FR-021**: Existing login install CTAs (`UI-010`) MUST remain.
- **FR-022**: Teacher and admin portals MUST keep their current information architecture; they share the installed-app shell (FR-001–FR-004, FR-007 colors) but not the student drawer, tile grid, or student tab motion.
- **FR-023**: All new student surfaces MUST be Arabic RTL with touch-friendly controls consistent with the constitution (large tap targets, no tiny unlabeled icons as the only control).
- **FR-024**: New interactive surfaces (drawer, tile grid, install sheet, offline saved list) MUST be labeled in Arabic and identifiable for in-app guided help, consistent with other student screens.

### Key Entities

- **Appearance preference**: Per-device choice of Light, Dark, or System; System tracks the phone; used by the installed chrome and student shell.
- **Home-screen install state**: Whether the user is already running from an installed icon, dismissed the in-app sheet, or is eligible to see it.
- **Offline saved quiz**: A quiz this student previously opened on this device while online; listed in the drawer; may be opened offline under existing gatekeeper and sync rules.
- **App version label**: Human-readable published version shown at the bottom of the profile drawer (example format «الإصدار 1.0.1»).
- **Share payload**: Arabic invite text plus the public app URL `https://almoayed.app`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a hallway test of 10 phone users, at least 9 identify the home-screen launch as a full-screen app (no address bar) within 5 seconds, and correctly recognize the المؤيد icon on both a typical Android launcher and an iPhone home screen.
- **SC-002**: A signed-in student can open the profile menu from the gear, switch appearance, and close the menu in under 15 seconds on a typical phone.
- **SC-003**: On a ~390×844 phone, the dashboard tile grid is visible without hunting through a long article-like page (tiles appear in the first screen or after at most one short scroll), and each of the four tile types reaches its destination in one tap.
- **SC-004**: Among the four student tabs, a switch shows the destination without a blank white-out lasting more than a brief moment; at least 9 of 10 testers describe the move as “app-like” rather than “the page reloaded.”
- **SC-005**: During an active quiz on a phone with bottom navigation, 100% of testers can tap «تسليم الإجابات وإنهاء الاختبار» without scrolling it out from under the tab bar or the last question.
- **SC-006**: On vibration-capable phones, answer and submit taps produce a noticeable short pulse; the tap-to-selection delay remains imperceptible (students do not wait extra to see the selected answer).
- **SC-007**: After one prior online session, a student who turns on airplane mode can still open the app, see the saved-items list, and open a previously viewed quiz, in under 10 seconds from launch.
- **SC-008**: At least 90% of first-time phone testers who have not installed the app can either complete the home-screen add flow or dismiss the sheet and continue studying, without asking a facilitator what to do.
- **SC-009**: No increase in quiz-security incidents: testers never see correct answers or explanations before submit, including when opening a saved quiz offline.
- **SC-010**: Existing login, teacher portal, timed quizzes, and offline sync continue to complete their current happy paths in the same number of user steps as before this feature.

## Assumptions

- Primary persona is the **student** on a phone. Teachers and Super Admin get the shared installed-app frame (icons, full-screen, viewport lock, theme colors) but not the Zaker-style drawer, tile grid, or student tab animations in this release.
- Visual inspiration from Zaker means **card density, dark/clean drawers, and tile home actions** — not copying Zaker content, branding, or a full LMS syllabus/calendar. Daily progress, tests, summaries, and “schedule” tiles map onto existing Al-Moayed streak/goal, quizzes, results/weak points, and continue-learning.
- Offline taking, queueing, and sync remain as specified in `OFFLINE-001` / `009-offline-quiz-pwa`. This feature **surfaces** saved items and strengthens shell availability; it does not redefine gatekeeper or sync.
- Login already offers install help (`UI-010`). The new sheet is an additional in-app reminder for signed-in students who skipped that step.
- Contact us reuses the support WhatsApp or contact path already shown on marketing/login rather than a new ticketing system.
- App version displayed in the drawer is the currently published product version; «1.0.1» in the request is an example of the label format, not a mandate to ship that exact number.
- Haptics are a progressive enhancement. Many iPhones will not vibrate from the web; that is acceptable if the rest of the quiz UX works.
- In-app pinch-zoom is disabled to mimic a native frame. The phone’s own larger-text setting, magnification, and screen reader still work.
- Appearance is stored on the device (not as a new required server profile field) so it works offline and before settings save.
- No new study-schedule planner, downloaded video library, or push-notification system is included.
- RTL Arabic copy, constitution touch targets, multi-tenant teacher scoping, and quiz gatekeeper rules are unchanged and non-negotiable.
- Public URL for share is `https://almoayed.app`.
