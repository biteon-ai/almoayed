---
description: "Task list for TEACH-004 import instruction template UI"
---

# Tasks: TEACH-004 Import Instruction Template

**Input**: Design documents from `specs/003-import-instruction-template/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`  
**Tests**: Included per plan Phase 2 outline (Vitest parser + template round-trip) — extend existing suite, not TDD-first.

**Organization**: Tasks grouped by user story; US2 (Excel guide) precedes US1 integration because `ImportFormatTabs` composes both tab panels.

**Status**: ✅ Completed 2026-07-14

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm design artifacts and teacher import environment before implementation

- [x] T001 Review acceptance criteria in `specs/003-import-instruction-template/spec.md` and UI contracts in `specs/003-import-instruction-template/contracts/ui-components.md`
- [x] T002 [P] Confirm dev server and demo teacher login work per `.speckit/spec.yaml` → `demo_accounts` (WhatsApp `963912345678`)
- [x] T003 [P] Read implementation map in `specs/003-import-instruction-template/plan.md` and parser alias decisions in `specs/003-import-instruction-template/research.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared lib helpers, parser extension, spekit registry, and tests — blocks all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add `IMPORT_COLUMN_DEFINITIONS`, sample row constant, and `downloadSampleImportXlsx()` in `src/lib/import-template.ts` per `specs/003-import-instruction-template/data-model.md`
- [x] T005 Extend `parseWordLikeText` in `src/lib/import-questions.ts` to accept `الشرح:` / `التصنيف:` alongside legacy `شرح:` / `قسم:` (shared prefix helper)
- [x] T006 [P] Add Vitest cases for canonical + legacy text labels and template header round-trip in `tests/features/teach-004-import.test.ts`
- [x] T007 [P] Register `importValidationTips: "import-validation-tips"` in `src/lib/spekit-targets.ts` and `.speckit/spekit-targets.yaml` under TEACH-004

**Checkpoint**: Foundation ready — template download helper exists; parser accepts new aliases; tests green for parser changes

---

## Phase 3: User Story 2 — Sample Excel template download (Priority: P1)

**Goal**: Excel/CSV tab shows column mapping table and downloads a valid starter `.xlsx` with parser headers + one sample Arabic MCQ row.

**Independent Test**: Click «تحميل نموذج Excel» → `almoayed-import-template.xlsx` saves; upload unchanged file → `importQuestions` succeeds with 1 row.

### Implementation for User Story 2

- [x] T008 [P] [US2] Create column table + download button component in `src/components/teacher/import/ImportExcelGuide.tsx` (friendly English labels + muted parser field names; calls `downloadSampleImportXlsx()`)
- [x] T009 [US2] Export `buildSampleImportSheetRows()` from `src/lib/import-template.ts` if needed for unit testing download payload shape without DOM

**Checkpoint**: US2 complete — Excel guide renders standalone; downloaded file parses via `parseXlsxQuestions`

---

## Phase 4: User Story 1 — Format guidance before upload (Priority: P1) 🎯 MVP

**Goal**: Tabbed instruction panel (Excel/CSV default + Word/Text), validation hint, and dropzone ordering above upload; hidden during DOCX preview.

**Independent Test**: Open `/teacher/quizzes/[id]` import card → tabs (Excel default), validation hint with `data-spekit="import-validation-tips"`, then dropzone; Word tab shows TXT block + DOCX callout; DOCX upload still opens staging preview.

### Implementation for User Story 1

- [x] T010 [P] [US1] Create plain-text format block + DOCX callout in `src/components/teacher/import/ImportWordGuide.tsx` per `specs/003-import-instruction-template/contracts/ui-components.md`
- [x] T011 [P] [US1] Create persistent Arabic bullet hint in `src/components/teacher/import/ImportValidationTips.tsx` with `data-spekit={SPEKIT.importValidationTips}`
- [x] T012 [US1] Create tab shell in `src/components/teacher/import/ImportFormatTabs.tsx` using `src/components/ui/tabs.tsx` (`defaultValue="excel"`; mounts `ImportExcelGuide` + `ImportWordGuide`)
- [x] T013 [US1] Compose `ImportFormatTabs` → `ImportValidationTips` → `FileUploadZone` in `src/components/teacher/BulkQuestionUpload.tsx`; keep instruction UI hidden when DOCX preview is active

**Checkpoint**: US1 complete — full instruction panel live; existing CSV/XLSX/TXT/DOCX import flows unchanged

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Registry sync, manual QA, and quality gates

- [x] T014 [P] Update TEACH-004 acceptance criteria and spekit list in `.speckit/spec.yaml` (import instruction template + `import-validation-tips`)
- [x] T015 Run manual verification steps in `specs/003-import-instruction-template/quickstart.md`
- [x] T016 Run `npm run lint && npm run typecheck && npm run test`
- [x] T017 [P] Verify mobile viewport 390×844 — tabs, table scroll, hint + dropzone visible without overlap on `/teacher/quizzes/[id]`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **User Story 2 (Phase 3)**: Depends on Foundational (T004, T007) — builds Excel guide
- **User Story 1 (Phase 4)**: Depends on Phase 3 (T008) for `ImportExcelGuide` inside tabs + Foundational
- **Polish (Phase 5)**: Depends on Phases 3–4 complete

### User Story Dependencies

- **User Story 2 (P1)**: Excel guide — independent after Foundational
- **User Story 1 (P1)**: Tab shell + Word guide + validation + integration — requires US2 Excel guide component

### Within Each User Story

- Lib/parser (Foundational) before UI components
- Standalone guide components before `ImportFormatTabs` composition
- `ImportFormatTabs` before `BulkQuestionUpload` integration

### Parallel Opportunities

- **Phase 1**: T002 ∥ T003
- **Phase 2**: T006 ∥ T007 (after T004–T005)
- **Phase 3**: T008 standalone; T009 optional after T004
- **Phase 4**: T010 ∥ T011 (after Phase 3 T008); T012 after T010–T011 + T008
- **Phase 5**: T014 ∥ T017 after T016

---

## Parallel Example: User Story 1

```bash
# After US2 Excel guide exists, build Word guide and validation hint in parallel:
Task T010: "Create ImportWordGuide.tsx"
Task T011: "Create ImportValidationTips.tsx"

# Then integrate:
Task T012: "Create ImportFormatTabs.tsx"
Task T013: "Wire into BulkQuestionUpload.tsx"
```

---

## Parallel Example: Foundational

```bash
# After parser + template lib land:
Task T006: "Vitest alias + template tests in teach-004-import.test.ts"
Task T007: "Spekit importValidationTips registration"
```

---

## Implementation Strategy

### MVP First (User Stories 2 + 1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**CRITICAL**)
3. Complete Phase 3: User Story 2 (Excel download)
4. Complete Phase 4: User Story 1 (full instruction panel)
5. **STOP and VALIDATE**: Run quickstart.md checklist
6. Complete Phase 5: Polish

### Incremental Delivery

1. Foundational → parser aliases + template lib ready
2. US2 → teachers can download valid Excel template
3. US1 → full tabbed guidance + validation hints above dropzone
4. Polish → spec.yaml sync + quality gates

### Suggested MVP Scope

**Minimum shippable slice**: Phases 1–4 (T001–T013) — delivers both P1 user stories. Phase 5 before merge.

---

## Notes

- No database migrations or Server Action changes required
- Do not modify DOCX staging preview behavior in `DocxImportPreview.tsx`
- `[P]` tasks touch different files with no incomplete dependencies
- Commit after each phase checkpoint

---

## Task Summary

| Phase | Tasks | Story |
|-------|-------|-------|
| Setup | T001–T003 (3) | — |
| Foundational | T004–T007 (4) | — |
| US2 Excel template | T008–T009 (2) | US2 |
| US1 Format guidance | T010–T013 (4) | US1 |
| Polish | T014–T017 (4) | — |
| **Total** | **17 tasks** | |

**Format validation**: All tasks use `- [x]`, sequential IDs T001–T017, `[P]` where parallelizable, `[USn]` on story phases only, explicit file paths included.
