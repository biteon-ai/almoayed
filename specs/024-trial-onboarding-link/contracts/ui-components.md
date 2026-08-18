# Contracts: UI (TEACH-015 / AUTH-008)

Locale: `ar-SY`, `dir="rtl"`, Tajawal. Touch targets `h-10`–`h-12`. No raw native `<select>` / file inputs on the join form (use existing Shadcn list/popover or button-group pattern from onboarding).

## Public join form — `src/app/join/[code]/join-form.tsx`

Client island. Fields (all required, Arabic labels):

| Field | Label (suggested) | Control |
|-------|-------------------|---------|
| First name | الاسم الأول | text, `h-12` |
| Last name | الكنية | text, `h-12` |
| Class / grade | المرحلة الدراسية | `EDUCATION_STAGE_LABELS` options, not a tiny native select |
| Birth date | تاريخ الميلاد | date-friendly control; value ISO `YYYY-MM-DD` |
| WhatsApp | رقم الواتساب | Same UX family as login `WhatsAppField` (dial code + digits) |

Primary CTA: «ابدأ التجربة» / «دخول بدون رمز تحقق» — disable + spinner while pending (AUTH-006 pattern).

Errors: Arabic alerts; do not show other students’ names or UUIDs.

Existing-number success path: follow `redirectUrl` to BiteonSwitch (same as login OTP). Show a one-line Arabic note that this number already has an account and must confirm via WhatsApp.

Invalid/inactive teacher: page-level message, form omitted or submit disabled.

Spekit (new keys in `SPEKIT` + `spekit-targets.yaml`):

| Key | DOM id |
|-----|--------|
| `joinForm` | `join-form` |
| `joinFirstName` | `join-first-name` |
| `joinLastName` | `join-last-name` |
| `joinClassLevel` | `join-class-level` |
| `joinBirthDate` | `join-birth-date` |
| `joinWhatsapp` | `join-whatsapp` |
| `joinSubmit` | `join-submit` |

Reuse `LoginPageShell` visual language (gradient, brand) where it keeps the page consistent; do not embed login tabs or demo CTAs.

## Teacher invite card — `src/components/teacher/TrialInviteCard.tsx`

Props: `teacherCode`, `teacherName`, `joinUrl`.

- Show join URL `dir="ltr"` (monospace, wrap-safe).
- Optionally still show classroom code as secondary.
- **Copy link**: clipboard of **full URL**; toast «تم نسخ رابط التجربة».
- **Share WhatsApp**: `href={whatsappHref}` from `buildTrialInviteShareUrl`; `target="_blank"`; `h-12` full-width on mobile.

Preset text (intent, exact copy may be tuned in implement):

> انضم لصف {teacherName} على المؤيد وجرّب الاختبارات المجانية من هالرابط: {url}

Dashboard: wrap/replace current teacher-code card; keep `data-spekit="teacher-code-card"` on the card root. Additional:

| Key | DOM id |
|-----|--------|
| `trialInviteCopy` | `trial-invite-copy` |
| `trialInviteWhatsapp` | `trial-invite-whatsapp` |

Students hub: same component, compact.

## Signed-in teacher on join URL

Simple Arabic card + button to `/teacher/dashboard`. No student form.

## Accessibility / RTL

- Labels `text-start`; errors under fields.
- WhatsApp and URL remain `dir="ltr"` inside RTL page.
- Primary buttons at least `h-12`.
