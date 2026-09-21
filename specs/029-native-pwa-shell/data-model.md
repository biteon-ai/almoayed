# Data Model: Native Home-Screen App Experience

**Feature**: UI-012 · UI-013 · DASH-002 · UI-014 · UI-015  
**Persistence**: Device-local only. **No new Supabase tables or migrations.**

Quiz exam rows, submissions, and gatekeeper rules stay as in OFFLINE-001 / QUIZ-001.

## Entity: Appearance preference

Per-device UI appearance. Not tied to `profiles`.

| Field | Type | Rules |
|-------|------|--------|
| `value` | `'light' \| 'dark' \| 'system'` | Default `'system'` when missing/corrupt |
| `storageKey` | `almoayed-appearance` | `localStorage` |
| `htmlClass` | `dark` on `<html>` | Applied when resolved scheme is dark |

### Resolution

1. If `value === 'light'` → light tokens.
2. If `value === 'dark'` → `.dark` class.
3. If `value === 'system'` → `prefers-color-scheme: dark` media.

Invalid JSON or unknown values → treat as `system`. Clearing site data resets to system.

### State transitions

```text
(missing) → system
system  --user picks light--> light
system  --user picks dark-->  dark
light|dark --user picks system--> system (follows OS again)
```

## Entity: Home-screen install prompt state

| Field | Type | Rules |
|-------|------|--------|
| `standalone` | boolean | Derived: `display-mode: standalone` or iOS `navigator.standalone` |
| `dismissedAt` | ISO timestamp \| null | `localStorage["almoayed-a2hs-dismissed-at"]` |
| `sessionHidden` | boolean | In-memory; true after dismiss until tab close |
| `canNativePrompt` | boolean | Chromium `beforeinstallprompt` captured |

### Eligibility (all must hold)

- Signed-in **student**
- Not `standalone`
- Path is not an active quiz (`/quiz/[id]`)
- Phone-oriented viewport (hide on `md+` teacher/desktop)
- `sessionHidden` is false
- `dismissedAt` is null **or** older than 24 hours

### State transitions

```text
eligible → shown
shown --install accepted / appinstalled--> never show
shown --«لاحقاً»--> sessionHidden + dismissedAt=now
shown --quiz starts--> hide (do not set dismissedAt)
```

## Entity: Offline saved quiz (list projection)

Read-only view of existing IndexedDB `quizPackages` (`almoayed-offline-v1`, OFFLINE-001). **No new object store.**

| Field | Source | Rules |
|-------|--------|--------|
| `quizId` | `QuizPackageRecord.quizId` | PK |
| `title` | `quiz.title` | Display |
| `teacherId` | `QuizPackageRecord.teacherId` | **MUST** equal session `currentTeacherId` (MT-002) |
| `openedAt` | `openedAt` | Sort desc |
| `cachedAt` | `cachedAt` | Display optional |
| `hasInProgress` | join `inProgress` by `quizId` | Badge «متابعة» |
| `hasPending` | join `pendingSubmissions` | Badge «بانتظار المزامنة» |

### Validation

- List **must not** include packages for other teachers.
- Opening a row uses existing `getQuizPackage` → `/quiz/{id}`; if missing, Arabic unavailable-offline (OFFLINE-001).
- Question payloads in the package remain exam-only (`assertGatekeeperCompliance` on write; never add `correct_answer` here).

### Signed-out / expired session

Do not render another profile’s list. If IndexedDB has rows but there is no student session, show sign-in guidance and skip the list (same-origin IDB is already per-browser profile, not per Al-Moayed account — still hide UI when signed out).

## Entity: App version label

| Field | Type | Rules |
|-------|------|--------|
| `version` | string | `APP_VERSION` from `src/lib/constants.ts`, synced with `package.json` |
| `display` | Arabic | `الإصدار {version}` |

No server entity. Changing the label is a constants bump, not a migration.

## Entity: Share payload

| Field | Value |
|-------|--------|
| `title` | `المؤيد` |
| `text` | Short Arabic invite (constants) |
| `url` | `https://almoayed.app` (prod public URL; `getAppUrl()` acceptable on non-prod) |

## Related existing entities (unchanged)

| Entity | Use |
|--------|-----|
| `QuizPackageRecord` | Offline list + start |
| `InProgressRecord` | Continue badge |
| `PendingSubmissionRecord` | Pending-sync badge; sync still OFFLINE-001 |
| `profiles` / session | `role`, `currentTeacherId` for drawer visibility and list filter |
| Manifest / icons | UI-001 / UI-003 files in `public/` |

## No SQL

This feature does not add columns to `profiles` for theme or A2HS. Those must work before login completes and while offline.
