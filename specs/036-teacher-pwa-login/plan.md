# Implementation Plan: Teacher Portal PWA Login

**Branch**: `036-teacher-pwa-login` | **Date**: 2026-09-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/036-teacher-pwa-login/spec.md`

**Feature IDs (registry)**: `UI-021` · `UI-022`  
**Extends**: `UI-010` · `UI-012` · `UI-020` · `AUTH-002` · `AUTH-009`

## Summary

Give Teacher Login (`/teacher/login`) the same installable PWA shell and compact mobile login chrome as Student Login, while keeping a **separate** install identity: dedicated teacher manifest, indigo/slate theme (not student teal/green), separate icons, `start_url` `/teacher/login`, standalone entry guard, sticky compact header with browser-only Home, and `AppVersion` at the login footer.

**Technical approach**:
1. Add `public/teacher-manifest.json` + teacher icon set; link via `src/app/teacher/login/layout.tsx` metadata (override root student manifest on that route).
2. Mirror student login structure: server page + `TeacherLoginPageShell` + indigo `TeacherLoginBrandingPanel` + client form extracted from today’s monolithic page; reuse `LoginLandingNav`, `usePwaInstall` / `isPwaStandalone`, `AppVersion`.
3. Extend install prompt with a teacher variant (non-green CTAs, teacher Spekit IDs) so Add-to-Home-Screen advertises the teacher package.
4. Portal-aware standalone guard: remember last portal on login shells; on marketing `/` in standalone, route to `/teacher/login` or `/login` accordingly (student default unchanged).
5. Register `UI-021` / `UI-022` in `.speckit/spec.yaml`; Vitest + Playwright contracts; update UI-020 test that currently forbids version on teacher login.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for all educational levels and subjects

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC shell + client form |
| **Database** | **None** for this feature |
| **Data access** | Existing teacher login Server Actions only (`loginTeacherEmail`, recovery actions) |
| **UI** | Tailwind, Shadcn, Spekit; indigo teacher shell vs emerald student shell |
| **Testing** | Vitest `[UI-021]` / `[UI-022]` + Playwright phone / standalone smoke |
| **Target platform** | Mobile-first Teacher Login PWA (iOS home-screen + Android install) |

**Feature-specific overrides**:

- **Primary Dependencies**: none beyond stack defaults; reuse `scripts/generate-brand-assets.mjs` (extend or add teacher palette pass) for icon PNGs
- **Storage / tables touched**: none (optional `localStorage` key for portal hint only — client device)
- **Performance Goals**: SC-001 cold start → Teacher Login; no new network round-trips for shell
- **Constraints**: RTL + touch targets; do not change student `manifest.json` / student login emerald shell; preserve AUTH-009 recovery UX
- **Scale/Scope**: Teacher Login install + shell (+ landing standalone portal routing). Full signed-in teacher chrome redesign out of scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md`

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries | PASS — no new queries |
| QUIZ-001 | No answer leakage | PASS — login chrome only |
| Server layer | Server Actions only | PASS — reuse existing teacher auth actions |
| RTL UX | Arabic RTL, touch targets | PASS — parity with student login shell (`h-9` Home, `h-10`–`h-12` fields) |
| Passwordless | WhatsApp identity | PASS (N/A) — teacher email/password already exists (`AUTH-002`); this feature does not add a new auth method |
| Minimal diff | Match existing patterns | PASS — mirror `login-page-shell` / `LoginBrandingPanel` / `PwaStandaloneEntryRedirect` |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — presentation + install metadata only; dual-install via separate manifest/icons; portal hint is device-local; student paths unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/036-teacher-pwa-login/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ui-components.md
│   ├── pwa-manifest.md
│   └── routes.md
└── tasks.md                    # via /speckit-tasks
```

### Source Code (planned touch points)

```text
public/teacher-manifest.json                 # NEW — teacher install package
public/teacher-icon-192.png                  # NEW
public/teacher-icon-512.png                  # NEW
public/teacher-apple-touch-icon.png          # NEW
public/sw.js                                 # EXTEND precache teacher assets
scripts/generate-brand-assets.mjs            # EXTEND teacher icon generation (optional)

src/lib/constants.ts                         # TEACHER_APP_* theme/name
src/lib/pwa-portal.ts                        # NEW — portal hint get/set (student|teacher)
src/lib/spekit-targets.ts                    # teacher login/PWA Spekit keys
.speckit/spekit-targets.yaml
.speckit/spec.yaml                           # UI-021, UI-022

src/app/teacher/login/layout.tsx             # NEW — manifest + themeColor + apple icon
src/app/teacher/login/page.tsx               # REFACTOR — server session redirect + shell
src/app/teacher/login/teacher-login-page-shell.tsx   # NEW
src/app/teacher/login/teacher-login-form.tsx         # NEW — client form (from page.tsx)

src/components/login/TeacherLoginBrandingPanel.tsx   # NEW — indigo sticky compact header
src/components/login/LoginLandingNav.tsx             # REUSE (optional teacher Spekit prop)
src/components/pwa/PwaInstallPrompt.tsx              # EXTEND variant="teacher"
src/components/pwa/PwaStandaloneEntryRedirect.tsx    # EXTEND portal-aware target
src/components/landing/LandingPageView.tsx           # VERIFY mount still present
src/components/brand/AppVersion.tsx                  # REUSE on teacher form footer

tests/features/ui-021-teacher-pwa.test.ts
tests/features/ui-022-teacher-login-shell.test.ts
tests/features/ui-020-app-version.test.ts            # UPDATE — expect version on teacher login
e2e/ui-021-teacher-pwa-login.spec.ts
```

**Structure decision**: Parallel student login architecture under `src/app/teacher/login/` + one teacher branding panel. Do not fork the entire student login tree into a shared mega-component unless duplication becomes painful after the first pass.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| none | — | — |

## Phase 0: Research

See [research.md](./research.md). Resolved: dual-install on same origin, manifest linkage, indigo tokens, portal-aware standalone guard, shell split, install prompt variant, icon generation, Spekit IDs.

## Phase 1: Design

See [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

**Key decisions**:
1. Static `public/teacher-manifest.json` with `id` `/teacher`, `start_url` `/teacher/login`, indigo `theme_color`, teacher icons.
2. Route `layout.tsx` metadata overrides root student manifest only on Teacher Login.
3. `localStorage["almoayed-pwa-portal"]` set on student/teacher login shells; landing standalone redirect uses it.
4. Sticky indigo compact header + reuse Home hide-when-installed; `AppVersion` on form footer.
5. `PwaInstallPrompt` `variant="teacher"` for non-green CTAs + teacher Spekit hooks.

## Phase 2: Task planning

Deferred to `/speckit-tasks`.
