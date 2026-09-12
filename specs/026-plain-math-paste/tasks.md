---
description: "Task list for TEACH-016 Plain Unicode Math Quick-Paste"
---

# Tasks: Plain Unicode Math for Quick-Paste Quizzes (TEACH-016)

**Input**: Design documents from `/specs/026-plain-math-paste/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — plan + SC-002/SC-003/SC-005 require Vitest for converter table, paste normalize, sample LaTeX-free checks, and TEACH-013/014 regression.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js app: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Spekit + registry scaffolding for TEACH-016

- [x] T001 [P] Add `quickTextPasteMathNotice` to `SPEKIT` in `src/lib/spekit-targets.ts` (`quick-text-paste-math-notice`)
- [x] T002 [P] Register `quick-text-paste-math-notice` under TEACH-016 in `.speckit/spekit-targets.yaml`
- [x] T003 [P] Add draft `TEACH-016` feature entry (status planned/partial) in `.speckit/spec.yaml` linking `specs/026-plain-math-paste/` and noting TEACH-013/014 extension

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Plain-math module + wire field-level normalize into `parseQuickPasteDocument` with `mathNotice` aggregate — shared by all stories

**⚠️ CRITICAL**: No user-story UI/sample work until this phase is complete

- [x] T004 Create `src/lib/plain-math.ts` exporting `PlainMathNormalizeResult`, `normalizeLatexToPlainMath`, and `detectLatexResidue` per `specs/026-plain-math-paste/contracts/parsers-and-actions.md` (pure, non-throwing; identity-safe on clean Unicode)
- [x] T005 Implement v1 conversion table in `src/lib/plain-math.ts` (`$...$`, `\(...\)`, `\frac`, `\sqrt`, `\vec`/`\overrightarrow`, `\widehat`/`\hat`, `\sin`/`\cos`/`\tan`/`\cot`, `\pm`/`\infty`/`\cdot`/`\times`) with `residualLatex` for unrecognized fragments per `specs/026-plain-math-paste/research.md` §3
- [x] T006 Extend `QuickPasteDocument` with `mathNotice: { convertedCount, residualLatex, hadLatexInput }` in `src/lib/import-text.ts` (types + empty aggregate default)
- [x] T007 Apply `normalizeLatexToPlainMath` to stem, `option_a`–`option_d`, and explanation after structural parse in `src/lib/import-text.ts`; set `correct_answer` from normalized option text; aggregate `mathNotice` across drafts; do not rewrite settings header or markers
- [x] T008 [P] Add `[TEACH-016]` unit tests for conversion table, idempotence on plain text, and residual detection in `tests/features/teach-016-plain-math.test.ts`

**Checkpoint**: Foundation ready — parse path returns normalized field text + `mathNotice`; US1–US4 can proceed

---

## Phase 3: User Story 1 — Paste STEM questions with readable plain math (Priority: P1) 🎯 MVP

**Goal**: Unicode-only LMS stems/options/explanations preview and save without introducing LaTeX; TEACH-014 structure unchanged.

**Independent Test**: Paste one `Q1:` block with `7/9`, `√2`, `[AB]`, `sin(BAC)` and spaces → preview valid → save → stored text matches plain characters.

### Tests for User Story 1

- [x] T009 [P] [US1] Add `[TEACH-016]` paste fixtures asserting plain Unicode LMS blocks stay valid and field text unchanged (no `$`/`\frac` introduced) in `tests/features/teach-016-paste-normalize.test.ts`

### Implementation for User Story 1

- [x] T010 [US1] Confirm `QuickTextPasteDialog.tsx` preview already renders `parseQuickPasteDocument(...).drafts` field strings (normalized) so Unicode STEM displays as typed — adjust only if preview uses raw textarea slices instead of drafts
- [x] T011 [US1] Confirm `importQuickPasteQuestions` in `src/actions/teacher.ts` still re-parses via `parseQuickPasteDocument` so saved rows match normalized preview (no action API change unless `mathNotice` passthrough is trivial)

**Checkpoint**: MVP — plain Unicode STEM paste → preview → save works end-to-end

---

## Phase 4: User Story 2 — Official samples and copy templates use plain math (Priority: P1)

**Goal**: «نسخ نموذج LMS» copies LaTeX-free Unicode STEM sample with correct spacing conventions.

**Independent Test**: Copy LMS sample → paste → ≥1 valid; sample contains no `$`, `\frac`, `\vec`, `\widehat`.

### Tests for User Story 2

- [x] T012 [P] [US2] Assert `LMS_QUICK_PASTE_SAMPLE` has no LaTeX delimiters/commands and parses to ≥1 valid draft in `tests/features/teach-016-paste-normalize.test.ts`

### Implementation for User Story 2

- [x] T013 [US2] Rewrite `LMS_QUICK_PASTE_SAMPLE` in `src/lib/import-text.ts` to Unicode plain math (include at least one of `1/2`, `√`, `[AB]`) and keep settings header + two `Qn:` blocks valid
- [x] T014 [US2] Verify «نسخ نموذج LMS» in `src/components/teacher/QuickTextPasteDialog.tsx` still copies `LMS_QUICK_PASTE_SAMPLE` (no UI label change required unless copy toast needs clearer STEM hint)

**Checkpoint**: Official LMS sample teaches plain-math paste format

---

## Phase 5: User Story 3 — LaTeX paste normalized or guided (Priority: P2)

**Goal**: Common LaTeX converts to plain Unicode in drafts; residual triggers non-blocking Arabic notice; structure validity independent of math style.

**Independent Test**: Paste Q10-style `$M$` / `\vec` / `\frac` LMS block → preview shows plain forms → notice if residual → save stores normalized text; obscure command still valid with warning.

### Tests for User Story 3

- [x] T015 [P] [US3] Add `[TEACH-016]` cases for `\frac`/`\vec`/`$...$` → plain output and residual obscure commands still `valid: true` in `tests/features/teach-016-paste-normalize.test.ts`
- [x] T016 [P] [US3] Update former “preserves LaTeX” test in `tests/features/teach-014-lms-parse.test.ts` to expect normalized plain forms for covered patterns (TEACH-016 narrowing)

### Implementation for User Story 3

- [x] T017 [US3] Render Arabic math notice banner from `mathNotice` (`hadLatexInput` / `residualLatex`) with Spekit `quickTextPasteMathNotice` in `src/components/teacher/QuickTextPasteDialog.tsx` per `specs/026-plain-math-paste/contracts/ui-components.md`
- [x] T018 [US3] Ensure notice is non-blocking (Save still enabled for valid drafts) and does not replace settings card or validity badge in `src/components/teacher/QuickTextPasteDialog.tsx`

**Checkpoint**: LaTeX AI paste soft-lands via normalize + Arabic notice

---

## Phase 6: User Story 4 — Arabic BiDi spacing intact (Priority: P2)

**Goal**: Preserve author spaces; samples demonstrate Arabic–math gaps; optional soft insert for missing Arabic↔Latin boundaries without breaking structure.

**Independent Test**: Spaced Arabic+Latin paste preserves spaces after import; sample (if Arabic STEM) shows gaps; missing spaces do not invalidate LMS structure.

### Tests for User Story 4

- [x] T019 [P] [US4] Add `[TEACH-016]` assertions that existing spaces between Arabic and Latin/math are preserved through `parseQuickPasteDocument` in `tests/features/teach-016-paste-normalize.test.ts`
- [x] T020 [P] [US4] Add unit cases for optional `ensureArabicMathSpacing` (insert only when Arabic letter abuts Latin/digit/`√`) in `tests/features/teach-016-plain-math.test.ts`

### Implementation for User Story 4

- [x] T021 [US4] Implement `ensureArabicMathSpacing` in `src/lib/plain-math.ts` and invoke it after LaTeX normalize on field text in `src/lib/import-text.ts` (conservative; do not strip spaces or rewrite punctuation order)
- [x] T022 [US4] Ensure `LMS_QUICK_PASTE_SAMPLE` / any Arabic STEM lines in samples keep a clear space between Arabic words and math/Latin tokens in `src/lib/import-text.ts`

**Checkpoint**: BiDi spacing preserved; soft insert safe; mixed TEACH-013/014 paste still works

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Registry, regressions, quickstart verification

- [x] T023 [P] Mark `TEACH-016` implemented (acceptance bullets from spec) and narrow TEACH-014 “LaTeX preserved” acceptance to unrecognized-only + TEACH-016 pointer in `.speckit/spec.yaml`
- [x] T024 [P] Keep TEACH-013 regression green: run `tests/features/teach-013-quick-paste-parse.test.ts` and `tests/features/teach-013-quick-paste-save.test.ts`
- [x] T025 Run `npx vitest run tests/features/teach-016-plain-math.test.ts tests/features/teach-016-paste-normalize.test.ts tests/features/teach-014-lms-parse.test.ts tests/features/teach-014-lms-settings.test.ts tests/features/teach-013-quick-paste-parse.test.ts tests/features/teach-013-quick-paste-save.test.ts` and `npm run build`
- [x] T026 [P] Walk `specs/026-plain-math-paste/quickstart.md` manual QA checklist; fix copy/UX gaps in `QuickTextPasteDialog.tsx` / samples only if needed
- [x] T027 [P] Set `specs/026-plain-math-paste/spec.md` status to Implemented (or Ready for implement if deferring until `/speckit-implement` completes)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: After Foundational — MVP path
- **US2 (Phase 4)**: After Foundational — can parallel US1 if staffing allows (same `import-text.ts` sample constant → prefer after or carefully with US1)
- **US3 (Phase 5)**: After Foundational — needs T005–T007 converter wired; UI can follow US1
- **US4 (Phase 6)**: After Foundational — spacing helper; sample spacing pairs with US2
- **Polish (Phase 7)**: After desired stories complete

### User Story Dependencies

- **US1 (P1)**: Foundational only — independently testable with Unicode fixtures
- **US2 (P1)**: Foundational; touches `LMS_QUICK_PASTE_SAMPLE` (coordinate with US4 sample spacing)
- **US3 (P2)**: Foundational converter; dialog notice; updates TEACH-014 test
- **US4 (P2)**: Foundational; optional spacing helper; preserve-space tests

### Within Each Story

- Tests marked first where listed — write failing tests then implement
- Converter/unit before dialog polish
- Story checkpoint before next priority when solo

### Parallel Opportunities

- T001–T003 in parallel
- T008 with early T004–T005 once exports exist
- T009 ∥ T012 ∥ T015 ∥ T016 ∥ T019 ∥ T020 (different test files/sections) after foundational
- T023 ∥ T024 ∥ T026 ∥ T027 during polish (before/around T025)

---

## Parallel Example: After Foundational

```bash
# Tests in parallel:
Task: "T009 plain Unicode paste fixtures in teach-016-paste-normalize.test.ts"
Task: "T012 LMS sample LaTeX-free assertions in teach-016-paste-normalize.test.ts"
Task: "T015 LaTeX→plain + residual valid in teach-016-paste-normalize.test.ts"
Task: "T016 update teach-014-lms-parse.test.ts LaTeX expectation"
Task: "T008/T020 converter units in teach-016-plain-math.test.ts"
```

---

## Parallel Example: User Story 3

```bash
Task: "T015 normalize integration tests in teach-016-paste-normalize.test.ts"
Task: "T016 update teach-014-lms-parse.test.ts"
# Then sequential UI:
Task: "T017 math notice banner in QuickTextPasteDialog.tsx"
Task: "T018 non-blocking notice placement in QuickTextPasteDialog.tsx"
```

---

## Implementation Strategy

### MVP First (US1 + foundational samples optional)

1. Phase 1 Setup  
2. Phase 2 Foundational (converter + wire)  
3. Phase 3 US1 — plain Unicode paste E2E  
4. **STOP and VALIDATE** quickstart §2  
5. Optionally ship US2 sample rewrite immediately after (high leverage)

### Incremental Delivery

1. Setup + Foundational → normalize path live  
2. US1 → Unicode STEM paste works  
3. US2 → teachers copy the right format  
4. US3 → LaTeX soft landing + notice  
5. US4 → spacing polish  
6. Polish → registry + full Vitest + build  

### Parallel Team Strategy

1. Shared: Setup + Foundational  
2. Dev A: US1 + US3 dialog notice  
3. Dev B: US2 samples + US4 spacing (coordinate `import-text.ts`)  
4. Shared: Phase 7 verification  

---

## Notes

- [P] = different files / safe parallel slices  
- Do **not** add MathJax/KaTeX  
- Do **not** migrate historical DB LaTeX rows  
- Server must re-parse (already true) so preview ≡ save  
- Commit after each task or logical group  
- Next command: `/speckit-implement`
