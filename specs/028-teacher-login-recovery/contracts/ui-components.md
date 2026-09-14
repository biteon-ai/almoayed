# Contracts: UI components (AUTH-009)

Locale `ar-SY`, `dir="rtl"`, Tajawal. Touch targets `h-10`–`h-12`. Spekit via `src/lib/spekit-targets.ts` + `.speckit/spekit-targets.yaml`.

Existing form Spekit: `teacher-email-login-form`.

## Teacher login card (`/teacher/login`)

Keep `BrandHeader`, `card-native`, title **دخول المدرس**, helper about Super Admin–created teachers.

### Back control

| Element | Detail |
|---------|--------|
| Copy | العودة لتسجيل الدخول الرئيسي |
| Href | `/login` |
| Style | Ghost/text + chevron on the **start** side (RTL), not `variant="brand"` |
| Spekit | `teacher-login-back` |
| Placement | Immediately above or in the card header |

### Password sign-in (default mode)

Unchanged fields `dir="ltr"` `h-12`. Primary button **دخول المدرس** `variant="brand"` `size="touch"`.

| Element | Copy | Spekit |
|---------|------|--------|
| Forgot link (below password) | نسيت كلمة المرور؟ | `teacher-forgot-password-link` |
| Magic CTA (below primary button, muted) | أرسل لي رابط دخول لمرة واحدة | `teacher-magic-link-cta` |

Forgot and magic switch local UI mode; they do not navigate away.

### Forgot-password mode

| Element | Copy | Spekit |
|---------|------|--------|
| Form | Email field pre-filled from login email | `teacher-forgot-password-form` |
| Submit | إرسال رابط إعادة التعيين | `teacher-forgot-password-submit` |
| Cancel | العودة لتسجيل الدخول | returns to password mode |

Success: `HubToast` success with «تم إرسال رسالة إعادة تعيين كلمة المرور إلى بريدك.»  
Error: inline `role="alert"` using `loginMessageForCode` (existing destructive card). Disable submit while pending.

### Magic-request mode

Same email field pattern. Submit **إرسال رابط الدخول**. Spekit `teacher-magic-link-form` / `teacher-magic-link-submit`. Success toast for magic copy.

## Reset page (`/teacher/reset`)

| Element | Copy | Spekit |
|---------|------|--------|
| Title | تعيين كلمة مرور جديدة | `teacher-reset-form` |
| Password | كلمة المرور الجديدة `dir="ltr"` `h-12` | `teacher-reset-password` |
| Confirm | تأكيد كلمة المرور | `teacher-reset-password-confirm` |
| Submit | حفظ كلمة المرور | `teacher-reset-submit` |
| Invalid token | AUTH-009 `RESET_INVALID` Arabic + link to `/teacher/login` | |

On success: Arabic confirmation + link **دخول المدرس** → `/teacher/login` (no auto session).

## Magic page (`/teacher/magic`)

Minimal card: «جاري تسجيل الدخول…» then consume action. Failure shows `MAGIC_INVALID` / `ACCOUNT_INACTIVE` + link to `/teacher/login`. Spekit `teacher-magic-consume`.

## Toasts / loading

Reuse `HubToast` (`success` / `error`) from `src/components/teacher/HubToast.tsx`. Pending: `Loader2` on the active submit (same as `SubmitButton` today). Do not overlay the back control.
