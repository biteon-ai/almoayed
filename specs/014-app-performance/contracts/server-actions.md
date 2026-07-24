# Contracts: Server Actions (PERF-001 / 002)

## Auth helpers (request-scoped)

| Helper | Contract |
|--------|----------|
| `requireStudent()` | Idempotent within one RSC/action request tree via React `cache()`. Returns same session shape as today. Still enforces AUTH-003 device lock exactly once per request. |
| `requireTeacher()` | Same memoization rules. Layout + page may both call it without double DB lock hits. |

**Non-goals**: Changing cookie name, session fields, or WhatsApp login flows.

---

## Teacher dashboard

### `getTeacherDashboardAnalytics()`

**Before**: Multiple Supabase round-trips + `quizzes.select("*")` + Node `computeTeacherDashboardAnalytics`.

**After**:

1. `requireTeacher()` (cached).
2. `rpc('get_teacher_dashboard_analytics', { p_teacher_id: session.profileId })`.
3. Map JSON → existing UI props type for `TeacherDashboardAnalytics`.

**Guarantees**:
- Results scoped only to `session.profileId` (MT-002).
- No quiz answer/explanation columns in payload.
- On RPC failure: Arabic recoverable error for the analytics section; page shell still renders.

### List loaders (students / quizzes / groups)

- Replace blanket `select("*")` with documented column lists per screen.
- Keep `revalidatePath` behavior on writes unchanged.

---

## Student dashboard

### `getStudentDashboardData()` / `fetchStudentQuizBundle`

- Single top-level `requireStudent` in the page/loader; nested helpers must not re-trigger device lock (rely on cached require* or accept session passed in — prefer cached require*).
- Lean quiz list columns for dashboard cards.
- Preserve `currentTeacherId` filtering for teacher-scoped progress (MT-002).
- Weak points / gamification may stay separate calls but should run in `Promise.all` where independent.

### Quiz exam path

- `getQuizForStudent` / gatekeeper select lists **unchanged** (QUIZ-001).
- Do not wrap exam question payloads in shared caches that could serve post-submit fields pre-submit.

---

## Writes

All mutations remain Server Actions + `createAdminClient()`. PERF work does not introduce client Supabase writes.
