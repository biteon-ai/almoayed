---
description: "Task list for TEACH-014 Structured LMS Quiz Text Import"
---

# Tasks: Structured LMS Quiz Text Import (TEACH-014)

**Input**: Design documents from `/specs/023-lms-quiz-text-import/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — plan + SC-003 / SC-004 require Vitest for LMS parse, settings mapping, mixed paste, and LaTeX retention.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js app: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Spekit + registry scaffolding for TEACH-014

- [x] T001 [P] Add `quickTextPasteSettings` to `SPEKIT` in `src/lib/spekit-targets.ts` (`quick-text-paste-settings`)
- [x] T002 [P] Register `quick-text-paste-settings` under TEACH-014 in `.speckit/spekit-targets.yaml`
- [x] T003 [P] Add draft `TEACH-014` feature entry (status planned/partial) in `.speckit/spec.yaml` linking files from `specs/023-lms-quiz-text-import/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Document parser surface — settings header extraction, `Qn:` splitter, LMS vs Arabic detection — shared by all stories

**⚠️ CRITICAL**: No user story UI/action work until this phase is complete

- [x] T004 Extend `splitQuickPasteBlocks` in `src/lib/import-text.ts` so a line matching `/^Q\d+:/i` starts a new block even without a blank line (alongside existing `(n)` / blank-line rules)
- [x] T005 Implement settings header extraction + `ParsedQuizSettings` types and mappers (`mapLmsQuizType`, attempts, timer/duration with FR-009a) in `src/lib/import-text.ts`
- [x] T006 Implement LMS block parse/validate (exactly 4 choices A–D, `Answer:` → option text, optional `Explanation:`, `format: 'lms'`) and wire `parseQuickPasteDocument` returning `{ settings, drafts }` in `src/lib/import-text.ts`; keep `parseQuickPasteText` as drafts-only wrapper
- [x] T007 [P] Add `LMS_QUICK_PASTE_SAMPLE` (settings + two `Qn:` questions) export in `src/lib/import-text.ts` for copy-example UI
- [x] T008 [P] Add `[TEACH-014]` parser tests for `Qn:` split, four choices, Answer→option text, LaTeX retention in `tests/features/teach-014-lms-parse.test.ts`

**Checkpoint**: Foundation ready — US1–US4 can proceed

---

## Phase 3: User Story 1 — Paste LMS-formatted questions and save (Priority: P1) 🎯 MVP

**Goal**: Paste `Q1:` / `A)`–`D)` / `Answer:` text, preview valid items, save appends questions with option-text correct answers.

**Independent Test**: «لصق نصي سريع» → paste two LMS questions → preview 2 valid → save → questions on quiz with correct option text.

### Tests for User Story 1

- [x] T009 [P] [US1] Extend `tests/features/teach-014-lms-parse.test.ts` (or save-shape file) asserting `toImportRowsFromValidDrafts` yields four options and `correct_answer` as option text for LMS drafts

### Implementation for User Story 1

- [x] T010 [US1] Update `importQuickPasteQuestions` in `src/actions/teacher.ts` to use `parseQuickPasteDocument` (drafts path) while preserving append/cap/Arabic-error behavior for zero valid
- [x] T011 [US1] Update `QuickTextPasteDialog.tsx` to preview via `parseQuickPasteDocument(...).drafts` so LMS blocks appear correctly in the live list
- [x] T012 [US1] Confirm save still closes on `imported ≥ 1`, toasts counts, and refreshes in `src/components/teacher/QuickTextPasteDialog.tsx`

**Checkpoint**: MVP — English LMS question paste → save works end-to-end

---

## Phase 4: User Story 2 — Apply optional Quiz Settings header (Priority: P1)

**Goal**: Settings header previewed in dialog; valid fields applied via `updateQuizFlags` on same confirm-save when ≥1 question imported; invalid fields skipped with Arabic warnings.

**Independent Test**: Paste settings + questions → see settings card → save → quiz type/attempts/timer match valid header fields; bad duration does not enable timer.

### Tests for User Story 2

- [x] T013 [P] [US2] Add `[TEACH-014]` settings mapping tests (type map, Unlimited→0, timer No, timer Yes without duration skips timer) in `tests/features/teach-014-lms-settings.test.ts`

### Implementation for User Story 2

- [x] T014 [US2] Build `settingsApplied` / `settingsSkipped` from `ParsedQuizSettings` and call `updateQuizFlags` with only valid fields after successful import in `src/actions/teacher.ts` `importQuickPasteQuestions`
- [x] T015 [US2] Render Arabic settings preview card (type, attempts, timer, duration + field warnings) with Spekit `quick-text-paste-settings` in `src/components/teacher/QuickTextPasteDialog.tsx`
- [x] T016 [US2] Include settings applied/skipped summary in success toast when a header was present in `src/components/teacher/QuickTextPasteDialog.tsx`
- [x] T017 [US2] Ensure zero valid questions never calls settings update in `src/actions/teacher.ts`

**Checkpoint**: Settings preview + per-field apply works with question import

---

## Phase 5: User Story 3 — Live validation for LMS markers (Priority: P2)

**Goal**: Incomplete LMS blocks show Arabic reasons; save imports valid subset only.

**Independent Test**: Valid `Q1` + `Q2` missing `Answer:` → second invalid → save imports one.

### Tests for User Story 3

- [x] T018 [P] [US3] Add LMS invalid-block cases (&lt;4 choices, missing Answer, bad letter) with Arabic `error_reason` in `tests/features/teach-014-lms-parse.test.ts`

### Implementation for User Story 3

- [x] T019 [US3] Ensure LMS drafts use four-choice validation messages distinct from Arabic ≥2-option messages in `src/lib/import-text.ts`
- [x] T020 [US3] Show optional `LMS` / `عربي` format badge on preview rows in `src/components/teacher/QuickTextPasteDialog.tsx`

**Checkpoint**: LMS validation UX clear for incomplete AI output

---

## Phase 6: User Story 4 — LaTeX and bilingual markers (Priority: P2)

**Goal**: LaTeX preserved; Arabic TEACH-013 and LMS coexist in one paste; copy LMS sample available.

**Independent Test**: Mixed paste + `$x^2$` stem; TEACH-013 regression green; «نسخ نموذج LMS» works.

### Tests for User Story 4

- [x] T021 [P] [US4] Add mixed LMS+Arabic paste and LaTeX retention assertions in `tests/features/teach-014-lms-parse.test.ts`
- [x] T022 [P] [US4] Run/keep green `tests/features/teach-013-quick-paste-parse.test.ts` and `teach-013-quick-paste-save.test.ts` after parser changes

### Implementation for User Story 4

- [x] T023 [US4] Confirm per-block auto-detect does not break Arabic `(n)` / `*ب)` / `الجواب:` paths in `src/lib/import-text.ts`
- [x] T024 [US4] Add «نسخ نموذج LMS» control using `LMS_QUICK_PASTE_SAMPLE` in `src/components/teacher/QuickTextPasteDialog.tsx` (keep existing Arabic copy control)

**Checkpoint**: Bilingual paste + LaTeX + LMS sample copy complete

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Registry, build, quickstart alignment

- [x] T025 [P] Mark `TEACH-014` implemented in `.speckit/spec.yaml` with acceptance notes, routes, and file paths; add `TEACH-014` to `AGENTS.md` / `.cursor/rules/almoayed-speckit.mdc` implemented lists
- [x] T026 Run `npx vitest run tests/features/teach-014-lms-parse.test.ts tests/features/teach-014-lms-settings.test.ts tests/features/teach-013-quick-paste-parse.test.ts tests/features/teach-013-quick-paste-save.test.ts` and `npm run build`
- [x] T027 [P] Walk `specs/023-lms-quiz-text-import/quickstart.md` manual QA checklist; fix copy/UX gaps in `QuickTextPasteDialog.tsx` only if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** → no blockers
- **Phase 2 (Foundational)** → after Setup; **blocks all stories**
- **Phase 3 (US1)** → after Foundational — **MVP**
- **Phase 4 (US2)** → after US1 action/dialog use `parseQuickPasteDocument`
- **Phase 5 (US3)** → after Foundational LMS validation (UI polish after US1 preview)
- **Phase 6 (US4)** → after Foundational; can parallel with US3
- **Phase 7 (Polish)** → after desired stories

### User Story Dependencies

- **US1**: Needs T004–T006; delivers LMS paste MVP
- **US2**: Needs US1 save path + T005 settings types
- **US3**: Mostly parser messages + preview badges
- **US4**: Mixed detect + LMS sample copy + TEACH-013 regression

### Parallel Opportunities

- T001–T003 in parallel
- T007–T008 after T004–T006
- T013 parallel with T014 once T005 done
- T021–T022 parallel in US4
- T025 / T027 parallel after tests green

### Parallel example (after Foundational)

```text
# Parallel:
# - teach-014-lms-parse.test.ts (T008/T018/T021)
# - teach-014-lms-settings.test.ts (T013)
# Then: T010 action → T011–T012 dialog LMS drafts → T014–T016 settings UI/apply
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Phase 1–2 (Spekit + `parseQuickPasteDocument` LMS questions)
2. Complete Phase 3 (action + dialog drafts)
3. **STOP and validate**: English LMS paste → save ≥1 question
4. Then add US2 settings (highest remaining P1)

### Incremental delivery

1. Setup + Foundational → LMS parse Vitest green  
2. US1 → MVP question import  
3. US2 → settings preview + apply  
4. US3 → validation polish  
5. US4 → mixed + LaTeX + LMS sample  
6. Polish → registry + build  

### Suggested MVP scope

**Phases 1–3** (T001–T012) for first shippable LMS question import; follow immediately with **Phase 4** (T013–T017) for settings header.

---

## Task Summary

| Story | Tasks | Count |
|-------|-------|-------|
| Setup | T001–T003 | 3 |
| Foundational | T004–T008 | 5 |
| US1 (MVP) | T009–T012 | 4 |
| US2 | T013–T017 | 5 |
| US3 | T018–T020 | 3 |
| US4 | T021–T024 | 4 |
| Polish | T025–T027 | 3 |
| **Total** | T001–T027 | **27** |

**Format validation**: All tasks use `- [ ]`, Task ID, optional `[P]` / `[USn]`, and file paths.

**Suggested next**: `/speckit-implement`
