# Implementation Plan: Teacher Login Recovery

**Branch**: `028-teacher-login-recovery` | **Date**: 2026-09-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/028-teacher-login-recovery/spec.md`

**Feature ID (registry)**: `AUTH-009` (extends `ADMIN-001` · `AUTH-003` · `AUTH-007`)

## Summary

Enhance `/teacher/login` so admin-provisioned teachers can (1) return to the main platform login, (2) request a password-reset email when their address is an **active teacher**, and (3) request a one-time magic-link sign-in. Unknown / non-teacher emails get a clear Arabic not-found error and **no** message. Inactive teachers get AUTH-007 copy and no message. Links are hashed, single-use, and origin-aware (`getAppUrl()`). Mail uses the existing Resend helper (`sendEmail` + `RESEND_FROM_EMAIL`).

**Technical approach**:
1. New `teacher_login_tokens` table (hashed secret, purpose, TTL, consume, RLS deny-all).
2. Pure lookup/rate-limit/token helpers in `src/lib/teacher-login-recovery.ts`; Server Actions for request + reset; GET handler/action for magic consume that calls `establishSession` (AUTH-003).
3. Public routes `/teacher/reset` and `/teacher/magic` — extend middleware so they are **not** treated as authenticated teacher portal.
4. Teacher login card: back link, forgot-password subflow, magic-link CTA, `HubToast` + existing inline Arabic alerts.
5. Vitest `[AUTH-009]`; Spekit hooks; registry `AUTH-009`.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for all educational levels and subjects

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC + client islands, Server Actions |
| **Database** | **Supabase** — new `teacher_login_tokens` (`020_teacher_login_tokens.sql`) |
| **Data access** | Server Actions + `createAdminClient()` only |
| **Session / auth** | iron-session via `establishSession`; teacher email/password already exists (`loginTeacherEmail`) |
| **Mail** | `src/lib/resend.ts` `sendEmail()` — From = `RESEND_FROM_EMAIL` |
| **UI** | Tailwind, Shadcn, `card-native`, teal `variant="brand"`, `HubToast` |
| **Testing** | Vitest `tests/features/auth-009-*.test.ts` + Playwright RTL smoke |
| **Target platform** | Mobile-first PWA — production `https://almoayed.app`, dev `https://dev.almoayed.app` |

**Feature-specific overrides**:

- **Primary Dependencies**: `resend` (already in repo), `bcryptjs` (existing password hashes)
- **Storage / tables touched**: `teacher_login_tokens` (new); `profiles.password_hash` / `last_session_id` (existing)
- **Performance Goals**: Recovery request confirmation on screen in &lt; 3s (SC-003); no student exam path impact
- **Constraints**: AUTH-003 device lock on magic sign-in; AUTH-007 inactive block; teacher-role emails only; constitution passwordless rule remains for **students** (justified teacher-email exception — see Complexity Tracking)
- **Scale/Scope**: Teacher login + two public completion routes; no student/admin login changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries / session | PASS — recovery looks up by email + `role=TEACHER` only; no student tenant data |
| QUIZ-001 | No answer leakage pre-submit | PASS — auth-only; quiz exam path unchanged |
| Server layer | Privileged data via Server Actions | PASS — profile + tokens via admin client; no client Supabase |
| RTL UX | Arabic RTL, touch targets | PASS — extend existing teacher login card (`h-12` fields, start-side back link) |
| Passwordless | WhatsApp identity; no email/password for students | **Justified exception** — ADMIN-001 already uses teacher email/password; AUTH-009 only recovers that path |
| Minimal diff | Match existing patterns | PASS — `loginTeacherEmail` / `establishSession` / `HubToast` / `login-ui-messages` |

**Feature compliance**: **PASS** with documented teacher-email exception (not a new student email/password flow).

**Post-design re-check**: **PASS** — hashed tokens + deny-all RLS; middleware public allowlist; magic consume goes through `establishSession` + `assertCanEstablishSession`; Resend only after active-teacher match.

## Project Structure

### Documentation (this feature)

```text
specs/028-teacher-login-recovery/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── server-actions.md
│   ├── ui-components.md
│   └── routes.md
└── tasks.md                    # via /speckit-tasks
```

### Source Code (planned touch points)

```text
supabase/migrations/020_teacher_login_tokens.sql

src/lib/teacher-login-recovery.ts     # NEW — lookup, hash token, TTL, rate limit
src/lib/teacher-login-messages.ts     # NEW — Arabic request/reset copy
src/lib/auth-error-codes.ts           # EXTEND — TEACHER_NOT_FOUND, RESET_INVALID, MAGIC_INVALID, RECOVERY_RATE_LIMITED, MAIL_SEND_FAILED
src/lib/login-ui-messages.ts          # EXTEND — Arabic for new codes
src/lib/resend.ts                     # USE — sendEmail({ to, subject, html }) with branded From
src/lib/app-origin.ts                 # USE — getAppUrl() for link origin
src/actions/teacher-login-recovery.ts # NEW — requestReset, requestMagic, completeReset
src/app/teacher/login/page.tsx        # EXTEND — back, forgot, magic CTA
src/app/teacher/reset/page.tsx        # NEW — set new password
src/app/teacher/magic/page.tsx        # NEW — consume magic token
src/middleware.ts                     # EXTEND — public teacher auth paths
src/lib/spekit-targets.ts
.speckit/spekit-targets.yaml
.speckit/spec.yaml                    # AUTH-009

tests/features/auth-009-teacher-login-recovery.test.ts
e2e/auth-009-teacher-login.spec.ts    # back link + forgot visible, RTL
```

**Structure decision**: Keep password verify/hash in `src/lib/admin/passwords.ts`. Isolate recovery token rules in `teacher-login-recovery.ts` so Vitest can cover lookup/TTL/rate-limit without hitting Resend.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Constitution “passwordless / no email-password” | Teachers already sign in with email+password (`ADMIN-001` `/teacher/login`) | Removing teacher email login is out of scope; students stay WhatsApp-only |

## Phase 0: Research

See [research.md](./research.md). All technical unknowns resolved (token hashing, public routes, Resend, explicit not-found vs enumeration).

## Phase 1: Design

See [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

**Key decisions**:
1. Store **SHA-256 of random secret** in `teacher_login_tokens`; URL carries the raw secret once.
2. Reset TTL **60 min**; magic TTL **15 min**; max **3 successful sends** per email per 15 min (either purpose counts toward the cap).
3. Middleware allowlist: `/teacher/login`, `/teacher/reset`, `/teacher/magic`.
4. Spec FR-006: reveal “no teacher account” (product choice); still never email non-teachers.
5. Magic consume: `assertCanEstablishSession` then `establishSession` (AUTH-003 / AUTH-007).

## Phase 2: Task planning

Deferred to `/speckit-tasks`.
