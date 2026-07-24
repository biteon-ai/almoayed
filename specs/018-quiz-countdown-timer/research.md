# Research: Quiz Countdown Timer (QUIZ-004)

**Date**: 2026-07-24  
**Status**: Complete — all Technical Context items resolved

## 1. Where to store quiz timer settings

**Decision**: Add `quizzes.is_timed BOOLEAN NOT NULL DEFAULT false` and `quizzes.duration_minutes INTEGER NULL` with CHECK (`duration_minutes IS NULL OR (duration_minutes BETWEEN 1 AND 180)`). When `is_timed = false`, `duration_minutes` MUST be NULL.

**Rationale**: Spec FR-001–003; teacher-owned quiz row already holds flags (`is_free`, `is_active`). Matches user brief column names. Range 1–180 from clarification Q4.

**Alternatives considered**:
- Separate `quiz_timer_settings` table — rejected; 1:1 with quiz, extra join noise.
- Duration in seconds — rejected; teacher UX is minutes; convert to seconds only in remaining-time math.

## 2. Where to store attempt start + duration snapshot

**Decision**: New table `quiz_timed_sessions`:

| Column | Purpose |
|--------|---------|
| `id` | PK |
| `student_id`, `quiz_id` | UNIQUE pair — one open timed clock per student/quiz |
| `started_at` | Server timestamp when runner first successfully opened |
| `duration_minutes` | Snapshot at start (FR-015) |
| `created_at` | Audit |

No row for untimed quizzes. Deleted when submission completes is **optional**; keeping the row after submit is fine (submit path already unique on `exam_submissions`). Prefer **retain** for audit; submit does not require deleting the session.

**Rationale**: Today `exam_submissions` exists only **after** grade — cannot hold pre-submit `started_at`. Clarifications require server wall-clock + snapshot independent of later quiz edits. UNIQUE(student_id, quiz_id) aligns with single-attempt QUIZ-001.

**Alternatives considered**:
- Client-only `localStorage` start — rejected; refresh/cheat reset (FR-005).
- Columns on `exam_submissions` with draft score — rejected; would invent pre-submit submissions and break “insert on submit” uniqueness flow.
- Store snapshot only in iron-session cookie — rejected; multi-device / clear-cookies weak; not durable.

## 3. Server Actions layout

**Decision**:
- Teacher create/update timer fields → `src/actions/teacher.ts` (`createQuiz`, edit flags / update quiz metadata — same ownership as TEACH-003).
- Student: `ensureTimedQuizSession(quizId)` + extend `getQuizForStudent` / `submitQuiz` in `src/actions/quiz.ts`.
- Pure helpers: `src/lib/quiz-timer.ts` (remaining seconds, `MM:SS` format, deadline checks, duration validation 1–180).

**Rationale**: Constitution Server Actions + existing file ownership. Keep grading/gatekeeper in `quiz.ts`.

**Alternatives considered**:
- New `actions/quiz-timer.ts` — unnecessary for two entrypoints.
- All timer logic in `QuizRunner` only — fails FR-014 server enforcement.

## 4. Enforcing deadline without mid-exam answer APIs (FR-014)

**Decision**:
- Answers remain client-local until `submitQuiz` (current design). There is **no** separate server “save answer” mutation today.
- **FR-014 interpretation for v1**:
  1. `ensureTimedQuizSession` / reopen path: if `now >= endsAt` and no submission → lock UI + auto-call `submitQuiz` (clarification Q1).
  2. `submitQuiz` always allowed after expiry (with current answer payload).
  3. If any future mid-attempt answer-save API is added, it MUST reject when `now >= endsAt`.
  4. Do **not** create a new session after expiry; reopen uses existing session and forces submit.
- Optional hardening (same PR if cheap): `submitQuiz` records `timed_session_id` / ignores client-supplied duration; deadline computed only from DB session row.

**Rationale**: Clarification Q2 requires server enforcement of mutations vs submit. Without mid-save endpoints, reopen + single submit path is the enforceable surface; documenting the future-save rule prevents regression.

**Alternatives considered**:
- Periodic server draft saves — out of scope; larger offline conflict surface.
- Reject submit after deadline — contradicts auto-submit / late reopen.

## 5. `getQuizForStudent` payload for timer

**Decision**: Extend return type with optional `timer: { startedAt: string; durationMinutes: number; endsAt: string; remainingSeconds: number } | null`.

- Untimed → `timer: null`.
- Timed + no existing submission → call `ensureTimedQuizSession` (idempotent insert) then compute remaining from server `now`.
- Timed + already submitted → `timer: null` (runner shows results; no countdown).
- Timed + session exists and `remainingSeconds <= 0` → still return timer with `remainingSeconds: 0` so client can auto-submit immediately.

**Rationale**: One round-trip on page load; server clock is source of truth (SC-003).

## 6. Display format & warning

**Decision**: Format as `MM:SS` with **unbounded minutes** (`padStart(2)` on seconds only; minutes can be `125`). Warning when `0 < remainingSeconds <= 120`. Pulse via CSS on badge (`data-spekit="quiz-timer"`).

**Rationale**: Clarification Q3; FR-004/006.

## 7. Teacher UI surfaces

**Decision**: Add «تفعيل التوقيت» + conditional «مدة الاختبار بالدقائق» to:
- `QuizCreateForm` / wizard create path
- Quiz edit flags UI (`updateQuizFlags` or dedicated update fields on edit dashboard — match wherever title/flags already edit)

Validate 1–180 client + server.

**Rationale**: Spec US1; create form is the primary TEACH-003 surface (user named `quiz-form.tsx`; repo uses `QuizCreateForm.tsx`).

## 8. Offline / PWA interaction

**Decision**: Wall-clock still applies. If offline at expiry, keep answers locked in UI; enqueue submit when online (existing pending queue). Do not reset session start from client. If session already expired when coming online, flush submit immediately.

**Rationale**: Spec wall-clock + existing OFFLINE-001 queue; no pause-on-blur.

## 9. Lean selects / types

**Decision**: Append `is_timed, duration_minutes` to `QUIZ_LIST_SELECT` and `Quiz` type (needed by runner + teacher lists). Catalog cards may ignore the fields.

**Rationale**: PERF lean-select discipline; avoid `select *`.

## 10. Tests & registry

**Decision**: Vitest `tests/features/quiz-004-countdown-timer.test.ts` for duration validation, remaining-time math, deadline reject helpers, ensure-session idempotency (mocked Supabase). Update `.speckit/spec.yaml` QUIZ-004 + Spekit `quiz-timer`. `npm run build`.

**Alternatives considered**: Full Playwright timer wait — flaky; prefer unit + short e2e smoke of badge presence when `is_timed` fixture exists (optional).
