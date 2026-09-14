# Data Model: Teacher Login Recovery

**Feature**: AUTH-009  
**Migration**: `supabase/migrations/020_teacher_login_tokens.sql`

## Entity: Teacher login token

One-time grant for password reset or magic sign-in. Not tenant-scoped (the teacher **is** the account). Never store the raw URL secret.

| Column | Type | Rules |
|--------|------|--------|
| `id` | `UUID` PK | `gen_random_uuid()` |
| `profile_id` | `UUID` NOT NULL FK `profiles(id)` ON DELETE CASCADE | Must be a `TEACHER` profile at insert time |
| `purpose` | `TEXT` NOT NULL | `'password_reset'` \| `'magic_link'` |
| `token_hash` | `TEXT` NOT NULL UNIQUE | hex SHA-256 of the raw secret |
| `expires_at` | `TIMESTAMPTZ` NOT NULL | `now() + 60 min` reset; `now() + 15 min` magic |
| `consumed_at` | `TIMESTAMPTZ` NULL | Set once on successful use |
| `created_at` | `TIMESTAMPTZ` NOT NULL DEFAULT `now()` | Rate-limit window |

### Check constraints

- `purpose IN ('password_reset', 'magic_link')`
- `expires_at > created_at`

### Indexes

- Unique `token_hash`
- `(profile_id, created_at DESC)` for rate-limit counts
- Partial `(profile_id) WHERE consumed_at IS NULL` optional for cleanup

## Related existing entities (no column change)

| Entity | Use |
|--------|-----|
| `profiles` | Lookup `email` (unique when not null) + `role = TEACHER` + `teacher_account_status`; update `password_hash` on reset; `last_session_id` via `establishSession` |
| Password hashes | Existing bcrypt via `hashPassword` / `verifyPassword` |

## Lookup algorithm (application)

1. Normalize email: `trim().toLowerCase()`; `isValidEmail` else validation error (no DB).
2. `profiles` where `email = normalized` AND `role = 'TEACHER'` (maybeSingle).
3. Missing → `TEACHER_NOT_FOUND` (no insert, no mail).
4. `teacher_account_status = 'inactive'` → `ACCOUNT_INACTIVE`.
5. Count tokens for `profile_id` with `created_at > now() - interval '15 minutes'`. If `>= 3` → `RECOVERY_RATE_LIMITED`.
6. Generate secret; insert row; send mail; on mail failure delete the row and return `MAIL_SEND_FAILED`.

## Consume algorithm

**Valid unused token**: row exists, `token_hash` matches, `consumed_at IS NULL`, `expires_at > now()`, profile still `TEACHER` + active.

**Reset success**: `UPDATE profiles SET password_hash = $hash WHERE id = $id` AND `UPDATE teacher_login_tokens SET consumed_at = now() WHERE id = $tid AND consumed_at IS NULL` — if token update returns 0 rows, abort (race).

**Magic success**: same CAS consume, then `assertCanEstablishSession` + `establishSession`. If inactive at consume time → `ACCOUNT_INACTIVE`, do not mint session (still consume to prevent reuse of a now-stale link).

## State transitions

```text
issued  → consumed   (reset success or magic success or magic+now-inactive)
issued  → expired    (clock; treated as invalid; no consume required)
issued  → deleted    (mail send failure)
```

Invalid / tampered secret: no row → same user-facing invalid-link copy (do not distinguish missing vs expired in URL guessing; **do** distinguish on the reset form after a previously valid page load that later expired).

## RLS

```sql
ALTER TABLE teacher_login_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY teacher_login_tokens_deny_all ON teacher_login_tokens
  FOR ALL USING (false) WITH CHECK (false);
```

Anon/authenticated PostgREST cannot read hashes. Service-role Server Actions bypass RLS.

## Cleanup

Not required for v1. Expired rows may accumulate; optional later job `DELETE WHERE expires_at < now() - interval '7 days'`.
