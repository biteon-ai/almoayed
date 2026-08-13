# Implementation Plan: Structured LMS Quiz Text Import

**Branch**: `023-lms-quiz-text-import` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/023-lms-quiz-text-import/spec.md`

**Feature ID (registry)**: `TEACH-014` (extends `TEACH-013` quick paste + quiz settings from TEACH-003 / QUIZ-004 / QUIZ-005)

## Summary

Teachers paste AI/LMS generator output into «لصق نصي سريع»: optional `=== Quiz Settings ===` header (previewed, applied per-field on the same confirm-save) plus `Q1:` / `A)`–`D)` / `Answer:` questions. Parser auto-detects LMS vs Arabic TEACH-013 **per block**; `Qn:` starts a new question without a blank line. Correct answers persist as option text; ≤50 valid questions per save; LaTeX preserved as text.

**Technical approach**:
1. Extend `src/lib/import-text.ts` — strip/parse settings header; `Qn:` delimiter; LMS block rules (exactly 4 choices + `Answer:`); keep Arabic path; return `{ settings, drafts }`.
2. Extend `importQuickPasteQuestions` — after successful append, apply only valid settings fields via existing `updateQuizFlags`.
3. Extend `QuickTextPasteDialog` — Arabic settings preview card + field warnings; toast mentions settings applied/skipped.
4. Vitest TEACH-014 suites; Spekit hooks if new controls; registry entry.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for Syrian Baccalaureate math

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC + client islands |
| **Database** | **Supabase** — **N/A** (no new tables/columns) |
| **Data access** | Extend `importQuickPasteQuestions` + existing `updateQuizFlags` / `importQuestionRows` |
| **Session / auth** | `requireTeacher` + quiz ownership |
| **UI** | Tailwind, Shadcn Dialog — `QuickTextPasteDialog` |
| **Testing** | Vitest `tests/features/teach-014-*.test.ts` (+ TEACH-013 regression) |
| **Target platform** | Teacher quiz question management — mobile + desktop |

**Feature-specific overrides**:

- **Primary Dependencies**: None beyond stack defaults
- **Storage / tables touched**: `questions` insert (append); `quizzes` update for settings fields only
- **Performance Goals**: Live parse of ≤100 blocks feels instant; save ≤50 questions + settings &lt;5s
- **Constraints**: MT-002 ownership; QUIZ-001 untouched; per-field settings; mixed paste; timer Yes without duration skips timer fields
- **Scale/Scope**: Extend paste parser/action/dialog only; no new routes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries / session | PASS — ownership on import + `updateQuizFlags` |
| QUIZ-001 | No answer leakage pre-submit | PASS — teacher-only |
| Server layer | Privileged data via Server Actions | PASS — re-parse server-side; no client-trusted rows/settings alone |
| RTL UX | Arabic RTL, touch targets | PASS — settings preview Arabic labels |
| Minimal diff | Match existing patterns | PASS — extend TEACH-013 surfaces |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — no migrations; Spekit optional on settings preview panel; TEACH-013 Arabic path preserved.

## Project Structure

### Documentation (this feature)

```text
specs/023-lms-quiz-text-import/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── parsers-and-actions.md
│   └── ui-components.md
└── tasks.md
```

### Source Code (planned touch points)

```text
src/lib/
├── import-text.ts              # EXTEND — settings header, Qn:, LMS blocks, parseQuickPasteDocument
├── quiz-attempts.ts            # Reuse parseAssessmentCategory / validateMaxAttempts
└── quiz-timer.ts               # Reuse validateDurationMinutes

src/actions/teacher.ts          # EXTEND importQuickPasteQuestions → settings apply

src/components/teacher/
└── QuickTextPasteDialog.tsx    # Settings preview + warnings

src/lib/spekit-targets.ts       # optional quick-text-paste-settings
.speckit/spekit-targets.yaml
.speckit/spec.yaml              # TEACH-014

tests/features/
├── teach-014-lms-parse.test.ts
├── teach-014-lms-settings.test.ts
└── teach-013-*.test.ts         # regression
```

**Structure decision**: Keep all paste grammar in `import-text.ts`; reuse `updateQuizFlags` rather than duplicating quiz validation.

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
1. `parseQuickPasteDocument(text)` → `{ settings: ParsedQuizSettings | null, drafts: QuickPasteDraft[] }`.
2. Splitters: blank line, `(n)`, and `Qn:`.
3. LMS block validity: stem + 4 non-empty A–D + Answer letter → option text.
4. Settings applied only if `imported ≥ 1`; per-field skip with warnings; timer Yes without duration skips timer fields.
5. UI: settings preview card in existing dialog.
6. Registry: `TEACH-014` on implement.

## Phase 2: Task planning

Deferred to `/speckit-tasks`.
