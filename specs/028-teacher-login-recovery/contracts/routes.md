# Contracts: Routes (AUTH-009)

## `GET /teacher/login`

- **Auth**: Public (existing).
- **Behavior**: Teacher email/password card plus back / forgot / magic-request UI.
- **Unchanged**: Successful password login still client-assigns `/teacher/dashboard`.

## `GET /teacher/reset?token=`

- **Auth**: Public (middleware allowlist).
- **Behavior**: If token missing → invalid copy. Page may optionally call a read-only `peekTeacherResetToken(token)` that returns `{ ok: true } | { ok: false; code }` **without** consuming. Form POST → `completeTeacherPasswordReset`.
- **Success**: Stay on page with success + link to `/teacher/login`.

## `GET /teacher/magic?token=`

- **Auth**: Public.
- **Behavior**: Consume via Server Action on load (or explicit confirm button «دخول» if we want an extra tap — spec says one tap from the **email** link, so auto-consume on GET+action is OK). Redirect `/teacher/dashboard` on success.
- **Failure**: Arabic error, no session cookie.

## Middleware

Extend `src/middleware.ts`:

```ts
const teacherAuthPublicPaths = [
  "/teacher/login",
  "/teacher/reset",
  "/teacher/magic",
];
```

`isTeacherRoute` is true only for `/teacher/*` that are **not** those prefixes. Matcher already includes `/teacher/:path*`.

## Email link hosts

Absolute URLs from `getAppUrl()`:

| Env | Origin |
|-----|--------|
| Production | `https://almoayed.app` |
| Dev/test | `https://dev.almoayed.app` |
| Local | `http://localhost:3000` |

`www.almoayed.app` 301s to apex (existing `next.config.mjs`).

## Unchanged

| Route | Note |
|-------|------|
| `/login` | Main student/WhatsApp login; back-link target |
| `/admin/login` | Super Admin — no recovery in this feature |
| `/teacher/dashboard` | Still requires teacher session |
| `POST /api/email/send` | Super Admin test mail; not used by AUTH-009 |
