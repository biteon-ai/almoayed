# Contracts: Teacher Web App Manifest (UI-021)

## File

`public/teacher-manifest.json` (static; linked only from Teacher Login layout metadata)

## Required fields

| Field | Value / rule |
|-------|----------------|
| `id` | Distinct app id, e.g. `/teacher` |
| `name` | Teacher Arabic product name (e.g. «المؤيد للمدرسين») |
| `short_name` | Distinct from student short name where possible |
| `description` | Teacher-oriented one-liner (may reuse slogan) |
| `start_url` | **`/teacher/login`** (exact) |
| `scope` | `/` |
| `display` | `standalone` |
| `background_color` | Light shell `#f8fafc` (v1) |
| `theme_color` | `TEACHER_APP_THEME_COLOR` (indigo, **not** `#0d9488`) |
| `orientation` | `portrait` |
| `lang` | `ar` |
| `dir` | `rtl` |
| `categories` | include `education` |
| `icons` | Teacher PNGs only — 192 + 512, `purpose` `any` + `maskable` |

## Icon assets

| Asset | Path |
|-------|------|
| 192 | `/teacher-icon-192.png` |
| 512 | `/teacher-icon-512.png` |
| Apple touch | `/teacher-apple-touch-icon.png` (layout metadata) |

Student `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png` remain for `public/manifest.json`.

## HTML linkage

Teacher Login layout metadata **must** set:

- `manifest: "/teacher-manifest.json"`
- `themeColor` aligned with teacher `theme_color`
- Apple touch icon → teacher asset

Root layout **must** continue advertising `/manifest.json` for non-teacher-login routes.

## Service worker

`public/sw.js` precache list **must** include teacher manifest + teacher icon URLs after bump of cache name when assets change.

## Non-goals

- Changing student `start_url` / theme / icons
- Separate origin or subdomain
- Offline teacher dashboard HTML precache
