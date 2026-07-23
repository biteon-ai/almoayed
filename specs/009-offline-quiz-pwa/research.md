# Research: Offline Quiz PWA

**Date**: 2026-07-23  
**Status**: Complete — all Technical Context items resolved

## 1. Service worker strategy with Next.js 14 App Router

**Decision**: Enhance existing `public/sw.js` with:
- **Install**: precache `offline.html`, `manifest.json`, icons, favicons, `/` document shell attempt
- **Activate**: claim clients; delete caches not matching `APP_SHELL_CACHE_v1` / `RUNTIME_CACHE_v1`
- **Fetch**:
  - **Navigation requests**: network-first, fallback to cached same-URL response, then `/offline.html`
  - **Static assets** (`/_next/static/*`, fonts, icons, CSS, JS): cache-first with background update
  - **Do not** intercept Server Action POST bodies

**Rationale**: RSC HTML is dynamic and user-specific; runtime caching of visited student routes (`/dashboard`, `/quizzes`, `/quiz/*`) after first online visit satisfies FR-001/FR-002 without brittle build-time route enumeration. Matches UI-001 `sw.js` location.

**Alternatives considered**:
- Workbox + `@ducanh2912/next-pwa` — heavier dependency; constitution prefers minimal diff on hand-rolled SW.
- Precache all student routes at build — impossible with dynamic `[id]` and session-gated HTML.

## 2. Quiz data caching mechanism

**Decision**: **IndexedDB** (`almoayed-offline-v1`) written from client after successful online `getQuizForStudent` load. Store gatekeeper-safe `ExamQuestion[]` + quiz metadata + `cachedAt` + `teacherId` + `openedAt` flag.

**Rationale**: Spec requires durable in-progress + pending queues across restarts (SC-002); localStorage quota/sync blocking is risky for full exam packages. SW cannot reliably cache Server Action responses. Clarification: only explicitly opened quizzes get packages (`openedAt` set on quiz page mount).

**Alternatives considered**:
- localStorage `pending_quiz_submissions` only — insufficient for question payloads and size limits.
- SW cache of `/quiz/[id]` HTML — does not include RSC payload separately; breaks offline reopen.

## 3. Offline quiz page UX

**Decision**: Keep RSC `quiz/[id]/page.tsx` for online. Add client layer in `QuizRunner`:
1. Online + server props → persist package to IndexedDB.
2. Offline → load package from IndexedDB; if missing → Arabic unavailable-offline UI.
3. `navigator.onLine` + `offline`/`online` events drive banner state.

**Rationale**: Minimal change to server page; gatekeeper data already validated server-side before cache write.

**Alternatives considered**:
- Dedicated `/quiz/[id]/offline` route — duplicate UX; rejected.
- Full client-only quiz fetch API — violates server-layer constitution.

## 4. Submission sync path

**Decision**: Reuse `submitQuiz(quizId, answers)` Server Action from `sync-processor.ts` when `navigator.onLine` and session valid. Queue records store `{ id, quizId, answers, cachedQuestionIds, teacherId, profileId?, queuedAt, status }`.

**Rationale**: Single grading path; no duplicate business logic. FR-010 validation added inside `submitQuiz` before insert.

**Alternatives considered**:
- New `/api/quizzes/[id]/submit` REST route — extra surface; Server Actions sufficient.
- Background Sync API — uneven Safari support; `online` event + manual button sufficient for v1.

## 5. Sync triggers

**Decision**: `OfflineSyncProvider` registers:
- `window` `online` → `flushPendingSubmissions()`
- Custom event after successful login → same flush (hook from auth success path or layout mount when session detected)
- Manual **«مزامنة الآن»** button → `flushPendingSubmissions({ manual: true })`

**Rationale**: Matches clarifications (auto + manual; auto after re-login).

## 6. FR-010 stale quiz validation (server)

**Decision**: In `submitQuiz`, before grading:
1. Re-fetch quiz `is_active` + question IDs for `quizId` (teacher-scoped via existing `getQuizForStudent` guard).
2. If inactive → throw `QUIZ_INACTIVE` (new or reuse code).
3. If any key in `answers` missing from live question set → throw `QUIZ_CHANGED` (reject full attempt).
4. If duplicate submission exists → return existing results (FR-009).

**Rationale**: Implements clarification Q4 without partial grading complexity.

## 7. Service worker registration

**Decision**: Add `ServiceWorkerRegister` client component mounted from `(student)/layout.tsx` only (student scope per FR-012).

**Rationale**: Teachers out of scope; avoids SW affecting teacher admin unexpectedly.

**Alternatives considered**:
- Root layout registration — broader than spec scope.

## 8. Storage eviction

**Decision**: v1 policy — never evict `pendingSubmissions` or `inProgress` stores. Evict oldest `quizPackages` entries beyond **20** LRU when quota pressure (optional `meta` store tracks order). Warn in UI if `QuotaExceededError`.

**Rationale**: Spec prioritizes unsynced attempts; defer sophisticated eviction to implementation tasks.

## 9. Testing approach

**Decision**:
- Vitest: pure functions in `quiz-cache`, `pending-queue`, `sync-processor` (mock `submitQuiz`)
- Playwright: `context.setOffline(true)` after opening quiz online; assert banner, local submit, pending state; restore online; assert sync

**Rationale**: Matches repo patterns (`tests/features/`, `e2e/`).

## 10. Spekit hooks

**Decision**: Add `SPEKIT.offlineStatusBanner`, `SPEKIT.offlineSyncNow`, `SPEKIT.pendingSyncBadge` to `spekit-targets.ts` + `.speckit/spekit-targets.yaml`.

**Rationale**: ENABLE-001 compliance for new student-visible controls.
