# Research: Fast Student Trial Onboarding Link

**Date**: 2026-08-18  
**Feature**: AUTH-008 / TEACH-015

## 1. Join URL identity

- **Decision**: Public path `/join/[code]` where `code` is the existing unique `profiles.teacher_code` (same code AUTH-002 and TEACH-005 already share).
- **Rationale**: Spec v1 forbids rotatable tokens; the classroom code is already unique and teacher-facing. One address per teacher, copyable forever.
- **Alternatives considered**: Opaque UUID token table (revocable) — extra schema and revoke UX, out of spec. Query `?token=` — worse for sharing and caching than a path segment.

Lookup: trim whitespace; try exact `.eq("teacher_code")`, then case-insensitive match among `role = TEACHER`. Invalid / missing / inactive → Arabic error, no form submit success.

## 2. When OTP may be skipped

- **Decision**: Skip OTP **only if** `profiles.whatsapp_number` has **no row**. Eligibility is not a stored “trial used” flag. After insert, every later entry requires AUTH-001 OTP (join form and `/login`).
- **Rationale**: Matches spec assumption; logout is simply “profile now exists.” Prevents hijack of an existing number via the public link.
- **Alternatives considered**: `trial_join_consumed_at` column — redundant with unique WhatsApp. Cookie-only “already joined” — trivially bypassed.

Race: unique `whatsapp_number`. On unique-violation insert, treat as existing → OTP path (do not mint).

## 3. Link status for trial students

- **Decision**: Insert `student_teachers` as `status: "active"`, `tier: "free"` (same as `createStudentManually` in `src/actions/teacher.ts`). Set `profiles.is_subscribed = true` so roster/analytics match activated students.
- **Rationale**: Quiz list and switcher (`getStudentContext`, `getStudentTeachers`) require **active**. AUTH-002 `pending` would leave trial students unable to take Free exams (FR-009) and looking “not linked” on the roster (US2.7).
- **Alternatives considered**: Reuse AUTH-002 `pending` then auto-activate — extra state, same outcome. Keep pending — **rejected** (breaks Free quiz access).

AUTH-002 `/login` registration remains `pending` + OTP (FR-013).

## 4. Name, class, birth date storage

- **Decision**: No new `profiles` columns. Concatenate trimmed first + last name with a single space → `validateDisplayName` → `full_name`. Class/grade is `education_stage` using `EDUCATION_STAGES` / Arabic labels from `src/lib/student-profile.ts`. Birth date uses `parseBirthDate` (ISO, not future, age ≥ 6).
- **Rationale**: Spec maps class to existing profiling choices; product already displays a single full name everywhere.
- **Alternatives considered**: `first_name`/`last_name` columns — migration + UI churn. `teacher_groups` as class — groups are teacher-specific and optional (TEACH-002), not a global grade.

## 5. PROFILE-002 interaction

- **Decision**: On trial insert set `onboarding_completed = true`, `referral_source = "whatsapp"`, `education_stage` from the form. Leave `profile_completed = false` (province/city still missing).
- **Rationale**: Student `(student)` layout redirects to `/onboarding` when `onboarding_completed` is false — that would block “instant Free quizzes.” The ≥2-quiz demographic gate stays.
- **Alternatives considered**: Force the 3-step wizard — contradicts FR-014. Set `profile_completed = true` — would skip the later gate and skip required province/city.

## 6. Existing number → OTP + referring teacher

- **Decision**: Add nullable `auth_otp_states.join_teacher_code`. Join action calls `startBiteonSwitchOtp` with WhatsApp + that code. OTP callback, after profile load, upserts an **active/free** link to that teacher (if teacher still active) then `establishSession(profile, teacher.id)`. Do not overwrite name/DOB on existing profiles.
- **Rationale**: BiteonSwitch is hosted off-origin; a DB field on the OTP state survives the bounce better than a cookie. Spec US3.5 requires linking the referring teacher after OTP.
- **Alternatives considered**: HttpOnly cookie — flaky in in-app browsers. Redirect to `/login?join_code=` without OTP state — lost if user starts OTP from the login tab. Do not auto-link after OTP — fails US3.5.

Deactivated students (AUTH-007): refuse at join with `ACCOUNT_INACTIVE`; do not start OTP and do not reactivate links. Teacher WhatsApp: Arabic “use teacher login”; do not mint a student session.

## 7. Session mint

- **Decision**: Reuse `establishSession` from `src/lib/auth-session.ts` (AUTH-003 `last_session_id` + AUTH-007 `assertCanEstablishSession`). `currentTeacherId` = referring teacher. Do **not** use `savePendingTeacherLinkSession` for a successful first trial join.
- **Rationale**: One mint path; device lock and inactive checks stay consistent.
- **Alternatives considered**: Custom cookie write — duplicates AUTH-003 and skips AUTH-007.

Logout (`src/actions/auth.ts`) already clears `last_session_id` and the cookie (AUTH-004). No change required.

## 8. Signed-in visitors on `/join/[code]`

- **Decision**: RSC branches before showing the anonymous form. Student + same teacher → redirect `/dashboard`. Student + new active teacher → Server Action upsert active/free link, set `currentTeacherId`, redirect `/dashboard` (no OTP; already authenticated). Teacher/admin → Arabic “this link is for students” + link to teacher home; never convert role.
- **Rationale**: Spec edge cases; avoids a second profile.
- **Alternatives considered**: Always require sign-out first — worse UX for multi-teacher (MT-001).

## 9. Teacher invite UI

- **Decision**: New `TrialInviteCard` (copy full URL + WhatsApp share). Place on teacher dashboard by extending the existing `teacher-code-card` Spekit surface, and a compact copy on `/teacher/students`. Share via `https://api.whatsapp.com/send?text=` with LTR isolates around the URL (QUIZ-003 pattern). Copy uses clipboard + HubToast / «تم النسخ» like `TeacherCodeSection`.
- **Rationale**: Teachers already look at the dashboard code card; students hub is where they think “invite.” Preset Arabic, not customizable (spec assumption).
- **Alternatives considered**: Settings-only copy — too hidden for SC-001 (<30s). Native `navigator.share` only — WhatsApp CTA is required.

## 10. Middleware and layouts

- **Decision**: Do **not** add `/join` to `middleware.ts` student/teacher matchers. Page lives at `src/app/join/[code]/` **outside** `(student)` and `(student-flows)` so `requireStudent` is not applied to anonymous visitors.
- **Rationale**: Matcher already leaves `/login` public; join is the same class of route. AUTH-007 stays out of middleware (PERF-001).
- **Alternatives considered**: `(student-flows)` layout — would bounce unsigned users to login.

## 11. Validation and WhatsApp format

- **Decision**: Normalize with `normalizeWhatsAppNumber`; accept 10–15 digits (same as AUTH-002) so join and login stay consistent. Prefer E.164 shape in UI (`WhatsAppField`-style country code + number) but do not reject AUTH-002-valid numbers.
- **Rationale**: Students who later use `/login` must match the stored digits.
- **Alternatives considered**: Strict E.164 only (`createStudentManually`) — would strand some AUTH-002-style numbers.

## 12. Spekit and registry

- **Decision**: New hooks for join form fields/submit and invite copy/WhatsApp. Reuse `teacherCodeCard` on the dashboard card wrapper. Do not reuse `loginTeacherCode` on `/join`. Registry: **AUTH-008** + **TEACH-015** (do not overwrite AUTH-007 / TEACH-012).
- **Rationale**: ENABLE-001; colliding IDs would erase shipped features.

## 13. Testing strategy

- **Decision**: Pure tests for URL builder, validation, eligibility (`canSkipOtp(profileExists)`), inactive teacher, existing-number → OTP (no session). Action tests mock admin client: new student mint vs existing → OTP start. Regression: AUTH-002 messaging, AUTH-007 matrix, PROFILE-002 `shouldBlockNewQuiz`. Playwright: public join page RTL + required fields visible (no live OTP).
- **Rationale**: Matches project Spekit-ID `describe` convention; hijack rule is the highest-risk assertion.
