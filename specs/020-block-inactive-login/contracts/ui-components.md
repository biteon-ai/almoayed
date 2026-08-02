# Contracts: AUTH-007 UI (Login)

## Surface

Existing `/login` form (`src/app/login/login-form.tsx`) — no new page.

## Error display

| Source | Mechanism |
|--------|-----------|
| Server Action failure | `loginMessageForCode(AuthErrorCode.ACCOUNT_INACTIVE)` in existing error alert/toast |
| Mid-session / OTP callback redirect | `?error=account_inactive` → `loginMessageForQueryError` |

## Copy (canonical)

```
عذراً، هذا الحساب غير فعال. يرجى التواصل مع الإدارة
```

## RTL / a11y

- Inherit root `dir="rtl"`.
- Message in existing start-aligned alert region (do not introduce LTR-only toast).
- Touch targets on login CTAs unchanged (`h-11`+).

## Spekit

Optional: reuse `login-form` / existing error region. New Spekit hook **not required** unless a distinct inactive banner element is added.

## Explicit non-UI

- No modal before redirect on protected hubs.
- No change to teacher student-deactivate controls beyond existing TEACH-001 (they remain the writers of link status).
