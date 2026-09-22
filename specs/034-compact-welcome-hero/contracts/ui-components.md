# Contracts: UI components (UI-019)

Locale `ar-SY`, page `dir="rtl"`. Compacts the shared student welcome hero only.

## `StudentDashboardHero`

**Mount**: `StudentDashboardView` (and any future student surface that reuses this component).  
**Spekit**: `student-welcome` (`SPEKIT.studentWelcome`) on the root `<section>`.  
**DOM id**: `student-welcome` (hash / `student-nav` scroll target — do not rename).

### Props (unchanged)

| Prop | Type | Notes |
|------|------|--------|
| `studentName` | `string` | May wrap onto multiple lines; must not clip with ellipsis |
| `gamification` | `StudentGamification` | Uses `streakDays`, `dailyGoalProgress` |

### Layout contract

| Region | Phone (`<sm`) | Comfortable (`sm+`) |
|--------|---------------|---------------------|
| Section padding | Compact (`p-4` class of density) | Slightly roomier, **not** legacy `p-8` |
| Motivational subtitle | **Hidden** | Optional **single** short line only |
| Greeting + name | Visible; **wraps** with `break-words` (no ellipsis clipping) | Visible |
| Daily goal | Label + thin progress; no overflow | Same |
| Streak chip | Compact; fully visible; no overflow | Same |

### Content rules

- **Must show**: personalized greeting, student name, daily goal progress, streak days.
- **Must not show on phone**: multi-line copy such as «استمر في إنجاز الاختبارات اليومية…».
- **Must not**: introduce collapsible “read more”; change Spekit id; restyle unrelated headers/empty states.

### Accessibility

- Heading remains a single clear greeting (`h1` or equivalent).
- Progress control keeps an accessible name (existing goal labeling).
- Decorative blur/background remains non-interactive (`pointer-events-none`).

## Unchanged

- Gamification calculation (`student-gamification.ts`)
- Dashboard action tiles / stats row / tabs below the hero
- Teacher, login, and landing heroes
- `#welcome` → `#student-welcome` navigation behavior
