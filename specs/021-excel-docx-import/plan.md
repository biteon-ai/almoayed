# Implementation Plan: Excel & Word Quiz Import Templates

**Branch**: `021-excel-docx-import` | **Date**: 2026-08-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/021-excel-docx-import/spec.md`

**Feature ID (registry)**: `TEACH-012` (extends `TEACH-004` bulk import — Excel/Word sample fidelity + template-driven tests)

## Summary

TXT import already works. This plan hardens **Excel (`.xlsx`)** and **Word (`.docx`)** import so teachers can download official sample templates, upload them unchanged, and get a successful import — with automated tests that use the **same builders** as the download buttons.

**Technical approach**:
1. Keep Excel client-side sample via existing `downloadSampleImportXlsx` / `buildSampleImportSheetRows`; add round-trip Vitest that builds → `parseXlsxQuestions` → assert `SAMPLE_IMPORT_ROW`.
2. Replace misleading Word “template” (currently downloads `.txt`) with a real `.docx` sample generated from shared sample question constants (new helper + `docx` dependency), downloadable from `ImportWordGuide`.
3. Wire sample `.docx` through the existing mammoth → `parseDocxHtmlQuestions` → staging preview path; keep TXT format preview + optional separate TXT download.
4. No schema migration; reuse `importQuestions` / `parseDocxQuestions` / `importQuestionRows` with `assertQuizOwnedByTeacher`.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for Syrian Baccalaureate math

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC + client islands |
| **Database** | **Supabase** — **N/A** (no new tables/columns) |
| **Data access** | Existing `importQuestions` / `importQuestionRows` / `parseDocxQuestions` Server Actions |
| **Session / auth** | `requireTeacher` + `assertQuizOwnedByTeacher` (existing) |
| **UI** | Tailwind, Shadcn, RTL — `ImportExcelGuide` / `ImportWordGuide` / `BulkQuestionUpload` |
| **Testing** | Vitest (`tests/features/teach-012-*.test.ts`); extend TEACH-004 coverage where shared |
| **Target platform** | Teacher quiz edit import panel — mobile + desktop |

**Feature-specific overrides**:

- **Primary Dependencies**: Existing `xlsx`, `mammoth`; **add** `docx` (client/Node generation of sample `.docx` OOXML)
- **Storage / tables touched**: `questions` insert only via existing import actions (no migration)
- **Performance Goals**: Sample download &lt; 1s client-side; template import of ≤10 sample MCQs feels instant (&lt; 5s wall clock on normal networks)
- **Constraints**: MT-002 quiz ownership; QUIZ-001 unchanged (teacher-only); append-only re-import; RTL guides; no Google Docs API
- **Scale/Scope**: Import guides + template builders + Vitest fixtures; no new routes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries / session | PASS — no new queries; existing `assertQuizOwnedByTeacher` |
| QUIZ-001 | No answer leakage pre-submit | PASS — teacher-only import; student exam path untouched |
| Server layer | Privileged data via Server Actions | PASS — import still via `importQuestions` / `importQuestionRows` / `parseDocxQuestions` |
| RTL UX | Arabic RTL, touch targets | PASS — update existing guides; buttons `h-11` |
| Minimal diff | Match existing patterns | PASS — extend `import-template` + `ImportWordGuide`; no new import surface |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — no middleware/DB changes; Spekit hooks optional on new download buttons; TXT/CSV retained; DOCX staging flow unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/021-excel-docx-import/
├── spec.md
├── plan.md                 # This file
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ui-components.md
│   └── parsers-and-actions.md
└── tasks.md                # /speckit-tasks
```

### Source Code (planned touch points)

```text
src/lib/
├── import-template.ts          # Excel builders (existing) + shared SAMPLE row
├── import-docx-template.ts     # NEW — buildSampleImportDocxBuffer / downloadSampleImportDocx
├── import-questions.ts         # Excel parse hardening if gaps found (minimal)
└── parse-docx-questions.ts     # Only if sample HTML shape needs tiny parser tweaks

src/components/teacher/import/
├── ImportExcelGuide.tsx        # Spekit on Excel download (optional)
└── ImportWordGuide.tsx         # Real .docx download; keep TXT preview + optional TXT download

src/lib/spekit-targets.ts       # importExcelTemplateDownload, importDocxTemplateDownload
.speckit/spekit-targets.yaml
.speckit/spec.yaml              # TEACH-012 registry entry

tests/features/
├── teach-012-excel-template.test.ts
└── teach-012-docx-template.test.ts
```

**Structure decision**: Mirror Excel’s “builder = download = test fixture” pattern for Word. Prefer generating `.docx` in-process over a static `public/` binary to avoid drift.

## Complexity Tracking

> No constitution violations.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0: Research

See [research.md](./research.md). All technical unknowns resolved.

## Phase 1: Design

See [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

**Key decisions**:
1. Add `docx` package for sample document generation (paragraph `(1)` + options table).
2. Shared sample MCQ content aligned with `SAMPLE_IMPORT_ROW` (Arabic 5×5 example) so Excel and Word demos teach the same question.
3. Word guide: primary CTA downloads `.docx`; TXT format remains visible; optional secondary TXT download kept for plain-text authors.
4. Tests: build buffer → parse → assert rows; no committed binary fixture required if builder is deterministic.
5. Registry: `TEACH-012` extends TEACH-004; update `.speckit/spec.yaml` on implement.

## Phase 2: Task planning

Deferred to `/speckit-tasks`.
