---
description: "Task list for TEACH-013 Quick Text Paste Bulk Question Import"
---

# Tasks: Quick Text Paste Bulk Question Import (TEACH-013)

**Input**: Design documents from `/specs/022-quick-text-import/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — plan + SC-003 / SC-001a / SC-003a require Vitest coverage for parse, valid-subset, 50-cap, and letter→option-text persistence.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js app: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Spekit hooks and registry scaffolding for TEACH-013 (no new npm packages)

- [x] T001 [P] Add `quickTextPasteOpen`, `quickTextPasteDialog`, and `quickTextPasteSubmit` to `SPEKIT` in `src/lib/spekit-targets.ts`
- [x] T002 [P] Register the same Spekit selectors under TEACH-013 in `.speckit/spekit-targets.yaml`
- [x] T003 [P] Add draft `TEACH-013` feature entry (status planned/partial) in `.speckit/spec.yaml` linking planned files from `specs/022-quick-text-import/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared paste parser + sample format used by preview, save action, and all stories

**⚠️ CRITICAL**: No user story UI work until this phase is complete

- [x] T004 Implement `QuickPasteDraft` types, `QUICK_PASTE_SAMPLE_FORMAT`, blank-line split, optional `س:`/`Q:` stem, options أ–د (Latin a–d), optional `الشرح:`/`التصنيف:`/`قسم:`, and Arabic `error_reason` strings in `src/lib/import-text.ts`
- [x] T005 Extend `src/lib/import-text.ts` to resolve correct letter from leading `*letter)` and/or `الجواب:`/`Answer:` with **`الجواب:` wins** on conflict; set `correct_answer` to option **text** when valid; persist only present options (2–4, no empty padding)
- [x] T006 Add `toImportRowsFromValidDrafts(drafts, { max: 50 })` in `src/lib/import-text.ts` returning `{ rows, imported, skippedInvalid, capped }` mapped to `ImportQuestionRow`
- [x] T007 [P] Add `[TEACH-013]` parser unit tests for blank-line blocks, plain/`س:` stem, `*ب)`, `الجواب:`, conflict winner, &lt;2 options invalid, Latin aliases, no empty padding in `tests/features/teach-013-quick-paste-parse.test.ts`

**Checkpoint**: Foundation ready — US1–US4 can proceed (US3/US4 partly parallel after T004–T006)

---

## Phase 3: User Story 1 — Paste text and save valid questions (Priority: P1) 🎯 MVP

**Goal**: Teacher opens «لصق نصي سريع», pastes valid MCQs, confirms save, questions append to the quiz with option-text correct answers; dialog closes with success count.

**Independent Test**: `/teacher/quizzes/[id]` → «لصق نصي سريع» → paste valid sample → preview valid → save → questions on list with correct option text; file import / manual add still work.

### Tests for User Story 1

- [x] T008 [P] [US1] Add `[TEACH-013]` save-shape tests: valid subset mapping, 50-cap (`capped: true`), letter→option text on rows in `tests/features/teach-013-quick-paste-save.test.ts`

### Implementation for User Story 1

- [x] T009 [US1] Implement `importQuickPasteQuestions(quizId, text)` in `src/actions/teacher.ts`: `requireTeacher` + `assertQuizOwnedByTeacher` → `parseQuickPasteText` → cap 50 → `importQuestionRows(..., { mode: "append" })` → return `{ imported, skippedInvalid, capped }`; Arabic error when zero valid
- [x] T010 [US1] Create `QuickTextPasteDialog` in `src/components/teacher/QuickTextPasteDialog.tsx` (RTL Dialog, textarea, live preview list, confirm save calling `importQuickPasteQuestions`, loading state, Spekit `quick-text-paste-dialog` / `quick-text-paste-submit`)
- [x] T011 [US1] Wire «لصق نصي سريع» button next to «إضافة سؤال يدوياً» with Spekit `quick-text-paste-open` and open `QuickTextPasteDialog` in `src/components/teacher/QuizQuestionsManager.tsx`
- [x] T012 [US1] On `imported ≥ 1`: close dialog, toast imported (+ skipped/cap when applicable), `router.refresh()`; on zero valid: keep dialog open with Arabic message in `src/components/teacher/QuickTextPasteDialog.tsx`

**Checkpoint**: MVP — paste → preview → save ≥1 valid question works end-to-end

---

## Phase 4: User Story 2 — Live validation and error highlighting (Priority: P1)

**Goal**: Live preview distinguishes invalid blocks with Arabic reasons; save imports only valid subset (or blocks with clear message if none valid).

**Independent Test**: Mix one valid + one incomplete block → invalid shows Arabic reason → save imports only valid; all-invalid paste does not write DB and keeps dialog open.

### Tests for User Story 2

- [x] T013 [P] [US2] Extend `tests/features/teach-013-quick-paste-parse.test.ts` with mixed valid/invalid blocks asserting `valid` flags and non-empty Arabic `error_reason` on invalids

### Implementation for User Story 2

- [x] T014 [US2] Render valid vs invalid preview rows (status badge/icon + `error_reason`) and disable or no-op save UX when zero valid in `src/components/teacher/QuickTextPasteDialog.tsx`
- [x] T015 [US2] Ensure toast after mixed save reports imported count and skipped-invalid count per FR-009 in `src/components/teacher/QuickTextPasteDialog.tsx`
- [x] T016 [US2] Confirm empty/whitespace paste shows «لا يوجد نص» (or equivalent) and never calls persist in `src/components/teacher/QuickTextPasteDialog.tsx`

**Checkpoint**: US2 validation UX + subset save messaging complete

---

## Phase 5: User Story 3 — Copy example format (Priority: P2)

**Goal**: Teacher can copy the official example and see the same structure as placeholder.

**Independent Test**: Open dialog → «نسخ نموذج التنسيق» → paste into textarea → preview shows sample as valid.

### Implementation for User Story 3

- [x] T017 [P] [US3] Export/use `QUICK_PASTE_SAMPLE_FORMAT` as textarea placeholder (or visible example) in `src/components/teacher/QuickTextPasteDialog.tsx`
- [x] T018 [US3] Add «نسخ نموذج التنسيق» control that writes `QUICK_PASTE_SAMPLE_FORMAT` to clipboard with brief Arabic confirmation in `src/components/teacher/QuickTextPasteDialog.tsx`
- [x] T019 [P] [US3] Assert `QUICK_PASTE_SAMPLE_FORMAT` parses to ≥1 valid draft in `tests/features/teach-013-quick-paste-parse.test.ts`

**Checkpoint**: First-time teachers can discover format without leaving the dialog

---

## Phase 6: User Story 4 — Correct-answer format variants (Priority: P2)

**Goal**: Both `*ب)` and `الجواب: ب` work; conflict prefers `الجواب:`; persisted correct answer is option text.

**Independent Test**: Paste one `*ب)` question and one `الجواب: ج` → both valid with expected correct option text after save.

### Tests for User Story 4

- [x] T020 [P] [US4] Add assertions in `tests/features/teach-013-quick-paste-parse.test.ts` and/or `teach-013-quick-paste-save.test.ts` for `*letter)`, `الجواب:`, conflict winner, and `correct_answer ===` option text

### Implementation for User Story 4

- [x] T021 [US4] Harden option-line asterisk stripping and letter alias mapping in `src/lib/import-text.ts` if T020 finds gaps (no change to `parseWordLikeText` file path)
- [x] T022 [US4] Preview may show correct letter for clarity while saved rows use option text — verify mapping in `src/lib/import-text.ts` + `src/actions/teacher.ts` `importQuickPasteQuestions`

**Checkpoint**: Story 4 format variants locked by Vitest

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Registry, regression, build, docs alignment

- [x] T023 [P] Mark `TEACH-013` implemented in `.speckit/spec.yaml` with acceptance notes, routes (`/teacher/quizzes/[id]`), and file paths
- [x] T024 [P] Confirm TEACH-004 file import unchanged by running `npx vitest run tests/features/teach-004-import.test.ts`
- [x] T025 Run `npx vitest run tests/features/teach-013-quick-paste-parse.test.ts tests/features/teach-013-quick-paste-save.test.ts` and `npm run build`
- [x] T026 [P] Walk `specs/022-quick-text-import/quickstart.md` manual QA checklist; fix any copy/UX gaps in `QuickTextPasteDialog.tsx` / manager button label only if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** → no blockers
- **Phase 2 (Foundational)** → after Setup; **blocks all stories**
- **Phase 3 (US1)** → after Foundational — **MVP**
- **Phase 4 (US2)** → after US1 dialog exists (extends same dialog)
- **Phase 5 (US3)** → after US1 dialog shell (can parallel with US2 polish)
- **Phase 6 (US4)** → after Foundational parser (tests can start once T004–T006 done; UI relies on US1)
- **Phase 7 (Polish)** → after US1–US4 desired scope

### User Story Dependencies

- **US1**: Needs T004–T006; delivers MVP
- **US2**: Needs US1 dialog; extends preview/toast
- **US3**: Needs US1 dialog; independent of US2 logically
- **US4**: Mostly parser (Foundational); verify via tests + save path from US1

### Parallel Opportunities

- T001–T003 in parallel
- T007 after T004–T006; T008 parallel with T009 once T006 exists
- T017 / T019 parallel within US3
- T023 / T024 / T026 parallel in Polish after tests green

### Parallel example (after Foundational)

```bash
# Parallel test files once parser exists:
# - teach-013-quick-paste-parse.test.ts (T007/T013/T019/T020)
# - teach-013-quick-paste-save.test.ts (T008)
# Then sequentially: T009 action → T010 dialog → T011 wire → T012 close/toast
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Phase 1–2 (Spekit + `import-text.ts`)
2. Complete Phase 3 (action + dialog + button + save tests)
3. **STOP and validate**: paste → save ≥1 question with option-text correct answer
4. Demo on `/teacher/quizzes/[id]`

### Incremental delivery

1. Setup + Foundational → parser Vitest green
2. US1 → MVP usable
3. US2 → safe mixed pastes
4. US3 → copy example
5. US4 → asterisk / `الجواب:` lock
6. Polish → registry + build + TEACH-004 regression

### Suggested MVP scope

**Phases 1–3 only** (T001–T012) for first shippable paste import.

---

## Task Summary

| Story | Tasks | Count |
|-------|-------|-------|
| Setup | T001–T003 | 3 |
| Foundational | T004–T007 | 4 |
| US1 (MVP) | T008–T012 | 5 |
| US2 | T013–T016 | 4 |
| US3 | T017–T019 | 3 |
| US4 | T020–T022 | 3 |
| Polish | T023–T026 | 4 |
| **Total** | T001–T026 | **26** |

**Format validation**: All tasks use `- [ ]`, Task ID, optional `[P]` / `[USn]`, and file paths.

**Suggested next**: `/speckit-implement`
