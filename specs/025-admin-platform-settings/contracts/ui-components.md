# Contracts: UI components (ADMIN-002)

Locale `ar-SY`, `dir="rtl"`, Tajawal. Touch targets `h-10`–`h-12`. Spekit via `src/lib/spekit-targets.ts`.

## Admin nav

Add link in `src/app/admin/(portal)/layout.tsx`:

- Label: **إعدادات المنصة**
- Href: `/admin/settings`
- Spekit: `admin-nav-settings`
- Icon: Settings (lucide), same `h-9` pill as other nav items

## Platform settings page

RSC wrapper + client form `PlatformSettingsForm`.

Root Spekit: `admin-platform-settings`.

### Card 1 — Demo Mode

| Element | Copy |
|---------|------|
| Title | تفعيل وضع التجربة |
| Helper | إيقاف هذا الخيار يخفي تبويب «تجربة» من صفحة الدخول ويمنع الدخول التجريبي بنقرة واحدة. حسابات التجربة تبقى موجودة. |
| Control | `Switch`, Spekit `admin-demo-mode-switch`, min height 44px tap area |

Saving: disable switch while pending; success toast «تم حفظ إعدادات المنصة»; error toast Arabic; revert switch on failure.

### Card 2 — Fixed OTP

| Element | Copy |
|---------|------|
| Title | تفعيل رمز التحقق الثابت |
| Helper | عند التشغيل لا تُرسل رسالة واتساب. جميع عمليات التحقق بواتساب تستخدم الرمز أدناه. عند الإيقاف يعود التحقق الحقيقي. |
| Control | `Switch`, Spekit `admin-fixed-otp-switch` |
| Code label | رمز التحقق الثابت |
| Code field | `dir="ltr"`, numeric, Spekit `admin-fixed-otp-code`, placeholder `123456` |
| Save code | Button «حفظ الرمز», Spekit `admin-settings-save`, `h-12` |

If Fixed OTP is on and the code is invalid/empty: inline Arabic warning that sandbox login will not work until a valid 4–8 digit code is saved.

Toasts: reuse `HubToast` (`success` / `error`).

## Login form

- «تجربة» tab: render only if `demoEnabled` (existing prop, now from settings).
- When `fixedOtpEnabled` is true and OTP was started: show numeric field Spekit `login-fixed-otp-field`, label «رمز التحقق», helper «أدخل رمز التحقق الثابت» (**do not** print the actual code). Submit «تأكيد» → `verifyFixedOtp`.
- When `fixedOtpEnabled` is false: unchanged BiteonSwitch redirect.

Join form existing-number path: same OTP field behavior if `startBiteonSwitchOtp` returns `fixed_otp_required`.

## Access denied

Non-admin hitting `/admin/settings` never sees switches or the code (redirect to `/admin/login`).
