# Data Model: Quiz Header Polish

**Feature**: UI-018  
**Persistence**: None. Derived from existing in-progress answers + timed session view.

## Entity: Card-header action row

| Field | Type | Rules |
|-------|------|--------|
| `taking` | boolean | `!isSubmitted && !pendingSync && !timeLocked && questionCount > 0` |
| `submitVisible` | boolean | `true` whenever `taking` |
| `submitEnabled` | boolean | `taking && complete && !isPending` |
| `stepperAlign` | visual right | Physical right of the card header (`dir="ltr"` + `ms-auto` on pager) |

Review-after-submit: compact taking submit is hidden; stepper may stay for review navigation.

### Transitions

```text
start taking            → submit visible + disabled (unless already complete)
answer last blank       → submitEnabled true
tap disabled submit     → no state change
tap enabled submit      → confirm dialog (existing)
cancel confirm          → still taking
confirm / expiry        → taking chrome hides
```

## Entity: Attempt completeness (unchanged UI-017)

| Field | Type | Rules |
|-------|------|--------|
| `questionIds` | string[] | Exam order |
| `answers` | `Record<id, string>` | Selected option text |
| `complete` | boolean | `n > 0` and every id has non-empty trim |

Empty quiz: `complete` false; no compact submit CTA.

## Entity: Time remaining fraction (new)

| Field | Type | Rules |
|-------|------|--------|
| `remainingSeconds` | int ≥ 0 | Existing tick from `endsAt` |
| `durationMinutes` | int 1–180 | Attempt snapshot (`TimedQuizSessionView`) |
| `fraction` | number `[0, 1]` | `remainingSeconds / (durationMinutes * 60)` clamped; `0` if duration ≤ 0 |
| `warning` | boolean | Existing `isWarningRemaining` (0 < remaining ≤ 120) |
| `showBar` | boolean | Timed taking only (`timer` present and not submitted) |

### Transitions

```text
tick (1s)     → remainingSeconds--; fraction shrinks
warning window → bar uses warning accent
00:00         → fraction 0; auto-submit (existing); bar not “still counting”
untimed       → no entity / no bar
```

## Relationships

```text
answers + questionIds → complete → compact submit enabled
timer.durationMinutes + remainingSeconds → fraction → timer bar width
taking → action row layout (submit left, stepper right)
```
