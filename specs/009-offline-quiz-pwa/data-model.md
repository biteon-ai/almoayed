# Data Model: OFFLINE-001 Offline Quiz PWA

**Scope**: Client-side IndexedDB only — no Supabase schema changes.

**Database name**: `almoayed-offline-v1`  
**Version**: `1`

---

## Object store: `quizPackages`

One record per quiz explicitly opened while online on this device.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `quizId` | string (key) | yes | Primary key |
| `teacherId` | string | yes | Active teacher at cache time (MT-002 context) |
| `quiz` | `Quiz` (metadata subset) | yes | Title, category, `is_free`, etc. — no secrets |
| `questions` | `ExamQuestion[]` | yes | Gatekeeper fields only |
| `questionIds` | string[] | yes | Denormalized for FR-010 checks |
| `cachedAt` | ISO string | yes | When package written |
| `openedAt` | ISO string | yes | Marks offline-startable (clarification Q1) |

**Validation**:
- `assertGatekeeperCompliance(questions)` before write
- Do not write if `existingSubmissionId` already on server (optional skip cache update)

**Lifecycle**:
```
online open quiz → upsert quizPackages[quizId]
offline open → read quizPackages[quizId] or block
LRU evict oldest when >20 packages (never if pending/inProgress references quizId)
```

---

## Object store: `inProgress`

Draft answers before submit.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `quizId` | string (key) | yes | Primary key |
| `answers` | `Record<string, string>` | yes | questionId → selected option |
| `activeIndex` | number | no | Last viewed question index |
| `updatedAt` | ISO string | yes | Last local edit |

**Lifecycle**:
```
answer change → upsert inProgress
offline submit success → delete inProgress, create pendingSubmissions
sync success → delete inProgress if any orphan
```

---

## Object store: `pendingSubmissions`

Completed attempts awaiting server sync.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string (key) | yes | UUID client-generated |
| `quizId` | string | yes | |
| `teacherId` | string | yes | |
| `answers` | `Record<string, string>` | yes | Full attempt |
| `questionIds` | string[] | yes | Keys of `answers` at submit time |
| `queuedAt` | ISO string | yes | |
| `status` | enum | yes | See Sync status below |
| `lastError` | string | no | Arabic-safe message code or text |
| `sessionExpiredAtSubmit` | boolean | no | true if queued while session invalid |

**Sync status enum**:
- `queued` — waiting
- `syncing` — in flight
- `synced` — success (row may be deleted after ack)
- `rejected` — definitive server rejection (FR-010, duplicate resolved)
- `failed-retryable` — network/server transient

**Lifecycle**:
```
offline submit → insert status=queued
online flush → syncing → synced | rejected | failed-retryable
duplicate on server → rejected + user message
```

---

## Object store: `meta`

| Key | Value | Notes |
|-----|-------|-------|
| `quizPackageLru` | string[] | quizIds oldest-first |
| `lastSyncAt` | ISO string | optional telemetry for UI |

---

## Relationships

```text
quizPackages (1) ──< inProgress (0..1 per quizId)
quizPackages (1) ──< pendingSubmissions (0..1 active per quizId at a time)
```

Server entities (unchanged):
- `exam_submissions` — created by `submitQuiz` on successful sync
- `student_answers` — graded rows

---

## State transitions (pending submission)

```text
[queued] --online flush--> [syncing]
[syncing] --success--> [synced] --> (delete local)
[syncing] --duplicate exists--> [rejected] --> (delete local + toast)
[syncing] --quiz inactive / missing QID--> [rejected] --> (retain for support)
[syncing] --network error--> [failed-retryable] --> [queued] on retry
```

---

## IndexedDB vs server source of truth

| Concern | Source of truth |
|---------|-----------------|
| Grading / scores | Server `exam_submissions` |
| Pre-submit exam content offline | Client `quizPackages` (snapshot) |
| Pending attempts pre-sync | Client `pendingSubmissions` |
| Authorization / tier | Server at sync via `submitQuiz` |
