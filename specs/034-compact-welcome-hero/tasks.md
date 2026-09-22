---
description: "Task list for UI-019 Compact Welcome Hero"
---

# Tasks: Compact Welcome Hero (UI-019)

**Input**: Design documents from `/specs/034-compact-welcome-hero/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — plan requires Vitest `[UI-019]` in `tests/features/ui-019-compact-welcome-hero.test.ts` (when a pure helper is extracted) and Playwright phone coverage in `e2e/ui-019-compact-welcome-hero.spec.ts`.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US3)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js app: `src/`, `tests/`, `e2e/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Registry scaffolding for UI-019; confirm Spekit hooks already exist (no new keys)

- [x] T001 [P] Add draft `UI-019` entry (status `partial`) in `.speckit/spec.yaml` linking `specs/034-compact-welcome-hero/`, route `/dashboard`, primary file `src/components/dashboard/StudentDashboardHero.tsx`, extends `UI-001` `GAMIF-001`, and Spekit `student-welcome`
- [x] T002 [P] Verify `SPEKIT.studentWelcome` remains `"student-welcome"` in `src/lib/spekit-targets.ts` and `.speckit/spekit-targets.yaml` (do not rename; no new Spekit keys)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm single shared mount site so compaction in one component satisfies FR-005

**⚠️ CRITICAL**: Do not start hero layout edits until T003 is done

- [x] T003 Confirm `StudentDashboardHero` is the only welcome-hero consumer (grep `StudentDashboardHero` / `student-welcome`) and that `src/components/dashboard/StudentDashboardView.tsx` mounts it without a second inline welcome markup fork; note any extra consumers in `specs/034-compact-welcome-hero/research.md` only if found

**Checkpoint**: Foundation ready — safe to densify the shared hero only

---

## Phase 3: User Story 1 — Compact height & hide phone subtitle (Priority: P1) 🎯 MVP

**Goal**: On phone widths, the green welcome card uses compact padding/gaps and does not show the long multi-line motivational subtitle, so greeting + name + goal/streak remain and content below is reachable sooner.

**Independent Test**: `/dashboard` at ~390px — hero visibly shorter; no «استمر في إنجاز الاختبارات اليومية…»; name greeting still shown; action tiles or stats at least partially visible without scrolling.

### Implementation for User Story 1

- [x] T004 [US1] In `src/components/dashboard/StudentDashboardHero.tsx`, reduce section padding to compact mobile density (`p-4`, at most `sm:p-5`/`sm:p-6` — not legacy `p-6 sm:p-8`) and shrink outer stack gaps (`gap-6`/`space-y-3` → tighter `gap-3`/`gap-4` / `space-y-2`) per `specs/034-compact-welcome-hero/contracts/ui-components.md`
- [x] T005 [US1] In `src/components/dashboard/StudentDashboardHero.tsx`, hide the multi-line motivational subtitle on `<sm` (do not mount or use `hidden sm:…`); from `sm+` show at most one short single-line support phrase — never restore the tall multi-line block on phones
- [x] T006 [US1] In `src/components/dashboard/StudentDashboardHero.tsx`, keep `id="student-welcome"`, `data-spekit={SPEKIT.studentWelcome}`, badge + `h1` greeting with `{studentName}`, and ensure decorative blur stays `pointer-events-none`

**Checkpoint**: MVP — phone hero is shorter and subtitle-free; Spekit/hash intact

---

## Phase 4: User Story 2 — Readable streak & goal in compact bounds (Priority: P1)

**Goal**: Daily goal progress and streak chip stay fully visible and tightly packed inside the smaller card with no overflow, clipping, or cramped overlap; long names truncate to one line.

**Independent Test**: Partial goal + non-zero streak on ~390px — both widgets fully visible; completed goal (100%) and zero streak still layout cleanly; long name does not grow card height via multi-line wrap.

### Implementation for User Story 2

- [x] T007 [US2] In `src/components/dashboard/StudentDashboardHero.tsx`, re-pack greeting column + streak chip into a denser RTL-safe row/wrap: goal label + thin `Progress` under greeting; streak chip uses tighter padding (`p-2`/`p-3`), smaller icon box, and does not become a tall full-width slab that re-inflates height
- [x] T008 [US2] In `src/components/dashboard/StudentDashboardHero.tsx`, apply single-line `truncate` (or `line-clamp-1`) on the name heading and ensure streak number/`shrink-0` chip cannot overflow the rounded section (`min-w-0` on text column as needed); verify 0 and 100% goal copy still render in the compact row

**Checkpoint**: Motivation widgets remain scannable after height cut

---

## Phase 5: User Story 3 — Consistent shared hero (Priority: P2)

**Goal**: Every student surface that shows the green welcome hero uses the same compact treatment; unrelated headers/empty states stay untouched.

**Independent Test**: Grep/mount check — only the shared component carries welcome density; teacher/login/landing heroes unchanged; `StudentDashboardView` still mounts the shared hero once.

### Implementation for User Story 3

- [x] T009 [US3] Verify `src/components/dashboard/StudentDashboardView.tsx` still mounts a single `<StudentDashboardHero … />` (no duplicate welcome markup or page-local tall hero fork)
- [x] T010 [P] [US3] Spot-check that teacher dashboard, login branding (`src/components/login/LoginBrandingPanel.tsx`), and landing heroes were not modified for this feature; revert accidental diffs if any

**Checkpoint**: Density is consistent via one component; out-of-scope surfaces clean

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tests, registry completion, quickstart gates

- [x] T011 [P] Add Playwright Pixel-7 (~390px) coverage in `e2e/ui-019-compact-welcome-hero.spec.ts`: after student login to `/dashboard`, assert `data-spekit="student-welcome"` / `#student-welcome` exists; multi-line motivational subtitle text absent; greeting name visible; streak and daily goal visible; hero bounding height under a documented max OR below-hero tiles (`DashboardActionTiles` / stats) partially in viewport per `specs/034-compact-welcome-hero/quickstart.md`
- [x] T012 [P] Add Vitest `[UI-019]` coverage in `tests/features/ui-019-compact-welcome-hero.test.ts` only if a pure subtitle/copy helper was extracted; otherwise document “e2e-only” in the test file skip note or omit file and rely on T011
- [x] T013 Mark `UI-019` `implemented` with acceptance + file list in `.speckit/spec.yaml` (compact phone padding; subtitle hidden on `<sm`; streak/goal readable; Spekit `student-welcome` preserved)
- [x] T014 Run `specs/034-compact-welcome-hero/quickstart.md` manual checks + `npm run lint && npm run typecheck && npm run build` (and e2e for T011)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — **MVP**
- **User Story 2 (Phase 4)**: Depends on US1 (same file `StudentDashboardHero.tsx` — sequential)
- **User Story 3 (Phase 5)**: Depends on US1/US2 layout landing; verification can start after T006
- **Polish (Phase 6)**: Depends on US1–US3 implementation tasks

### User Story Dependencies

- **User Story 1 (P1)**: After T003 — no other story dependency
- **User Story 2 (P1)**: After US1 edits in `StudentDashboardHero.tsx` (same-file conflict if parallel)
- **User Story 3 (P2)**: After shared hero compaction exists; mostly verification

### Within Each User Story

- Layout/padding before fine streak packing when sharing one file
- Preserve Spekit/id before considering story done
- Story complete before next priority when touching the same component

### Parallel Opportunities

- T001 ∥ T002 (Setup)
- T010 can run beside polish prep once US1/US2 land
- T011 ∥ T012 (Polish tests, different files)
- US1 and US2 **cannot** safely parallel on `StudentDashboardHero.tsx`

---

## Parallel Example: Setup

```bash
Task: "Add draft UI-019 entry in .speckit/spec.yaml"
Task: "Verify SPEKIT.studentWelcome in src/lib/spekit-targets.ts and .speckit/spekit-targets.yaml"
```

## Parallel Example: Polish

```bash
Task: "Add Playwright coverage in e2e/ui-019-compact-welcome-hero.spec.ts"
Task: "Add or skip Vitest in tests/features/ui-019-compact-welcome-hero.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003)
3. Complete Phase 3: US1 (T004–T006) — compact padding + hide phone subtitle
4. **STOP and VALIDATE** with quickstart phone checks
5. Demo shorter first viewport

### Incremental Delivery

1. Setup + Foundational → safe single-component scope
2. US1 → shorter hero, no phone subtitle (MVP)
3. US2 → streak/goal density + name truncate
4. US3 → consistency verification
5. Polish → e2e, registry `implemented`, lint/typecheck/build

### Suggested MVP scope

**T001–T006 only** (registry + confirm consumer + compact padding/gaps + hide subtitle + preserve Spekit).

---

## Notes

- [P] = different files, no incomplete-task dependency
- Primary touch file: `src/components/dashboard/StudentDashboardHero.tsx`
- Do not change teacher/login/landing heroes
- Commit after each phase or logical group
- Feature ID for tests/describe: `[UI-019]`
