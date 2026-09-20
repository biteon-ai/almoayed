# Data Model: Mobile Quiz Player Redesign

**Feature**: UI-016  
**Persistence**: No new Supabase tables or migrations. Reuse OFFLINE-001 IndexedDB `inProgress`.

Exam questions, submissions, and gatekeeper payloads stay as QUIZ-001 / QUIZ-004.

## Entity: In-progress attempt (existing)

Device-local draft. Exit confirm **flushes** this record; it does not create a submission.

| Field | Type | Rules |
|-------|------|--------|
| `quizId` | string | PK in `inProgress` store |
| `answers` | `Record<questionId, optionText>` | Only chosen options; empty object allowed |
| `activeIndex` | number \| undefined | Restored on reopen; clamped to `[0, n-1]` |
| `updatedAt` | ISO timestamp | Set on each save |

### Validation

- Confirming exit MUST call `saveInProgress` (not only the debounced writer) before navigation.
- Submit still requires every `questionId` to have a non-empty answer (existing runner validation).
- Draft MUST NOT contain `correct_answer` or explanations.

### State transitions

```text
(open quiz, no draft) → empty answers, activeIndex=0
answer / jump        → debounce save
confirm exit         → flush save → leave (still in-progress)
submit success       → clear in-progress (existing) → review
expiry auto-submit   → same as submit path
```

## Entity: Question card view

Presentation of **one** exam question. Not stored separately.

| Field | Source | Rules |
|-------|--------|--------|
| `index` | `activeIndex` | Display «السؤال {index+1}» |
| `stem` | `question_text` + optional image | Math/plain Unicode unchanged |
| `options[]` | `question.options` | Letter A… via `String.fromCharCode(65 + i)` |
| `selected` | `answers[questionId]` | Single select |
| `showResult` | `isSubmitted` | Only then: correct/wrong/explanation/category |

### Validation

- Pre-submit: `correctAnswer`, `explanationText`, `explanationMediaUrl`, `categoryTag` MUST be omitted from the answering chrome (category chip is review-only).
- Selected visual state uses `#065f46` only when `!showResult && selected`.

## Entity: Pager item

One number in the horizontal pager / jump sheet.

| Field | Type | Rules |
|-------|------|--------|
| `index` | 0-based | Display `index + 1` |
| `status` | see below | Derived; never encodes the correct key |

### Status (taking)

| Status | When |
|--------|------|
| `active` | `index === activeIndex` |
| `answered` | `answers[questionId]` is non-empty and not active |
| `default` | unanswered and not active |

### Status (review, after submit)

| Status | When |
|--------|------|
| `active` | current card |
| `correct` / `wrong` | from `QuizSubmitResult.answers[].isCorrect` |
| `unanswered-review` | missing result row |

## Entity: Timer readout (QUIZ-004)

| Field | Type | Rules |
|-------|------|--------|
| `remainingSeconds` | number | From `endsAt` snapshot; never client-reset |
| `visible` | boolean | `timer != null` and not submitted |
| `warning` | boolean | `0 < remainingSeconds <= 120` |
| `label` | «الوقت المتبقي» | Hidden when untimed |

Expiry (`remainingSeconds === 0`) still locks answers and auto-submits. Header must not re-enable choices.

## Entity: Exit guard

Ephemeral UI state. Not persisted.

| Field | Type | Rules |
|-------|------|--------|
| `dialogOpen` | boolean | Header exit or intercepted Back |
| `historyArmed` | boolean | True only while taking (see `shouldConfirmQuizExit`) |

### `shouldConfirmQuizExit`

True when all hold:

- not submitted
- not pending-sync
- `questions.length > 0`
- not showing expiry auto-submit notice

False → header back is a plain navigation; no `popstate` intercept.

## Relationships

```text
Quiz (server) 1──* ExamQuestion (exam fields only until submit)
      │
      └── In-progress attempt (IDB, optional)
              ├── answers → questionId
              └── activeIndex → Question card view
                      ├── Pager items (1 per question)
                      └── Timer readout (0..1)
```
