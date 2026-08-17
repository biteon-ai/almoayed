# Implementation Plan: Quick Text Paste Bulk Question Import

**Branch**: `022-quick-text-import` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/022-quick-text-import/spec.md`

**Feature ID (registry)**: `TEACH-013` (extends `TEACH-004` file bulk import with a paste-only path)

## Summary

Teachers on `/teacher/quizzes/[id]` get a **«لصق نصي سريع»** control next to manual add. They paste Arabic MCQ text (blank-line blocks; optional `س:`; options أ–د; correct via `*ب)` or `الجواب: ب`), see a live valid/invalid preview, and confirm-save up to **50** valid questions (append-only). Correct answers persist as **option text**. File import (TEACH-004/012) and manual add stay unchanged.

**Technical approach**:
1. Pure parser module for paste grammar + validation drafts (client preview + server re-parse).
2. `QuickTextPasteDialog` in `QuizQuestionsManager` (textarea, copy-example, live preview, save).
3. Server Action wrapping ownership checks → parse → cap 50 → resolve letter→option text → `importQuestionRows` append.
4. Vitest TEACH-013 suites; Spekit hooks; registry entry in `.speckit/spec.yaml`.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for Syrian Baccalaureate math

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC + client islands |
| **Database** | **Supabase** — **N/A** (no new tables/columns) |
| **Data access** | New Server Action + existing `importQuestionRows` / `assertQuizOwnedByTeacher` |
| **Session / auth** | `requireTeacher` + quiz ownership (existing) |
| **UI** | Tailwind, Shadcn Dialog, RTL — `QuizQuestionsManager` |
| **Testing** | Vitest `tests/features/teach-013-*.test.ts` |
| **Target platform** | Teacher quiz question management — mobile + desktop |

**Feature-specific overrides**:

- **Primary Dependencies**: None beyond stack defaults (reuse Dialog, HubToast/toast patterns, existing import helpers)
- **Storage / tables touched**: `questions` insert via existing import path (append-only)
- **Performance Goals**: Live parse of ≤100 blocks feels instant (&lt;100ms typical); save ≤50 questions &lt;5s wall clock
- **Constraints**: MT-002 ownership; QUIZ-001 untouched; append-only; 50-cap; store correct as option text; no empty option padding; RTL mobile dialog
- **Scale/Scope**: One dialog + parser + action on quiz edit screen; no new routes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries / session | PASS — `requireTeacher` + `assertQuizOwnedByTeacher` on save |
| QUIZ-001 | No answer leakage pre-submit | PASS — teacher-only UI/action; student exam path untouched |
| Server layer | Privileged data via Server Actions | PASS — persist only via Server Action + admin client |
| RTL UX | Arabic RTL, touch targets | PASS — Dialog RTL, controls `h-10`–`h-12` |
| Minimal diff | Match existing patterns | PASS — extend manager + import libs; no new page |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — no migrations/middleware; Spekit on new CTAs; file import unchanged; shared letter→text normalize only on paste persist path (or shared insert helper if tests allow).

## Project Structure

### Documentation (this feature)

```text
specs/022-quick-text-import/
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
├── import-text.ts              # NEW — parseQuickPasteText, validate drafts, sample format string
├── import-questions.ts         # Optional: shared letter→text in importRowsToQuestionInserts
└── question-options.ts         # Reuse resolveCorrectOptionText / letter maps

src/actions/teacher.ts          # importQuickPasteQuestions(quizId, text)

src/components/teacher/
├── QuizQuestionsManager.tsx    # «لصق نصي سريع» next to add
└── QuickTextPasteDialog.tsx    # NEW — paste UI + live preview

src/lib/spekit-targets.ts
.speckit/spekit-targets.yaml
.speckit/spec.yaml              # TEACH-013

tests/features/
├── teach-013-quick-paste-parse.test.ts
└── teach-013-quick-paste-save.test.ts   # parser→rows→insert shape / cap / letter→text
```

**Structure decision**: Keep paste grammar in a dedicated `import-text.ts` so TEACH-004 `parseWordLikeText` / file path stays stable. Preview and server both call the same pure functions.

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
1. Dedicated `parseQuickPasteText` with blank-line blocks, optional `س:`, `*letter)` + `الجواب:` (`الجواب:` wins).
2. Client live preview from the same pure parser; server re-parses on save (never trust client-only validity).
3. Persist via `importQuestionRows` append; map correct letter → option text before insert; options array = present only (2–4).
4. Cap 50 valid on confirm; toast imported + skippedInvalid + capped flags; close dialog if imported ≥ 1.
5. Spekit: `quick-text-paste-open`, `quick-text-paste-dialog`, `quick-text-paste-submit`.
6. Registry: `TEACH-013` on implement.

## Phase 2: Task planning

Deferred to `/speckit-tasks`.
