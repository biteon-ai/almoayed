# Contracts: Server Actions (AUTH-008)

**New module**: `src/actions/join.ts`  
**Client**: `createAdminClient()` / `getAuthSupabaseClient()` only.  
**Session**: `establishSession` from `src/lib/auth-session.ts`.

## Pure helpers — `src/lib/trial-join.ts`

```ts
normalizeTeacherJoinCode(raw: string): string; // trim; reject empty

buildTrialJoinPath(teacherCode: string): string; // `/join/${encodeURIComponent(code)}`

buildTrialJoinAbsoluteUrl(teacherCode: string, origin?: string): string;
// origin default APP_URL, no trailing slash

buildTrialInviteShareUrl(input: {
  teacherName: string;
  joinUrl: string;
}): { text: string; whatsappHref: string };
// Preset Arabic invite; LTR isolates around joinUrl; api.whatsapp.com/send?text=

canSkipOtp(profileExists: boolean): boolean; // !profileExists

type JoinFormFields = {
  firstName: string;
  lastName: string;
  educationStage: string;
  birthDate: string; // YYYY-MM-DD
  whatsappNumber: string;
};

validateTrialJoinForm(fields: JoinFormFields):
  | { ok: true; fullName: string; whatsapp: string; educationStage: EducationStage; birthDate: string }
  | { ok: false; message: string; field?: string };
```

Compose `fullName` as `` `${first} ${last}` `` then `validateDisplayName`. WhatsApp: `normalizeWhatsAppNumber`, length 10–15. Birth: `parseBirthDate`. Stage: `isEducationStage`.

## `joinTrialStudent(formData)` 

Form fields: `teacher_code` (hidden from URL), `first_name`, `last_name`, `education_stage`, `birth_date`, `whatsapp_number`.

Returns (Flight-safe; reuse `AuthErrorCode` + one new code if needed):

```ts
type JoinState =
  | { status: "success"; role: "STUDENT" }          // caller redirect /dashboard
  | { status: "redirect"; redirectUrl: string }     // hosted OTP
  | { status: "error"; code: AuthErrorCode };
```

Suggested codes: existing `INVALID_TEACHER_CODE`, `ACCOUNT_INACTIVE`, `INVALID_WHATSAPP`, `MISSING_FULL_NAME` (or field-level Arabic via a small join-specific error map). Optional new `JOIN_TEACHER_ACCOUNT` when WhatsApp belongs to a TEACHER.

### Algorithm

1. Validate form (`validateTrialJoinForm`). Fail → error, no writes.
2. Resolve teacher by code; `role === TEACHER`; `isTeacherAccountActive(teacher_account_status)`. Else `INVALID_TEACHER_CODE` or `ACCOUNT_INACTIVE`.
3. Lookup `profiles` by normalized WhatsApp.
4. **No row**: insert student profile (see data-model); insert `student_teachers` `{ status: "active", tier: "free" }`; `establishSession(profile, teacher.id)`; return `success`. Unique-violation on WhatsApp → go to step 5.
5. **STUDENT row**: if `isStudentDeactivatedForLogin(links)` → `ACCOUNT_INACTIVE` (no OTP). Else `startBiteonSwitchOtp` with `join_teacher_code`; return `{ status: "redirect", redirectUrl }` — **do not mint**.
6. **TEACHER / SUPER_ADMIN row**: error — use teacher login; **do not mint**.

Must **not** call `registerStudentImpl` (that path is pending + OTP).

## Signed-in link — `linkSignedInStudentToJoinCode(teacherCode)`

`requireStudent()`. Resolve active teacher; upsert `student_teachers` active/free **without lowering existing `pro`**. Save `session.currentTeacherId = teacher.id`. Redirect `/dashboard`. Inactive teacher → Arabic error, no link.

## OTP start — extend `startBiteonSwitchOtp`

Read optional `join_teacher_code` from FormData; persist on `auth_otp_states` insert. Ignore if empty. AUTH-001 callers omit it.

## OTP callback — extend `finishLogin`

After student profile is loaded and AUTH-007 passes:

1. If consumed OTP row has `join_teacher_code`, resolve that teacher (must be active TEACHER).
2. Upsert `student_teachers` for `(student, teacher)`:
   - new row: `active` + `free`
   - existing `pro`: keep `pro`, set `status = active` if it was pending (do not deactivate)
   - deactivated-only student still blocked by AUTH-007 **before** this step
3. `establishSession(profile, referringTeacherId ?? access.teacherId)`.

If `join_teacher_code` is missing/invalid, keep current AUTH-001 behavior (existing links / `needs_teacher`).

## Non-goals

- Do not add OTP-free login to `/login`.
- Do not change `registerStudentAndRequestOTP`.
- Do not check inactivity in `middleware.ts`.
- Do not select `correct_answer` anywhere in this feature.
