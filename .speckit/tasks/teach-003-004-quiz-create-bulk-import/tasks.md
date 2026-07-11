---
description: "Task list for TEACH-003/004 quiz create + bulk import wizard"
---

# Tasks: TEACH-003/004 Quiz Create + Bulk Import Flow

**Input**: Design documents from `.speckit/tasks/teach-003-004-quiz-create-bulk-import/`  
**Prerequisites**: `plan.md`, `spec.md`, `.speckit/spec.yaml` clarifications (2026-07-12)  
**Tests**: Included — project CI runs Vitest; add feature-mapped unit tests per `.cursor/skills/speckit/SKILL.md` convention.

**Organization**: Tasks grouped by user story for independent verification.

**Status**: ✅ Completed 2026-07-12

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align environment and design docs before verification

- [x] T001 Review clarifications and acceptance criteria in `.speckit/spec.yaml` (TEACH-003, TEACH-004, `clarifications` section)
- [x] T002 [P] Confirm dev server runs and teacher demo login works per `.speckit/spec.yaml` → `demo_accounts.teacher`
- [x] T003 [P] Read implementation map in `.speckit/tasks/teach-003-004-quiz-create-bulk-import/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and server actions used by all user stories

**⚠️ CRITICAL**: Verify these before story-level QA

- [x] T004 Verify `TeacherQuiz` type with `question_count` in `src/types/database.ts`
- [x] T005 Verify `getTeacherQuizzes()` selects `questions(count)` in `src/actions/teacher.ts`
- [x] T006 [P] Verify `createQuiz()` inserts `is_active: false` in `src/actions/teacher.ts`
- [x] T007 [P] Verify `updateQuizFlags()` blocks `is_active: true` when question count is 0 in `src/actions/teacher.ts`
- [x] T008 [P] Verify `importQuestions()` returns `{ imported: number }` and throws on empty parse in `src/actions/teacher.ts`

**Checkpoint**: Server contract stable — user story verification can begin

---

## Phase 3: User Story 1 — Create quiz and durable setup URL (Priority: P1) 🎯 MVP

**Goal**: Teacher creates quiz on `/new` and lands on `/teacher/quizzes/[id]?setup=import` with refresh-safe URL.

**Independent Test**: Submit new quiz form → URL is `/teacher/quizzes/[uuid]?setup=import`; refresh preserves setup banner.

### Implementation Verification for User Story 1

- [x] T009 [US1] Verify `QuizCreateWizard` redirects via `router.push(\`/teacher/quizzes/${id}?setup=import\`)` in `src/components/teacher/QuizCreateWizard.tsx`
- [x] T010 [US1] Verify `/teacher/quizzes/new` mounts `QuizCreateWizard` in `src/app/teacher/quizzes/new/page.tsx`
- [x] T011 [US1] Verify create form removed `is_active` checkbox and shows inactive helper text in `src/components/teacher/QuizCreateForm.tsx`
- [x] T012 [US1] Verify `EditQuizBulkImportSection` renders setup banner when `?setup=import` in `src/components/teacher/EditQuizBulkImportSection.tsx`

**Checkpoint**: US1 create → durable setup URL flow works end-to-end

---

## Phase 4: User Story 2 — Bulk import with feedback (Priority: P1)

**Goal**: Teacher imports questions on edit page; success toast shows count; skip clears setup; re-import appends.

**Independent Test**: Import CSV on setup page → `?imported=N` + toast; skip removes `?setup=import`; second import adds rows.

### Tests for User Story 2

- [x] T013 [P] [US2] Extend parser coverage if gaps found in `tests/features/teach-004-import.test.ts`
- [x] T014 [P] [US2] Add unit test for append semantics documentation comment or integration stub in `tests/features/teach-004-import.test.ts` (verify `importRowsToQuestionInserts` preserves order for multi-batch scenario)

### Implementation Verification for User Story 2

- [x] T015 [US2] Verify `BulkQuestionUpload` calls `importQuestions(quizId, formData)` and invokes `onSuccess(result.imported)` in `src/components/teacher/BulkQuestionUpload.tsx`
- [x] T016 [US2] Verify edit page uses `EditQuizBulkImportSection` (not duplicate server form) in `src/app/teacher/quizzes/[id]/page.tsx`
- [x] T017 [US2] Verify `handleSuccess` sets `?imported=N` and calls `router.refresh()` in `src/components/teacher/EditQuizBulkImportSection.tsx`
- [x] T018 [US2] Verify skip calls `router.replace` without query in `src/components/teacher/EditQuizBulkImportSection.tsx`
- [x] T019 [US2] Verify `EditQuizImportToast` reads `imported` param and dismiss clears query in `src/components/teacher/EditQuizImportToast.tsx`
- [x] T020 [P] [US2] Manual QA — import valid CSV during setup; confirm toast count matches questions list length on edit page

---

## Phase 5: User Story 3 — Inactive until questions exist (Priority: P2)

**Goal**: Quizzes cannot go active with zero questions; no post-import activation nudge on edit page.

**Independent Test**: New quiz shows مخفي on list; تفعيل disabled until ≥1 question; after import, activation succeeds from list only.

### Tests for User Story 3

- [x] T021 [P] [US3] Add Vitest for activation guard logic — extract or mock `updateQuizFlags` zero-question branch in `tests/features/teach-003-quiz-flags.test.ts`
- [x] T022 [P] [US3] Add Vitest asserting `createQuiz` payload forces inactive (mock Supabase insert) in `tests/features/teach-003-quiz-flags.test.ts`

### Implementation Verification for User Story 3

- [x] T023 [US3] Verify `QuizListItem` disables تفعيل when `question_count === 0` in `src/components/teacher/QuizListItem.tsx`
- [x] T024 [US3] Verify `QuizListItem` surfaces server error from `updateQuizFlags` in `src/components/teacher/QuizListItem.tsx`
- [x] T025 [US3] Confirm edit page has no activation CTA after import (toast only) in `src/components/teacher/EditQuizImportToast.tsx` and `src/components/teacher/EditQuizBulkImportSection.tsx`
- [x] T026 [US3] Manual QA — create quiz, skip import, confirm تفعيل blocked; add one question, confirm تفعيل works

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Registry sync, CI, and optional E2E

- [x] T027 [P] Update `teacher-quiz-create-flags` description in `.speckit/spekit-targets.yaml` (no active checkbox; inactive-until-questions note)
- [x] T028 [P] Add `data-spekit` hook for setup banner if missing in `src/components/teacher/EditQuizBulkImportSection.tsx` and register in `src/lib/spekit-targets.ts`
- [x] T029 Run `npm run lint && npm run typecheck && npm run test` from repo root
- [x] T030 [P] Optional Playwright smoke — teacher creates quiz and sees setup banner in `e2e/teach-003-quiz-create.spec.ts`
- [x] T031 Audit `.speckit/spec.yaml` file lists match actual touched files for TEACH-003 and TEACH-004

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → no deps
- **Phase 2** → after Phase 1; **blocks** Phases 3–5
- **Phases 3–5** → after Phase 2; US1 and US2 can run in parallel; US3 after US2 data exists (or parallel with mocked tests)
- **Phase 6** → after Phases 3–5 acceptance paths verified

### User Story Dependencies

| Story | Depends on | Can parallel with |
|-------|------------|-------------------|
| US1 (P1) | Phase 2 | US2 verification (different files) |
| US2 (P1) | Phase 2, US1 redirect | US3 tests (different test file) |
| US3 (P2) | Phase 2; manual QA needs US2 import | US1 verification |

### Within Each User Story

- Tests (T021–T022) before or alongside verification tasks
- Server actions (Phase 2) before UI manual QA
- Manual QA (T020, T026) after component verification tasks

---

## Parallel Execution Examples

### User Story 1 (after Phase 2)

```bash
# Parallel verification (different files):
T009  src/components/teacher/QuizCreateWizard.tsx
T010  src/app/teacher/quizzes/new/page.tsx
T011  src/components/teacher/QuizCreateForm.tsx
T012  src/components/teacher/EditQuizBulkImportSection.tsx
```

### User Story 2 (after Phase 2)

```bash
# Parallel:
T013  tests/features/teach-004-import.test.ts
T015  src/components/teacher/BulkQuestionUpload.tsx
T019  src/components/teacher/EditQuizImportToast.tsx
T020  manual QA
```

### User Story 3 (after Phase 2)

```bash
# Parallel:
T021  tests/features/teach-003-quiz-flags.test.ts
T023  src/components/teacher/QuizListItem.tsx
T025  toast/section review
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 1–2 (setup + server contract verification)
2. Complete Phase 3 (US1 redirect flow)
3. Complete Phase 4 (US2 import + toast)
4. **STOP and VALIDATE** with manual QA (T020)
5. Ship/demo create → import flow

### Incremental Delivery

1. Foundation verified → US1 redirect (MVP slice A)
2. Add US2 import + toast (MVP slice B — full teacher onboarding)
3. Add US3 activation guard + tests (production hardening)
4. Phase 6 polish (Spekit, E2E, CI)

### Suggested MVP Scope

**Phases 1–4 through T020** — teacher can create a quiz, land on durable setup URL, import questions, and see success feedback.

---

## Notes

- Core implementation is **already merged in working tree**; most tasks are verify/test/polish unless gaps found during QA.
- Feature branch workflow: run `/speckit-specify` on branch `00N-teach-quiz-create-bulk-import` to align with `.specify/scripts/bash/setup-tasks.sh`.
- Re-import always appends per clarification — do not add duplicate blocking without new spec.
