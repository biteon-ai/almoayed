# Quickstart: LAND-001 Marketing Landing Page

**Branch**: `008-marketing-landing-page`  
**Route**: `/`

## Prerequisites

```bash
npm install
cp .env.example .env   # SESSION_SECRET required for session redirect test
npm run dev
```

## Manual verification

### 1. Logged-out landing

1. Clear cookies / use incognito.
2. Open `http://localhost:3000/`.
3. **Expect**: Marketing page (not redirect to `/login`).
4. **Expect**: Sticky nav with المميزات, للطلاب, للمدرسين, تسجيل الدخول, ابدأ الآن.
5. **Expect**: Hero headline "اختبر مهاراتك، تتبع إنجازاتك، وحقق التميّز الدراسي".
6. Tap **تجربة المنصة مجاناً** → `/login`.
7. Tap **تصفح الاختبارات** → `/login?from=/quizzes`.

### 2. Anchor navigation

1. From `/`, click **المميزات** in nav.
2. **Expect**: Smooth scroll to features grid; header does not cover section title.

### 3. Trust + features + audience

1. Scroll through trust bar — 4 metrics visible on mobile (wrap ok).
2. Features section — 3 cards with icons.
3. Audience — student and teacher cards with distinct copy.

### 4. Logged-in redirect

1. Log in as demo student (`963987654321`).
2. Navigate to `/`.
3. **Expect**: Redirect to `/dashboard` (no landing content flash ideally).

4. Log in as demo teacher (`963912345678`, code `AlMoayed-DEMO`).
5. Navigate to `/`.
6. **Expect**: Redirect to `/teacher/dashboard`.

### 5. RTL + dark mode

1. Confirm `dir="rtl"` — nav order and text alignment correct.
2. Toggle OS dark mode — gradients and text remain readable.

### 6. Build

```bash
npm run build
```

**Expect**: No type errors; `/` route builds successfully.

## Automated tests (after implementation)

```bash
npm run test -- tests/features/land-001-landing-content.test.ts
npx playwright test e2e/landing-page.spec.ts
```

## Spekit

After implementation, verify `[data-spekit="landing-page"]` on page root.
