# Research: Teacher Login Recovery (AUTH-009)

**Date**: 2026-09-14  
**Status**: Complete — all Technical Context items resolved

## 1. Token persistence vs signed JWT

**Decision**: Persist hashed one-time tokens in Postgres (`teacher_login_tokens`), not self-contained JWTs.

**Rationale**: Spec requires single-use, expiry, and consume-on-success. A DB row with `consumed_at` makes replay checks trivial and matches `auth_otp_states`. JWT would still need a denylist for consume, so a row is simpler.

**Alternatives considered**:
- Signed JWT in the query string only — rejected (cannot reliably mark used without storage).
- Reuse `auth_otp_states` — rejected (WhatsApp OTP shape: `whatsapp_hint`, no purpose/email/TTL columns).
- Store raw token — rejected (DB leak would mint sessions / reset passwords).

## 2. Secret format

**Decision**: 32-byte cryptographically random value, URL-safe hex (64 chars). Store `sha256(secret)` as `token_hash` (unique). Lookup hashes the inbound query param with the same algorithm (timing-safe compare not required after unique-index fetch).

**Rationale**: Unguessable; fits in email links; no extra encoding libraries.

**Alternatives considered**: UUID v4 only — weaker than 256 bits of CSPRNG; still acceptable but hex secret is explicit.

## 3. Email existence disclosure

**Decision**: Follow spec FR-006/FR-013: if no **TEACHER** row for the normalized email, return Arabic «لا يوجد حساب مدرس بهذا البريد» and send nothing. Inactive teacher → AUTH-007 copy, send nothing. Super Admin / student emails count as not-found.

**Rationale**: Product explicitly asked for a clear not-found message. Enumeration risk is accepted for v1; rate limit (3/15 min) plus teacher-only lookup limits abuse.

**Alternatives considered**: Generic “if this email exists…” — rejected (spec assumption). Same message for inactive and missing — rejected (AUTH-007 already has canonical inactive copy).

## 4. Mail delivery

**Decision**: Use existing `sendEmail()` in `src/lib/resend.ts`. `from` = `getResendFromEmail()` (env `RESEND_FROM_EMAIL`, e.g. `Almoayed <info@almoayed.app>`). `to` = teacher email. HTML + subject Arabic. Link host = `getAppUrl()` (no trailing slash) so production/dev origins stay correct. If Resend is unconfigured or send fails after insert: mark token unused still (do not consume), return `MAIL_SEND_FAILED`; optionally delete the unused row so rate-limit is not burned — **prefer delete unused row on send failure**.

**Rationale**: EMAIL-001 already wired; constitution Server Actions stay the only privileged path.

**Alternatives considered**: New mail vendor — rejected. Queue/outbox table — overkill for v1.

## 5. Middleware / public routes

**Decision**: Treat `/teacher/login`, `/teacher/reset`, `/teacher/magic` (and their subpaths) as **public teacher-auth** paths, same idea as `/teacher/login` today. `/teacher/dashboard` and the rest of `/teacher/*` stay session-gated.

**Rationale**: `teacherPaths = ["/teacher"]` currently protects everything except exact `/teacher/login`. Reset/magic pages must be reachable signed-out.

**Alternatives considered**: Nest under `/login/teacher-reset` — rejected (keeps teacher recovery next to teacher login). Query-param modal only on `/teacher/login` for reset form — still need a **GET** URL for the emailed link.

## 6. Magic link vs password reset consume timing

**Decision**:
- **Magic**: consume token **before** `establishSession` succeeds in the same request; if session mint fails, leave consumed (user requests a new link) — avoids double-use races. Prefer: consume in the same transaction/update `WHERE consumed_at IS NULL` so two tabs cannot both succeed.
- **Reset**: validate token on page load **without** consuming; consume in the same update as `password_hash` write (`consumed_at = now()` CAS). Weak/mismatched password does not consume.

**Rationale**: Matches spec FR-008 (link remains usable until successful password set) vs FR-012 (one tap sign-in).

## 7. Password rules

**Decision**: Reuse create-teacher rule: trimmed length **≥ 8** (`src/lib/admin/teachers.ts`). Confirm field must match. Hash with existing `hashPassword` (bcrypt, 10 rounds).

**Rationale**: Spec: “same strength rules already used when Super Admin creates a teacher password.”

## 8. Rate limit

**Decision**: Count `teacher_login_tokens` rows for that `profile_id` with `created_at > now() - 15 minutes` (both purposes). If count ≥ 3, return `RECOVERY_RATE_LIMITED` **without** inserting or sending. Failed lookups (unknown email) also rate-limit by **normalized email hash** in-memory/DB: store optional `email_norm` on a lightweight counter **or** insert no row and throttle unknown emails via hashed email in the same table with `profile_id` null.

Simpler v1 for unknown emails: still no row; apply a hashed-email counter table is extra. **v1**: rate-limit **successful** sends only (spec FR-018). Unknown-email flooding gets the same Arabic not-found each time; add `email_hash` + count later if abused.

**Rationale**: Spec FR-018 is “3 successful sends per email per 15 minutes.”

## 9. Link URLs

**Decision**:
- Reset: `{getAppUrl()}/teacher/reset?token={secret}`
- Magic: `{getAppUrl()}/teacher/magic?token={secret}`

www production traffic 301s to apex (`next.config.mjs`); emails use canonical `NEXT_PUBLIC_APP_URL`.

## 10. UI composition

**Decision**: Keep one client page at `/teacher/login` with local mode `login | forgot | magic`. Reset **completion** is a separate page (needs its own URL). Magic completion is a small client/RSC page that posts the token to a Server Action then redirects to `/teacher/dashboard`.

**Rationale**: Email clients must open a stable GET URL. Login-card modes avoid extra routes for “type your email.”
