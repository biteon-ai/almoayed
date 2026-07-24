# Contracts: SQL / RPC (PERF-002)

## Migration

`supabase/migrations/010_perf_indexes_and_teacher_dashboard_rpc.sql`

### Indexes

```sql
-- Illustrative; exact names in migration
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_teachers_teacher_status
  ON student_teachers (teacher_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_teachers_student_status
  ON student_teachers (student_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quizzes_created_by_active
  ON quizzes (created_by, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quizzes_created_by_archived
  ON quizzes (created_by, is_archived);
```

Note: If hosted migration runner disallows `CONCURRENTLY` inside a transaction, use plain `CREATE INDEX IF NOT EXISTS` (Supabase CLI default).

### RPC

```text
get_teacher_dashboard_analytics(p_teacher_id uuid) → jsonb
```

**Input**: Teacher profile id (must match caller’s session in the Server Action).

**Output shape** (stable for UI):

```json
{
  "kpis": {
    "studentCount": 0,
    "quizCount": 0,
    "pendingCount": 0,
    "groupCount": 0,
    "submissionCount": 0
  },
  "gradeBuckets": [{ "label": "string", "count": 0 }],
  "weeklyActivity": [{ "weekStart": "ISO-date", "count": 0 }],
  "popularExams": [{ "quizId": "uuid", "title": "string", "attempts": 0 }]
}
```

Exact bucket labels must match current Arabic/UI expectations in `TeacherDashboardAnalytics` / `teacher-analytics.ts` (map in TS if SQL uses English keys).

**Security**:
- Filter every CTE/join by `p_teacher_id` (quizzes.`created_by`, `student_teachers`.`teacher_id`).
- Do not select question answer columns.
- Grant execute to service role used by admin client (match existing migration grant style).

**Fallback**: If RPC deploy lags, temporary path may keep Node aggregation on **lean** selects only — document in tasks; target state is RPC.
