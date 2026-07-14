# UI Component Contracts: DASH-001

**Route**: `/dashboard`  
**Layout root**: `dir="rtl"` inherited from app layout; components use logical CSS (`start`/`end`, `text-start`).

---

## `DashboardStatsRow`

**Props**:
```typescript
{ stats: DashboardStats }
```

**Renders**: Horizontal flex row of 3 mini-cards:
1. Tier badge — Free/Pro Arabic label
2. Completed count — integer
3. Average score — `{n}%` or `0%`

**Responsive**: `flex gap-2 overflow-x-auto` if needed on narrow screens; target fit on 390px without wrap.

---

## `QuizCarousel`

**Props**:
```typescript
{ quizzes: QuizCarouselItem[] }
```

**Renders**:
- Section title: الاختبارات المتاحة
- Horizontal scroll container: `overflow-x-auto flex snap-x snap-mandatory gap-3 scrollbar-none`
- Empty state when `quizzes.length === 0`
- Maps each quiz to `QuizCarouselCard`

**Spekit**: `data-spekit={SPEKIT.studentQuizList}` on section

---

## `QuizCarouselCard`

**Props**:
```typescript
{ quiz: QuizCarouselItem }
```

**Accessible variant** (`isAccessible`):
- Title (truncate)
- Question count: `{n} سؤال`
- Button: Link to `/quiz/[id]` — label "ابدأ" or "متابعة" based on `hasSubmission`

**Locked variant** (`isLocked`):
- Dimmed card styling + Lock icon
- Question count shown
- Compact upgrade button → `requestProUpgrade()`
- Spekit: `SPEKIT.proUpgradeCard` / `proUpgradeRequestButton`

---

## `DashboardTabs` (client)

**Props**:
```typescript
{
  recentScores: RecentScoreRow[];
  weakPoints: CategoryPerformance[];
  teachers: StudentTeacherOption[];
  currentTeacherId: string | null;
}
```

**Renders**: Shadcn Tabs with default tab "نتائجي":
| Tab value | Label | Panel |
|-----------|-------|-------|
| `scores` | نتائجي | `MyScoresTab` |
| `weak` | نقاط الضعف | `WeakPointsTab` |
| `teachers` | أساتذتي | `TeachersTab` |

**Constraints**: Tab list visible above fold on 390×844 with stats + carousel present.

---

## `MyScoresTab`

**Props**: `{ scores: RecentScoreRow[] }`

**Renders**: Compact list (max 5 rows): title, score badge, optional date. Empty: "ما في نتائج بعد — حلّ أول اختبار!"

---

## `WeakPointsTab`

**Props**: `{ categories: CategoryPerformance[] }`

**Renders**: Row per category — tag, percentage, weak/strong badge. No SVG rings. Empty: shortened QUIZ-002 onboarding message.

**Spekit**: `SPEKIT.weakPointsCard` on container

---

## `TeachersTab`

**Props**: `{ teachers, currentTeacherId }`

**Renders**: `TeacherSwitcher` (existing component). Spekit: `SPEKIT.teacherSwitcher`

---

## `tabs.tsx` (new primitive)

Exports: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

**Requirements**:
- Keyboard navigable (Base UI default)
- RTL-safe trigger order
- Touch-friendly triggers: min `h-10`

---

## Mobile welcome (inline in page)

```tsx
<h1 className="text-lg font-bold md:text-xl">أهلاً {name} 👋</h1>
<p className="hidden text-sm text-muted-foreground md:block">...</p>
```

**Spekit**: `SPEKIT.studentWelcome` on section
