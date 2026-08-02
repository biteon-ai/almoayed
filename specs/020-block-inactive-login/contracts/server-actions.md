# Contracts: AUTH-007 Account Access (Server)

## Shared helper (new)

### `src/lib/account-access.ts` (pure)

```ts
type LinkStatus = "pending" | "active" | "deactivated";

isTeacherAccountActive(status: "active" | "inactive"): boolean;

/** AUTH-007 student block rule */
isStudentDeactivatedForLogin(links: { status: LinkStatus }[]): boolean;

/** Prefer currentTeacherId if still active; else oldest active by created_at */
resolveActiveTeacherId(
  links: { teacher_id: string; status: LinkStatus; created_at: string }[],
  preferredTeacherId: string | null
): string | null;
```

### `assertCanEstablishSession(profileId, role, supabase?)`

Returns:
- `{ ok: true, teacherId: string | null }` — `teacherId` for students with ≥1 active link
- `{ ok: false, code: "ACCOUNT_INACTIVE" }` — teacher inactive OR student deactivated rule
- Does **not** treat pending-only as `ACCOUNT_INACTIVE`

## Login mint sites (must call assert before `establishSession`)

| Path | File | On ACCOUNT_INACTIVE |
|------|------|---------------------|
| WhatsApp OTP callback | `src/app/api/auth/biteonswitch/callback/route.ts` | Redirect `/login?error=account_inactive` |
| Demo login | `src/actions/login.ts` | `{ status: "error", code: ACCOUNT_INACTIVE }` |
| Complete teacher link → session | `src/actions/login.ts` | Same error payload |
| Emergency fallback | `src/actions/auth.ts` | Same (not generic ADMIN_FALLBACK_DENIED) |
| Teacher email | `src/actions/auth.ts` / `lib/admin/auth.ts` | Map `"inactive"` → `ACCOUNT_INACTIVE` |

### `establishSession`

- MUST NOT run `last_session_id` update when assert would fail.
- Optional internal re-assert as backstop.

## Mid-session (`src/lib/auth.ts`)

### `getValidatedSession` (extend after device lock)

1. Load eligibility for `session.profileId` + role.
2. **Teacher** + inactive → `redirect("/login?error=account_inactive")`.
3. **Student** + `isStudentDeactivatedForLogin` → same redirect.
4. **Student** + ≥1 active:
   - If `currentTeacherId` missing or not in active set → `resolveActiveTeacherId`, assign `session.currentTeacherId`, `await session.save()`, continue.
5. Pending-only / orphan: no AUTH-007 redirect (existing flows).

## Auth error code

```ts
AuthErrorCode.ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE"
```

Arabic (client map only):  
`عذراً، هذا الحساب غير فعال. يرجى التواصل مع الإدارة`

Query: `error=account_inactive` → same message via `loginMessageForQueryError`.

## Non-goals

- No middleware Supabase inactive check.
- No change to QUIZ-001 selects.
- No new deactivate Server Actions (use existing teacher/admin toggles).
