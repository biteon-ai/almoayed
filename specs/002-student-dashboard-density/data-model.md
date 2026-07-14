# Data Model: Student Dashboard Mobile Density (DASH-001)

**Date**: 2026-07-14  
**Schema source**: Existing migrations — no new tables or columns required.

## Entities (existing tables)

### ExamSubmission (`exam_submissions`)

| Field | Type | Dashboard usage |
|-------|------|-----------------|
| `id` | uuid | Link to results |
| `student_id` | uuid | Filter: `= session.profileId` |
| `quiz_id` | uuid | Join to quiz title |
| `score` | int 0–100 | Stats average + My Scores rows |
| `submitted_at` | timestamptz | Sort recent scores DESC |

**Teacher scope**: Join `quizzes` ON `quiz_id`, filter `quizzes.created_by = session.currentTeacherId`.

**Unique constraint**: One submission per student per quiz — `hasSubmission` is boolean existence check.

### Quiz (`quizzes`)

| Field | Dashboard usage |
|-------|-----------------|
| `id`, `title` | Carousel + scores list |
| `created_by` | Teacher tenant filter |
| `is_free`, `quiz_type`, `target_group_id` | Access via `computeQuizListItem` |
| `is_active` | Only active quizzes in carousel |

### Question (`questions`)

| Field | Dashboard usage |
|-------|-----------------|
| `quiz_id` | Aggregate `questionCount` per quiz |

### CategoryPerformance (computed — QUIZ-002)

Existing `getWeakPoints()` aggregation — unchanged schema; compact tab UI only.

### StudentTeacherOption (existing — MT-001/002)

From `getStudentTeachers()` — rendered in Teachers tab.

## Read models (DTOs — not DB tables)

### DashboardStats

```typescript
interface DashboardStats {
  tier: "free" | "pro";
  completedQuizCount: number;
  overallAverageScore: number; // 0–100 rounded; 0 when count === 0
}
```

**Computation**:
- `tier`: from `student_teachers.tier` for active teacher link
- `completedQuizCount`: count of `exam_submissions` joined to quizzes where `created_by = teacherId`
- `overallAverageScore`: `count === 0 ? 0 : Math.round(sum(scores) / count)`

### RecentScoreRow

```typescript
interface RecentScoreRow {
  quizId: string;
  quizTitle: string;
  score: number;
  submittedAt: string; // ISO
}
```

**Limit**: 5 rows, newest first, current teacher scope.

### QuizCarouselItem (extends QuizListItem)

```typescript
interface QuizCarouselItem extends QuizListItem {
  questionCount: number;
  hasSubmission: boolean;
}
```

**Derived UI**:
- `isAccessible && !hasSubmission` → primary "ابدأ"
- `isAccessible && hasSubmission` → primary "متابعة"
- `isLocked` → upgrade CTA (no navigation to quiz)

### StudentDashboardData (aggregate)

```typescript
interface StudentDashboardData {
  stats: DashboardStats;
  recentScores: RecentScoreRow[];
  quizzes: QuizCarouselItem[];
  weakPoints: CategoryPerformance[];
  teachers: StudentTeacherOption[];
}
```

## Queries (logical)

### Stats + recent scores

```sql
-- Pseudocode: single query or two lightweight queries
SELECT es.score, es.submitted_at, q.id, q.title
FROM exam_submissions es
JOIN quizzes q ON q.id = es.quiz_id
WHERE es.student_id = :profileId
  AND q.created_by = :teacherId
ORDER BY es.submitted_at DESC;
```

Application layer:
- `recentScores` = first 5 rows mapped
- `completedQuizCount` = total row count
- `overallAverageScore` = rounded mean of scores (0 if empty)

### Quiz carousel with counts

Extend existing `getAvailableQuizzes` flow:
1. Fetch active quizzes for teacher (existing).
2. Batch count questions per `quiz_id`.
3. Batch lookup submission existence for student + quiz IDs.

## Validation rules

| Rule | Enforcement |
|------|-------------|
| Teacher scope | All queries include `teacherId` from `getStudentContext()` |
| No cross-teacher scores | Join filter on `quizzes.created_by` |
| Score display | Integer 0–100 with `%` suffix in UI |
| Empty states | Stats show 0/0%; tabs show Arabic empty messages |

## State transitions

### Teacher switch (Teachers tab)

Unchanged MT-002 flow: `switchTeacher(id)` → update session `currentTeacherId` → `router.refresh()` → dashboard reloads all DTOs for new teacher.

### Pro upgrade from locked carousel card

Unchanged TIER-002: `requestProUpgrade()` → pending message on card.

## Security rules

- `requireStudent()` on all dashboard actions
- `getStudentContext()` provides `teacherId`; return empty arrays if null
- No exam answers or explanations on dashboard DTOs
