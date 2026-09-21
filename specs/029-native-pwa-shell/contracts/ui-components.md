# Contracts: UI components (UI-012 · UI-013 · DASH-002 · UI-014 · UI-015)

Locale `ar-SY`, `dir="rtl"`, Tajawal. Touch targets `h-10`–`h-12`. Spekit via `src/lib/spekit-targets.ts` + `.speckit/spekit-targets.yaml`.

## Shared PWA shell (UI-012)

| Surface | Behavior |
|---------|----------|
| `public/manifest.json` | `display: "standalone"`, `lang: "ar"`, `dir: "rtl"`, `theme_color: "#0d9488"`, `background_color` aligned to light `--background` (`#f8fafc`), icons 192/512 `any` + `maskable`, Apple 180 via `apple-touch-icon` |
| Root viewport | Keep `userScalable: false`, `maximumScale: 1`, `viewportFit: "cover"`; `themeColor` light `#0d9488` / dark `#042626` (or resolved appearance) |
| Student chrome | Header, bottom nav, portal background use **semantic tokens** (`bg-background`, `border-border`, `text-foreground`) — not hard-coded `bg-white` / `slate-100` |

## Student profile drawer (UI-013)

Trigger: header gear (`aria-label` remains «الإعدادات» or «القائمة»). Phone: open drawer. `md+`: drawer as side panel is OK; gear may still open it.

| Element | Copy | Spekit |
|---------|------|--------|
| Drawer root | `role="dialog"` `aria-modal` | `native-profile-drawer` |
| Close | إغلاق | `native-drawer-close` |
| Appearance | المظهر — Dark / Light / System (داكن / فاتح / تلقائي) | `native-theme-switcher` |
| Offline items | العناصر المحفوظة / الاختبارات دون اتصال | `native-offline-list` |
| Upgrade / profile | ترقية الحساب / إعدادات الملف → `/settings` | `native-drawer-settings` |
| Share | مشاركة التطبيق | `native-share-app` |
| Contact | تواصل معنا | `native-contact-us` |
| Version | الإصدار {APP_VERSION} (muted, footer) | `native-app-version` |

Motion: panel enters from **inline-start** (RTL = right). Backdrop tap, Escape, and explicit close dismiss. Bottom tabs stay visible (drawer `z` above content, not covering the tab bar if possible; if full-height, include a close control).

Share success: toast or inline «تم نسخ الرابط» when `navigator.share` is missing. Contact: WhatsApp URL + mailto fallback visible.

## Offline saved list (inside drawer)

| State | UI |
|-------|-----|
| Loading | Short Arabic skeleton / «جاري التحميل…» |
| Empty | «ما في اختبارات محفوظة على هذا الجهاز. افتح اختباراً وأنت متصل ليظهر هنا.» |
| Rows | Title, relative saved time, optional «متابعة» / «بانتظار المزامنة» |
| Tap | `router.push(/quiz/{id})` then close drawer |
| Signed out | Do not list; «سجّل الدخول لعرض المحفوظات» |

Spekit on list: `native-offline-list`. Each row may use `native-offline-item` (optional).

## Dashboard action tiles (DASH-002)

Grid: `grid-cols-2` on phone, gap-3, cards `rounded-2xl`, min tap `min-h-12`. Place **below** the welcome hero (or replacing hero text links) and **above** KPI row or immediately after hero — first screen or one short scroll (SC-003).

| Tile | Title | Subtitle / empty | Href |
|------|-------|------------------|------|
| Daily progress | تقدّم اليوم | Streak days + daily goal %; empty «ابدأ اختبار اليوم» | `/dashboard` hash welcome or scroll to goal |
| Interactive tests | اختبارات تفاعلية | Count hint or «تصفح الاختبارات» | `/quizzes` |
| Results summary | ملخص نتائجي | Last score or «لا نتائج بعد» | `/results` |
| Continue / next | جدول المذاكرة / أكمل | Continue quiz title or «لا اختبار جارٍ — تصفح الاختبارات» | `/quiz/{id}` or `/quizzes` |

Spekit: `dashboard-action-tiles` on the grid; optional `dashboard-tile-progress` / `dashboard-tile-quizzes` / `dashboard-tile-results` / `dashboard-tile-continue`.

Hero «ابدأ اختباراً» / «نتائجي» **text buttons may be removed** once tiles exist (FR-011 absorb cluster). Hero greeting, streak, daily goal bar stay (`DASH-001`).

## Tab motion (UI-014)

`(student)/template.tsx`: 180–280ms fade + 8–16px RTL-aware translate on enter. `@media (prefers-reduced-motion: reduce) { animation: none }`. Bottom nav does not unmount.

## Quiz runner (UI-014)

Keep sticky bar `fixed inset-x-0 bottom-16 z-40` (phone) / `md:bottom-0`. Tokens for background. `hapticPulse()` on:

- Answer option change (`handleAnswer`)
- Primary submit click
- Other primary runner CTAs if present (start/continue on same screen)

Spekit submit remains `quiz-submit-button`.

## A2HS sheet (UI-015)

| Element | Copy | Spekit |
|---------|------|--------|
| Sheet | أضف المؤيد إلى الشاشة الرئيسية | `pwa-install-sheet` |
| Android primary | تثبيت التطبيق (calls `promptInstall` when `canPrompt`) | `pwa-install-sheet-android` |
| iOS / fallback | Reuse UI-010 step list | `pwa-install-sheet-guide` |
| Dismiss | لاحقاً | `pwa-install-sheet-dismiss` |

Do not mount on `/quiz/*`. Login `pwa-install-buttons` **unchanged**.

## Teacher / admin

No drawer, tiles, tab template, or A2HS sheet. They inherit root appearance class, manifest, SW, and viewport lock.
