---
description: "Task list for PROFILE-001 user profile & settings page"
---

# Tasks: PROFILE-001 User Profile & Settings

**Input**: Design documents from `specs/001-profile-settings/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`  
**Tests**: Included per plan Phase 2 outline (Vitest + Playwright) — not TDD-first; run after implementation.

**Organization**: Tasks grouped by user story for independent verification.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm design artifacts and environment before implementation

- [ ] T001 Review acceptance criteria in `specs/001-profile-settings/spec.md` and contracts in `specs/001-profile-settings/contracts/`
- [ ] T002 [P] Confirm dev server and demo logins work per `.speckit/spec.yaml` → `demo_accounts` (student + teacher)
- [ ] T003 [P] Read implementation map and file layout in `specs/001-profile-settings/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, Spekit registry, auth routing, and server read action — blocks all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Add `profileTierInfo`, `profileTeacherCode`, `profileSessionManagement` to `SPEKIT` in `src/lib/spekit-targets.ts`
- [ ] T005 [P] Register the three profile Spekit targets with descriptions in `.speckit/spekit-targets.yaml`
- [ ] T006 [P] Add `SettingsProfile` type (or export from actions) matching `specs/001-profile-settings/data-model.md` in `src/types/database.ts` or `src/actions/profile.ts`
- [ ] T007 Implement `getSettingsProfile()` read action (profile + student link join by `currentTeacherId`) in `src/actions/profile.ts`
- [ ] T008 Extend `src/middleware.ts` to protect `/settings` for any logged-in role (do not redirect teachers away from `/settings`)
- [ ] T009 [P] Add Shadcn `AlertDialog` component if missing in `src/components/ui/alert-dialog.tsx` (needed for logout confirmation)

**Checkpoint**: Foundation ready — profile data loads; routes protected; Spekit IDs registered

---

## Phase 3: User Story 1 — View and update display name (Priority: P1) 🎯 MVP

**Goal**: Logged-in users open settings, see name + read-only WhatsApp, edit and save display name with session sync.

**Independent Test**: Log in → `/settings` or `/teacher/settings` → edit name → Save → refresh → name persists on settings page and dashboard welcome.

### Implementation for User Story 1

- [ ] T010 [P] [US1] Create client `ProfileForm` with editable name, disabled WhatsApp `Input`, and Save button in `src/components/settings/ProfileForm.tsx`
- [ ] T011 [US1] Implement `updateProfileName(formData)` with trim validation, DB update, `session.fullName` sync, and `revalidatePath` in `src/actions/profile.ts`
- [ ] T012 [US1] Create server `SettingsPage` shell (header, profile card, RTL mobile layout) in `src/components/settings/SettingsPage.tsx`
- [ ] T013 [US1] Mount `SettingsPage` at `src/app/settings/page.tsx` with auth via `getSession()` + `validateDeviceSession()` or shared helper
- [ ] T014 [US1] Mount shared `SettingsPage` at `src/app/teacher/settings/page.tsx` under teacher layout

**Checkpoint**: US1 complete — name edit works for both roles on both routes

---

## Phase 4: User Story 2 — Role-specific profile information (Priority: P1)

**Goal**: Students see tier badge, teacher code, Pro request; teachers see copyable teacher code; no cross-role UI leakage.

**Independent Test**: Compare student vs teacher settings — each sees role-appropriate fields only; Spekit hooks on tier and teacher code sections.

### Implementation for User Story 2

- [ ] T015 [P] [US2] Create `StudentProfileExtras` with tier `Badge` (`data-spekit="profile-tier-info"`), read-only teacher code, and `requestProUpgrade` button/pending state in `src/components/settings/StudentProfileExtras.tsx`
- [ ] T016 [P] [US2] Create `TeacherCodeSection` with monospace code display, copy button, and clipboard fallback toast in `src/components/settings/TeacherCodeSection.tsx`
- [ ] T017 [US2] Wire role-conditional sections in `src/components/settings/SettingsPage.tsx` using `session.role` and `SettingsProfile` data
- [ ] T018 [US2] Apply `data-spekit={SPEKIT.profileTeacherCode}` on teacher code blocks (student read-only + teacher copy) in `src/components/settings/StudentProfileExtras.tsx` and `src/components/settings/TeacherCodeSection.tsx`

**Checkpoint**: US2 complete — dual-role adaptive UI with Spekit tier/teacher-code hooks

---

## Phase 5: User Story 3 — Session management and logout (Priority: P2)

**Goal**: Active Sessions card, log out other devices (AUTH-003 token rotation), logout with confirmation dialog.

**Independent Test**: View active session indicator → log out other devices → current session stays valid → Logout with confirm → `/login`.

### Implementation for User Story 3

- [ ] T019 [US3] Implement `logoutOtherDevices()` (rotate `last_session_id`, update cookie `sessionToken`) in `src/actions/profile.ts`
- [ ] T020 [P] [US3] Create `ActiveSessionsCard` with active status UI and logout-others action (`data-spekit="profile-session-management"`) in `src/components/settings/ActiveSessionsCard.tsx`
- [ ] T021 [P] [US3] Create `LogoutConfirmButton` using `AlertDialog` + existing `logout()` form action in `src/components/settings/LogoutConfirmButton.tsx`
- [ ] T022 [US3] Integrate `ActiveSessionsCard` and `LogoutConfirmButton` into `src/components/settings/SettingsPage.tsx`

**Checkpoint**: US3 complete — session management and confirmed logout work end-to-end

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Navigation, tests, registry sync, and quality gates

- [ ] T023 [P] Add settings nav link to student dashboard header in `src/app/dashboard/page.tsx`
- [ ] T024 [P] Add settings nav item (`/teacher/settings`) to `navItems` in `src/app/teacher/layout.tsx`
- [ ] T025 [P] Add Vitest tests for name validation and session token rotation logic in `tests/features/profile-001-settings.test.ts`
- [ ] T026 [P] Add Playwright smoke tests for student and teacher settings in `e2e/profile-settings.spec.ts`
- [ ] T027 Add `PROFILE-001` feature entry (implemented) and update `TEACH-008` notes in `.speckit/spec.yaml`
- [ ] T028 Run manual verification steps in `specs/001-profile-settings/quickstart.md`
- [ ] T029 Run `npm run lint && npm run typecheck && npm run test`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational — MVP deliverable
- **User Story 2 (Phase 4)**: Depends on Phase 3 (`SettingsPage` shell exists)
- **User Story 3 (Phase 5)**: Depends on Phase 3 (`SettingsPage` shell exists); independent of US2 content
- **Polish (Phase 6)**: Depends on Phases 3–5 (or MVP + desired stories)

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependency on US2/US3
- **US2 (P1)**: After US1 — extends `SettingsPage.tsx` with role sections
- **US3 (P2)**: After US1 — adds session/logout cards to same page; parallel with US2 after US1

### Within Each User Story

- Server actions before UI components that call them
- Shared shell (`SettingsPage`) before route pages that mount it
- Role/session components before wiring in shell

### Parallel Opportunities

- **Phase 1**: T002 ∥ T003
- **Phase 2**: T005 ∥ T006 ∥ T009 (after T004); T008 after T007 optional
- **Phase 3**: T010 parallel with T011 prep; T013 ∥ T014 after T012
- **Phase 4**: T015 ∥ T016 (different files); T18 after T15/T16
- **Phase 5**: T020 ∥ T21 (different files); T19 before T20
- **Phase 6**: T023 ∥ T024 ∥ T025 ∥ T26; T27–T29 sequential at end
- **Cross-story**: US2 and US3 can proceed in parallel once US1 checkpoint passes

---

## Parallel Example: User Story 2

```bash
# After US1 checkpoint, launch role-specific components together:
Task T015: "Create StudentProfileExtras in src/components/settings/StudentProfileExtras.tsx"
Task T016: "Create TeacherCodeSection in src/components/settings/TeacherCodeSection.tsx"

# Then wire both in SettingsPage (T017)
```

---

## Parallel Example: After Foundational

```bash
# Developer A — US1 name form + routes
Task T010 → T011 → T012 → T013/T014

# Developer B (after T012) — US2 role sections in parallel with US3
Task T015/T016 (US2)  ||  Task T019/T020/T021 (US3)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational  
3. Complete Phase 3: User Story 1  
4. **STOP and VALIDATE**: Name edit on `/settings` and `/teacher/settings`  
5. Demo if ready  

### Incremental Delivery

1. Setup + Foundational → infrastructure ready  
2. US1 → name + basic settings page (**MVP**)  
3. US2 → role-specific tier/teacher code/Pro request  
4. US3 → session management + confirmed logout  
5. Polish → nav, tests, spec.yaml  

### Suggested MVP Scope

**Phases 1–3 only** (T001–T014): Delivers FR-001, FR-002, FR-003, FR-004, FR-012 partial — core settings with name edit for both roles.

---

## Notes

- No schema migration — reuse `profiles` and `student_teachers` per `specs/001-profile-settings/data-model.md`
- Reuse `requestProUpgrade()` from `src/actions/student.ts` and `logout()` from `src/actions/auth.ts`
- Teacher `school_name` / `bank_details` editor remains out of scope (TEACH-008 partial)
- WhatsApp field: `disabled` + `readOnly`; display with `dir="ltr"` if needed
- All primary buttons: touch targets `h-10`–`h-12` per constitution

---

## Task Summary

| Phase | Tasks | Story |
|-------|-------|-------|
| Setup | T001–T003 (3) | — |
| Foundational | T004–T009 (6) | — |
| US1 Name edit | T010–T014 (5) | US1 |
| US2 Role profile | T015–T018 (4) | US2 |
| US3 Sessions | T019–T022 (4) | US3 |
| Polish | T023–T029 (7) | — |
| **Total** | **29 tasks** | |

**Parallel-marked**: 14 tasks  
**MVP task range**: T001–T014 (14 tasks)
