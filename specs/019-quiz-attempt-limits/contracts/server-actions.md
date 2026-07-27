# Contracts: Quiz Attempt Limits Server Actions (QUIZ-005)

## Teacher

### `createQuiz` / quiz update (extend)

Form fields (Arabic UI):
- `assessment_category` — `practice` | `evaluation` | `challenge` («نوع الاختبار»)
- `max_attempts_unlimited` — checkbox/toggle «غير محدود»
- `max_attempts` — integer 1–10 when not unlimited (hidden or ignored when unlimited)

Server validation:
- Parse category enum; reject unknown values with Arabic error
- If unlimited: persist `max_attempts = 0`
- Else: require integer `1 <= n <= 10`
- Scope: `created_by = requireTeacher().profileId`

Category default mapping (when client sends category change without custom override):
- `practice` → `max_attempts = 0` unless explicit custom value sent
- `evaluation` → `max_attempts = 1`
- `challenge` → `max_attempts = 1`

## Student

### `getQuizForStudent(quizId)` (extend)

Existing return +:

```ts
attemptState: {
  usedAttempts: number;
  maxAttempts: number;              // 0 = unlimited
  canStartNewAttempt: boolean;
  bestScore: number | null;
  latestSubmissionId: string | null;
  reviewSubmissionId: string | null;
}
```

Rules:
1. `usedAttempts` = count of `exam_submissions` for `(student, quiz)`
2. `canStartNewAttempt = maxAttempts === 0 || usedAttempts < maxAttempts`
3. When `canStartNewAttempt === false` and `latestSubmissionId` set → client loads review results (same as today’s exhausted path)
4. When `canStartNewAttempt === true` → `initialResults` null even if prior submissions exist (fresh attempt)
5. Still uses `EXAM_QUESTION_SELECT_FIELDS` without correct answers on fresh attempts (QUIZ-001)

### `ensureTimedQuizSession(quizId)` (extend)

1. If `!attemptState.canStartNewAttempt` → return `null`
2. If starting new attempt after prior submit → delete existing `quiz_timed_sessions` row for pair
3. Else existing QUIZ-004 idempotent insert / reuse in-flight session

### `submitQuiz(quizId, answers)` (extend)

1. Load `quiz.max_attempts` and `usedAttempts`
2. If `max_attempts > 0 && usedAttempts >= max_attempts` → throw `QUIZ_ATTEMPTS_EXHAUSTED` (Arabic)
3. **Remove** early return that short-circuits when any submission exists
4. INSERT new `exam_submissions` row (always on success)
5. If retakes remain and quiz timed → delete `quiz_timed_sessions` after submit; if exhausted → keep session (audit)
6. QUIZ-001 post-submit results unchanged

### `getChallengeLeaderboard(quizId)` (NEW — P2)

1. `requireStudent()`; verify quiz access + `assessment_category === 'challenge'`
2. Aggregate best score per student; rank by score DESC, submit time ASC
3. Return ranked rows with display name only (no phone)
4. Include `viewerEntry: { rank, score } | null` when caller has submitted

## Helpers (`src/lib/quiz-attempts.ts`)

```ts
validateMaxAttempts(input: { unlimited: boolean; value: unknown }):
  { ok: true; value: number } | { ok: false; error: string }

categoryDefaultMaxAttempts(category: AssessmentCategory): number

canStartNewAttempt(used: number, max: number): boolean  // max=0 → true until... always true if unlimited

formatAttemptProgressAr(used: number, max: number): string  // e.g. «محاولة 2 من 3»
```

## Error codes (extend `app-errors`)

| Code | Arabic message (summary) |
|------|--------------------------|
| `QUIZ_ATTEMPTS_EXHAUSTED` | لا تبقى محاولات لهذا الاختبار |
