# Client Offline Store Contract: OFFLINE-001

**Module**: `src/lib/offline/`  
**Consumer**: `QuizRunner`, `OfflineSyncProvider`, dashboard/quizzes pending badges

---

## `openOfflineDb()`

Opens IndexedDB `almoayed-offline-v1` version `1` with stores: `quizPackages`, `inProgress`, `pendingSubmissions`, `meta`.

---

## `saveQuizPackage(input)`

```typescript
saveQuizPackage(input: {
  quiz: Quiz;
  questions: ExamQuestion[];
  teacherId: string;
}): Promise<void>
```

- Runs `assertGatekeeperCompliance(questions)` before write
- Sets `openedAt` + `cachedAt` to now
- Updates `meta.quizPackageLru` (MRU)
- Enforces LRU cap (~20) evicting packages without pending/inProgress

---

## `getQuizPackage(quizId)`

```typescript
getQuizPackage(quizId: string): Promise<QuizPackageRecord | null>
```

Returns null if never opened online on this device.

---

## `saveInProgress(quizId, state)`

```typescript
saveInProgress(
  quizId: string,
  state: { answers: Record<string, string>; activeIndex?: number }
): Promise<void>
```

Debounced calls from `QuizRunner` on answer change (e.g. 300ms).

---

## `getInProgress(quizId)`

Returns draft or null.

---

## `enqueuePendingSubmission(input)`

```typescript
enqueuePendingSubmission(input: {
  quizId: string;
  teacherId: string;
  answers: Record<string, string>;
  questionIds: string[];
  sessionExpiredAtSubmit?: boolean;
}): Promise<PendingSubmissionRecord>
```

- Generates UUID `id`
- Initial `status: "queued"`
- Clears `inProgress` for `quizId`

---

## `listPendingSubmissions()`

Returns all records where `status` in `queued | failed-retryable | syncing`.

---

## `flushPendingSubmissions(options?)`

```typescript
flushPendingSubmissions(options?: {
  manual?: boolean;
}): Promise<FlushResult>

type FlushResult = {
  synced: number;
  rejected: number;
  failed: number;
};
```

**Behavior**:
1. No-op if `!navigator.onLine`
2. For each pending (FIFO):
   - Set `syncing`
   - Call `submitQuiz(quizId, answers)` (Server Action)
   - On success → mark `synced`, remove record, emit UI event
   - On duplicate/existing → `rejected`, remove, Arabic toast
   - On `QUIZ_CHANGED` / inactive → `rejected`, retain record
   - On network/5xx → `failed-retryable`, keep queued
3. If session missing (action throws auth error) → stop flush; keep queue

**Triggers** (via `OfflineSyncProvider`):
- `online` event
- Post-login success (layout detects session + pending count > 0)
- Manual button (`options.manual: true`)

---

## UI components

### `OfflineStatusBanner`

- Visible when `!navigator.onLine` during quiz
- Arabic: offline + saved locally on this device
- `data-spekit={SPEKIT.offlineStatusBanner}`

### `PendingSyncBadge`

- On dashboard/quizzes when pending count > 0
- Shows count + **«مزامنة الآن»** when online
- `data-spekit={SPEKIT.pendingSyncBadge}` / `SPEKIT.offlineSyncNow`

---

## Error copy (Arabic)

| Code | User message (summary) |
|------|------------------------|
| offline-unavailable | Quiz not available offline — reconnect and open online first |
| pending-queued | Attempt saved; will sync when connection returns |
| sync-in-progress | Syncing submissions… |
| sync-complete | Submissions synced successfully |
| sync-rejected-changed | Quiz changed; contact teacher |
| sync-duplicate | Already submitted on another device |

Use `toUserMessage` / `uiMessage` patterns where applicable.
