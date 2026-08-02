# Research: Block Inactive Account Login (AUTH-007)

**Date**: 2026-08-02  
**Status**: Complete — all Technical Context items resolved

## 1. Teacher inactivity signal

**Decision**: Use existing `profiles.teacher_account_status` enum (`active` | `inactive`). No new column.

**Rationale**: ADMIN-001 already manages this field; email login already rejects `inactive` via `loginTeacherWithEmail`. Gap is WhatsApp OTP, emergency fallback, and demo paths.

**Alternatives considered**:
- New `profiles.is_active` boolean — rejected; duplicates `teacher_account_status`.
- Soft-delete profiles — rejected; out of scope and breaks FK history.

## 2. Student inactivity signal

**Decision**: AUTH-007 blocks a student when:
1. Count of `student_teachers` with `status = 'active'` is **0**, AND
2. Count with `status = 'deactivated'` is **≥ 1**.

Pending-only (pending links, zero deactivated) → **not** blocked; AUTH-002 limited session remains.

**Rationale**: Spec clarifications Session 2026-08-02 (Q1). Matches TEACH-001 deactivate semantics without a student profile flag.

**Alternatives considered**:
- Block any zero-active student (including pending-only) — rejected; breaks registration OTP completion.
- New student `account_status` on profiles — rejected for v1; larger migration + admin UX; can revisit later.

## 3. Where to enforce at login

**Decision**: Evaluate eligibility **before** calling `establishSession` (which writes `last_session_id` and saves iron-session). Prefer a shared helper `assertCanEstablishSession(profileId, role)` used by:
- BiteonSwitch callback
- `login.ts` demo + teacher-link completion
- `auth.ts` emergency + email (map email `"inactive"` → `ACCOUNT_INACTIVE`)

Optionally also call from inside `establishSession` as a hard backstop (defense in depth) after loading status/links.

**Rationale**: Spec FR-005 — refused login must not rotate device session id.

**Alternatives considered**:
- Only check inside `establishSession` — acceptable backstop; still need callers to surface `ACCOUNT_INACTIVE` cleanly for OTP redirect.
- Check only in UI — rejected; bypassable.

## 4. Mid-session enforcement vs middleware

**Decision**: Enforce in `getValidatedSession` (`src/lib/auth.ts`) after AUTH-003 device-lock check. **Do not** add Supabase lookups to `middleware.ts` (PERF-001).

On inactive: `redirect("/login?error=account_inactive")` (cookie overwrite on next successful login — same limitation as device_lock today).

**Rationale**: Spec assumption + constitution server layer; middleware stays iron-session decrypt only.

**Alternatives considered**:
- Middleware + admin client — rejected; PERF-001 / cold-edge cost.
- Clear cookies in RSC before redirect — currently unsupported pattern in codebase; match device_lock.

## 5. Query param for Arabic message

**Decision**: Use **`/login?error=account_inactive`**. Add to `QUERY_ERROR_MAP` and `LOGIN_UI_AR` with canonical copy:  
«عذراً، هذا الحساب غير فعال. يرجى التواصل مع الإدارة».

Also return Server Action `{ status: "error", code: "ACCOUNT_INACTIVE" }` for in-form demos/email/emergency so `loginMessageForCode` works without query.

**Rationale**: `login-form.tsx` already reads `searchParams.get("error")` via `loginMessageForQueryError`. `reason=device_lock` is **not** currently mapped in login UI — avoid repeating that gap.

**Alternatives considered**:
- `reason=account_inactive` only — rejected unless login form also reads `reason`.
- Toast-only with no query — rejected; mid-session redirect loses message.

## 6. Multi-teacher mid-session re-scope

**Decision**: In `getValidatedSession` / student path:
1. Load student’s links (`status`, `teacher_id`) or active set.
2. If ≥1 active:
   - If `session.currentTeacherId` is still active → keep.
   - Else set `currentTeacherId` to oldest active link (same order as `getActiveTeacherId`) and `session.save()`.
3. If 0 active and ≥1 deactivated → inactive redirect.
4. If 0 active and 0 deactivated (pending-only / orphan) → do **not** AUTH-007 inactive redirect; existing pending / needs-teacher flows apply.

**Rationale**: Spec clarification Q3 / FR-007a.

## 7. OTP cost / pre-check

**Decision**: Hard gate at **session issuance** (callback / mint). Optional soft pre-check when WhatsApp is known before starting OTP is **nice-to-have**, not required for AUTH-007 acceptance.

**Rationale**: BiteonSwitch hosted OTP may start before profile resolution; session mint is the security boundary.

## 8. Testing strategy

**Decision**: Pure unit tests on `account-access` predicates + thin tests that `ACCOUNT_INACTIVE` maps to Arabic; integration-style tests mocking supabase only if existing auth tests do so. Describe: `[AUTH-007]`.

**Rationale**: Spec FR-010; matches repo Spekit-mapped Vitest style without brittle full OTP e2e for v1.
