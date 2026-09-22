# Research: Compact Welcome Hero

**Date**: 2026-09-22  
**Status**: Complete — all Technical Context items resolved

## 1. Subtitle: hide vs collapse vs shorten

**Decision**: On phone widths (`default` / `<sm`), **do not render** the long motivational paragraph. From `sm` upward, show at most a **single shortened Arabic line** (or keep hidden if the one-liner still feels tall). No “read more” / collapsible control.

**Rationale**: Spec Assumptions prefer hide over collapsible to maximize vertical savings and avoid a new interaction. Matches prior density clarification in `002-student-dashboard-density` (one-line greeting, no subtitle on mobile).

**Alternatives considered**:
- Collapsible “اقرأ المزيد” — adds tap overhead and still costs a line when expanded.
- Always show shortened line on mobile — still consumes non-functional reading space the user called out.
- Delete subtitle everywhere — acceptable if desktop also feels better without it; optional during implementation if single-line still dominates.

## 2. Breakpoint for “mobile”

**Decision**: Treat **`<sm` (Tailwind 640px)** as the strict phone density mode (hide subtitle, tightest padding). `sm`–`md` may add the short line; `md+` may use slightly roomier padding without returning to `p-6`/`p-8` + large stacked gaps.

**Rationale**: Product target is ~360–390px phones (SC-001/SC-002). `sm` is the repo’s common first step-up; avoids waiting until `md` where many tablets still need density.

**Alternatives considered**:
- `<md` hide — would also hide subtitle on large phones in landscape / small tablets unnecessarily if we only need phone savings.
- Container queries — overkill for one card; no existing pattern required.

## 3. Padding and height budget

**Decision**: Target section padding **`p-4`** on mobile (≈16px), **`sm:p-5`** or **`sm:p-6`** max — not `p-6`/`sm:p-8`. Reduce outer flex `gap-6` → `gap-3`/`gap-4`. Shrink decorative blur if it forces perceived height. Aim for **≥~40%** measured height reduction vs current tall card (SC-001).

**Rationale**: User explicitly asked for lighter vertical padding akin to `py-4` instead of heavy `py-8`/`py-10`. Current component uses `p-6 sm:p-8` plus `gap-6` and multi-line copy.

**Alternatives considered**:
- Only hide subtitle, keep `p-8` — fails SC-001.
- Ultra-flat `p-2` — risks cramped streak/goal (FR-004).

## 4. Streak + daily goal packing

**Decision**: Keep **daily goal** (label row + thin `Progress`) under the greeting block. Keep **streak** as a compact chip (smaller icon container, tighter `p-2`/`p-3`, reduced type scale if needed) that sits beside the greeting on wider widths and **does not force a second tall column** on mobile. Prefer a horizontal wrap: greeting+goal take primary width; streak chip aligns end without becoming a full-width padded slab taller than the text block.

**Rationale**: FR-004 — widgets must stay scannable without overflow. Current layout stacks `flex-col gap-6` then a self-stretch streak box, which inflates height on phones.

**Alternatives considered**:
- Move streak into action tiles only — would remove motivation from the hero (spec keeps it).
- Overlap streak as absolute badge — fragile with RTL and long names.

## 5. Long names and large streak counts

**Decision**: Greeting heading uses **`truncate`** (or `line-clamp-1`) with a bounded width so long Arabic names do not wrap into two/three lines. Streak number stays on one line; chip uses `shrink-0` with `min-w-0` on the text column of the hero so flex children do not overflow the rounded card.

**Rationale**: Spec edge cases require controlled truncation and no chip overflow.

**Alternatives considered**:
- Allow 2-line names — fights SC-001.
- Ellipsis only after 20 graphemes in JS — unnecessary if CSS truncate works with RTL.

## 6. Scope: one component vs per-page forks

**Decision**: Implement compaction **only** in `StudentDashboardHero`. Today it is mounted solely from `StudentDashboardView`. Any future page that reuses the component inherits the rules (FR-005). Do **not** restyle teacher dashboard, login branding, or landing heroes.

**Rationale**: Spec Assumptions bound scope to the shared green student welcome banner. Grep confirms a single consumer.

**Alternatives considered**:
- Duplicate compact hero markup per route — diverges Spekit and hash scroll (`#welcome` → `#student-welcome`).
- Global CSS override on `.rounded-3xl` greens — too broad, high regression risk.

## 7. Spekit, hash nav, and registry

**Decision**: Keep `id="student-welcome"` and `data-spekit={SPEKIT.studentWelcome}` unchanged. Register feature as **`UI-019`** in `.speckit/spec.yaml` with acceptance tied to FR/SC. No new Spekit keys required unless tests need a subtitle-specific hook (prefer asserting absence via role/text).

**Rationale**: FR-007; `student-nav` scrolls to `#student-welcome`.

**Alternatives considered**:
- New `student-welcome-compact` Spekit — unnecessary churn for ENABLE-001.

## 8. Tests

**Decision**:
- Playwright `[UI-019]` at ~390px: hero height below a documented max (or vs snapshot budget), motivational multi-line copy absent, name + streak + goal visible, Spekit `student-welcome` present; below-hero tiles partially visible.
- Optional Vitest: if any pure copy helper is extracted (short desktop line), unit-test it; otherwise rely on e2e + manual quickstart.
- Regression: dashboard still loads; `#welcome` scroll target still resolves.

**Rationale**: Layout density is best proven on a real viewport; avoid brittle class-name unit tests.
