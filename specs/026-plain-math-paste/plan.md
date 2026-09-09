# Implementation Plan: Plain Unicode Math for Quick-Paste Quizzes

**Branch**: `026-plain-math-paste` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/026-plain-math-paste/spec.md`

**Feature ID (registry)**: `TEACH-016` (extends `TEACH-013` / `TEACH-014` quick paste; narrows TEACH-014 LaTeX guidance)

## Summary

Teachers paste STEM quiz text into «لصق نصي سريع». The product no longer recommends raw LaTeX (`$...$`, `\frac`, `\vec`, …). Official LMS samples use **plain Unicode math** with spaces between Arabic and Latin/math. On parse, a conservative **normalizer** converts common inline LaTeX into plain equivalents on draft fields; residual LaTeX triggers a non-blocking Arabic notice. Structural LMS/Arabic parsing, settings header, gatekeeper, and tenant scoping stay unchanged. No formula typesetting engine.

**Technical approach**:
1. Add pure `normalizeLatexToPlainMath` (+ helpers) in `src/lib/` — conversion table for common commands; leave unrecognized fragments; report `hadLatex` / `residualLatex`.
2. Apply normalization to **parsed field text** (stem, options, explanation) inside `parseQuickPasteDocument` / block parse — never rewrite structural markers (`Qn:`, `Answer:`, settings keys).
3. Replace `LMS_QUICK_PASTE_SAMPLE` (and any math-bearing Arabic sample bits) with Unicode STEM examples + Arabic–math spacing.
4. Extend `QuickTextPasteDialog` with a compact Arabic notice when residual (or pre-normalize) LaTeX is detected; save path uses already-normalized draft text via existing `toImportRowsFromValidDrafts`.
5. Vitest `[TEACH-016]` suites; update TEACH-014 “preserves LaTeX” expectation; registry `TEACH-016` + TEACH-014 acceptance note.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for Syrian Baccalaureate math

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC + client islands |
| **Database** | **Supabase** — **N/A** (no new tables/columns) |
| **Data access** | Existing `importQuickPasteQuestions` — re-parse server-side; no new privileged APIs |
| **Session / auth** | `requireTeacher` + quiz ownership (unchanged) |
| **UI** | Tailwind, Shadcn Dialog — `QuickTextPasteDialog` |
| **Testing** | Vitest `tests/features/teach-016-*.test.ts` + TEACH-013/014 regression |
| **Target platform** | Teacher quiz question management — mobile + desktop |

**Feature-specific overrides**:

- **Primary Dependencies**: None beyond stack defaults (no KaTeX/MathJax)
- **Storage / tables touched**: `questions` text columns only via existing append import (same as TEACH-013/014)
- **Performance Goals**: Normalize + parse ≤100 blocks feels instant on teacher device
- **Constraints**: MT-002 ownership; QUIZ-001 untouched; conservative conversion (FR-008); structure validity independent of math style (FR-010)
- **Scale/Scope**: Paste lib + dialog + samples + tests + registry; no new routes; no historical DB migration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries / session | PASS — no change to ownership filters |
| QUIZ-001 | No answer leakage pre-submit | PASS — teacher paste only; student exam path unchanged |
| Server layer | Privileged data via Server Actions | PASS — server still re-parses paste text; client drafts not trusted alone |
| RTL UX | Arabic RTL, touch targets | PASS — Arabic notice + samples with BiDi spacing |
| Minimal diff | Match existing patterns | PASS — extend `import-text` / dialog / tests only |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — no migrations; optional Spekit on math-notice banner; TEACH-013/014 structure preserved; normalization is pure and applied identically client preview + server import.

## Project Structure

### Documentation (this feature)

```text
specs/026-plain-math-paste/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── parsers-and-actions.md
│   └── ui-components.md
└── tasks.md                    # via /speckit-tasks
```

### Source Code (planned touch points)

```text
src/lib/
├── plain-math.ts               # NEW — normalizeLatexToPlainMath, detectLatexResidue, spacing helpers
└── import-text.ts              # EXTEND — apply normalize on draft fields; Unicode LMS sample

src/components/teacher/
└── QuickTextPasteDialog.tsx    # EXTEND — Arabic LaTeX/residual notice

src/lib/spekit-targets.ts       # optional math-notice hook
.speckit/spekit-targets.yaml
.speckit/spec.yaml              # TEACH-016 + TEACH-014 note

tests/features/
├── teach-016-plain-math.test.ts      # converter + sample assertions
├── teach-016-paste-normalize.test.ts # parse → normalized drafts + residual flag
├── teach-014-lms-parse.test.ts       # UPDATE LaTeX expectation
└── teach-013-*.test.ts               # regression green
```

**Structure decision**: Keep structural grammar in `import-text.ts`; isolate conversion table in `plain-math.ts` for unit testing without dragging full paste fixtures.

## Complexity Tracking

> No constitution violations.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0: Research

See [research.md](./research.md). All technical unknowns resolved (including FR-007: normalize + residual notice).

## Phase 1: Design

See [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

**Key decisions**:
1. FR-007 shipped as **(a)+(b)**: best-effort normalize common patterns, then Arabic notice if residual LaTeX remains.
2. Normalize **after** block/field parse on stem/options/explanation only.
3. Samples are Unicode-only; TEACH-014 “preserve LaTeX” becomes “preserve unrecognized; normalize covered patterns”.
4. No DB migration; no MathJax.

## Phase 2: Task planning

Deferred to `/speckit-tasks`.
