# Server Action Contracts: PROFILE-001

**Module**: `src/actions/profile.ts` (new)  
**Auth**: All actions require valid device session via `getSession()` + `validateDeviceSession` or role-specific `requireStudent`/`requireTeacher` where applicable.

---

## `getSettingsProfile()`

**Type**: Query (no mutation)  
**Auth**: Any logged-in user (`session.isLoggedIn`)

**Returns**: `SettingsProfile` (see data-model.md)

**Errors**:
- Unauthenticated → redirect `/login` (via auth helper)

**Side effects**: None

---

## `updateProfileName(formData: FormData)`

**Type**: Mutation  
**Auth**: Any logged-in user

**Input**:
| Field | Type | Rules |
|-------|------|-------|
| `full_name` | string | Required after trim; max 100 chars |

**Returns**: `{ success: boolean; message: string }`

**Success**:
- Updates `profiles.full_name` where `id = session.profileId`
- Sets `session.fullName` and saves cookie
- `revalidatePath('/settings')`, `revalidatePath('/teacher/settings')`

**Failure messages** (Arabic):
- Empty name → `"الاسم مطلوب"`
- DB error → generic app error message

---

## `logoutOtherDevices()`

**Type**: Mutation  
**Auth**: Any logged-in user

**Input**: None

**Returns**: `{ success: boolean; message: string }`

**Behavior**:
1. `newToken = generateSessionToken()`
2. `UPDATE profiles SET last_session_id = newToken WHERE id = session.profileId`
3. `session.sessionToken = newToken`; `session.save()`

**Success message**: `"تم تسجيل خروج الأجهزة الأخرى — جلسة هذا الجهاز فقط نشطة الآن."`

**Failure**: DB update error → `{ success: false, message: ... }`

---

## Reused actions (existing)

### `logout()` — `src/actions/auth.ts`

- Clears session, nulls `last_session_id`, redirects `/login`
- Invoked from settings after client confirmation dialog

### `requestProUpgrade()` — `src/actions/student.ts`

- Student-only; requires `currentTeacherId`
- Returns `{ success, message }` — same contract as dashboard Pro card
