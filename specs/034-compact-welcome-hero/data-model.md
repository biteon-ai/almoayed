# Data Model: Compact Welcome Hero

**Feature**: UI-019  
**Persistence**: None. Presentation of existing dashboard props only.

## Entity: Welcome Hero (view model)

| Field | Type | Rules |
|-------|------|--------|
| `studentName` | string | Display name; may be empty → still render greeting shell without crashing |
| `streakDays` | int ≥ 0 | From `StudentGamification.streakDays` |
| `dailyGoalProgress` | number 0–100 | From `StudentGamification.dailyGoalProgress` |
| `density` | `phone` \| `comfortable` | Derived from viewport: phone = `<sm`; comfortable = `sm+` |
| `showSubtitle` | boolean | `false` on phone; `true` on comfortable only if a single short line is used |
| `subtitleText` | string \| null | Short one-liner when `showSubtitle`; never the legacy multi-line motivational block on phone |

### Display invariants

- Greeting + name always visible when hero mounts.
- Daily goal label + progress always visible.
- Streak chip always visible (including `0`).
- Card vertical padding budget: phone ≈ compact (`p-4` class of density); comfortable may be slightly larger but not legacy tall padding.

### Transitions

```text
viewport < sm     → density=phone; showSubtitle=false
viewport ≥ sm     → density=comfortable; showSubtitle=optional short line
goal → 100        → completed label (existing copy) inside same compact row
streak → 0        → chip still mounts; layout stable
```

## Entity: Daily Goal Progress (unchanged semantics)

| Field | Type | Rules |
|-------|------|--------|
| `dailyGoalProgress` | 0–100 | Existing gamification |
| `complete` | boolean | `dailyGoalProgress === 100` |

No schema or calculation changes in this feature.

## Entity: Study Streak (unchanged semantics)

| Field | Type | Rules |
|-------|------|--------|
| `streakDays` | int ≥ 0 | Existing `computeStudyStreak` / gamification aggregate |

No schema or calculation changes in this feature.

## Relationships

```text
StudentDashboardView
  └─ passes studentName + gamification
       └─ StudentDashboardHero (Welcome Hero view)
            ├─ Daily Goal Progress (read-only display)
            └─ Study Streak (read-only display)
```

## Out of scope entities

- Teacher gamification level cards (`LevelProgressCard`, `RewardsHall`)
- Login / landing marketing heroes
- New user preference rows for “show subtitle”
