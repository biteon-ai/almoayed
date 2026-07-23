# Server Action Contracts: OFFLINE-001

**Module**: `src/actions/quiz.ts`  
**Auth**: Existing `requireStudent()` + `getQuizForStudent` guards unchanged

---

## Existing (extended)

### `getQuizForStudent(quizId)`

No signature change. **Client responsibility**: after successful online page load, call `saveQuizPackage()` from `QuizRunner` useEffect.

---

### `submitQuiz(quizId, answers)`

**Signature** (unchanged):

```typescript
submitQuiz(
  quizId: string,
  answers: Record<string, string>
): Promise<QuizSubmitResult>
```

**New validation** (before insert, after `getQuizForStudent`):

1. Fetch live question IDs for `quizId` (ordered).
2. If quiz not active → throw `AppError(ErrorCode.QUIZ_INACTIVE)` *(add code if missing)*.
3. If `Object.keys(answers)` contains ID not in live set → throw `AppError(ErrorCode.QUIZ_CHANGED)`.
4. If live set has fewer questions than answer keys → treat as `QUIZ_CHANGED` (full reject per FR-010).
5. Existing duplicate submission short-circuit unchanged (FR-009).

**Grading**: Unchanged — compare `student_answer` to `correct_answer` server-side only.

**Offline sync**: `flushPendingSubmissions` calls this action; no separate sync endpoint.

---

## New error codes (if not present)

Add to `src/lib/app-errors.ts`:

| Code | Arabic message intent |
|------|-------------------------|
| `QUIZ_INACTIVE` | Quiz no longer available |
| `QUIZ_CHANGED` | Quiz updated; cannot accept offline attempt |

Map in `toUserMessage` for sync UI.

---

## Optional helper (internal)

```typescript
validateQuizAttemptAgainstLive(
  quizId: string,
  answerQuestionIds: string[]
): Promise<{ ok: true } | { ok: false; code: ErrorCode }>
```

Pure server helper called from `submitQuiz` — not exported to client directly.

---

## Security notes

- Never accept client-supplied `teacherId` for grading authority — always derive from session + `getStudentContext`.
- Pending queue stores `teacherId` for UI only; server ignores client copy.
- Gatekeeper: offline cache must not include `correct_answer`; server loads grading fields only at submit time.

---

## Registry

Update `.speckit/spec.yaml` with feature `OFFLINE-001` linking:
- `public/sw.js`, `public/offline.html`
- `src/lib/offline/*`
- `src/components/pwa/*`
- Extended `QuizRunner`, `submitQuiz`
