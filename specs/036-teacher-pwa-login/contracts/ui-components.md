# Contracts: UI components (UI-021 / UI-022)

Locale `ar-SY`, page `dir="rtl"`. Teacher Login shell parity with student UI-010; install identity UI-021.

## `TeacherLoginPageShell`

**Mount**: `src/app/teacher/login/page.tsx`  
**Role**: Server-friendly layout wrapper (mirrors `LoginPageShell`).

| Region | Behavior |
|--------|----------|
| Desktop (`lg+`) | Two-column: full teacher branding panel + form column |
| Mobile | Compact sticky teacher branding + form children |
| Root | `min-h-dvh`, `dir="rtl"` |

## `TeacherLoginBrandingPanel`

**Spekit**: `teacher-login-brand-header`  
**Props**: `compact?: boolean`

| Mode | Layout contract |
|------|-----------------|
| `compact` | `sticky top-0 z-40`; indigo/slate gradient; logo row + optional Home; tight vertical padding |
| full (desktop) | Full-height branding; may include desktop version/copyright like student panel |

**Must**:
- Use teacher indigo accent (not emerald/`brand` teal student login colors).
- Compose `LoginBrandHomeLink` + `LoginLandingBackLink` (or teacher Spekit-wrapped equivalents).

**Must not**:
- Reuse student `login-brand-header` Spekit id on the teacher panel root.
- Show Home when install detection reports installed/standalone.

## Home control (`LoginLandingBackLink` / teacher wrapper)

**Spekit**: `teacher-login-landing-back`  
**Visible when**: `ready && !installed`  
**Hidden when**: standalone (`display-mode: standalone` or iOS `navigator.standalone`)  
**Action**: navigate to `/` (marketing)  
**a11y**: Arabic `aria-label` «العودة للصفحة الرئيسية»; circular control ≈ `h-9 w-9`

## `TeacherLoginForm` (client)

**Spekit**: existing `teacher-email-login-form` + AUTH-009 recovery hooks  
**Layout**: `items-start` + tight top padding under sticky header (parity with student `pt-3`)  
**Footer**: copyright + `<AppVersion />` (`SPEKIT.appVersion`)  
**Install**: `<PwaInstallPrompt variant="teacher" />`  
**Modes**: `login` \| `forgot` \| `magic` unchanged functionally

## `PwaInstallPrompt` (`variant="teacher"`)

| Spekit | Purpose |
|--------|---------|
| `teacher-pwa-install-buttons` | CTA row |
| `teacher-pwa-install-android` | Android action |
| `teacher-pwa-install-ios` | iOS action |
| `teacher-pwa-install-modal` | Guide modal |

**Chrome**: indigo / teacher theme buttons (not `brand-600` student green)  
**Hidden when**: `!ready \|\| installed`  
**Behavior**: same deferred `beforeinstallprompt` / iOS steps as student

## `PwaStandaloneEntryRedirect` (extended)

**Mount**: marketing `LandingPageView` (unchanged mount site)  
**When**: `isPwaStandalone()`  
**Then**: `replace` → `/teacher/login` if portal hint is `teacher`, else `/login`  
**When not standalone**: render null; no navigation

## Unchanged

- Student `LoginBrandingPanel` emerald styling and Spekit ids
- Student `PwaInstallPrompt` default variant
- Teacher recovery Server Actions and message catalogs
- Signed-in teacher portal chrome (beyond what standalone start requires)
