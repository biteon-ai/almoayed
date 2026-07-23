# Data Model: Teacher-Driven Gamification (GAMIF-001)

## Entity: Gamification Tier

**Table**: `gamification_tiers`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, `gen_random_uuid()` | |
| `teacher_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE, INDEX | Owner teacher |
| `level_number` | `int` | NOT NULL, CHECK ≥ 1 | Ordered position; unique per teacher |
| `level_name` | `text` | NOT NULL, trim non-empty | e.g. مبتدئ |
| `min_completed_quizzes` | `int` | NOT NULL DEFAULT 0, CHECK ≥ 0 | Distinct completed quizzes |
| `min_avg_score` | `numeric(5,2)` | NOT NULL DEFAULT 0, CHECK 0–100 | Percentage |
| `icon_type` | `text` | NOT NULL, CHECK IN (`cup`,`diamond`,`star`,`shield`,`badge`) | Reward icon |
| `created_at` | `timestamptz` | NOT NULL DEFAULT NOW() | |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT NOW() | |

**Constraints**:
- `UNIQUE (teacher_id, level_number)`
- Soft product max **20** rows per `teacher_id` (enforced in Server Action; optional DB trigger deferred)

**RLS**: Enable RLS. With admin client from Server Actions, policies may mirror other teacher tables (service role bypass). Prefer deny-by-default policies; all app access via admin client + `requireTeacher` / `requireStudent`.

**Migration file**: `supabase/migrations/007_gamification_tiers.sql`

---

## Derived: Student Gamification Status (not stored)

Computed in `src/lib/teacher-gamification.ts` from:

1. Tiers for `teacher_id` ordered by `level_number` ASC  
2. Submissions: `exam_submissions` ⋈ `quizzes` where `quizzes.created_by = teacher_id` and `exam_submissions.student_id = student_id`

| Field | Derivation |
|-------|------------|
| `totalQuizzesCompleted` | `COUNT(DISTINCT quiz_id)` (or row count given unique constraint) |
| `averageScorePercentage` | `AVG(score)` over those rows; `0` if none |
| `currentTier` | Highest tier where `total >= min_completed_quizzes` AND `avg >= min_avg_score`; else `null` (not yet leveled) |
| `nextTier` | First tier above current (or first tier if current null) that is not yet met; else `null` at top |
| `progressFill` | `min(quizProgress, scoreProgress)` toward `nextTier` (0–1); `1` if no next |
| `remainingQuizzes` | `max(0, next.min_completed_quizzes - total)` |
| `remainingScorePoints` | `max(0, next.min_avg_score - avg)` |
| `badges[]` | Each tier → `{ tierId, levelName, iconType, unlocked: meets thresholds }` |

---

## Relationships

```text
profiles (teacher)
    └── gamification_tiers (1:N)

profiles (student) + profiles (teacher)
    └── student_teachers (link; must be active for student read)
    └── quizzes.created_by = teacher
            └── exam_submissions (student_id, quiz_id, score)
```

---

## Validation rules (application)

1. `level_name` non-empty after trim; length ≤ 40 recommended.  
2. `min_avg_score` in [0, 100]; `min_completed_quizzes` ≥ 0 integer.  
3. `icon_type` one of five allowed values.  
4. On save: renormalize `level_number` to `1..n` from UI order.  
5. Effort ladder: consecutive levels non-decreasing on both mins.  
6. `n ≤ 20`.  
7. Student status: reject if no `student_teachers` row for `(studentId, teacherId)` (or inactive per product rules — prefer `active` only for display).

---

## Types (`src/types/database.ts`)

```ts
export type GamificationIconType =
  | "cup"
  | "diamond"
  | "star"
  | "shield"
  | "badge";

export interface GamificationTier {
  id: string;
  teacher_id: string;
  level_number: number;
  level_name: string;
  min_completed_quizzes: number;
  min_avg_score: number;
  icon_type: GamificationIconType;
  created_at: string;
  updated_at: string;
}
```

Plus DTO types for save payload (omit ids for new rows) and `TeacherGamificationStatus` in lib.

---

## Existing tables (read-only for this feature)

| Table | Use |
|-------|-----|
| `exam_submissions` | Completed attempts + scores |
| `quizzes` | `created_by` scopes submissions to teacher |
| `student_teachers` | Ownership / active link check |
| `profiles` | Teacher/student identity (unchanged) |

No changes to QUIZ-001 submission write path required for v1.
