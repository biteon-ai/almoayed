# Contracts: Quiz Timer Server Actions (QUIZ-004)

## Teacher

### `createQuiz` / quiz update (extend)

Form fields (Arabic UI):
- `is_timed` — checkbox/switch «تفعيل التوقيت»
- `duration_minutes` — number «مدة الاختبار بالدقائق» when timed

Server validation:
- If timed: parse int, require `1 <= n <= 180`, else Arabic error
- If not timed: persist `is_timed=false`, `duration_minutes=null`
- Scope: `created_by = requireTeacher().profileId`

## Student

### `ensureTimedQuizSession(quizId): Promise<TimedQuizSessionView | null>`

1. `requireStudent()`; resolve active teacher; load quiz via existing access rules (`getQuizForStudent` gate)
2. If existing `exam_submissions` for pair → return `null` (already graded)
3. If existing `quiz_timed_sessions` row → return view from that row (ignore current quiz duration edits)
4. Else if quiz `is_timed` and `duration_minutes` valid → INSERT session with snapshot; return view
5. Else → `null` (untimed)

`TimedQuizSessionView`:
```ts
{
  startedAt: string;       // ISO
  durationMinutes: number; // snapshot
  endsAt: string;          // ISO
  remainingSeconds: number; // max(0, …) from server now
}
```

### `getQuizForStudent` (extend)

Return includes `timer: TimedQuizSessionView | null` (calls ensure when appropriate). **Still** uses `EXAM_QUESTION_SELECT_FIELDS` without correct answers (QUIZ-001).

### `submitQuiz(quizId, answers)` (extend)

1. Existing gates (access, unique submission, grade, QUIZ-001 post-submit results)
2. If `quiz_timed_sessions` exists for pair: compute deadline from session only; **do not** reject submit for being past deadline
3. Do not accept client-supplied `startedAt` / `durationMinutes`
4. Future answer-save APIs MUST call shared `assertTimedSessionAllowsMutation(session)` → error Arabic if past deadline

## Client helper contract

`src/lib/quiz-timer.ts`:
- `formatRemainingMmSs(totalSeconds: number): string` — minutes unbounded, seconds `00`–`59`
- `isWarningRemaining(seconds: number): boolean` — `seconds > 0 && seconds <= 120`
- `validateDurationMinutes(n: unknown): { ok: true; value: number } | { ok: false; error: string }`
