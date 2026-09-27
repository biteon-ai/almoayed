# Research: Teacher Portal PWA Login

**Date**: 2026-09-24  
**Status**: Complete — all Technical Context items resolved

## 1. Dual install on the same origin

**Decision**: Ship a second static manifest (`public/teacher-manifest.json`) with a distinct Web App Manifest `id` (`/teacher` or absolute app id), distinct `name` / `short_name` (e.g. «المؤيد للمدرسين»), distinct icons, distinct `theme_color` / `background_color`, and `start_url: "/teacher/login"`. Keep student `public/manifest.json` unchanged (`start_url: "/login"`, teal theme). Prefer `scope: "/"` for both so deep links inside the signed-in portals still work; uniqueness comes from `id` + `start_url` + icons/name.

**Rationale**: Chromium allows multiple installed apps per origin when manifests differ by `id` / start URL / identity. Spec requires completely separate configuration without a second host. Static JSON matches the existing student pattern and is cacheable by `sw.js`.

**Alternatives considered**:
- Dynamic `app/manifest.ts` route handlers — more flexible, but diverges from today’s static student file and complicates SW precache.
- Separate subdomain for teachers — out of scope; hosting/DNS overhead.
- Narrow `scope: "/teacher/"` only — can break navigation to shared public assets or confuse recovery routes; reopen only if install tests show collision.

## 2. Linking the teacher manifest on Teacher Login

**Decision**: Add `src/app/teacher/login/layout.tsx` exporting Next.js `metadata` / `viewport` with `manifest: "/teacher-manifest.json"`, teacher `themeColor`, and teacher Apple touch icon. Root `src/app/layout.tsx` continues to advertise the student manifest for all other routes.

**Rationale**: App Router metadata merges/overrides per segment; this is the minimal way to advertise a different install package only where teachers land. Install CTAs on Teacher Login then install the teacher identity.

**Alternatives considered**:
- Client-injected `<link rel="manifest">` — fights Next metadata and is easy to miss on SSR.
- Changing root manifest based on cookie — fragile and risks students receiving the teacher package.

## 3. Standalone routing guard (student + teacher)

**Decision**:
1. Teacher cold start relies primarily on `start_url: "/teacher/login"`.
2. Introduce a tiny device hint `localStorage["almoayed-pwa-portal"] = "student" | "teacher"`, written when the respective login shell mounts (and when teacher install succeeds if detectable).
3. Extend `PwaStandaloneEntryRedirect` on marketing `/`: if `isPwaStandalone()`, `router.replace` to `/teacher/login` when hint is `teacher`, else `/login` (current behavior).
4. Continue using `isPwaStandalone()` (`display-mode: standalone` **or** iOS `navigator.standalone`) from `src/lib/pwa-install.ts` for Home-control hiding.

**Rationale**: Spec requires preventing marketing-home landings for installed teacher launches, including iOS. With correct `start_url`, most launches never hit `/`; the portal hint covers older icons, accidental `/` navigations, and iOS quirks without needing separate origins.

**Alternatives considered**:
- Always redirect `/` → `/login` only (status quo) — fails FR-005 for teacher installs that land on `/`.
- Redirect all standalone `/` → `/teacher/login` — breaks student installs.
- Server-side User-Agent / Sec-Fetch-Site heuristics — unreliable across iOS/Android PWAs.

## 4. Teacher theme tokens (non-green)

**Decision**: Teacher install + sticky header use an **indigo / slate** accent family, not student emerald/teal:
- `TEACHER_APP_THEME_COLOR` ≈ `#4f46e5` (indigo-600) for manifest `theme_color` + meta theme-color on teacher login layout.
- Compact header gradient: indigo-800 → indigo-600 → slate-800 (or equivalent Tailwind `indigo-*` / `slate-*`), white foreground text.
- `background_color` in teacher manifest: `#f8fafc` (light shell parity) unless dark-first splash is preferred later.
- Do **not** retint the entire signed-in teacher portal `brand-*` teal in this feature.

**Rationale**: Spec asks for a professional distinctive accent vs student green; indigo is absent from current Tailwind brand scale so the installed icon chrome and login shell read as a different product. Limiting the recolor to login/install avoids a large TEACH-* visual regression.

**Alternatives considered**:
- Keep teacher teal (`brand-*`) for login only change icons — fails “distinct theme color” acceptance.
- Full portal indigo redesign — out of scope (SC / Assumptions).

## 5. Login shell architecture

**Decision**: Mirror student structure:
- Server `page.tsx`: `getSession()` → redirect signed-in teachers to teacher dashboard; wrap client form in `TeacherLoginPageShell`.
- `TeacherLoginPageShell`: two-column desktop / mobile sticky compact panel (same grid as `LoginPageShell`).
- `TeacherLoginBrandingPanel`: indigo compact sticky `top-0 z-40` mobile header; reuse `LoginBrandHomeLink` + `LoginLandingBackLink` (Home → `/`, hidden when `ready && installed`).
- Extract current client page into `teacher-login-form.tsx` preserving AUTH-009 modes; footer: copyright + `AppVersion`; include `PwaInstallPrompt variant="teacher"`.
- Drop `BrandHeader` + loose vertical centering that creates large empty scroll on phones.

**Rationale**: Student UI-010 already solved density, Home gating, and version placement; copying the pattern is minimal-diff and meets SC-003–SC-005.

**Alternatives considered**:
- Add `variant` props to `LoginBrandingPanel` — workable, but emerald hardcoding + teacher copy would tangle Spekit/brand; separate panel is clearer for v1.
- Keep `BrandHeader` and only add Home — fails sticky/tight-gap requirements.

## 6. Install prompt variant

**Decision**: Extend `PwaInstallPrompt` with `variant?: "student" | "teacher"` (default `student`). Teacher variant: indigo/`TEACHER_APP_THEME_COLOR` button surfaces, Arabic labels unchanged in meaning, Spekit IDs `teacher-pwa-install-*`. Reuse `usePwaInstall` (same `beforeinstallprompt` / iOS modal flow).

**Rationale**: Install mechanics are identical; only chrome and analytics hooks differ. Avoids duplicating iOS/Android modal logic.

**Alternatives considered**:
- Fully separate `TeacherPwaInstallPrompt` — more copy-paste.
- No install CTAs on teacher login — weaker discoverability vs UI-010 parity.

## 7. Icons

**Decision**: Add `teacher-icon-192.png`, `teacher-icon-512.png`, `teacher-apple-touch-icon.png` under `public/`, generated by extending `scripts/generate-brand-assets.mjs` with a teacher indigo palette (or a one-shot teacher pass). Reference them only from `teacher-manifest.json` and teacher login layout metadata. Leave student icons untouched. Precache teacher assets in `public/sw.js`.

**Rationale**: Spec requires distinguishable home-screen icons; existing generate script is the project’s source of truth for brand PNGs.

**Alternatives considered**:
- Recolor student icons at runtime — not possible for install packages.
- Hand-drawn assets outside the script — harder to regenerate on brand bumps.

## 8. Spekit / registry

**Decision**: New hooks (ENABLE-001): `teacher-login-brand-header`, `teacher-login-landing-back`, `teacher-pwa-install-buttons`, `teacher-pwa-install-android`, `teacher-pwa-install-ios`, `teacher-pwa-install-modal`. Keep existing `teacherLoginBack` / recovery Spekit IDs. Register `UI-021` / `UI-022` in `.speckit/spec.yaml`. Update `ui-020-app-version` test to **require** `AppVersion` on teacher login.

**Rationale**: Separate DAP selectors for teacher vs student login; UI-020 acceptance expands to teacher login per this spec’s FR-010.

**Alternatives considered**:
- Reuse `login-landing-back` on both pages — blurs analytics between portals.
