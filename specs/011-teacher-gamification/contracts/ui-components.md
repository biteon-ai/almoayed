# UI Component Contracts: GAMIF-001

All surfaces: `dir="rtl"`, Arabic copy, touch targets `h-10`–`h-12`, Tajawal via app shell.

Spekit: add targets under `GAMIF-001` in `SPEKIT` + `.speckit/spekit-targets.yaml`.

---

## Teacher — `GamificationSettings`

**Route**: `/teacher/settings/gamification`  
**File**: `src/components/teacher/GamificationSettings.tsx` (+ page RSC loader)

| Element | Behavior | Spekit id (suggested) |
|---------|----------|------------------------|
| Page title | «نظام المستويات والمكافآت» | `gamif-settings-page` |
| Tier list | Ordered cards/rows; reorder up/down or drag if pattern exists | `gamif-tier-list` |
| Add level | Disabled at 20; opens inline form or dialog | `gamif-tier-add` |
| Fields | اسم المستوى، عدد الاختبارات، المعدل %، نوع الأيقونة | `gamif-tier-form` |
| Icon select | كأس / ألماس / نجمة / درع / وسام (no raw native if project avoids them — use existing Select) | `gamif-icon-select` |
| Save | Persists full list; success toast | `gamif-tiers-save` |
| Validation | Inline Arabic errors for ladder / max / fields | — |

Link from `/teacher/settings` (text button «إعداد المستويات»).

---

## Student — `LevelProgressCard`

**Mount**: `StudentDashboardView` when status ≠ null  
**File**: `src/components/dashboard/LevelProgressCard.tsx`

| Element | Content |
|---------|---------|
| Level name + icon | Current tier or «لم تصل إلى مستوى بعد» if null current |
| Progress bar | `progressFill` 0–100% |
| Hint copy | e.g. «بقيت N اختبارات…» and/or score gap; top-tier: «أنت في أعلى مستوى» |
| Spekit | `gamif-level-card` |

**Do not render** when parent passes `status === null`.

---

## Student — `BadgeGallery`

**Mount**: Dashboard below/near progress card when status ≠ null  
**File**: `src/components/dashboard/BadgeGallery.tsx`

| Element | Content |
|---------|---------|
| Grid of icons | All teacher tiers; unlocked vs locked visual (opacity / lock affordance) |
| Labels | Level name under each |
| Spekit | `gamif-badge-gallery` |

---

## Student — Results summary

**Mount**: `StudentResultsView` (compact)  
Reuse `LevelProgressCard` in compact mode **or** a slim row: icon + level name + optional mini bar. Same hide-when-null rule. Spekit: `gamif-results-summary`.

---

## Coexistence with streak UI

Existing `StudentDashboardHero` streak/achievements remain. Teacher tiers are a **separate** block (do not replace streak copy with level names).

---

## Empty / switcher

| Condition | UI |
|-----------|-----|
| Zero tiers | Omit card + gallery + results summary |
| Teacher switch | RSC reload / revalidation shows new teacher status |
| Zero completions, first tier mins &gt; 0 | Current null; progress toward first tier; all badges locked except those with 0/0 mins |
