# Quickstart: Offline Quiz PWA (OFFLINE-001)

## Prerequisites

- Branch `009-offline-quiz-pwa`
- Local `.env` with Supabase + `SESSION_SECRET`
- Demo student: WhatsApp `963987654321` (linked to demo teacher)

```bash
npm install
npx supabase db push   # no new migration expected
npm run dev
```

Use Chrome DevTools → **Application** → Service Workers + IndexedDB for inspection.

---

## Manual QA path

### 1. Register service worker

1. Log in as demo student → visit `/dashboard` (registers SW from student layout).
2. DevTools → Application → Service Workers: `sw.js` activated.

### 2. Cache quiz for offline (clarification Q1)

1. While **online**, open `/quizzes` then open a specific quiz (`/quiz/[id]`).
2. Confirm quiz loads normally.
3. DevTools → IndexedDB → `almoayed-offline-v1` → `quizPackages` has entry with `openedAt`.

### 3. Take quiz offline

1. DevTools → Network → **Offline** (or airplane mode).
2. Reload `/quiz/[id]` — questions load from IndexedDB.
3. Answer all questions → submit.
4. Confirm Arabic pending-sync message; **no** scores/explanations shown.
5. Confirm `pendingSubmissions` store has `status: queued`.

### 4. Block never-opened quiz offline

1. Stay offline; open `/quizzes` (cached list may show).
2. Tap a quiz **never opened** while online → Arabic unavailable-offline message.

### 5. Auto sync on reconnect

1. Network **Online**.
2. Within ~2 minutes, pending submission syncs (check Supabase `exam_submissions` or UI results).
3. Pending record removed locally; normal post-submit UI appears.

### 6. Manual sync

1. Queue another offline attempt (or simulate `failed-retryable`).
2. Tap **«مزامنة الآن»** on dashboard/quizzes → retry without re-entering answers.

### 7. Session expiry + re-login

1. Queue submission offline; clear session cookie (or wait for expiry).
2. Re-login while online → auto-sync runs without manual resubmit.

### 8. Offline fallback page

1. Offline → navigate to uncached URL (e.g. `/settings` if never visited).
2. Confirm Arabic `offline.html` with retry button.

### 9. Gatekeeper check

1. Inspect IndexedDB `quizPackages` questions — must **not** contain `correct_answer`, `explanation_text`.

---

## Automated checks (after implement)

```bash
npm run lint
npm run typecheck
npm run test:unit    # offline-001 store/sync tests
npm run test:e2e     # e2e/offline-quiz.spec.ts
npm run build
```

---

## Registry

After behavior lands, add **OFFLINE-001** to `.speckit/spec.yaml` with acceptance criteria from spec FR-001–FR-014 and SC-001–SC-007.
