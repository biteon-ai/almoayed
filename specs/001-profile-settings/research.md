# Research: User Profile & Settings (PROFILE-001)

**Date**: 2026-07-14  
**Status**: Complete — all Technical Context items resolved

## 1. Route strategy: `/settings` vs `/teacher/settings`

**Decision**: Shared `SettingsPage` component; two App Router entries — `/settings` and `/teacher/settings` — both render the same tree with role-adaptive sections.

**Rationale**: Spec requires equivalent UX on both paths. Teachers use `/teacher/layout.tsx` nav; a hard redirect from `/teacher/settings` → `/settings` would drop teacher shell context. Students stay on `/settings` under student flows.

**Alternatives considered**:
- Redirect `/teacher/settings` → `/settings` — rejected (breaks teacher nav active state).
- Separate duplicate pages — rejected (violates FR-002 shared components).

## 2. Session “log out other devices” with AUTH-003

**Decision**: New Server Action `logoutOtherDevices()` generates a fresh `sessionToken` via `generateSessionToken()`, writes it to `profiles.last_session_id`, and updates the current iron-session cookie to match.

**Rationale**: AUTH-003 stores a single canonical token in DB. Any device holding an old cookie fails `validateDeviceSession()` on next request. Rotating token while updating current session is the standard pattern for “invalidate others, keep me.”

**Alternatives considered**:
- Set `last_session_id` to null — rejected (would invalidate current session too per edge cases in `isDeviceSessionValid`).
- Track multiple session rows — rejected (schema change, contradicts single-device policy).

## 3. Profile name update + session sync

**Decision**: `updateProfileName(name)` validates non-empty trimmed string, updates `profiles.full_name`, sets `session.fullName`, calls `session.save()`, `revalidatePath('/settings')` and `/teacher/settings`.

**Rationale**: Dashboard welcome text reads `session.fullName`; updating DB alone would stale UI until re-login.

**Alternatives considered**:
- DB-only update — rejected (session.fullName stale until logout).

## 4. Student tier and teacher code data source

**Decision**: For students, load `student_teachers` row where `student_id = profileId` AND `teacher_id = session.currentTeacherId`; display `tier`, `upgrade_requested`, and joined teacher `teacher_code`.

**Rationale**: Tier is per teacher link (MT-002), not global profile field. Matches `getStudentTier()` and `requestProUpgrade()` in `src/actions/student.ts`.

**Alternatives considered**:
- `profiles.is_subscribed` only — rejected (legacy gate; tier lives on link for multi-tenant).

## 5. Pro upgrade on settings page

**Decision**: Reuse existing `requestProUpgrade()` Server Action; show button when `tier === 'free'` and `!upgrade_requested`; pending state when `upgrade_requested === true`.

**Rationale**: FR-007 requires consistency with existing workflow; `ProUpgradeCard` pattern already exists on dashboard.

## 6. Logout confirmation

**Decision**: Client `AlertDialog` (Shadcn) wrapping existing `logout()` Server Action form submit.

**Rationale**: Dashboard/teacher layout use instant logout form; settings spec requires confirmation (FR-011). AlertDialog matches existing UI kit.

## 7. Middleware protection

**Decision**: Extend `middleware.ts` matcher to include `/settings`; allow both roles on `/settings`; keep `/teacher/settings` under existing `/teacher/*` teacher-only guard.

**Rationale**: Currently `/settings` is unprotected. Student routes redirect teachers away — settings must be an exception or use dedicated logic.

**Implementation note**: Add `/settings` to matcher with role-neutral auth check (logged in only). `/teacher/settings` remains teacher-only via `/teacher/*` rules.

## 8. Spekit hook placement

**Decision**: Add to `SPEKIT`:
- `profileTierInfo`: `profile-tier-info` — on student tier Badge
- `profileTeacherCode`: `profile-teacher-code` — on teacher code section (student read-only + teacher copy)
- `profileSessionManagement`: `profile-session-management` — on Active Sessions Card

**Rationale**: Matches user-specified IDs and ENABLE-001 constitution rule.

## 9. Teacher extended profile (school, bank)

**Decision**: Out of scope for PROFILE-001 v1.

**Rationale**: Spec FR list does not include school/bank editing. TEACH-008 partial status remains for those fields until a follow-up feature.
