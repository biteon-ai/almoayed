# Data Model: LAND-001 Marketing Landing Page

**Scope**: Static presentation types only — no database entities or persistence.

---

## `TrustMetric`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | Stable key e.g. `students`, `tests` |
| `value` | string | yes | Display value e.g. `+10,000` |
| `label` | string | yes | Arabic label |
| `icon` | Lucide icon name | yes | Mapped in component |

**Validation**: Exactly 4 items in `LANDING_TRUST_METRICS` array.

---

## `FeatureCard`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | `interactive-tests`, `analytics`, `streak` |
| `title` | string | yes | Arabic heading |
| `description` | string | yes | 1–2 sentence body |
| `icon` | Lucide icon name | yes | e.g. `ClipboardCheck`, `BarChart3`, `Flame` |

**Validation**: Exactly 3 items in `LANDING_FEATURES`.

---

## `AudienceCard`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `role` | `"student"` \| `"teacher"` | yes | Drives styling accent |
| `title` | string | yes | e.g. للطلاب / للمدرسين |
| `benefits` | string[] | yes | 3–4 bullet strings |
| `ctaLabel` | string | yes | e.g. ابدأ كطالب |
| `ctaHref` | string | yes | `/login` |

**Validation**: Exactly 2 cards in `LANDING_AUDIENCE`.

---

## `NavLink`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `label` | string | yes | Arabic |
| `href` | string | yes | `#features` or `/login` |

---

## `LandingContent` (aggregate export)

```typescript
export const LANDING_HERO = {
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
};

export const LANDING_TRUST_METRICS: TrustMetric[];
export const LANDING_FEATURES: FeatureCard[];
export const LANDING_AUDIENCE: AudienceCard[];
export const LANDING_NAV_LINKS: NavLink[];
export const LANDING_FOOTER = {
  copyright: string;
  links: NavLink[];
};
```

---

## State transitions

None — all content is immutable at runtime. Session state handled externally by `getSession()` in `page.tsx`:

```
GET /
  ├─ isLoggedIn && role=TEACHER → redirect /teacher/dashboard
  ├─ isLoggedIn && role=STUDENT → redirect /dashboard
  └─ else → render LandingPageView
```

---

## Relationships

No foreign keys. Optional future link: live stats could replace `TrustMetric.value` from a Server Action — out of scope for LAND-001.
