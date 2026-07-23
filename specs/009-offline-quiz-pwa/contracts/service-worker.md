# Service Worker Contract: OFFLINE-001

**File**: `public/sw.js`  
**Scope**: Student PWA shell + static assets (registered from `(student)/layout.tsx` only)

---

## Cache names

| Name | Purpose |
|------|---------|
| `APP_SHELL_CACHE_v1` | Precached essentials on install |
| `RUNTIME_CACHE_v1` | Visited navigations + runtime static assets |

Bump suffix (`v2`) when precache list changes materially.

---

## Install (`install` event)

Precache URLs (minimum):

```text
/offline.html
/manifest.json
/favicon.ico
/icon-192.png
/icon-512.png
/apple-touch-icon.png
/
```

Call `skipWaiting()` after `cache.addAll` (with per-URL catch for `/` if needed).

---

## Activate (`activate` event)

- Delete caches not in `[APP_SHELL_CACHE_v1, RUNTIME_CACHE_v1]`
- `clients.claim()`

---

## Fetch (`fetch` event)

### Navigation (`request.mode === 'navigate'`)

1. Try network
2. On failure: match `RUNTIME_CACHE_v1` for same URL
3. Else: return cached `/offline.html` from `APP_SHELL_CACHE_v1`

### Static assets

Match:
- `/_next/static/*`
- `/fonts/*` (if any)
- `/icon-*.png`, `/favicon*`

Strategy: **cache-first**, update cache on network success.

### Excluded

- Server Action endpoints (Next.js POST to same origin with `Next-Action` header) — **no intercept**
- Supabase URLs
- `/teacher/*` (SW not registered on teacher layout in v1)

---

## `public/offline.html`

- `lang="ar"` `dir="rtl"`
- Tajawal or system Arabic font stack
- Message: connection unavailable
- Button: **«إعادة المحاولة»** → `location.reload()`
- Emerald/teal styling consistent with app

---

## Registration component

```typescript
// ServiceWorkerRegister.tsx (client)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", { scope: "/" });
}
```

Register once on mount; no update toast required in v1.

---

## Acceptance checks

- Offline navigation to uncached route shows `offline.html` (SC-007)
- Repeat visit to `/dashboard` after online visit serves cached shell when offline
- No correct-answer data stored in SW caches (only HTML/JS/CSS)
