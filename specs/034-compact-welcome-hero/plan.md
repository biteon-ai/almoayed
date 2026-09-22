# Implementation Plan: Compact Welcome Hero

**Branch**: `034-compact-welcome-hero` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/034-compact-welcome-hero/spec.md`

**Feature IDs (registry)**: `UI-019`  
**Extends**: `UI-001` · `GAMIF-001` · student dashboard density direction from `002-student-dashboard-density`

## Summary

Shrink the student green welcome hero so mobile dashboards reclaim vertical space: tighter padding, hide the long motivational subtitle on phone widths, keep greeting + name + daily goal + streak readable, and tighten the inner progress/streak layout so nothing overflows.

**Technical approach**:
1. Edit the shared `StudentDashboardHero` only (sole consumer today is `StudentDashboardView`) so every surface that mounts it inherits compaction (FR-005).
2. Mobile-first Tailwind: reduce section padding (`p-4` / smaller gaps); hide the multi-line subtitle below `sm` (or show a single shortened line from `sm` up).
3. Re-layout greeting column + streak chip into a denser row (goal bar under greeting; streak compact beside or below without large empty stacks).
4. Truncate long names; keep `id="student-welcome"`, `data-spekit={SPEKIT.studentWelcome}`, and existing gamification props.
5. No Server Actions, SQL, or new packages. Register `UI-019` in `.speckit/spec.yaml`; Vitest/Playwright smoke for height/subtitle/Spekit.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for all educational levels and subjects

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** — client component `StudentDashboardHero` |
| **Database** | **None** |
| **Data access** | Existing dashboard props (`studentName`, `StudentGamification`) — no new fetches |
| **UI** | Tailwind, Shadcn `Badge` / `Progress`, Spekit `student-welcome` |
| **Testing** | Vitest `[UI-019]` (layout contract / class flags if extracted) + Playwright phone viewport |
| **Target platform** | Student `/dashboard` ~360–390px first; tablet/desktop secondary |

**Feature-specific overrides**:

- **Primary Dependencies**: none beyond stack defaults
- **Storage / tables touched**: none
- **Performance Goals**: SC-001 ≥~40% hero height reduction on phone; SC-002 interactive content below visible without scroll
- **Constraints**: RTL (`dir="rtl"`); preserve Spekit + `#student-welcome` hash scroll; do not change teacher/login/landing heroes
- **Scale/Scope**: Shared welcome hero component only; unrelated empty states / page headers out of scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md`

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries | PASS — no new queries |
| QUIZ-001 | No answer leakage | PASS — dashboard chrome only |
| Server layer | Server Actions only | PASS — no new data writes/reads |
| RTL UX | Arabic RTL, touch targets | PASS — denser layout keeps readable streak/goal; no tiny new tap targets required inside hero |
| Passwordless | WhatsApp identity | PASS |
| Minimal diff | Match existing patterns | PASS — single component density pass |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — presentation-only; gamification fields unchanged; Spekit id preserved; single shared component covers all mount sites.

## Project Structure

### Documentation (this feature)

```text
specs/034-compact-welcome-hero/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-components.md
└── tasks.md                    # via /speckit-tasks
```

### Source Code (planned touch points)

```text
src/components/dashboard/StudentDashboardHero.tsx   # PRIMARY — compact padding, subtitle rules, streak/goal density
src/components/dashboard/StudentDashboardView.tsx   # VERIFY only — still mounts hero; no layout fork
src/lib/spekit-targets.ts                           # VERIFY — keep studentWelcome
.speckit/spekit-targets.yaml                        # VERIFY — student-welcome
.speckit/spec.yaml                                  # ADD UI-019

tests/features/ui-019-compact-welcome-hero.test.ts  # optional pure helpers / render contract
e2e/ui-019-compact-welcome-hero.spec.ts             # phone viewport height + subtitle hidden
```

**Structure decision**: Density lives entirely in `StudentDashboardHero`. No new shared layout primitive unless a second consumer appears later.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| none | — | — |

## Phase 0: Research

See [research.md](./research.md). Resolved: hide vs collapse subtitle, breakpoint, padding targets, streak/goal packing, name truncation, single-component scope.

## Phase 1: Design

See [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

**Key decisions**:
1. Hide motivational subtitle on `<sm`; optional one-line shortened copy from `sm` up (not multi-line).
2. Section padding ≈ `p-4` mobile / slightly larger `sm+`; reduce internal `gap-6` / `space-y-3` stacks.
3. Goal progress stays under greeting; streak chip stays compact (smaller icon box + tighter padding) in the same card.
4. Long names use single-line truncate; large streak numbers must not overflow the chip.
5. Preserve `id="student-welcome"` + Spekit `student-welcome`.

## Phase 2: Task planning

Deferred to `/speckit-tasks`.
