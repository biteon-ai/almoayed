---
description: "Task list for Teacher Student Management Hub (TEACH-001 evolve)"
---

# Tasks: Teacher Student Management Hub

**Input**: Design documents from `specs/006-student-management-hub/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Tests**: Included per plan/quickstart (Vitest feature suite + light e2e) — extend `tests/features/` patterns; not strict TDD-first.

**Organization**: Stories ordered MVP-first — US1 (browse/search/filter/pagination) → US2 (manual add) → US3 (status/Pro/group) → US4 (edit) → US5 (unlink). US1 and US3 both edit `StudentManagement.tsx`; finish US1 shell before stacking US3 actions carefully.

**Feature IDs**: TEACH-001 (evolve), TEACH-002 (group clear), TIER-002 (preserve), MT-002, ENABLE-001

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US5 maps to spec user stories
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Spekit hooks and shared types before hub behavior changes

- [x] T001 [P] Register optional Spekit targets `addStudentButton`, `addStudentDialog`, `studentSearch`, `studentPagination` in `src/lib/spekit-targets.ts` and `.speckit/spekit-targets.yaml` (preserve existing TEACH-001/002 IDs)
- [x] T002 [P] Add shared `ActionResult` type (or equivalent) for teacher student mutations in `src/types/database.ts` or `src/actions/teacher.ts` per `specs/006-student-management-hub/contracts/server-actions.md`
- [x] T003 [P] Add pure helper `paginateStudents(rows, page, pageSize = 8)` in `src/lib/paginate-students.ts` for client/unit reuse

**Checkpoint**: Spekit IDs registered; ActionResult + paginate helper compile

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Dialog primitive, group replace/clear actions, enriched student rows — MUST complete before story UI

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add controlled `Dialog` primitive in `src/components/ui/dialog.tsx` mirroring `src/components/ui/alert-dialog.tsx` patterns (`open` / `onOpenChange`, RTL-friendly content)
- [x] T005 Implement `setStudentGroup({ studentId, groupId: string | null })` in `src/actions/teacher.ts` with replace-semantics (clear all of this teacher’s memberships, then insert if `groupId` set) per `specs/006-student-management-hub/research.md`
- [x] T006 Update `getTeacherStudents` mapping in `src/actions/teacher.ts` to expose singular `groupId: string | null` (and keep `groupNames`) on `TeacherStudentRow` in `src/types/database.ts`
- [x] T007 [P] Add ephemeral success toast/live-region helper or small component usable by the hub (e.g. `src/components/teacher/HubToast.tsx` or inline pattern) — Arabic `role="status"`, no new npm toast library
- [x] T008 Wire `StudentGroupSelect` in `src/components/teacher/StudentGroupSelect.tsx` to support «بدون مجموعة» (`value=""` / null) calling `setStudentGroup` clear path

**Checkpoint**: Foundation ready — Dialog exists; group set/clear + row `groupId` work; toast pattern ready; stories can proceed

---

## Phase 3: User Story 1 — Browse and find students quickly (Priority: P1) 🎯 MVP

**Goal**: Teachers search/filter the roster and paginate at 8 per page with RTL controls and clear empty states.

**Independent Test**: With &gt;8 students, search + tier/status/group filters update the list; «الصفحة X من Y» / السابق/التالي work; zero matches show «لا يوجد طلاب يطابقون خيارات البحث».

### Implementation for User Story 1

- [x] T009 [US1] Refactor `src/components/teacher/StudentManagement.tsx` header to «إدارة الطلاب» + layout shell for search/filters/list/pagination (keep create-group block; defer Add CTA wiring to US2 if needed as disabled/placeholder)
- [x] T010 [US1] Add real-time search input in `src/components/teacher/StudentManagement.tsx` filtering by name or WhatsApp (`data-spekit` studentSearch); reset page to 1 on change
- [x] T011 [US1] Keep/enhance tier + status filter pills and add study-group filter in `src/components/teacher/StudentManagement.tsx` (`SPEKIT.studentFilters`); reset page to 1 on change
- [x] T012 [US1] Apply client pagination (page size 8) via `paginateStudents` in `src/components/teacher/StudentManagement.tsx` with «الصفحة X من Y», «السابق», «التالي», and empty-filter vs empty-roster Arabic messages (`SPEKIT.studentPagination`)
- [x] T013 [P] [US1] Add Vitest cases for filter + `paginateStudents` edge cases in `tests/features/teach-001-students-hub.test.ts`

**Checkpoint**: US1 complete — browse/search/filter/pagination usable on `/teacher/students`

---

## Phase 4: User Story 2 — Add a student manually (Priority: P1)

**Goal**: Teacher creates/links a student by name + WhatsApp (default مجاني / نشط) with success toast.

**Independent Test**: Open Add → submit valid fields → student on roster as free/active; duplicate link shows Arabic error; invalid fields blocked.

### Implementation for User Story 2

- [x] T014 [US2] Implement `createStudentManually({ fullName, whatsappNumber })` in `src/actions/teacher.ts` (normalize WhatsApp, create profile if needed, insert `student_teachers` active/free, MT-002 scope, `revalidatePath`)
- [x] T015 [P] [US2] Build `AddStudentDialog` in `src/components/teacher/AddStudentDialog.tsx` using `src/components/ui/dialog.tsx` (fields اسم الطالب / رقم الواتساب, `h-10`+ controls, Spekit `addStudentDialog`)
- [x] T016 [US2] Wire «إضافة طالب جديد» CTA + dialog + HubToast success/error in `src/components/teacher/StudentManagement.tsx` and refresh local list / `router.refresh()` after success
- [x] T017 [P] [US2] Add Vitest cases for create success defaults, duplicate link error, and WhatsApp normalization expectations in `tests/features/teach-001-students-hub.test.ts`

**Checkpoint**: US2 complete — manual add works end-to-end

---

## Phase 5: User Story 3 — Manage status, tier, and study group inline (Priority: P1)

**Goal**: Activate/deactivate (confirm on deactivate), Pro approve/revoke (no confirm), and group assign/clear from each card.

**Independent Test**: Deactivate shows AlertDialog then معطل; activate → نشط without heavy confirm; Pro toggle updates badge + toast; group select + بدون مجموعة persist.

### Implementation for User Story 3

- [x] T018 [US3] Add `toggleStudentStatus(linkId, "active" | "deactivated")` wrapper (or harden `updateStudentStatus` callers) in `src/actions/teacher.ts` rejecting `pending` writes; return `ActionResult` where practical
- [x] T019 [US3] Add deactivate `AlertDialog` flow in `src/components/teacher/StudentManagement.tsx` (exam-lock copy) before calling deactivate; activate remains one-click; preserve Spekit activate/deactivate buttons
- [x] T020 [US3] Wire Pro approve (`pro`) and revoke (`free`) with success toast only (no AlertDialog) in `src/components/teacher/StudentManagement.tsx` using existing tier actions; preserve `SPEKIT.studentManualProUpgrade`
- [x] T021 [US3] Ensure each card uses updated `StudentGroupSelect` (T008) with singular `groupId` binding and badge refresh in `src/components/teacher/StudentManagement.tsx`
- [x] T022 [P] [US3] Extend Vitest coverage for status transition rules (no set-to-pending) and group replace/clear helper behavior in `tests/features/teach-001-students-hub.test.ts`

**Checkpoint**: US3 complete — inline management matches clarifications

---

## Phase 6: User Story 4 — Edit student details (Priority: P2)

**Goal**: Edit name + group; WhatsApp read-only; success toast.

**Independent Test**: Edit modal shows read-only WhatsApp; save updates name/group; invalid name blocked.

### Implementation for User Story 4

- [x] T023 [US4] Implement `updateStudentInfo({ linkId, fullName, groupId })` in `src/actions/teacher.ts` (ownership check; update `profiles.full_name` only; call `setStudentGroup`; never change WhatsApp)
- [x] T024 [P] [US4] Build `EditStudentDialog` in `src/components/teacher/EditStudentDialog.tsx` (editable name + group, read-only WhatsApp)
- [x] T025 [US4] Wire «تعديل» on each card to `EditStudentDialog` + toast in `src/components/teacher/StudentManagement.tsx`

**Checkpoint**: US4 complete — edit without WhatsApp mutation

---

## Phase 7: User Story 5 — Remove student from list safely (Priority: P2)

**Goal**: Unlink with mandatory AlertDialog; cancel is no-op; confirm removes from this teacher only.

**Independent Test**: Open delete → cancel keeps student; confirm removes from roster and adjusts pagination/empty state.

### Implementation for User Story 5

- [x] T026 [US5] Implement `deleteStudentLink(linkId)` in `src/actions/teacher.ts` (ownership check; clear this teacher’s group memberships; delete link only; `revalidatePath`)
- [x] T027 [P] [US5] Build `DeleteStudentConfirmDialog` in `src/components/teacher/DeleteStudentConfirmDialog.tsx` using AlertDialog with copy «هل أنت أؤكد حذف هذا الطالب من قائمتك؟»
- [x] T028 [US5] Wire delete/unlink control on each card to confirm dialog + toast + list update in `src/components/teacher/StudentManagement.tsx`
- [x] T029 [P] [US5] Add Vitest cases for unlink ownership failure and “does not delete profile” expectations in `tests/features/teach-001-students-hub.test.ts`

**Checkpoint**: US5 complete — safe unlink

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Registry, e2e smoke, verify constitution gates

- [x] T030 Update TEACH-001 acceptance criteria in `.speckit/spec.yaml` (manual add, search, 8-page pagination, edit without WhatsApp, unlink/deactivate confirms, group clear)
- [x] T031 [P] Add Playwright smoke for hub UI structure (filters/search/pagination copy or empty states) in `e2e/teach-001-students-hub.spec.ts` — skip authed mutations when `E2E_SKIP_AUTHED` / placeholder Supabase
- [x] T032 [P] Ensure `src/app/teacher/students/page.tsx` title/CTA props and Spekit root remain correct after hub refactor
- [x] T033 Run `npm run lint`, `npm run typecheck`, `npm run test:unit`, and `npm run build`; fix regressions; manually spot-check `specs/006-student-management-hub/quickstart.md`

**Checkpoint**: Feature ready for `/speckit-implement` completion sign-off

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: After Foundational — MVP browse hub
- **US2 (Phase 4)**: After Foundational; ideally after US1 shell (T009) so CTA lands on finished header
- **US3 (Phase 5)**: After Foundational + US1 list shell; shares `StudentManagement.tsx` with US1/US2
- **US4 (Phase 6)**: After Foundational; needs T005/T006; dialog file parallelizable
- **US5 (Phase 7)**: After Foundational; dialog file parallelizable; card wire after US1 list exists
- **Polish (Phase 8)**: After desired stories complete

### User Story Dependencies

| Story | Depends on | Notes |
|-------|------------|--------|
| US1 | Phase 2 | MVP |
| US2 | Phase 2 (+ T009 preferred) | New action + dialog file |
| US3 | Phase 2 + US1 list | Same file as US1 — serialize card actions |
| US4 | Phase 2 | `updateStudentInfo` + Edit dialog |
| US5 | Phase 2 | `deleteStudentLink` + Delete dialog |

### Parallel Opportunities

- T001–T003 in parallel
- T007 parallel with T005/T006 after T004 if Dialog not required for toast
- T015 / T024 / T027 dialog components in parallel once T004 done
- T013 / T017 / T022 / T029 test file extensions — coordinate to avoid merge conflicts on same test file (prefer sequential appends or one owner)
- T030–T032 polish items largely parallel

---

## Parallel Example: After Foundational

```bash
# Dialogs in parallel (different files):
Task: "Build AddStudentDialog in src/components/teacher/AddStudentDialog.tsx"
Task: "Build EditStudentDialog in src/components/teacher/EditStudentDialog.tsx"
Task: "Build DeleteStudentConfirmDialog in src/components/teacher/DeleteStudentConfirmDialog.tsx"

# Then serialize StudentManagement.tsx wiring: US1 → US2 CTA → US3 actions → US4/US5 buttons
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 + Phase 2  
2. Complete Phase 3 (US1)  
3. **STOP and VALIDATE**: search/filter/pagination on `/teacher/students`  
4. Demo browse hub before add/edit/delete

### Incremental Delivery

1. Setup + Foundational → foundation ready  
2. US1 → browse MVP  
3. US2 → manual add  
4. US3 → day-to-day management  
5. US4 + US5 → edit + safe unlink  
6. Polish → registry, e2e, build

### Suggested MVP scope

**US1 only** (search + filters + 8/page) delivers immediate roster usability; US2+US3 are the next valuable slice for a “hub”.

---

## Notes

- No DB migration in this feature  
- WhatsApp immutable on edit (unlink + re-add to fix)  
- Never write `status: pending` from hub  
- Pro revoke: no AlertDialog  
- All mutations: `requireTeacher` + `teacher_id` ownership checks (MT-002)  
- Commit after each task or logical group  
- Next command: `/speckit-implement`
