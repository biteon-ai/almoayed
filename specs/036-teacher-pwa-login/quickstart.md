# Quickstart: Teacher Portal PWA Login

**Feature**: `UI-021` · `UI-022`  
**Branch**: `036-teacher-pwa-login`

## Prerequisites

- `npm run dev` at `http://localhost:3000`
- Demo teacher: WhatsApp `963912345678` / code `AlMoayed-DEMO` (or admin-provisioned email login)
- DevTools phone viewport ≈ **390×844**
- Optional: Android Chrome for `beforeinstallprompt`; iOS Safari for Add to Home Screen

## P1 — Separate install package

1. Open `/teacher/login` → View Source / Application tab: manifest link is `/teacher-manifest.json` (not `/manifest.json`).
2. Confirm theme-color meta matches teacher indigo (not `#0d9488`).
3. Confirm icons in the teacher manifest point at `/teacher-icon-*.png`.
4. Open `/login` and confirm student still uses `/manifest.json` + teal theme.

## P1 — Standalone start

1. Install from Teacher Login (Android install prompt or iOS Add to Home Screen).
2. Cold-start the home-screen icon → first screen is `/teacher/login` (or teacher dashboard if already signed in).
3. Confirm icon/label is distinguishable from the student app.
4. With portal hint `teacher`, open `/` inside standalone → redirected to `/teacher/login` (not marketing content).

## P1 — Login shell

1. Browser phone: sticky compact indigo header; Home control visible; tight gap above the card; version `v…` at footer.
2. Emulate standalone (`display-mode: standalone` or iOS standalone): Home control **absent**; version still visible.
3. AUTH-009: back to main login, forgot password, and magic link still work.

## P2 — RTL / touch

1. Confirm RTL alignment of header Home vs logo and form labels.
2. Primary fields/buttons remain large touch targets; no horizontal page scroll at ~360px.

## Regression

- Student `/login` install CTAs, emerald header, Home gating, and version unchanged.
- `data-spekit` hooks present for teacher brand header, landing back, and teacher PWA install controls.

## Automated

```bash
npm run test:unit -- tests/features/ui-021-teacher-pwa.test.ts tests/features/ui-022-teacher-login-shell.test.ts tests/features/ui-020-app-version.test.ts
npm run test:e2e -- e2e/ui-021-teacher-pwa-login.spec.ts
npm run lint && npm run typecheck && npm run build
```
