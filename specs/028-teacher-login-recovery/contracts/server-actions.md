# Contracts: Server Actions & helpers (AUTH-009)

**Clients**: `createAdminClient()` / `getAuthSupabaseClient()` only.  
**Guards**: Request actions are **public** (signed-out). They must never return whether a row exists beyond the spec’s Arabic codes. Magic consume and reset complete are public but token-gated.

## Error codes — extend `src/lib/auth-error-codes.ts`

| Code | When |
|------|------|
| `TEACHER_NOT_FOUND` | Email is not an active-or-inactive **teacher** |
| `ACCOUNT_INACTIVE` | Existing AUTH-007 |
| `RECOVERY_RATE_LIMITED` | ≥ 3 tokens created for that teacher in 15 minutes |
| `MAIL_SEND_FAILED` | Resend unconfigured or send error (token row deleted) |
| `RESET_INVALID` | Missing/expired/used/tampered reset token |
| `MAGIC_INVALID` | Missing/expired/used/tampered magic token |
| `PASSWORD_TOO_SHORT` | New password &lt; 8 chars |
| `PASSWORD_MISMATCH` | Confirm field differs |

Arabic lives in `login-ui-messages.ts` / `teacher-login-messages.ts` (client), never as the Flight `code` string.

Suggested copy:

| Code | Arabic |
|------|--------|
| `TEACHER_NOT_FOUND` | لا يوجد حساب مدرس بهذا البريد. |
| `RECOVERY_RATE_LIMITED` | وصلت للحد المسموح. جرّب بعد ربع ساعة. |
| `MAIL_SEND_FAILED` | ما قدرنا نرسل الرسالة. جرّب مرة تانية. |
| `RESET_INVALID` | رابط إعادة التعيين غير صالح أو منتهٍ. اطلب رابطاً جديداً من صفحة دخول المدرس. |
| `MAGIC_INVALID` | رابط الدخول غير صالح أو منتهٍ. اطلب رابطاً جديداً من صفحة دخول المدرس. |
| `PASSWORD_TOO_SHORT` | كلمة المرور يجب أن تكون 8 أحرف على الأقل. |
| `PASSWORD_MISMATCH` | تأكيد كلمة المرور غير مطابق. |
| Success reset request | تم إرسال رسالة إعادة تعيين كلمة المرور إلى بريدك. |
| Success magic request | تم إرسال رابط الدخول لمرة واحدة إلى بريدك. |

## Pure helpers — `src/lib/teacher-login-recovery.ts`

```ts
type RecoveryPurpose = "password_reset" | "magic_link";

hashRecoverySecret(secret: string): string; // sha256 hex
generateRecoverySecret(): string;           // 32 bytes hex
resetExpiresAt(now?: Date): Date;           // +60 min
magicExpiresAt(now?: Date): Date;           // +15 min

type TeacherLookup =
  | { status: "not_found" }
  | { status: "inactive"; profileId: string }
  | { status: "ok"; profileId: string; email: string; fullName: string };
```

Rate-limit helper: `countRecentTokens(profileId, since) >= 3`.

## `requestTeacherPasswordReset(email)` / `requestTeacherMagicLink(email)`

`src/actions/teacher-login-recovery.ts`. `"use server"`.

```ts
type RecoveryRequestState =
  | { status: "success" }
  | { status: "error"; code: AuthErrorCode };
```

Algorithm (both; purpose + TTL + email template differ):

1. Validate email (`isValidEmail`). Else `TEACHER_NOT_FOUND` is **wrong** — use a validation code or reuse a generic invalid-email Arabic via `TEACHER_NOT_FOUND` only after lookup. Prefer: invalid format → `TEACHER_NOT_FOUND` is misleading. Add `INVALID_EMAIL` **or** client-side `required` + `type=email` and server `isValidEmail` → same `TEACHER_NOT_FOUND` only if format is valid but no teacher. **Invalid format**: return a dedicated `INVALID_EMAIL` code (add to AuthErrorCode) with «البريد الإلكتروني غير صالح.»
2. Lookup teacher (role filter).
3. Inactive → `ACCOUNT_INACTIVE`.
4. Rate limit → `RECOVERY_RATE_LIMITED`.
5. Insert hashed token.
6. `sendEmail({ to: email, subject, html })` with link `{getAppUrl()}/teacher/reset?token=` or `/teacher/magic?token=`.
7. Send fail → delete row → `MAIL_SEND_FAILED`.
8. Success → `{ status: "success" }` (do not echo email beyond what the user typed).

## `completeTeacherPasswordReset({ token, password, confirm })`

```ts
type ResetCompleteState =
  | { status: "success" }
  | { status: "error"; code: AuthErrorCode };
```

1. Hash token; load unused unexpired `password_reset` row + profile.
2. Invalid → `RESET_INVALID`.
3. Inactive teacher → `ACCOUNT_INACTIVE` (do not change password).
4. Password rules (≥ 8, match confirm).
5. `hashPassword`; CAS consume + update `password_hash`.
6. Do **not** mint a session (spec: then sign in on Teacher Login).

## `consumeTeacherMagicLink(token)`

```ts
type MagicConsumeState =
  | { status: "success"; role: "TEACHER" }
  | { status: "error"; code: AuthErrorCode };
```

1. CAS consume valid `magic_link` row.
2. Fail → `MAGIC_INVALID`.
3. `assertCanEstablishSession` — inactive → `ACCOUNT_INACTIVE`.
4. `establishSession(profile, null)` — AUTH-003 `last_session_id`.
5. Client redirects to `/teacher/dashboard` (same pattern as `loginTeacherEmail`).

## `loginTeacherEmail`

Unchanged behavior. Page still uses it for the primary button.

## Tests

`tests/features/auth-009-teacher-login-recovery.test.ts`:

- Hash + TTL helpers
- Lookup: student/admin/unknown → not_found; inactive teacher → inactive
- Rate limit at 3
- Reset does not consume on weak password (mock supabase)
- Magic consume calls `establishSession` (mock)
- `describe('[AUTH-009] …')`
