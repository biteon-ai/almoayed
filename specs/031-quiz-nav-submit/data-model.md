# Data Model: Quiz Navigation and Safe Submit

**Feature**: UI-017  
**Persistence**: None. Derived from existing in-progress answers + question list.

## Entity: Question position

| Field | Type | Rules |
|-------|------|--------|
| `activeIndex` | 0-based int | Clamped `[0, n-1]` |
| `canPrev` | boolean | `activeIndex > 0` |
| `canNext` | boolean | `n > 0 && activeIndex < n - 1` |

### Transitions

```text
التالي  → min(n-1, activeIndex+1)
السابق → max(0, activeIndex-1)
pager / كل الأسئلة → set index
```

## Entity: Answer completeness

| Field | Type | Rules |
|-------|------|--------|
| `questionIds` | string[] | Exam order |
| `answers` | `Record<id, string>` | Selected option text |
| `complete` | boolean | `n > 0` and every id has non-empty trim |
| `remaining` | number | Count of ids without a non-empty answer |

Empty quiz (`n === 0`): `complete` is false; no submit.

### Transitions

```text
select option → remaining may drop; complete may become true
(no clear-choice control today → complete stays true until submit)
submit success → review; completeness UI hidden
```

## Entity: Submit confirmation (ephemeral)

| Field | Type | Rules |
|-------|------|--------|
| `open` | boolean | Only if `complete && !isSubmitted && !timeExpiredNotice` |
| `copy` | Arabic | Title/description per contract |

Not persisted. Closed on cancel, successful submit start, or expiry auto-submit.

## Relationships

```text
In-progress answers + questionIds → completeness → submit enabled
activeIndex + n → canPrev / canNext
completeness + user tap → confirmation → existing submitQuiz / offline enqueue
expiry → submitAttempt(force)  (bypasses confirmation)
```
