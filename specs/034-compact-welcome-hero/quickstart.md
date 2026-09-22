# Quickstart: Compact Welcome Hero

**Feature**: UI-019  
**Branch**: `034-compact-welcome-hero`

## Prerequisites

- `npm run dev` at `http://localhost:3000`
- Demo student WhatsApp `963987654321`
- DevTools phone viewport ≈ **390×844** (and a second check at ≈360×800)
- Optional: widen to ≥640px to verify desktop short-line behavior

## P1 — Phone density

1. Log in as the demo student → `/dashboard`.
2. Confirm the green welcome card is **visibly shorter** than the pre-change tall banner (roughly half or better of prior height).
3. Confirm **no** multi-line motivational subtitle («استمر في إنجاز الاختبارات اليومية…»).
4. Confirm greeting shows the student name, daily goal bar, and streak chip — all fully visible, no clipping.
5. Without scrolling (or with minimal scroll), confirm **action tiles or stats** below the hero are at least partially on screen.

## P1 — Streak / goal edge cases

1. If daily goal is complete, completed labeling still appears in the compact row.
2. With streak `0` (or a large streak if available), the streak chip does not overflow the card.
3. Mentally substitute a very long name: heading should truncate to one line rather than grow the card.

## P2 — Comfortable widths

1. Widen past `sm` (~640px): card may show a **single** short support line; it must not return to a tall multi-line block or heavy `p-8` feel.
2. RTL alignment of greeting vs streak remains coherent.

## Regression

- `data-spekit="student-welcome"` still present; `#student-welcome` still scrollable via welcome nav hash.
- Tiles, stats, level/rewards, and tabs below behave as before.
- Teacher dashboard / login / landing heroes unchanged.

## Automated

```bash
npm run test:unit -- tests/features/ui-019-compact-welcome-hero.test.ts
npm run test:e2e -- e2e/ui-019-compact-welcome-hero.spec.ts
npm run lint && npm run typecheck && npm run build
```
