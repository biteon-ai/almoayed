# Data Model: Fast Student Trial Onboarding Link

**Date**: 2026-08-18  
**Schema source**: Existing `profiles` + `student_teachers` + `auth_otp_states`; one additive column.

## Entity: Trial join address (derived, not stored)

| Piece | Source |
|-------|--------|
| Origin | `APP_URL` (`NEXT_PUBLIC_APP_URL`) |
| Path | `/join/{teacher_code}` |
| Teacher | `profiles.teacher_code` UNIQUE, `role = TEACHER` |

v1 does not persist tokens, expiry, or rotation. Invalid/inactive codes fail at read time.

---

## Entity: Profile (`profiles`) — existing columns

Used on **insert** for a new trial student:

| Field | Value |
|-------|--------|
| `whatsapp_number` | Normalized digits; UNIQUE identity |
| `full_name` | `first_name` + ` ` + `last_name` (validated, max 100) |
| `role` | `STUDENT` |
| `birth_date` | ISO date from form |
| `education_stage` | Form class/grade enum |
| `referral_source` | `whatsapp` |
| `onboarding_completed` | `true` (skip first wizard) |
| `profile_completed` | `false` (keep PROFILE-002 quiz gate) |
| `is_subscribed` | `true` (active classroom membership) |
| `last_session_id` | Set by `establishSession`, not by the insert itself |

**Not written on join**: `province`, `city`, `first_name`/`last_name` columns (do not exist), `teacher_code`.

**Existing profile** (any role): join form MUST NOT update demographics or mint a session. Student → OTP + optional link. Teacher → refuse student join.

### Validation

| Field | Rule |
|-------|------|
| First name / last name | Each non-empty after trim; combined `validateDisplayName` |
| WhatsApp | Digits only, length 10–15 |
| Birth date | `parseBirthDate` — ISO, not future, age ≥ 6 |
| Education stage | `isEducationStage` |
| Teacher code | Trimmed; resolves to one active TEACHER |

---

## Entity: Classroom membership (`student_teachers`)

| Field | Trial join (new student) | Existing student after OTP from join |
|-------|--------------------------|--------------------------------------|
| `student_id` / `teacher_id` | New profile / referring teacher | Existing profile / referring teacher |
| `status` | **`active`** | Upsert **`active`** if teacher still active |
| `tier` | `free` | `free` if inserting; do not downgrade existing `pro` |
| `upgrade_requested` | `false` | Unchanged if row exists |

UNIQUE `(student_id, teacher_id)`. Duplicate same-teacher join after OTP: no second row; session uses that teacher as `currentTeacherId`.

AUTH-002 self-register remains `pending` — **not** this feature.

---

## Entity: OTP state (`auth_otp_states`) — extend

| Field | Type | Notes |
|-------|------|--------|
| existing | — | Unchanged (`id`, `whatsapp_hint`, `created_at`, `consumed_at`, `provider_ref`) |
| `join_teacher_code` | `TEXT NULL` | Referring classroom code when OTP was started from `/join/...` |

### Migration

`supabase/migrations/016_trial_join_otp_code.sql`

```sql
ALTER TABLE auth_otp_states
  ADD COLUMN IF NOT EXISTS join_teacher_code TEXT;

COMMENT ON COLUMN auth_otp_states.join_teacher_code IS
  'AUTH-008: teacher_code to link after OTP when join started from /join/[code]';
```

No RLS change (admin client only, same as today).

---

## Entity: Session (iron-session — not DB)

Unchanged shape. After successful trial join or OTP-from-join:

| Field | Value |
|-------|--------|
| `isLoggedIn` | `true` |
| `role` | `STUDENT` |
| `currentTeacherId` | Referring teacher `id` |
| `sessionToken` | New; written to `profiles.last_session_id` |
| `pendingTeacherLink` | `false` |

Logout: existing AUTH-004 (`last_session_id = null`, cookie reset).

---

## Derived: OTP-free eligibility

```text
canSkipOtp(whatsapp) =
  no profiles row with that whatsapp_number
```

Once a row exists (student or teacher), `canSkipOtp` is false forever for that number.

---

## State transitions

### New WhatsApp + valid active teacher

```text
Anonymous → submit join
  → profiles INSERT (student, onboarding_completed)
  → student_teachers INSERT (active, free)
  → establishSession(currentTeacherId = teacher)
  → /dashboard
```

### Existing student WhatsApp + join link

```text
Anonymous → submit join
  → NO session
  → OTP state with join_teacher_code
  → BiteonSwitch
  → callback: AUTH-007 check
       fail → /login?error=account_inactive
       ok → upsert active link to referring teacher
            → establishSession
            → /dashboard
```

### Existing teacher WhatsApp

```text
Submit join → error (use teacher login) → no student session
```

### Inactive teacher code

```text
Open or submit /join/[code] → Arabic inactive/invalid → no session
```

### Signed-in student + new teacher code

```text
GET /join/[code] → upsert active/free link → currentTeacherId = that teacher → /dashboard
```

---

## Relationships

```text
Teacher Profile 1 — owns — teacher_code — 1 Trial join URL
Teacher Profile 1 — N student_teachers N — Student Profile
Student Profile 1 — 1 iron-session (device lock via last_session_id)
OTP state 0..1 — join_teacher_code — Teacher Profile.teacher_code
```
