# UI Component Contracts: LAND-001

**Route**: `/` (logged-out only)  
**Layout**: Inherits `dir="rtl"`, Tajawal from root layout.

---

## `page.tsx` (RSC)

**Behavior**:
```typescript
const session = await getSession();
if (session.isLoggedIn) {
  redirect(session.role === "TEACHER" ? "/teacher/dashboard" : "/dashboard");
}
return <LandingPageView />;
```

**Metadata**:
```typescript
export const metadata = {
  title: "المؤيد — حل بيدك ما حدا بفيدك",
  description: APP_SLOGAN,
};
```

---

## `LandingPageView`

**Props**: none (reads static content from `@/lib/landing-content`)

**Renders**: Vertical stack of all sections; root `data-spekit={SPEKIT.landingPage}`.

**Structure**:
```text
LandingNav
LandingHero
LandingTrustBar
LandingFeatures   # id="features"
LandingAudience   # id="students" + id="teachers" subsections or split cards
LandingFooter
```

---

## `LandingNav` (client)

**Props**: none

**Renders**:
- Sticky top bar: `sticky top-0 z-50 backdrop-blur border-b`
- Logo: المؤيد wordmark
- Links: المميزات → `#features`, للطلاب → `#students`, للمدرسين → `#teachers`
- Actions: تسجيل الدخول → `/login`, ابدأ الآن → `/login` (primary button)

**Mobile**: Hamburger toggles vertical link drawer; touch targets ≥44px.

**Accessibility**: `nav` landmark, skip link optional.

---

## `LandingHero`

**Props**: none (uses `LANDING_HERO`)

**Renders**:
- Badge/sparkle optional
- H1: `اختبر مهاراتك، تتبع إنجازاتك، وحقق التميّز الدراسي`
- Subtitle paragraph
- Primary CTA: تجربة المنصة مجاناً → `/login`
- Secondary CTA: تصفح الاختبارات → `/login?from=/quizzes`
- `DashboardPreviewMockup` beside/below on `md:` breakpoint

**Responsive**: Single column mobile; two-column `md:grid`.

---

## `DashboardPreviewMockup`

**Props**: none

**Renders**: Static card mimicking dashboard — fake stats row, progress bar, quiz card chip. No real data. Uses emerald gradient border `rounded-3xl`.

---

## `LandingTrustBar`

**Props**: none

**Renders**: Horizontal grid/wrap of 4 metric tiles from `LANDING_TRUST_METRICS`.

| Metric | Value | Label (AR) |
|--------|-------|------------|
| students | +10,000 | طالب نشط |
| tests | +500 | اختبار |
| satisfaction | 98% | نسبة الرضا |
| grading | فوري | تصحيح |

---

## `LandingFeatures`

**Props**: none

**Container**: `id="features"` + `scroll-mt-24`

**Renders**: Section title + 3-column grid (`md:grid-cols-3`) of Card components.

---

## `LandingAudience`

**Props**: none

**Renders**: Two cards side-by-side (`md:grid-cols-2`):
- Student card — `id="students"`
- Teacher card — `id="teachers"`

Each: title, bullet list, CTA Link to `/login`.

---

## `LandingFooter`

**Props**: none

**Renders**: Copyright © {year} المؤيد; links: تسجيل الدخول, المميزات (#features).

---

## Design tokens (mandatory)

| Token | Usage |
|-------|-------|
| `emerald-600` / `#10b981` | Primary buttons, accents |
| `teal-600` | Gradient stops |
| `rounded-3xl` | Hero cards, mockup, feature cards |
| `dark:` variants | All sections |

---

## Out of scope

- Live dashboard embed
- i18n beyond Arabic
- CMS admin for copy edits
