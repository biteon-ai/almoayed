---
description: "Task list for ADMIN-001 Super Admin Dashboard"
---

# Tasks: ADMIN-001 Super Admin Dashboard

**Input**: Design documents from `specs/010-super-admin-dashboard/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`  
**Tests**: Included per plan quickstart (Vitest + Playwright smoke) — run in Polish phase after implementation.

**Organization**: Tasks grouped by user story for independent delivery and testing.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies, env documentation, and Spekit hook registration

- [x] T001 Install `bcryptjs` and `@types/bcryptjs` in `package.json`
- [x] T002 [P] Add `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` placeholders to `.env.example` per `specs/010-super-admin-dashboard/quickstart.md`
- [x] T003 [P] Register ADMIN-001 Spekit target ids in `src/lib/spekit-targets.ts` and `.speckit/spekit-targets.yaml` per `specs/010-super-admin-dashboard/contracts/ui-components.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, session/auth guards, middleware, admin shell, and login flows — blocks all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create migration `supabase/migrations/006_super_admin.sql` (SUPER_ADMIN role, email/password fields, subject catalog, audit log, quiz archive, whatsapp nullable) per `specs/010-super-admin-dashboard/data-model.md`
- [x] T005 Extend `UserRole`, `Profile`, and admin DTO types in `src/types/database.ts` for SUPER_ADMIN, teacher account status, subjects, and KPI shapes
- [x] T006 Extend `SessionData` with optional `impersonation` blob in `src/lib/session.ts` per `specs/010-super-admin-dashboard/research.md` R6
- [x] T007 [P] Implement password hash/verify helpers in `src/lib/admin/passwords.ts`
- [x] T008 [P] Implement audit log writer in `src/lib/admin/audit.ts`
- [x] T009 Implement `requireSuperAdmin()` guard in `src/lib/admin/require-super-admin.ts` and export `requireSuperAdmin()` from `src/lib/auth.ts`
- [x] T010 Extend `src/middleware.ts` to protect `/admin/dashboard`, `/admin/teachers`, and other `/admin/*` routes (exclude `/admin/login` and `/admin/emergency`)
- [x] T011 Create RTL admin shell with nav links in `src/app/admin/layout.tsx` per `specs/010-super-admin-dashboard/contracts/ui-components.md`
- [x] T012 Implement Super Admin email login page in `src/app/admin/login/page.tsx` and POST handler in `src/app/api/admin/auth/login/route.ts`
- [x] T013 Move AUTH-005 emergency teacher fallback to `src/app/admin/emergency/page.tsx` (preserve existing form behavior; update redirects)
- [x] T014 Create email/password teacher login page in `src/app/teacher/login/page.tsx` for admin-provisioned teachers

**Checkpoint**: Foundation ready — migration applied; Super Admin can log in; admin routes guarded; teacher email login available

---

## Phase 3: User Story 1 — View Platform Health at a Glance (Priority: P1) 🎯 MVP

**Goal**: Super Admin dashboard shows five Arabic KPI cards with platform-wide accurate counts.

**Independent Test**: Log in as Super Admin → open `/admin/dashboard` → verify total users, teachers (active/inactive), students, exams (published/draft), and completed attempts match database.

### Implementation for User Story 1

- [x] T015 [P] [US1] Implement platform aggregation helpers in `src/lib/admin/kpis.ts` per `specs/010-super-admin-dashboard/data-model.md`
- [x] T016 [US1] Implement GET handler in `src/app/api/admin/kpis/route.ts` per `specs/010-super-admin-dashboard/contracts/admin-api.md`
- [x] T017 [P] [US1] Create KPI card grid component in `src/components/admin/AdminKpiCards.tsx` (emerald/teal RTL, dark mode, Spekit hooks)
- [x] T018 [US1] Create dashboard RSC page in `src/app/admin/dashboard/page.tsx` loading KPIs via shared lib

**Checkpoint**: US1 complete — KPI dashboard independently testable

---

## Phase 4: User Story 2 — Create Teacher Accounts Exclusively via Super Admin (Priority: P1)

**Goal**: Super Admin creates teachers with all required fields; new teachers sign in via `/teacher/login`; no public teacher registration.

**Independent Test**: Open create modal → submit valid form → teacher appears in DB → sign in with email/password → reach `/teacher/dashboard`.

### Implementation for User Story 2

- [x] T019 [P] [US2] Implement subject catalog read helpers and GET handler in `src/lib/admin/teachers.ts` and `src/app/api/admin/subjects/route.ts`
- [x] T020 [US2] Implement `createTeacher` with validation, password generation, and subject assignments in `src/lib/admin/teachers.ts`
- [x] T021 [US2] Implement POST handler in `src/app/api/admin/teachers/route.ts` per `specs/010-super-admin-dashboard/contracts/admin-api.md`
- [x] T022 [P] [US2] Create `src/components/admin/CreateTeacherModal.tsx` with all required Arabic fields and auto-generate password toggle
- [x] T023 [US2] Add «إضافة مدرس جديد» button and wire create modal success flow (show generated password once) in `src/app/admin/teachers/page.tsx`

**Checkpoint**: US2 complete — teacher creation end-to-end works

---

## Phase 5: User Story 3 — Browse, Search, and Filter the Teacher Roster (Priority: P1)

**Goal**: Searchable, filterable teacher table with quiz counts and Arabic empty state.

**Independent Test**: With mixed-status teachers, search by name/email and filter by status; verify quiz counts and empty-state copy.

### Implementation for User Story 3

- [x] T024 [US3] Implement `listTeachers` with `q` and `status` query support in `src/lib/admin/teachers.ts`
- [x] T025 [US3] Implement GET handler in `src/app/api/admin/teachers/route.ts` per `specs/010-super-admin-dashboard/contracts/admin-api.md`
- [x] T026 [P] [US3] Create `src/components/admin/AdminTeachersTable.tsx` with search input, status filter, and responsive RTL table/cards
- [x] T027 [US3] Complete `src/app/admin/teachers/page.tsx` integrating table, create modal, and Arabic empty state «لا يوجد مدرسون يطابقون البحث»

**Checkpoint**: US3 complete — teacher roster independently browsable and filterable

---

## Phase 6: User Story 4 — Activate, Deactivate, and Edit Teacher Accounts (Priority: P2)

**Goal**: Edit profiles, reset passwords, adjust subjects/quiz limits, and toggle active/inactive with immediate effect on login.

**Independent Test**: Edit teacher fields, toggle inactive → login blocked → toggle active → login restored; verify KPI inactive count updates.

### Implementation for User Story 4

- [x] T028 [US4] Implement `updateTeacher` including status toggle and password reset in `src/lib/admin/teachers.ts`
- [x] T029 [US4] Implement PUT handler in `src/app/api/admin/teachers/[id]/route.ts` per `specs/010-super-admin-dashboard/contracts/admin-api.md`
- [x] T030 [P] [US4] Create `src/components/admin/EditTeacherModal.tsx` with optional password reset section
- [x] T031 [US4] Wire edit and «تفعيل / تعطيل الحساب» quick-toggle actions in `src/components/admin/AdminTeachersTable.tsx`
- [x] T032 [US4] Enforce optional `max_quiz_limit` in `createQuiz` within `src/actions/teacher.ts` per FR-017

**Checkpoint**: US4 complete — edit and status toggle independently testable

---

## Phase 7: User Story 5 — Impersonate a Teacher for Support (Priority: P2)

**Goal**: One-click impersonation with sticky Arabic banner and safe return to Super Admin session.

**Independent Test**: Impersonate active teacher → banner visible on teacher routes → exit → land on `/admin/teachers` as Super Admin; inactive teacher blocked.

### Implementation for User Story 5

- [x] T033 [US5] Implement impersonation start/exit session helpers in `src/lib/admin/impersonation.ts` (block nested impersonation and inactive targets)
- [x] T034 [US5] Implement POST handlers in `src/app/api/admin/impersonate/[teacherId]/route.ts` and `src/app/api/admin/impersonate/exit/route.ts`
- [x] T035 [P] [US5] Create sticky `src/components/admin/ImpersonationBanner.tsx` with Arabic copy and exit action
- [x] T036 [US5] Mount `ImpersonationBanner` in `src/app/teacher/layout.tsx` and add «تسجيل الدخول كـ مدرس» row action in `src/components/admin/AdminTeachersTable.tsx`

**Checkpoint**: US5 complete — impersonation round-trip works with visible banner

---

## Phase 8: User Story 6 — Delete a Teacher with Quiz Data Handling (Priority: P3)

**Goal**: Confirmed delete with reassign-or-archive quiz disposition and KPI roster update.

**Independent Test**: Delete teacher with quizzes → choose archive or reassign → verify profile removed and quizzes handled per choice.

### Implementation for User Story 6

- [x] T037 [US6] Implement transactional `deleteTeacher` with quiz disposition logic in `src/lib/admin/teachers.ts`
- [x] T038 [US6] Implement DELETE handler in `src/app/api/admin/teachers/[id]/route.ts` per `specs/010-super-admin-dashboard/contracts/admin-api.md`
- [x] T039 [P] [US6] Create `src/components/admin/DeleteTeacherDialog.tsx` with reassign picker and archive radio options
- [x] T040 [US6] Wire delete flow with confirmation in `src/components/admin/AdminTeachersTable.tsx`

**Checkpoint**: US6 complete — safe teacher deletion with quiz stewardship

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Registry, tests, build gate, and manual QA validation

- [x] T041 [P] Register `ADMIN-001` acceptance criteria in `.speckit/spec.yaml` and update `AUTH-005` route to `/admin/emergency`
- [x] T042 [P] Add Vitest coverage for guards, KPI aggregation, teacher CRUD, and impersonation in `tests/features/admin-001-super-admin.test.ts`
- [x] T043 [P] Add Playwright smoke for admin login, KPI dashboard, create teacher, and impersonation banner in `e2e/admin-001-super-admin.spec.ts`
- [x] T044 Run `npm run build` and fix any TypeScript or lint errors across admin feature files
- [x] T045 Validate manual QA path in `specs/010-super-admin-dashboard/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **User Stories (Phase 3–8)**: All depend on Foundational completion
- **Polish (Phase 9)**: Depends on desired user stories being complete

### User Story Dependencies

| Story | Priority | Depends on | Notes |
|-------|----------|------------|-------|
| US1 KPI dashboard | P1 | Foundational | MVP entry point |
| US2 Create teacher | P1 | Foundational | Needs subjects catalog from migration |
| US3 Teacher roster | P1 | US2 (partial) | Table page started in US2; list API completes US3 |
| US4 Edit/toggle | P2 | US3 | Requires roster table and teacher rows |
| US5 Impersonation | P2 | US3 | Requires row action target |
| US6 Delete | P3 | US3, US4 | Requires roster + optional reassign targets |

**Recommended sequential order**: Foundational → US1 → US2 → US3 → US4 → US5 → US6 → Polish

### Within Each User Story

- Shared lib functions before Route Handlers
- Route Handlers before UI components that consume them
- Page integration last within each story

### Parallel Opportunities

- **Phase 1**: T002, T003 parallel after T001
- **Phase 2**: T007, T008 parallel; T011–T014 parallel after T009–T010
- **US1**: T015, T017 parallel
- **US2**: T019, T022 parallel
- **US3**: T026 parallel with T024–T025 once API ready
- **US4–US6**: Modal components (T030, T035, T039) parallel with backend tasks
- **Polish**: T041, T042, T043 parallel

---

## Parallel Example: User Story 1

```bash
# Launch KPI backend and UI card component together:
Task T015: "Implement platform aggregation helpers in src/lib/admin/kpis.ts"
Task T017: "Create KPI card grid component in src/components/admin/AdminKpiCards.tsx"

# Then wire sequentially:
Task T016: "Implement GET handler in src/app/api/admin/kpis/route.ts"
Task T018: "Create dashboard RSC page in src/app/admin/dashboard/page.tsx"
```

---

## Parallel Example: User Story 2 + 3

```bash
# After Foundational, US2 modal and US3 table component can start in parallel:
Task T022: "Create src/components/admin/CreateTeacherModal.tsx"
Task T026: "Create src/components/admin/AdminTeachersTable.tsx"

# Merge on teachers page:
Task T027: "Complete src/app/admin/teachers/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (KPI dashboard)
4. **STOP and VALIDATE**: Super Admin login + KPI cards accurate
5. Demo platform health overview

### Incremental Delivery

1. Setup + Foundational → auth and schema ready
2. US1 → KPI dashboard (MVP visibility)
3. US2 + US3 → teacher provisioning and roster (operational core)
4. US4 → lifecycle management
5. US5 → support impersonation
6. US6 → safe offboarding
7. Polish → registry, tests, build

### Parallel Team Strategy

With multiple developers after Foundational:

- **Developer A**: US1 KPI dashboard
- **Developer B**: US2 create teacher API + modal
- **Developer C**: US3 list API + table (merge on teachers page)

Then US4 → US5 → US6 sequentially or split modals vs API.

---

## Notes

- All admin Route Handlers MUST call `requireSuperAdmin()` and use `createAdminClient()` only
- Impersonation sets `session.role = TEACHER` and `profileId = teacherId`; banner MUST stay visible until exit
- Public `/login` remains student-only — do not add teacher registration links
- Commit after each task or logical checkpoint
- Stop at any checkpoint to validate story independently
