---
description: "Task list for Student Unlink vs Admin Hard Delete (MT-003)"
---

# Tasks: Student Unlink vs Admin Hard Delete

**Input**: Design documents from `specs/017-student-unlink-purge/`  
**Prerequisites**: `plan.md`, `spec.md` (Clarified), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Tests**: Included — plan/quickstart call for Vitest `tests/features/mt-003-student-unlink-purge.test.ts` (contract-style alongside implementation; not full TDD)

**Organization**: US1 (teacher unlink UX) → US2 (admin hard delete) → US3 (teacher no-profile-delete invariant) → US4 (RTL polish). Shared foundation: Spekit + registry stubs. **No new migration.**

**Feature ID**: `MT-003` (extends `TEACH-001` · `ADMIN-001`) — do not break `MT-001`/`MT-002`, `QUIZ-001`, RTL Tajawal, Server Actions, Spekit registry patterns

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US4 maps to spec user stories
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Spekit / registry stubs so teacher and admin stories share discovery ids

- [x] T001 [P] Add Spekit ids `unlink-student-action`, `admin-students-table`, `admin-student-purge-action` to `src/lib/spekit-targets.ts` and `.speckit/spekit-targets.yaml`
- [x] T002 [P] Draft `MT-003` stub entry (status planned/partial) in `.speckit/spec.yaml` with routes `/teacher/students`, `/admin/students` and planned file list per `plan.md`

**Checkpoint**: Spekit + registry stubs ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm existing unlink contract and admin teachers pattern to mirror — MUST complete before story UI/API work

**⚠️ CRITICAL**: No story mutations until teacher unlink semantics and admin mirror targets are confirmed

- [x] T003 Audit `deleteStudentLink` in `src/actions/teacher.ts` against `contracts/admin-students.md` (scoped link + this-teacher group cleanup only; **no** `profiles` delete); document any gap to fix in US1/US3
- [x] T004 [P] Skim admin teachers pattern in `src/lib/admin/teachers.ts`, `src/app/api/admin/teachers/`, `src/components/admin/AdminTeachersTable.tsx`, and `src/app/admin/(portal)/layout.tsx` as the mirror for students list/delete

**Checkpoint**: Foundation ready — US1 can tighten UI; US2 can mirror admin teachers

---

## Phase 3: User Story 1 — Teacher removes a student by unlinking only (Priority: P1) 🎯 MVP

**Goal**: Teacher remove CTA is «إزالة من قائمتك» with account-safe Arabic confirm + Spekit; action only unlinks under active teacher; profile/scores remain.

**Independent Test**: On `/teacher/students`, remove a linked student after confirmation; student disappears from this teacher’s list; profile and past scores remain; other teachers’ links unchanged.

### Tests for User Story 1

- [x] T005 [P] [US1] Scaffold `tests/features/mt-003-student-unlink-purge.test.ts` with teacher unlink contract: asserts `deleteStudentLink` semantics (scoped `student_teachers` delete + group cleanup; no profile delete) matching other feature contract tests

### Implementation for User Story 1

- [x] T006 [US1] Fix any `deleteStudentLink` gaps found in T003 in `src/actions/teacher.ts` (keep MT-002 scope; revalidate `/teacher/students`; never delete `profiles`)
- [x] T007 [P] [US1] Update Arabic copy in `src/components/teacher/DeleteStudentConfirmDialog.tsx` — title «تأكيد الإزالة من قائمتك»; body list-only + account/performance preserved per FR-003
- [x] T008 [P] [US1] Rename primary remove control to «إزالة من قائمتك» and wire Spekit `unlink-student-action` in `src/components/teacher/StudentsTable.tsx` (and card actions if present)
- [x] T009 [US1] Align success toast to «تمت الإزالة من قائمتك.» and confirm cancel leaves roster unchanged in `src/components/teacher/StudentManagement.tsx` (and any handler wiring)

**Checkpoint**: US1 complete — teacher unlink UX + Spekit; profiles intact

---

## Phase 4: User Story 2 — Super Admin hard-delete platform-wide (Priority: P1)

**Goal**: `/admin/students` lists all `STUDENT` profiles (incl. orphans) with search/pagination; two-step AlertDialog purge cascades student rows; refuses non-student roles; audits.

**Independent Test**: In `/admin/students`, locate student → start purge → cancel once (still present) → confirm twice (account gone platform-wide); non-student id refused.

### Tests for User Story 2

- [x] T010 [P] [US2] Extend `tests/features/mt-003-student-unlink-purge.test.ts` with admin purge contracts: `confirm: true` required; refuse non-`STUDENT` roles; list filter includes orphans (`role=STUDENT`)

### Implementation for User Story 2

- [x] T011 [US2] Implement `listStudents` + `hardDeleteStudent` in `src/lib/admin/students.ts` per `contracts/admin-students.md` (`role=STUDENT`, `teacherLinkCount`, page size 20, audit `student.hard_delete` via `writeAdminAuditLog`)
- [x] T012 [P] [US2] Add `GET /api/admin/students` in `src/app/api/admin/students/route.ts` (Super Admin; `q` + `page`; return paged items)
- [x] T013 [P] [US2] Add `DELETE /api/admin/students/[id]` in `src/app/api/admin/students/[id]/route.ts` (body `{ confirm: true }`; Super Admin; Arabic errors for missing/non-student)
- [x] T014 [US2] Create `/admin/students` page in `src/app/admin/(portal)/students/page.tsx` loading/searching via admin students API or lib
- [x] T015 [US2] Add «إدارة الطلاب» nav link in `src/app/admin/(portal)/layout.tsx`
- [x] T016 [US2] Implement `AdminStudentsTable` in `src/components/admin/AdminStudentsTable.tsx` (name, WhatsApp, teacher link count, created, search/pagination, Spekit `admin-students-table`, Arabic empty state)
- [x] T017 [US2] Implement two-step `DeleteStudentPurgeDialog` in `src/components/admin/DeleteStudentPurgeDialog.tsx` (step 1: name + «مرتبط بـ N مدرسين» + warn; step 2: irreversible; Spekit `admin-student-purge-action`; cancel either step = no API call; only then `DELETE` with `confirm: true`)

**Checkpoint**: US2 complete — admin directory + gated hard delete + audit

---

## Phase 5: User Story 3 — Teachers cannot hard-delete profiles (Priority: P1)

**Goal**: Enforce and prove no teacher-reachable path deletes student `profiles`.

**Independent Test**: Teacher remove path never deletes profile/account rows; only relationship (+ this-teacher group membership) is removed.

### Tests for User Story 3

- [x] T018 [P] [US3] Extend `tests/features/mt-003-student-unlink-purge.test.ts` asserting teacher student-remove paths never call/perform `profiles` hard delete (static contract / source invariant matching FR-008)

### Implementation for User Story 3

- [x] T019 [US3] Grep/audit teacher surfaces (`src/actions/teacher.ts`, `src/components/teacher/Student*.tsx`, `DeleteStudentConfirmDialog.tsx`) for any alternate delete that touches `profiles`; remove or redirect to unlink-only
- [x] T020 [US3] Confirm impersonating admin-as-teacher (if present) still cannot purge profiles except via Super Admin `/api/admin/students/[id]` path

**Checkpoint**: US3 complete — FR-008 invariant held

---

## Phase 6: User Story 4 — RTL admin/teacher UX consistency (Priority: P2)

**Goal**: Unlink and purge dialogs are Arabic RTL, touch-friendly, Spekit-complete.

**Independent Test**: Narrow viewport: teacher unlink + admin double-confirm; Arabic copy; RTL layout; touch targets.

### Implementation for User Story 4

- [x] T021 [P] [US4] Audit teacher unlink dialog/controls in `DeleteStudentConfirmDialog.tsx` / `StudentsTable.tsx` for RTL (`dir`/`text-start`), Tajawal shell, touch targets `h-10`–`h-12`
- [x] T022 [P] [US4] Audit admin purge dialog + table actions in `DeleteStudentPurgeDialog.tsx` / `AdminStudentsTable.tsx` for RTL and touch targets
- [x] T023 [US4] Finalize `.speckit/spec.yaml` `MT-003` acceptance + spekit list to match shipped UI; mark status implemented when done

**Checkpoint**: US4 complete — polish + registry accurate

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify gates across stories

- [x] T024 [P] Run `npx vitest run tests/features/mt-003-student-unlink-purge.test.ts`; fix regressions
- [x] T025 [P] Manual QA per `specs/017-student-unlink-purge/quickstart.md` (teacher unlink cancel/confirm; dual-teacher link; admin cancel either step; full purge; non-student refuse)
- [x] T026 Run `npm run build` and fix any type/API errors from admin students surfaces
- [x] T027 Confirm out-of-scope holds: no profile soft-delete; no type-to-confirm; no teacher `profiles` delete; QUIZ-001 exam paths untouched

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** story implementation that assumes patterns
- **US1 (Phase 3)**: After Foundational — **MVP** (teacher safety UX)
- **US2 (Phase 4)**: After Foundational — can proceed in parallel with US1 (different files: admin vs teacher)
- **US3 (Phase 5)**: After US1 action/UI settled (depends on unlink path being final)
- **US4 (Phase 6)**: After US1 + US2 UI exist
- **Polish (Phase 7)**: After all stories

### User Story Dependencies

```text
Setup → Foundational
           ├─► US1 (teacher unlink) ──► US3 (no profile delete) ──┐
           └─► US2 (admin purge) ─────────────────────────────────┼─► US4 → Polish
```

### Parallel Opportunities

- T001 ∥ T002 (setup)
- Within US1: T007 ∥ T008 after T006
- Within US2: T012 ∥ T013 after T011; table/dialog can follow page/nav
- US1 and US2 implementation can run in parallel after Foundational (teacher vs admin trees)
- US4 audits T021 ∥ T022

### Parallel example: User Story 2

```bash
# After T011 (lib):
# Agent A: T012 GET route
# Agent B: T013 DELETE route
# Then: T014–T017 page, nav, table, dialog
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Setup + Foundational  
2. Ship teacher «إزالة من قائمتك» + Spekit + verified unlink-only action  
3. **Stop and validate** Independent Test for US1  

### Incremental delivery

1. MVP = US1  
2. Add US2 = admin purge capability  
3. Add US3 = automated/static invariant  
4. Add US4 + polish = ship-ready MT-003  

### Suggested MVP scope

**US1 only** — locks the teacher safety story immediately; admin hard delete (US2) is the complementary P1 ship item for full MT-003.

---

## Task Summary

| Phase | Story | Task IDs | Count |
|-------|-------|----------|-------|
| Setup | — | T001–T002 | 2 |
| Foundational | — | T003–T004 | 2 |
| US1 | Teacher unlink | T005–T009 | 5 |
| US2 | Admin hard delete | T010–T017 | 8 |
| US3 | No teacher profile delete | T018–T020 | 3 |
| US4 | RTL polish | T021–T023 | 3 |
| Polish | — | T024–T027 | 4 |
| **Total** | | **T001–T027** | **27** |

**Format validation**: All tasks use `- [ ]`, sequential Task IDs, optional `[P]`, story labels only on US phases, and exact file paths in descriptions.
