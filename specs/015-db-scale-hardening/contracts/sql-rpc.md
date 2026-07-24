# Contracts: SQL / RPC (PERF-004 / 006)

## Migration

`supabase/migrations/011_db_scale_hardening.sql`

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_exam_submissions_student_submitted
  ON exam_submissions (student_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_sort
  ON questions (quiz_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_student_teachers_teacher_upgrade
  ON student_teachers (teacher_id)
  WHERE upgrade_requested = true;

CREATE INDEX IF NOT EXISTS idx_quizzes_created_by_updated
  ON quizzes (created_by, updated_at DESC, created_at DESC);
```

No `CONCURRENTLY` inside transactional Supabase migrations. No GIN indexes in this feature.

### KPI RPC

```text
get_teacher_dashboard_kpis(p_teacher_id uuid) → jsonb
```

Preferred: new function name; update TS callers. Optionally `CREATE OR REPLACE` the old `get_teacher_dashboard_analytics` to return the **new aggregate shape** and keep the name — but payload MUST NOT include full student/submission arrays.

**Illustrative output**:

```json
{
  "studentCount": 0,
  "quizCount": 0,
  "pendingUpgrades": 0,
  "submissionCount": 0,
  "averageScore": 0,
  "passRate": 0,
  "gradeDistribution": [
    { "range": "0-49%", "label": "راسب", "count": 0 }
  ],
  "weeklyActivity": [
    { "day": "الأحد", "passed": 0, "failed": 0 }
  ],
  "popularExams": [
    { "rank": 1, "title": "…", "attempts": 0, "completionRate": 0 }
  ]
}
```

- `popularExams.length` ≤ **10**
- Grade/day labels must map cleanly to `TeacherDashboardAnalytics` (TS mapper may fill colors / missing optional fields with safe defaults)
- Filter all CTEs by `p_teacher_id` (MT-002)
- No question answer/explanation columns

### Grants

```sql
REVOKE ALL ON FUNCTION public.get_teacher_dashboard_kpis(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_teacher_dashboard_kpis(uuid)
  TO service_role;

-- Same pattern for get_teacher_dashboard_analytics if retained/replaced
-- Same pattern for admin_quiz_counts_by_teacher()
```

### Admin quiz counts RPC (optional but preferred)

```text
admin_quiz_counts_by_teacher() → SETOF (teacher_id uuid, quiz_count bigint)
```

Non-archived quizzes only. service_role execute only.

### RLS

```sql
-- Deny-all (illustrative) on:
-- student_teachers, teacher_groups, teacher_group_members,
-- categories, topics, auth_otp_states

-- Rewrite 001 policies:
-- USING (id = (SELECT auth.uid()))
-- USING (student_id = (SELECT auth.uid()))
-- etc.
```

Service role continues to bypass RLS for Server Actions.
