# Contracts: UI Components (PERF-003)

## Fonts (`src/app/layout.tsx`)

| Rule | Detail |
|------|--------|
| Family | Tajawal via `next/font/google` |
| Subset | `arabic` |
| Display | `swap` (required) |
| Weights | Minimum needed (`400` + `700`; keep `500` only if utilities use `font-medium` heavily) |
| Application | CSS variable `--font-arabic` on `<html>`; body fallback `system-ui` |

Must not remove RTL `dir="rtl"` or Spekit-bearing chrome.

---

## Dynamic charts

| Surface | Requirement |
|---------|-------------|
| Teacher dashboard analytics charts | Load Recharts through `next/dynamic` with `ssr: false` |
| Student detail dashboard charts | Same |
| Loading UI | Compact Arabic placeholder (`جاري تحميل الرسم البياني…` or skeleton) matching emerald/teal shell — not a card-heavy promo |
| Failure | Section-level retry; do not blank entire dashboard |

Spekit `data-spekit` attributes on parent shells MUST remain on always-mounted wrappers (not only inside the deferred chunk if that would drop hooks until load).

---

## Touch & layout

- Keep interactive targets `h-10`–`h-12`.
- Deferral must not shrink tap areas.
- No visual redesign beyond asset sizing and loading placeholders.

---

## Images

- Oversized rasters in `public/` / landing: compress or provide appropriately sized variants.
- Prefer existing SVGs; avoid introducing large uncompressed PNGs.
