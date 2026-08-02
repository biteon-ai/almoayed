# Implementation Plan: Block Inactive Account Login

**Branch**: `020-block-inactive-login` | **Date**: 2026-08-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/020-block-inactive-login/spec.md`

**Feature ID (registry)**: `AUTH-007` (alias `FIX-AUTH-002`; extends `AUTH-001` · `AUTH-003` · `AUTH-004` · `AUTH-005` · `MT-001` · `MT-002` · `ADMIN-001`)

## Summary

Prevent **inactive teachers** (`profiles.teacher_account_status = inactive`) and **deactivated students** (zero `active` teacher links **and** ≥1 `deactivated` link) from receiving an iron-session. Enforce the same rules on mid-session protected access: force logout → `/login?error=account_inactive` with canonical Arabic copy; if a multi-teacher student’s *current* link is deactivated but another active link remains, **re-scope** `currentTeacherId` (do not logout). Pending-only students keep AUTH-002 limited onboarding.

**Technical approach**: Pure helpers in `src/lib/account-access.ts`; gate **before** `establishSession` / `last_session_id` write on all login paths; extend `getValidatedSession` in `src/lib/auth.ts` for mid-session checks + re-scope; add `AuthErrorCode.ACCOUNT_INACTIVE` + login query/UI mapping; Vitest `[AUTH-007]`; update `.speckit/spec.yaml`; `npm run build`. **No schema migration** (reuse existing columns). **No Supabase in middleware** (PERF-001).

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC, Server Actions |
| **Database** | **Supabase** PostgreSQL — **no new migration** |
| **Data access** | Server Actions + `createAdminClient()` |
| **Session / auth** | iron-session — `establishSession`, `requireStudent` / `requireTeacher` |
| **UI** | Tailwind, Shadcn, IBM Plex Sans Arabic RTL, login query-error UI |
| **Testing** | Vitest `tests/features/auth-007-inactive-login.test.ts` |
| **Target platform** | Mobile-first PWA |
| **Spec registry** | `.speckit/spec.yaml` → AUTH-007 / FIX-AUTH-002 |

**Feature-specific overrides**:

- **Primary Dependencies**: Existing stack only.
- **Storage / tables touched**: `profiles.teacher_account_status` (read); `student_teachers.status` (read); `profiles.last_session_id` (must **not** update on refused login).
- **Performance Goals**: One extra narrow profile/link select on login mint; mid-session check folded into existing `getValidatedSession` request-cache (same PERF-001 memoization) — ideally combine with device-lock profile fetch where possible.
- **Constraints**: QUIZ-001 unchanged; MT-002 re-scope when current link deactivated; middleware stays session-decrypt only (no DB); AUTH-002 pending-only session preserved; demo/emergency/email/OTP all gated.
- **Scale/Scope**: Auth + session guards + login error UI; no new admin deactivate UI (uses existing ADMIN-001 / TEACH-001 controls).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md`

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries / active teacher | PASS — student re-scope picks another **active** link; logout only when zero active remain |
| QUIZ-001 | No answer leakage pre-submit | PASS — no quiz select changes |
| Server layer | Privileged data via server only | PASS — checks in Server Actions / `require*` with admin client |
| RTL UX | Arabic RTL, touch targets | PASS — existing login error surface + canonical Arabic copy |
| Minimal diff | Match existing patterns | PASS — central helper + existing `AuthErrorCode` / query-error map |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — middleware remains DB-free; session mint gated before `last_session_id`; pending AUTH-002 path untouched; inactive query uses `error=` (login UI already maps `error`, not `reason`).

## Project Structure

### Documentation (this feature)

```text
specs/020-block-inactive-login/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── server-actions.md
│   └── ui-components.md
└── tasks.md                # /speckit-tasks
```

### Source Code (planned touch points)

```text
src/lib/account-access.ts                 # NEW pure predicates + resolveActiveTeacherId
src/lib/auth-error-codes.ts               # ACCOUNT_INACTIVE
src/lib/login-ui-messages.ts              # Arabic + QUERY_ERROR_MAP account_inactive
src/lib/auth-session.ts                   # optional assert before mint / widen selects
src/lib/auth.ts                           # getValidatedSession: inactive + re-scope
src/app/api/auth/biteonswitch/callback/route.ts
src/actions/auth.ts                       # emergency + email (unify inactive message)
src/actions/login.ts                      # demo + link-complete mint paths
src/lib/admin/auth.ts                     # already returns "inactive" — map to ACCOUNT_INACTIVE
src/app/login/login-form.tsx              # ensure query error displays (may already)
tests/features/auth-007-inactive-login.test.ts
.speckit/spec.yaml
AGENTS.md                                 # list AUTH-007
```

**Structure decision**: Centralize eligibility in pure `account-access` helpers tested by Vitest; call from login mint sites + `getValidatedSession`. Prefer `/login?error=account_inactive` over `reason=` because `loginMessageForQueryError` only reads `error` today.

## Complexity Tracking

> No constitution violations.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
