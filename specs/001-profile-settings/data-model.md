# Data Model: User Profile & Settings (PROFILE-001)

**Date**: 2026-07-14  
**Schema source**: Existing migrations — no new tables or columns required.

## Entities

### Profile (`profiles`)

| Field | Type | Settings usage |
|-------|------|----------------|
| `id` | uuid | Session `profileId` — scope all reads/updates |
| `whatsapp_number` | text | Display read-only (login identifier) |
| `full_name` | text | Editable via settings Save |
| `role` | `TEACHER` \| `STUDENT` | Determines adaptive UI sections |
| `teacher_code` | text \| null | Teachers: display + copy; Students: N/A on profile row |
| `last_session_id` | text \| null | AUTH-003 — rotated by logout-other-devices |
| `school_name` | text | Not shown in v1 settings |
| `bank_details` | jsonb | Not shown in v1 settings |

**Validation (name update)**:
- Trim whitespace
- Reject empty string after trim
- Max length: 100 characters (reasonable default; matches login form expectations)

### StudentTeacher link (`student_teachers`)

| Field | Type | Settings usage (students only) |
|-------|------|--------------------------------|
| `student_id` | uuid | Filter: `= session.profileId` |
| `teacher_id` | uuid | Filter: `= session.currentTeacherId` |
| `tier` | `free` \| `pro` | Badge display |
| `upgrade_requested` | boolean | Hide/disable Pro button when true |
| `status` | enum | Only `active` links considered |

**Join**: `profiles` on `teacher_id` → `teacher_code`, `full_name` (teacher name optional subtitle)

### Session (iron-session cookie — not DB table)

| Field | Settings usage |
|-------|----------------|
| `profileId` | Auth scope |
| `fullName` | Display + sync on name save |
| `whatsappNumber` | Display read-only |
| `role` | UI branching |
| `sessionToken` | Must match `profiles.last_session_id` after rotation |
| `currentTeacherId` | Student tier/code context |

## Read model: SettingsProfile DTO

Aggregated server-side for the settings page (not a DB view):

```typescript
interface SettingsProfile {
  fullName: string;
  whatsappNumber: string;
  role: "STUDENT" | "TEACHER";
  // Student-only (null when teacher or no active teacher)
  activeTeacherCode: string | null;
  tier: "free" | "pro" | null;
  upgradeRequested: boolean;
  // Teacher-only
  teacherCode: string | null;
}
```

## State transitions

### Name update

```
[View settings] → user edits name → Save
  → validate → UPDATE profiles.full_name
  → UPDATE session.fullName → save cookie
  → revalidate → UI shows new name
```

### Log out other devices

```
[Active session shown] → user confirms
  → generateSessionToken()
  → UPDATE profiles.last_session_id = newToken
  → session.sessionToken = newToken → save cookie
  → success toast (current session remains valid)
```

Other devices: next request → `validateDeviceSession` fails → redirect `/login?reason=device_lock`

### Logout

```
[Logout tapped] → AlertDialog confirm → logout()
  → UPDATE profiles.last_session_id = null
  → clear session cookie → redirect /login
```

### Pro upgrade request (student, free tier)

```
[Request Pro] → requestProUpgrade() (existing)
  → UPDATE student_teachers.upgrade_requested = true
  → UI shows pending state
```

## Edge case data handling

| Case | Behavior |
|------|----------|
| Student, no `currentTeacherId` | `activeTeacherCode` null, tier null, Pro button disabled with Arabic hint |
| Student, no active link row | Same as above |
| Teacher, no `teacher_code` | Show empty state message (should not happen for valid teachers) |
| Pending upgrade | Badge stays Free; button replaced with pending label |

## Security rules

- All mutations require `enforceValidSession()` (existing auth helpers)
- `updateProfileName` scoped to `session.profileId` only
- `logoutOtherDevices` scoped to `session.profileId` only
- No cross-user reads — student teacher code from own `student_teachers` link only
