# Research: BiteonSwitch OTP Auth & Admin Fallback

**Date**: 2026-07-21  
**Status**: Complete — all Technical Context items resolved

## 1. BiteonSwitch provider integration shape

**Decision**: Implement a thin **adapter** in `src/lib/biteonswitch/` with:

| Function | Responsibility |
|----------|----------------|
| `getBiteonSwitchConfig()` | Read `BITEONSWITCH_API_KEY`, `BITEONSWITCH_APP_ID`, `BITEONSWITCH_CALLBACK_URL`, optional `BITEONSWITCH_HOSTED_LOGIN_URL` / `BITEONSWITCH_API_BASE_URL` |
| `buildHostedLoginUrl({ state, whatsappHint? })` | Build redirect URL to BiteonSwitch hosted OTP |
| `verifyCallbackToken({ token, state })` | Server-side verify with API key; return `{ whatsappNumber, providerRef }` or failure |

Public web search (2026-07-21) did **not** surface official BiteonSwitch API docs. Treat endpoint paths as **env-configured** and document expected request/response in [contracts/biteonswitch-otp.md](./contracts/biteonswitch-otp.md). During implementation, pin concrete URLs once operators supply credentials.

**Rationale**: Spec mandates BiteonSwitch as primary OTP; adapter prevents scattering HTTP details across actions/routes and allows a **mock verify** path for Vitest without live provider.

**Alternatives considered**:
- Inline Meta WhatsApp Cloud OTP templates in-app — rejected (spec requires external hosted BiteonSwitch).
- Client-side token accept without server verify — rejected (FR-010 / constitution server layer).

## 2. Session minting reuse

**Decision**: Extract `establishSession(profile, teacherId)` from `src/actions/login.ts` into a shared server module (keep in `login.ts` as exported helper or move to `src/lib/auth-session.ts`) and call it from:

1. BiteonSwitch callback (success)
2. `loginAdminFallback` (success)
3. Demo bypass path (local/demo only)

**Rationale**: Today’s login already updates `profiles.last_session_id` and iron-session fields correctly for AUTH-003. Duplicating mint logic risks lock bugs.

**Alternatives considered**:
- Separate mint paths per entrypoint — rejected (drift risk on AUTH-003).

## 3. Registration vs login split

**Decision**:

| Action | Creates profile/link | Mints session |
|--------|----------------------|---------------|
| `registerStudent` | Yes (new WhatsApp + valid teacher code) | **No** |
| Existing WhatsApp on register form | No (error → OTP CTA) | No |
| BiteonSwitch callback | No (lookup only) | **Yes** if profile exists |
| Demo bypass | May use existing seed rows | **Yes** when enabled |

**Rationale**: Clarification Q2 — create/link immediately; OTP only mints session. Aligns with abandoned-OTP edge case.

**Alternatives considered**:
- Pending row until OTP — rejected by clarification.
- Keep monolithic `loginWithWhatsApp` — rejected (mints session on register; conflicts with FR-005).

## 4. Public URL strategy

**Decision**: Keep `/login` as primary registration page; add `/register` as thin alias (`redirect` or shared component render). OTP start is a button/link on that page, not a separate mandatory `/login` password form.

**Rationale**: Clarification Q3 + bookmark stability for existing `/login` links and middleware redirects.

**Alternatives considered**:
- Split `/register` vs `/login` pages — deferred; optional later if UX tests fail SC-005.

## 5. Admin privilege model

**Decision**: No new `ADMIN` enum value in v1. Privileged admin = profile with `role = 'TEACHER'` whose `whatsapp_number` is listed in `ADMIN_WHATSAPP_ALLOWLIST` (comma-separated E.164-like digits). Authz check: allowlist **and** `timingSafeEqual` on `ADMIN_FALLBACK_SECRET` (or `ADMIN_SECRET` alias).

**Rationale**: Clarification Q1 requires identity + secret; minimal schema change; teachers already access `/teacher/*`.

**Alternatives considered**:
- New `user_role = ADMIN` — deferred (migration + middleware churn).
- Secret-only fixed profile — rejected by clarification Q1.
- `is_admin` boolean column — acceptable later; env allowlist ships faster.

## 6. OTP outage behavior

**Decision**: On provider unreachable / verify failure: Arabic recoverable error + retry. No student/teacher emergency secret. Only `/admin/login` bypasses OTP.

**Rationale**: Clarification Q5.

## 7. Replay protection

**Decision**: On OTP start, create `auth_otp_states` row: `id` (uuid state), `created_at`, `consumed_at`, optional `whatsapp_hint`. Callback requires matching unconsumed state; mark consumed in same transaction path before `establishSession`. Second callback with same state → Arabic error, no session corruption.

**Rationale**: Spec edge case for duplicate callback.

**Alternatives considered**:
- Signed JWT state only without DB — weaker replay story if token leaks within TTL.
- Provider-side idempotency only — cannot rely without docs.

## 8. Demo access

**Decision**: When `AUTH_DEMO_BYPASS=true` **or** `NODE_ENV !== 'production'`, keep one-click / direct demo path for `963912345678` / `963987654321` that calls `establishSession` without BiteonSwitch. Disabled in production unless explicitly forced (prefer never force in prod).

**Rationale**: FR-012 / SC-007; AGENTS.md demo accounts.

**Alternatives considered**:
- Always call real BiteonSwitch in local — rejected (blocks offline/dev).

## 9. Env documentation file

**Decision**: Create `.env.local.example` (referenced by AGENTS.md; currently missing) documenting:

```text
BITEONSWITCH_API_KEY=
BITEONSWITCH_APP_ID=
BITEONSWITCH_CALLBACK_URL=http://localhost:3000/api/auth/biteonswitch/callback
BITEONSWITCH_HOSTED_LOGIN_URL=   # optional override
BITEONSWITCH_API_BASE_URL=       # optional verify API base
ADMIN_FALLBACK_SECRET=
ADMIN_WHATSAPP_ALLOWLIST=963912345678
AUTH_DEMO_BYPASS=true
```

**Rationale**: Spec FR env requirement; operators need a single checklist.

## 10. Spekit / registry

**Decision**: Update `.speckit/spec.yaml` for AUTH-001/002 routes/acceptance; add AUTH-005. Add spekit targets only if new distinct help surfaces (e.g. `admin-login-form`, `login-otp-cta`); reuse existing login field targets where possible.

**Rationale**: FR-013 + ENABLE-001 conventions.
