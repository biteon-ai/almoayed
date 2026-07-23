# Implementation Plan: Offline Quiz PWA

**Branch**: `009-offline-quiz-pwa` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-offline-quiz-pwa/spec.md`

**Feature ID (registry)**: `OFFLINE-001` — student offline app shell, cached quiz-taking, pending submission sync.

## Summary

Enable students to open the PWA shell offline, continue quizzes they previously opened while online, queue submissions locally when disconnected, and auto-sync (plus manual **«مزامنة الآن»**) when connectivity and session allow. Extend the minimal `public/sw.js` with install/activate/fetch handlers for app-shell assets and navigation fallbacks; add `public/offline.html` as an Arabic RTL offline page. Quiz exam payloads and pending queues live in **IndexedDB** (not localStorage) via a small client module, written only after gatekeeper-safe server loads. Submission continues through existing `submitQuiz` Server Action with added sync-time validation (FR-010). No new DB tables.

**Technical approach**: `ServiceWorkerRegister` in student layout; enhanced SW with `APP_SHELL_CACHE_v1` + `RUNTIME_CACHE_v1`; `src/lib/offline/` for IndexedDB schema + sync queue; `useOfflineQuiz` hook wrapping `QuizRunner` submit path; `OfflineStatusBanner` + pending badges on dashboard/quizzes; extend `submitQuiz` for stale-quiz rejection; Vitest for store/sync helpers; Playwright offline smoke.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC pages + client islands |
| **Database** | **Supabase** — reuse `exam_submissions`, `student_answers`, `questions`, `quizzes` |
| **Data access** | Server Actions + `createAdminClient()`; offline cache is client-only |
| **Session / auth** | iron-session — sync requires valid session except local queue while expired |
| **UI** | Tailwind, Shadcn/Base UI, RTL, Arabic copy |
| **Testing** | Vitest (`tests/features/`), Playwright (`e2e/`) |
| **Target platform** | Mobile-first installed PWA |
| **Spec registry** | `.speckit/spec.yaml` (+ `OFFLINE-001`) |

**Feature-specific overrides**:

- **Primary Dependencies**: `idb` (lightweight IndexedDB wrapper) — optional; native IndexedDB acceptable if kept small
- **Storage / tables touched**: No migrations; client IndexedDB database `almoayed-offline-v1` with object stores `quizPackages`, `inProgress`, `pendingSubmissions`, `meta`
- **Performance Goals**: Offline shell visible ≤5s (SC-001); pending sync within 2 min of reconnect (SC-003)
- **Constraints**: QUIZ-001 gatekeeper on cached payloads; MT-002/tier/group re-check on sync; student-only scope; explicit quiz open required for offline start
- **Scale/Scope**: ~12–15 files touched/added across `public/`, `src/lib/offline/`, `src/components/quiz/`, `src/actions/quiz.ts`, student layout

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md`

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries | PASS — `getQuizForStudent` / `submitQuiz` unchanged scope; cache stores `teacherId` for display only |
| QUIZ-001 | No answer leakage pre-submit | PASS — cache uses `EXAM_QUESTION_SELECT_FIELDS`; `assertGatekeeperCompliance` before IndexedDB write |
| Server layer | Privileged data via Server Actions | PASS — sync calls `submitQuiz`; no client Supabase |
| RTL UX | Arabic RTL, touch targets | PASS — `offline.html` + banners Arabic RTL |
| Minimal diff | Match existing patterns | PASS — extend `QuizRunner`, `sw.js`, `quiz.ts` |

**Feature compliance**: PASS — no justified exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/009-offline-quiz-pwa/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Client-side IndexedDB entities
├── quickstart.md        # Manual + automated verification
├── contracts/
│   ├── service-worker.md
│   ├── offline-store.md
│   └── server-actions.md
└── spec.md
```

### Source Code (planned)

```text
public/
├── sw.js                           # App shell + runtime caching, offline fallback
└── offline.html                    # Arabic RTL offline fallback page

src/
├── app/(student)/layout.tsx        # + ServiceWorkerRegister, OfflineSyncProvider
├── app/(student)/quiz/[id]/page.tsx # Pass online payload; client persists package
├── actions/quiz.ts                 # submitQuiz: FR-010 stale quiz validation
├── components/
│   ├── pwa/
│   │   ├── ServiceWorkerRegister.tsx
│   │   └── OfflineSyncProvider.tsx
│   └── quiz/
│       ├── QuizRunner.tsx          # Offline-aware submit + status
│       ├── OfflineStatusBanner.tsx
│       └── PendingSyncBadge.tsx
├── lib/offline/
│   ├── db.ts                       # IndexedDB open + stores
│   ├── quiz-cache.ts               # save/load exam packages (gatekeeper)
│   ├── pending-queue.ts            # enqueue, list, mark synced/rejected
│   ├── sync-processor.ts           # flush queue via submitQuiz
│   └── connectivity.ts             # online/offline helpers
└── lib/spekit-targets.ts           # + offlineSyncNow, offlineStatusBanner

tests/features/offline-001-*.test.ts
e2e/offline-quiz.spec.ts
```

**Structure decision**: Service worker handles static/shell/navigation; IndexedDB handles quiz domain data because Next.js Server Actions are not SW-cacheable POST equivalents. RSC quiz pages still render online-first; offline reopen uses client hydration from IndexedDB inside `QuizRunner`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [none] | — | — |

## Phase 0 Output

See [research.md](./research.md) — all NEEDS CLARIFICATION items resolved.

## Phase 1 Output

- [data-model.md](./data-model.md) — IndexedDB stores and record shapes
- [contracts/service-worker.md](./contracts/service-worker.md) — cache names, routes, fetch strategies
- [contracts/offline-store.md](./contracts/offline-store.md) — client store API
- [contracts/server-actions.md](./contracts/server-actions.md) — `submitQuiz` sync validation
- [quickstart.md](./quickstart.md) — verification steps

## Constitution Re-check (post-design)

All gates remain PASS. Cached exam fields remain gatekeeper-safe; sync stays server-side via `submitQuiz`; teacher flows untouched.
