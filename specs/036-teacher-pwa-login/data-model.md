# Data Model: Teacher Portal PWA Login

**Feature**: `UI-021` · `UI-022`  
**Persistence**: No database tables. Device-local portal hint only.

## Entity: Teacher Install Package

| Field | Type | Rules |
|-------|------|--------|
| `id` | string | Distinct from student; e.g. `/teacher` |
| `name` | string | Teacher-branded Arabic label (e.g. «المؤيد للمدرسين») |
| `short_name` | string | Short home-screen label; must not be identical to student «المؤيد» alone if that causes confusion — prefer a teacher-qualified short name |
| `start_url` | path | Must be `/teacher/login` |
| `scope` | path | `/` (v1) |
| `display` | enum | `standalone` |
| `theme_color` | hex | Non-green; indigo family (`TEACHER_APP_THEME_COLOR`) |
| `background_color` | hex | Light shell parity (`#f8fafc`) unless later dark-first |
| `icons[]` | icon refs | Teacher-only PNG paths (192 / 512 / maskable + Apple 180) |
| `lang` / `dir` | | `ar` / `rtl` |

### Invariants

- Student install package fields remain unchanged.
- Teacher package must be advertised when Teacher Login is the document that the user installs from.

## Entity: PWA Portal Hint (device-local)

| Field | Type | Rules |
|-------|------|--------|
| `key` | const | `almoayed-pwa-portal` |
| `value` | `"student" \| "teacher"` | Written when the corresponding login shell mounts |
| `storage` | localStorage | Same device only; missing → treat as `student` for marketing standalone redirect |

### Transitions

```text
Visit /login shell           → portal = student
Visit /teacher/login shell   → portal = teacher
Standalone open of /         → replace → /teacher/login if portal=teacher else /login
Non-standalone browse of /   → no redirect (marketing as today)
```

## Entity: Teacher Login Shell (view model)

| Field | Type | Rules |
|-------|------|--------|
| `installed` | boolean | From `usePwaInstall` / `isPwaStandalone` |
| `ready` | boolean | Install detection settled (avoid Home flash) |
| `showHomeControl` | boolean | `ready && !installed` |
| `version` | string | `APP_VERSION` from package.json (`v{version}`) |
| `mode` | `login` \| `forgot` \| `magic` | Existing AUTH-009 form modes |
| `themeAccent` | indigo token set | Header + install CTAs; not student emerald |

### Display invariants

- Sticky/fixed compact header on mobile.
- Tight gap under header (`pt-3`-class density like student form).
- Home control absent whenever `installed`.
- Version visible at bottom of login container in browser and installed modes.
- AUTH-009 actions remain reachable in all modes.

## Entity: Standalone Session (detection)

| Signal | Meaning |
|--------|---------|
| `(display-mode: standalone)` | Standard installed PWA |
| `navigator.standalone === true` | iOS home-screen web app |
| Either true | `installed` / standalone session for Home hide + entry guard |

No server-side session fields added.
