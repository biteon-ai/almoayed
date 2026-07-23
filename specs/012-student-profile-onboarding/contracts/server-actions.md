# Server Action Contracts: PROFILE-002

**Module**: `src/actions/profile.ts` (extend) + helpers in `src/lib/student-profile.ts`  
**Auth**: `requireStudent()` for student writes; `requireTeacher()` path via existing teacher detail.  
**Client**: `createAdminClient()` only.

```ts
type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }; // Arabic
```

---

## `getStudentProfileState`

```ts
getStudentProfileState(): Promise<{
  onboardingCompleted: boolean;
  profileCompleted: boolean;
  uniqueCompletedQuizzes: number;
  demographics: StudentDemographics; // may be partial
}>
```

- `requireStudent()`; load profile flags + fields for `session.profileId`.
- Count distinct submissions for gate UI messaging (optional).

---

## `completeStudentOnboarding`

```ts
completeStudentOnboarding(input: {
  educationStage: EducationStage;
  referralSource: ReferralSource;
  primarySubject: string;
}): Promise<ActionResult>
```

1. Validate enums + non-empty subject.
2. Update profile; set `onboarding_completed = true`.
3. Do **not** set `profile_completed` unless required set already fully valid (normally leave false).
4. Do **not** touch `currentTeacherId` / `student_teachers`.
5. `revalidatePath` dashboard/settings/onboarding.

---

## `completeRequiredStudentProfile`

```ts
completeRequiredStudentProfile(input: {
  fullName: string;
  birthDate: string; // ISO date
  province: string;
  city: string;
  educationStage: EducationStage;
  email?: string;
  address?: string;
}): Promise<ActionResult<{ redirectTo?: string }>>
```

1. Validate required fields (FR-008).
2. Update profile; set `profile_completed = true`.
3. Preserve session teacher context.
4. Caller supplies safe internal `from` path (e.g. `/quiz/uuid`) — sanitize to same-origin relative path only.

---

## `updateStudentDemographics` (settings)

```ts
updateStudentDemographics(input: StudentDemographicsUpdate): Promise<ActionResult>
```

1. Validate; WhatsApp immutable.
2. Recompute `profile_completed` from required-field validity after update.
3. If required incomplete → `profile_completed = false`.

---

## Pure lib — `src/lib/student-profile.ts`

| Export | Purpose |
|--------|---------|
| `isRequiredProfileComplete(fields)` | Boolean for flag + gate |
| `shouldBlockNewQuiz({ profileCompleted, uniqueCompletedQuizzes, hasSubmissionForQuiz })` | Gate predicate |
| `sanitizeReturnPath(from)` | Allow only `/…` relative paths |
| Zod schemas | Onboarding + complete + settings |
| Stage / referral label maps | Arabic UI |

---

## Teacher read path

`getTeacherStudentDetail(studentId)` MUST include demographics only when link exists for `session.profileId`. Never accept cross-tenant reads.

---

## Spekit (ENABLE-001)

| Hook | Element |
|------|---------|
| `student-onboarding` | Onboarding wizard root |
| `profile-completion-modal` | Full-page completion root (legacy id name) |
| `profile-completion-submit` | Submit control |
| `student-demographics-settings` | Settings demographics block |
