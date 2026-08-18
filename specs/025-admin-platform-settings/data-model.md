# Data Model: Admin Global Platform Settings

**Feature**: ADMIN-002  
**Migration**: `supabase/migrations/018_platform_settings.sql`

## Entity: Platform setting

Global key-value row. Not tenant-scoped.

| Column | Type | Rules |
|--------|------|--------|
| `key` | `TEXT` PK | One of the seeded keys below |
| `value` | `JSONB` NOT NULL | Boolean for flags; JSON string for the OTP code |
| `updated_at` | `TIMESTAMPTZ` NOT NULL DEFAULT `now()` | Set on every upsert |
| `updated_by` | `UUID` NULL REFERENCES `profiles(id)` ON DELETE SET NULL | Super Admin `profileId` on save; NULL on seed |

### Seeded keys

| `key` | Initial `value` | Meaning |
|-------|-----------------|--------|
| `demo_mode_enabled` | `true` | Public «تجربة» tab + demo shortcut login |
| `fixed_otp_enabled` | `false` | Sandbox WhatsApp verification |
| `fixed_otp_code` | `"123456"` | Only accepted when Fixed OTP is on |

Unknown keys: ignore on read; v1 writes only these three.

## Parsed application shape

```ts
type PlatformSettings = {
  demoModeEnabled: boolean;
  fixedOtpEnabled: boolean;
  fixedOtpCode: string; // digits only, 4–8
};
```

Parse rules:

- Missing/unreadable store → `{ demoModeEnabled: isAuthDemoBypassEnabled(), fixedOtpEnabled: false, fixedOtpCode: "" }` (do not invent a working code).
- `demo_mode_enabled` / `fixed_otp_enabled`: JSON boolean; string `"true"`/`"false"` accepted; anything else → treat flag as `false` except Demo Mode which then uses env fallback **only if the row is missing**, not if the row is malformed (`false`).
- `fixed_otp_code`: JSON string or number coerced to digits; if not 4–8 digits, treat code as invalid (`""`).
- Fixed OTP is **usable** only when `fixedOtpEnabled && /^\d{4,8}$/.test(fixedOtpCode)`.

## State transitions

```text
Demo Mode:     on ⇄ off     (immediate; next /login)
Fixed OTP:     off → on     requires valid stored code (else save may succeed for the flag but login treats as unusable)
               on → off     test code no longer accepted; BiteonSwitch resumes
Code rotate:   any → new    old code rejected on next verify; unused until Fixed OTP is on
```

Changing flags does **not** invalidate existing iron-sessions.

## Related existing entities (no schema change)

| Entity | Use |
|--------|-----|
| `profiles` | `updated_by` FK; WhatsApp identity after Fixed OTP verify |
| `auth_otp_states` | Pending Fixed OTP attempt (`id` as `stateId`, optional `join_teacher_code`, 15-minute TTL already in BiteonSwitch helpers) |
| `admin_audit_log` | **Not required** for v1 (FR-014 is `updated_at` / `updated_by` on the row) |

## RLS

```sql
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY platform_settings_deny_all ON platform_settings
  FOR ALL USING (false) WITH CHECK (false);
```

Anon/authenticated PostgREST cannot read the test code. Service role (Server Actions) bypasses RLS.

## Indexes

PK on `key` is sufficient (three rows).
