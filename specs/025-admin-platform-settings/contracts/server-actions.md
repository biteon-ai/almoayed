# Contracts: Server Actions & helpers (ADMIN-002)

**Clients**: `createAdminClient()` / `getAuthSupabaseClient()` only.  
**Guards**: mutations and admin reads of the test code use `requireSuperAdmin()` from `src/lib/auth.ts` (rejects impersonation).

## Pure / cached helpers — `src/lib/platform-settings.ts`

```ts
export const PLATFORM_SETTING_KEYS = {
  demoMode: "demo_mode_enabled",
  fixedOtp: "fixed_otp_enabled",
  fixedOtpCode: "fixed_otp_code",
} as const;

export type PlatformSettings = {
  demoModeEnabled: boolean;
  fixedOtpEnabled: boolean;
  fixedOtpCode: string;
};

getPlatformSettings(): Promise<PlatformSettings>;
// One select of all keys; requestCache(); fallbacks per data-model.md

isDemoModeEnabled(): Promise<boolean>;
// settings.demoModeEnabled after a successful read; else isAuthDemoBypassEnabled()

isFixedOtpUsable(): Promise<boolean>;
// enabled && valid 4–8 digit code; false on store failure

validateFixedOtpCode(raw: string): { ok: true; value: string } | { ok: false; message: string };
// trim; /^\d{4,8}$/; Arabic message on fail

codesMatch(submitted: string, expected: string): boolean;
// digit-normalize both; timingSafeEqual; false if either empty or length mismatch
```

Do not export `fixedOtpCode` to Client Components.

## `updatePlatformSettings(patch)`

`src/actions/platform-settings.ts`. `"use server"`.

```ts
type PlatformSettingsPatch = {
  demoModeEnabled?: boolean;
  fixedOtpEnabled?: boolean;
  fixedOtpCode?: string;
};

type PlatformSettingsState =
  | { status: "success"; settings: Omit<PlatformSettings, never> } // admin may include code
  | { status: "error"; message: string };
```

Algorithm:

1. `requireSuperAdmin()` — else redirect (never upsert).
2. Validate any provided `fixedOtpCode` (`validateFixedOtpCode`). Fail → error, no writes.
3. Upsert only provided keys; set `updated_at = now()`, `updated_by = session.profileId`.
4. Re-read and return parsed settings.
5. On DB error: Arabic error; previous rows unchanged.

Turning `fixedOtpEnabled` on while the stored code is invalid: allow the flag write, but `isFixedOtpUsable()` remains false until a valid code is saved (admin UI should show Arabic guidance).

## `startBiteonSwitchOtp` — extend return

```ts
type StartOtpState =
  | { status: "redirect"; redirectUrl: string }
  | { status: "fixed_otp_required"; stateId: string }
  | { status: "error"; code: AuthErrorCode };
```

After WhatsApp validation and `auth_otp_states` insert:

- If `isFixedOtpUsable()` → return `fixed_otp_required` (**no** `buildHostedLoginUrl`, **no** provider HTTP).
- Else existing BiteonSwitch URL / mock bounce.

Join form (`joinTrialStudent`) already consumes `redirect`; it MUST also handle `fixed_otp_required` (show OTP field or navigate to `/login` with state — prefer keeping the user on a small OTP step that posts `stateId` + code + WhatsApp).

## `verifyFixedOtp(formData)`

Fields: `otp_code`, `state` (`auth_otp_states.id`), `whatsapp_number` (must match hint when present).

```ts
type VerifyFixedOtpState =
  | { status: "success"; role: "TEACHER" | "STUDENT" }
  | { status: "error"; code: AuthErrorCode };
```

Algorithm:

1. If `!await isFixedOtpUsable()` → `OTP_UNAVAILABLE` (or invalid).
2. Load OTP state by id; missing/expired → existing OTP error; do not mint.
3. `codesMatch(submitted, settings.fixedOtpCode)` — false → OTP invalid; **do not** mint.
4. Resolve WhatsApp from form + state hint (same rules as mock callback).
5. `completeWhatsAppLogin(whatsapp, join_teacher_code)` — shared with BiteonSwitch callback (AUTH-007, AUTH-003, AUTH-008 link).
6. Delete or consume OTP state on success (same as callback).

Wrong code never calls BiteonSwitch.

## `loginDemoAccount`

Replace `isAuthDemoBypassEnabled()` with `await isDemoModeEnabled()`. Env-only helper remains for fallback inside `getPlatformSettings`.

## `completeWhatsAppLogin` (extract)

Move `finishLogin` body from `src/app/api/auth/biteonswitch/callback/route.ts` into `src/lib/auth-otp-complete.ts` so Fixed OTP and live OTP share AUTH-007 / join-code linking. Callback becomes a thin token verify + call.
