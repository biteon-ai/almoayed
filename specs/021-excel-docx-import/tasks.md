---
description: "Task list for TEACH-012 Excel & Word quiz import templates"
---

# Tasks: Excel & Word Quiz Import Templates (TEACH-012)

**Input**: Design documents from `/specs/021-excel-docx-import/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included — spec US3 / FR-007 require template-driven automated verification using the same builders as teacher downloads.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js app: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies and Spekit/registry scaffolding for TEACH-012

- [x] T001 Install `docx` package dependency via npm and confirm it appears in `package.json`
- [x] T002 [P] Add `importExcelTemplateDownload` and `importDocxTemplateDownload` to `SPEKIT` in `src/lib/spekit-targets.ts`
- [x] T003 [P] Register the same Spekit selectors under TEACH-012 in `.speckit/spekit-targets.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared sample content and export surface that Excel and Word builders both use

**⚠️ CRITICAL**: No user story work until this phase is complete

- [x] T004 Ensure `SAMPLE_IMPORT_ROW`, `IMPORT_COLUMN_DEFINITIONS`, and `buildSampleImportSheetRows` remain the canonical Excel sample source and are exported for tests from `src/lib/import-template.ts`
- [x] T005 [P] Add draft `TEACH-012` feature entry (status planned/partial) in `.speckit/spec.yaml` linking planned files from `specs/021-excel-docx-import/plan.md`

**Checkpoint**: Foundation ready — US1 and US2 can proceed (in parallel if staffed)

---

## Phase 3: User Story 1 — Import from sample Excel template (Priority: P1) 🎯 MVP

**Goal**: Teacher downloads the official Excel sample, uploads it unchanged, and questions import correctly; Spekit on download CTA.

**Independent Test**: Download `almoayed-import-template.xlsx` from Excel tab → upload to quiz → sample MCQ appears with correct options/answer/category; TXT import still works.

### Tests for User Story 1

> Write tests first where practical; they must fail or be incomplete until hardening is done, then pass.

- [x] T006 [P] [US1] Add `[TEACH-012]` Excel builder→`parseXlsxQuestions` round-trip test asserting `SAMPLE_IMPORT_ROW` field-wise in `tests/features/teach-012-excel-template.test.ts`

### Implementation for User Story 1

- [x] T007 [P] [US1] Wire `data-spekit={SPEKIT.importExcelTemplateDownload}` on the Excel download button in `src/components/teacher/import/ImportExcelGuide.tsx`
- [x] T008 [US1] Harden empty/invalid Excel feedback in `src/lib/import-questions.ts` and/or `src/actions/teacher.ts` `importQuestions` only if T006 reveals gaps (Arabic error, zero inserts; no silent partial rows)
- [x] T009 [US1] Confirm existing CSV/TXT paths in `src/actions/teacher.ts` `importQuestions` remain unchanged (regression: run `tests/features/teach-004-import.test.ts`)

**Checkpoint**: US1 complete — Excel sample download + upload happy path verified by Vitest + manual quickstart Excel steps

---

## Phase 4: User Story 2 — Import from sample Word (.docx) template (Priority: P1)

**Goal**: Word tab downloads a real `.docx` sample (not `.txt`); upload opens staging preview; confirm saves questions.

**Independent Test**: Click «تحميل نموذج Word» → file is `.docx` → upload → preview shows sample stem + four options → confirm → quiz updated; malformed `.docx` shows Arabic error.

### Tests for User Story 2

- [x] T010 [P] [US2] Add `[TEACH-012]` DOCX builder→mammoth→`parseDocxHtmlQuestions`/`sanitizeImportRows` test asserting ≥1 row with four options and sample stem in `tests/features/teach-012-docx-template.test.ts`

### Implementation for User Story 2

- [x] T011 [US2] Implement `buildSampleImportDocxBuffer` and `downloadSampleImportDocx` (dynamic `import("docx")`, filename `almoayed-import-template.docx`, structure `(1)` + a–d options table aligned with `SAMPLE_IMPORT_ROW`) in `src/lib/import-docx-template.ts`
- [x] T012 [US2] Update `src/components/teacher/import/ImportWordGuide.tsx`: primary CTA downloads `.docx` via `downloadSampleImportDocx`; keep TXT `<pre>` format; add optional secondary «تحميل نموذج نصي (.txt)» for plain-text authors
- [x] T013 [US2] Attach `data-spekit={SPEKIT.importDocxTemplateDownload}` to the primary Word download button in `src/components/teacher/import/ImportWordGuide.tsx`
- [x] T014 [US2] If T010 fails due to HTML shape, make minimal parser or builder adjustments in `src/lib/parse-docx-questions.ts` and/or `src/lib/import-docx-template.ts` (no new DOCX grammar beyond what sample needs)
- [x] T015 [US2] Verify DOCX upload still uses existing staging flow in `src/components/teacher/BulkQuestionUpload.tsx` / `src/actions/parse-docx.ts` with no signature break; empty parse still shows Arabic error and no inserts

**Checkpoint**: US1 and US2 both independently testable — Excel and Word official samples work end-to-end

---

## Phase 5: User Story 3 — Template-driven verification (Priority: P2)

**Goal**: Automated checks lock the contract between downloadable samples and parsers; failures clearly indicate template/expectation mismatch.

**Independent Test**: `npx vitest run tests/features/teach-012-excel-template.test.ts tests/features/teach-012-docx-template.test.ts` passes; breaking sample content fails with clear assertion messages.

### Tests / verification for User Story 3

- [x] T016 [P] [US3] Strengthen assertion messages in `tests/features/teach-012-excel-template.test.ts` so header or sample-row drift fails with explicit expected vs actual field names
- [x] T017 [P] [US3] Strengthen assertion messages in `tests/features/teach-012-docx-template.test.ts` so missing options/stem fail with explicit diagnostics
- [x] T018 [US3] Run TEACH-004 regression suite `tests/features/teach-004-import.test.ts` and `tests/features/teach-004-docx-parse.test.ts` and fix any breakage from US2 builder/parser tweaks

**Checkpoint**: Template-driven verification green; TXT/DOCX HTML fixtures still pass

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Registry, build, and quickstart validation

- [x] T019 [P] Finalize `TEACH-012` acceptance criteria, files, and spekit list in `.speckit/spec.yaml` (status implemented when done)
- [x] T020 [P] Sync Spekit count/notes in `.speckit/spekit-targets.yaml` if required by project conventions
- [x] T021 Run `npm run build` and fix any type/import errors from `docx` or new modules
- [x] T022 Execute manual steps in `specs/021-excel-docx-import/quickstart.md` (Excel + Word + TXT regression) and note any copy tweaks needed in guides

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks** all user stories
- **US1 (Phase 3)**: After Foundational — **MVP**; no dependency on US2/US3
- **US2 (Phase 4)**: After Foundational — needs `docx` from T001; independent of US1 UI
- **US3 (Phase 5)**: After US1 test file (T006) and US2 test file (T010) exist; ideally after US1+US2 implementation
- **Polish (Phase 6)**: After desired stories complete

### User Story Dependencies

| Story | Depends on | Notes |
|-------|------------|-------|
| US1 Excel | Phase 2 | MVP; can ship alone |
| US2 Word | Phase 1 T001 + Phase 2 | Parallel with US1 after foundation |
| US3 Verification | T006 + T010 (+ preferably T011–T014) | Locks both templates |

### Parallel Opportunities

- T002 ∥ T003 (Spekit TS + YAML)
- T006 ∥ T007 (Excel test vs Spekit button) after Phase 2
- T016 ∥ T017 (assertion polish on different test files)
- T019 ∥ T020 (registry files)
- After Phase 2: Developer A on US1, Developer B on US2 (`import-docx-template.ts` vs Excel guide/tests)

---

## Parallel Example: User Story 1

```bash
# After Phase 2:
Task: "T006 Add teach-012-excel-template.test.ts round-trip"
Task: "T007 Wire Spekit on ImportExcelGuide download button"
# Then sequentially:
Task: "T008 Harden Excel errors only if T006 fails"
Task: "T009 Run teach-004-import.test.ts regression"
```

## Parallel Example: User Story 2

```bash
# After T001 + Phase 2:
Task: "T011 Implement import-docx-template.ts builders"
# Then:
Task: "T010 Write teach-012-docx-template.test.ts (may fail until T011/T014)"
Task: "T012–T013 Update ImportWordGuide + Spekit"
Task: "T014–T015 Parser/staging verify"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1–2  
2. Complete Phase 3 (US1)  
3. **STOP and VALIDATE** Excel quickstart + `teach-012-excel-template.test.ts`  
4. Demo Excel sample import

### Incremental Delivery

1. Setup + Foundational → ready  
2. US1 Excel → MVP demo  
3. US2 Word `.docx` sample → full P1  
4. US3 assertion polish + TEACH-004 green  
5. Polish: `spec.yaml`, `npm run build`, quickstart QA  

### Suggested MVP scope

**US1 only** (T001 optional for MVP if Word deferred; Spekit T002/T003 can be Excel-only initially). Full P1 value requires US2 as well.

---

## Notes

- [P] = different files, no incomplete-task dependency  
- Do not commit binary fixtures if builders are deterministic  
- Keep append-only import; no Google Docs / PDF  
- Feature ID in tests: `[TEACH-012]`  
- Commit after each task or logical group when asked  
