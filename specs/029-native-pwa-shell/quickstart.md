# Quickstart: Native Home-Screen App Experience

**Features**: UI-012 · UI-013 · DASH-002 · UI-014 · UI-015  
**Branch**: `029-native-pwa-shell`

## Prerequisites

- `npm run dev` (SW **unregisters** in development — test install/offline on `npm run build && npm run start` or a preview deploy).
- Demo student `963987654321` (linked to demo teacher).
- Phone viewport ~390×844 (DevTools) plus one Android Chrome and one iOS Safari pass for install.
- Optional: vibration-capable Android for haptics; iOS is expected to no-op.

## P1 — Standalone shell

1. Production/preview: Add to Home Screen. Icon label **المؤيد**; Apple touch icon present; launch has **no address bar**.
2. Pinch-zoom does not scale the document; overscroll does not reveal a browser backdrop.
3. Toggle OS dark mode with appearance = System: chrome colors follow; no unreadable login.

## P1 — Profile drawer

1. Sign in as student → tap header **gear** (not the bottom «الإعدادات» tab).
2. Drawer opens from the start side. Switch **داكن / فاتح / تلقائي**; reload — choice persists.
3. **إعدادات الملف** → `/settings` (full PROFILE-001 page still works from the bottom tab).
4. **مشاركة التطبيق** → share sheet or copy `https://almoayed.app`.
5. **تواصل معنا** → WhatsApp or visible email fallback.
6. Footer shows **الإصدار** matching `APP_VERSION`.
7. Close via backdrop / إغلاق; underlying page is unchanged.

## P1 — Dashboard tiles

1. Open الرئيسية. Four card tiles visible (progress, tests, results, continue).
2. Each tile one-taps to the mapped student surface. Empty states stay tappable and Arabic.
3. Hero greeting / streak / KPIs / rewards / tabs still present.

## P2 — Tab motion + quiz

1. Tap الرئيسية → الاختبارات → نتائجي → الإعدادات: short slide/fade, bottom bar stays, no blank white-out.
2. Enable OS reduced motion: switches are instant, still no full reload flash.
3. Start a quiz: scroll questions; **تسليم الإجابات وإنهاء الاختبار** stays above the tab bar.
4. Tap answers + submit: Android vibrates briefly; iOS does not error. Answers still hidden until submit (QUIZ-001).

## P2 — Offline saved list

1. Online: open a quiz once, leave.
2. Airplane mode, relaunch: shell + tabs + gear still appear.
3. Drawer → saved items: that quiz is listed; open it and answer.
4. A never-opened quiz is not startable; Arabic unavailable copy.
5. Reconnect: pending sync / «مزامنة الآن» still work (OFFLINE-001).

## P3 — In-app install sheet

1. Student home in **browser** (not standalone): Arabic bottom sheet appears.
2. **لاحقاً** hides it for the rest of the session and ≥ 24h.
3. Open a quiz: sheet must not cover questions.
4. Simulate standalone (`display-mode: standalone`): sheet absent.
5. `/login` still shows UI-010 install CTAs.

## Teacher regression

Teacher dashboard/login: no student drawer/tiles/sheet. Installed-app icons + viewport lock still apply. SW registers outside the student layout.

## Automated

```bash
npm run test:unit -- tests/features/ui-012-native-shell.test.ts tests/features/ui-013-appearance-drawer.test.ts tests/features/dash-002-action-tiles.test.ts tests/features/ui-014-haptic.test.ts tests/features/ui-015-a2hs-eligibility.test.ts
npm run test:e2e -- e2e/ui-012-native-pwa-shell.spec.ts
npm run lint && npm run typecheck && npm run build
```

Quiz gatekeeper regression (must stay green):

```bash
npm run test:unit -- tests/features/quiz-001-gatekeeper.test.ts
```
