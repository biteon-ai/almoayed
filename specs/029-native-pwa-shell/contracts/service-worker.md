# Service Worker Contract delta (UI-012 / FR-017–018)

**File**: `public/sw.js`  
**Supersedes cache names in** `specs/009-offline-quiz-pwa/contracts/service-worker.md`  
**Quiz IndexedDB contract** in `specs/009-offline-quiz-pwa/contracts/offline-store.md` is unchanged except for `listQuizPackages` (see [client-storage.md](./client-storage.md)).

## Registration

| Before (OFFLINE-001) | After (this feature) |
|----------------------|----------------------|
| `ServiceWorkerRegister` in `(student)/layout.tsx` only | Same component mounted from **root** `src/app/layout.tsx` (login + teacher + student) |
| Unregister in `development` | Keep — avoid stale SW while iterating |

## Cache names

| Name | Purpose |
|------|---------|
| `APP_SHELL_CACHE_v3` | Precached essentials on install |
| `RUNTIME_CACHE_v3` | Visited navigations + runtime static assets |

Activate **must** delete `v1`/`v2` (and any other unused) cache keys.

## Install precache (minimum)

```text
/offline.html
/manifest.json
/favicon.ico
/icon-192.png
/icon-512.png
/apple-touch-icon.png
```

`skipWaiting()` after `Promise.allSettled` per URL (do not fail install if one icon 404s).

Do **not** precache `/dashboard`, `/quizzes`, `/quiz/*` at install — still filled by **network-first navigation** after the first online visit (009 decision).

## Fetch rules (unchanged intent)

| Request | Strategy |
|---------|----------|
| `mode === "navigate"` | Network-first → cached same URL → `/offline.html` → 503 |
| Same-origin GET static (`/_next/static`, fonts, images, css, js) | Cache-first + background refresh |
| Non-GET (Server Actions) | **Do not intercept** |
| Cross-origin | Ignore |

## Offline UX still owned by OFFLINE-001

- Quiz packages in IndexedDB, not in Cache Storage.
- Pending submit queue + «مزامنة الآن» unchanged.
- Gatekeeper: cached questions remain exam-only.

## Version bump trigger

Bump `v3` → `v4` if precache list or fetch strategy changes again after this feature ships.
