---
description: "Task list for OFFLINE-001 offline quiz PWA"
---

# Tasks: OFFLINE-001 Offline Quiz PWA

**Input**: Design documents from `specs/009-offline-quiz-pwa/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`  
**Tests**: Included per plan (Vitest store/sync helpers + Playwright offline smoke) — run in Polish phase after implementation.

**Organization**: Tasks grouped by user story for independent delivery and testing.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm design artifacts and environment before implementation

- [x] T001 Review acceptance criteria in `specs/009-offline-quiz-pwa/spec.md` and contracts in `specs/009-offline-quiz-pwa/contracts/`
- [x] T002 [P] Confirm branch `009-offline-quiz-pwa`, update `.specify/feature.json` if needed, and dev server per `specs/009-offline-quiz-pwa/quickstart.md`
- [x] T003 [P] Read technical approach and file layout in `specs/009-offline-quiz-pwa/plan.md` and decisions in `specs/009-offline-quiz-pwa/research.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: IndexedDB schema, connectivity helpers, error codes, Spekit hooks, and service worker registration — blocks all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create IndexedDB open helper and object stores (`quizPackages`, `inProgress`, `pendingSubmissions`, `meta`) in `src/lib/offline/db.ts` per `specs/009-offline-quiz-pwa/data-model.md`
- [x] T005 [P] Create online/offline helpers and event subscription utilities in `src/lib/offline/connectivity.ts`
- [x] T006 [P] Add `QUIZ_INACTIVE` and `QUIZ_CHANGED` error codes with Arabic messages in `src/lib/app-errors.ts` per `specs/009-offline-quiz-pwa/contracts/server-actions.md`
- [x] T007 [P] Add `offlineStatusBanner`, `offlineSyncNow`, and `pendingSyncBadge` to `SPEKIT` in `src/lib/spekit-targets.ts` and register hooks in `.speckit/spekit-targets.yaml`
- [x] T008 Create client `ServiceWorkerRegister` component in `src/components/pwa/ServiceWorkerRegister.tsx` per `specs/009-offline-quiz-pwa/contracts/service-worker.md`
- [x] T009 Mount `ServiceWorkerRegister` in `src/app/(student)/layout.tsx` (student scope only per FR-012)

**Checkpoint**: Foundation ready — IndexedDB schema exists; SW registers on student routes; error codes and Spekit ids reserved

---

## Phase 3: User Story 1 — Student Opens the App Without Connectivity (Priority: P1) 🎯 MVP

**Goal**: Returning students see the familiar Arabic RTL app shell offline; uncached routes show Arabic offline fallback with retry.

**Independent Test**: After one online visit to `/dashboard`, go offline and reopen — shell loads within 5s; navigate to uncached route → `offline.html`; retry after reconnect works (SC-001, SC-007).

### Implementation for User Story 1

- [x] T010 [P] [US1] Create Arabic RTL fallback page with retry button in `public/offline.html` per `specs/009-offline-quiz-pwa/contracts/service-worker.md`
- [x] T011 [US1] Implement `install`, `activate`, and `fetch` handlers with `APP_SHELL_CACHE_v1` and `RUNTIME_CACHE_v1` in `public/sw.js` (precache essentials, network-first navigation, cache-first static assets)
- [x] T012 [US1] Verify visited student routes (`/dashboard`, `/quizzes`) cache at runtime and offline navigation falls back to `public/offline.html` when uncached

**Checkpoint**: US1 complete — offline app shell and fallback page work for student PWA

---

## Phase 4: User Story 2 — Student Takes a Previously Opened Quiz Offline (Priority: P1)

**Goal**: Student opens quiz online, goes offline, continues answering, submits locally; gatekeeper preserved; never-opened quizzes blocked offline.

**Independent Test**: Open quiz online → offline → answer all → submit → Arabic pending-sync confirmation, no scores/explanations; quiz never opened offline shows unavailable message (FR-003, FR-004, FR-005, SC-004).

### Implementation for User Story 2

- [x] T013 [P] [US2] Implement `saveQuizPackage` and `getQuizPackage` with `assertGatekeeperCompliance` in `src/lib/offline/quiz-cache.ts` per `specs/009-offline-quiz-pwa/contracts/offline-store.md`
- [x] T014 [P] [US2] Implement `saveInProgress` and `getInProgress` with debounced persistence in `src/lib/offline/in-progress.ts`
- [x] T015 [US2] Extend `QuizRunner` in `src/components/quiz/QuizRunner.tsx` to persist exam package on online mount and hydrate from IndexedDB when offline
- [x] T016 [US2] Add offline-unavailable and list-only-not-opened Arabic UI states in `src/components/quiz/QuizRunner.tsx` (clarification Q1)
- [x] T017 [US2] Implement offline submit path in `QuizRunner` — enqueue pending submission via `src/lib/offline/pending-queue.ts`, show pending-sync state (no grading UI)
- [x] T018 [US2] Allow in-progress editing and local submit when session expired offline in `src/components/quiz/QuizRunner.tsx` (clarification Q5)

**Checkpoint**: US2 complete — offline quiz-taking works for explicitly opened quizzes

---

## Phase 5: User Story 3 — Pending Quiz Attempts Sync Automatically (Priority: P2)

**Goal**: Pending attempts auto-sync on reconnect and after re-login; manual «مزامنة الآن» retry; server validates stale quizzes; no duplicates.

**Independent Test**: Complete quiz offline → go online → submission appears in DB without re-entry within 2 min; duplicate/already-submitted resolves safely; changed quiz rejects with Arabic message (FR-006–FR-010, SC-003, SC-005).

### Implementation for User Story 3

- [x] T019 [P] [US3] Implement `enqueuePendingSubmission`, `listPendingSubmissions`, and status transitions in `src/lib/offline/pending-queue.ts`
- [x] T020 [US3] Implement `flushPendingSubmissions` calling `submitQuiz` in `src/lib/offline/sync-processor.ts` per `specs/009-offline-quiz-pwa/contracts/offline-store.md`
- [x] T021 [US3] Add FR-010 live question-ID and inactive-quiz validation to `submitQuiz` in `src/actions/quiz.ts` per `specs/009-offline-quiz-pwa/contracts/server-actions.md`
- [x] T022 [US3] Create `OfflineSyncProvider` in `src/components/pwa/OfflineSyncProvider.tsx` — listen for `online` event and trigger flush
- [x] T023 [US3] Mount `OfflineSyncProvider` in `src/app/(student)/layout.tsx` and auto-flush after successful re-login when pending queue non-empty
- [x] T024 [US3] Handle duplicate submission (server wins) and rejected sync outcomes with Arabic messaging in `src/lib/offline/sync-processor.ts`

**Checkpoint**: US3 complete — offline attempts sync automatically and idempotently

---

## Phase 6: User Story 4 — Clear Offline Status While Taking Quizzes (Priority: P3)

**Goal**: Students always see Arabic indicators for offline mode, pending sync, sync progress, and manual retry.

**Independent Test**: Toggle offline mid-quiz → banner visible; pending badge on dashboard/quizzes; «مزامنة الآن» appears when online with failed/pending items (FR-012, SC-006).

### Implementation for User Story 4

- [x] T025 [P] [US4] Create `OfflineStatusBanner` in `src/components/quiz/OfflineStatusBanner.tsx` with `data-spekit={SPEKIT.offlineStatusBanner}`
- [x] T026 [P] [US4] Create `PendingSyncBadge` with manual sync button in `src/components/quiz/PendingSyncBadge.tsx` (`SPEKIT.pendingSyncBadge`, `SPEKIT.offlineSyncNow`)
- [x] T027 [US4] Integrate `OfflineStatusBanner` into `src/components/quiz/QuizRunner.tsx` driven by `src/lib/offline/connectivity.ts`
- [x] T028 [US4] Integrate `PendingSyncBadge` into `src/app/(student)/dashboard/page.tsx` and `src/app/(student)/quizzes/page.tsx` showing pending count and «مزامنة الآن» when online

**Checkpoint**: US4 complete — offline and sync status visible across student quiz flows

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Registry, tests, build verification, and quickstart validation

- [x] T029 Register `OFFLINE-001` feature (routes, files, acceptance, status) in `.speckit/spec.yaml`
- [x] T030 [P] Add Vitest tests for quiz-cache, pending-queue, and sync-processor in `tests/features/offline-001-offline-store.test.ts`
- [x] T031 [P] Add Playwright offline smoke test in `e2e/offline-quiz.spec.ts` (open quiz online, submit offline, sync online)
- [x] T032 Run `npm run build` and execute manual checklist in `specs/009-offline-quiz-pwa/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: Depends on Foundational (T008–T009 for SW registration)
- **US2 (Phase 4)**: Depends on Foundational (T004); integrates with US1 shell but independently testable via IndexedDB + QuizRunner
- **US3 (Phase 5)**: Depends on US2 (T017 pending enqueue) and Foundational error codes
- **US4 (Phase 6)**: Depends on US3 sync processor for manual button; can start banner UI in parallel after US2
- **Polish (Phase 7)**: Depends on US1–US4 complete

### User Story Dependencies

```text
Foundational → US1 (shell) ──┐
Foundational → US2 (quiz)  ──┼→ US3 (sync) → US4 (status UI) → Polish
```

- **US1**: Independent after Foundational — MVP demo (offline shell only)
- **US2**: Independent after Foundational — core product value (offline quiz)
- **US3**: Requires US2 offline submit queue
- **US4**: Requires US3 flush + US2 connectivity; UI-only tasks parallelizable

### Parallel Opportunities

- **Phase 1**: T002 ∥ T003
- **Phase 2**: T005 ∥ T006 ∥ T007 (after T004 started); T008 after T004 optional
- **Phase 3**: T010 ∥ (after T011 started)
- **Phase 4**: T013 ∥ T014; then T015–T018 sequential on `QuizRunner.tsx`
- **Phase 5**: T019 ∥ T021; T022 ∥ T023 after T020
- **Phase 6**: T025 ∥ T026; T027 ∥ T028 after components exist
- **Phase 7**: T030 ∥ T031

### Parallel Example: User Story 2

```bash
# Launch cache modules together:
Task T013: "Implement quiz-cache.ts in src/lib/offline/quiz-cache.ts"
Task T014: "Implement in-progress.ts in src/lib/offline/in-progress.ts"

# Then sequentially integrate QuizRunner (T015–T018)
```

### Parallel Example: User Story 4

```bash
Task T025: "Create OfflineStatusBanner.tsx"
Task T026: "Create PendingSyncBadge.tsx"
# Then T027–T028 integrate into pages
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (offline shell)
4. **STOP and VALIDATE**: Offline dashboard shell + fallback page
5. Demo PWA resilience before quiz offline work

### Core Value (User Stories 1 + 2)

1. Setup + Foundational
2. US1 + US2 → student can complete quiz offline with pending queue
3. Validate via quickstart sections 2–4 before sync work

### Incremental Delivery

1. Setup + Foundational → infrastructure ready
2. US1 → offline shell (MVP)
3. US2 → offline quiz-taking
4. US3 → auto/manual sync
5. US4 → status UX polish
6. Polish → registry, tests, build

### Suggested MVP Scope

**Minimum shippable increment**: Phases 1–3 (US1) — offline student shell.  
**First product-value increment**: Phases 1–4 (US1 + US2) — offline quiz with local pending submit (sync can follow in US3).

---

## Notes

- Quiz route is `/quiz/[id]` (not `/quizzes/[id]`)
- Submissions use Server Action `submitQuiz` — no new REST API
- Only quizzes **explicitly opened online** are offline-startable
- Never cache gatekeeper-forbidden fields in IndexedDB
- Teacher routes out of scope — SW registration in `(student)/layout.tsx` only
- `[P]` tasks = different files, no incomplete dependencies
- Commit after each phase checkpoint
