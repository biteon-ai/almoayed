# Contracts: Routes (AUTH-008 / TEACH-015)

## Public join

### `GET /join/[code]`

**Auth**: None required. Not in middleware student/teacher matchers.

**Resolve `code`**: trim; lookup `profiles` where `role = TEACHER` and `teacher_code` equals (then case-insensitive fallback).

| Visitor | Response |
|---------|----------|
| Anonymous + active teacher | Join form (RTL Arabic) |
| Anonymous + unknown code | Arabic “الرابط غير صالح” — no form submit |
| Anonymous + inactive teacher | Canonical AUTH-007 inactive copy — no session |
| Signed-in STUDENT + same teacher | Redirect `/dashboard` |
| Signed-in STUDENT + other active teacher | Link then redirect `/dashboard` |
| Signed-in TEACHER / SUPER_ADMIN | Arabic “هذا الرابط للطلاب” + link to teacher home; no role change |

Do not render `(student)` chrome (nav, quiz list) on the anonymous form.

### `POST` (Server Action, same page)

See [server-actions.md](./server-actions.md) `joinTrialStudent`. Success: `redirect("/dashboard")`. Existing student: client follows OTP `redirectUrl`.

## Teacher portal (TEACH-015)

| Route | Change |
|-------|--------|
| `/teacher/dashboard` | Invite card: full join URL, copy, WhatsApp share (reuse `data-spekit=teacher-code-card`) |
| `/teacher/students` | Compact same card at top of hub |

Still shows classroom code; adds the **full URL** as the primary share target.

## Unchanged (must keep OTP)

| Route | Rule |
|-------|------|
| `/login` | AUTH-001 OTP for existing users; AUTH-002 register still OTP |
| `/register` | Alias to `/login` |
| `/api/auth/biteonswitch/callback` | Extended only to apply `join_teacher_code` after successful OTP |

## Redirects after auth

| Outcome | Location |
|---------|----------|
| Trial join success | `/dashboard` (student home; existing role home) |
| OTP from join success | Same as AUTH-001 student: `/dashboard` |
| Logout | `/login` (AUTH-004) |
