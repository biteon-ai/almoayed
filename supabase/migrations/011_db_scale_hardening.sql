-- PERF-004 / 005 / 006: Aggregate KPIs, indexes, RLS harden, admin quiz counts
-- Builds on 010; does not rewrite history.

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_exam_submissions_student_submitted
  ON exam_submissions (student_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_sort
  ON questions (quiz_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_student_teachers_teacher_upgrade
  ON student_teachers (teacher_id)
  WHERE upgrade_requested = true;

CREATE INDEX IF NOT EXISTS idx_quizzes_created_by_updated
  ON quizzes (created_by, updated_at DESC, created_at DESC);

-- ── Deny-all RLS (defense-in-depth; app uses service_role) ───
DROP POLICY IF EXISTS "student_teachers_deny_all" ON student_teachers;
CREATE POLICY "student_teachers_deny_all" ON student_teachers
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "teacher_groups_deny_all" ON teacher_groups;
CREATE POLICY "teacher_groups_deny_all" ON teacher_groups
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "teacher_group_members_deny_all" ON teacher_group_members;
CREATE POLICY "teacher_group_members_deny_all" ON teacher_group_members
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "categories_deny_all" ON categories;
CREATE POLICY "categories_deny_all" ON categories
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "topics_deny_all" ON topics;
CREATE POLICY "topics_deny_all" ON topics
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "auth_otp_states_deny_all" ON auth_otp_states;
CREATE POLICY "auth_otp_states_deny_all" ON auth_otp_states
  FOR ALL USING (false) WITH CHECK (false);

-- ── RLS initplan: (SELECT auth.uid()) ────────────────────────
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "quizzes_select_subscribed" ON quizzes;
CREATE POLICY "quizzes_select_subscribed"
  ON quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND (profiles.is_subscribed = TRUE OR profiles.role = 'TEACHER')
    )
  );

DROP POLICY IF EXISTS "questions_select_subscribed" ON questions;
CREATE POLICY "questions_select_subscribed"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND (profiles.is_subscribed = TRUE OR profiles.role = 'TEACHER')
    )
  );

DROP POLICY IF EXISTS "exam_submissions_select_own" ON exam_submissions;
CREATE POLICY "exam_submissions_select_own"
  ON exam_submissions FOR SELECT
  USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "exam_submissions_insert_own" ON exam_submissions;
CREATE POLICY "exam_submissions_insert_own"
  ON exam_submissions FOR INSERT
  WITH CHECK (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "student_answers_select_own" ON student_answers;
CREATE POLICY "student_answers_select_own"
  ON student_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exam_submissions es
      WHERE es.id = submission_id AND es.student_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "student_answers_insert_own" ON student_answers;
CREATE POLICY "student_answers_insert_own"
  ON student_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_submissions es
      WHERE es.id = submission_id AND es.student_id = (SELECT auth.uid())
    )
  );

-- ── PERF-004: Aggregate KPI RPC (no row dumps) ───────────────
CREATE OR REPLACE FUNCTION public.get_teacher_dashboard_kpis(p_teacher_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH active_links AS (
    SELECT st.student_id
    FROM student_teachers st
    WHERE st.teacher_id = p_teacher_id
      AND st.status = 'active'
  ),
  teacher_quizzes AS (
    SELECT q.id, q.title, q.is_active
    FROM quizzes q
    WHERE q.created_by = p_teacher_id
      AND COALESCE(q.is_archived, false) = false
  ),
  active_quizzes AS (
    SELECT id, title FROM teacher_quizzes WHERE is_active = true
  ),
  scoped_subs AS (
    SELECT es.student_id, es.quiz_id, es.score, es.submitted_at
    FROM exam_submissions es
    WHERE es.student_id IN (SELECT student_id FROM active_links)
      AND es.quiz_id IN (SELECT id FROM active_quizzes)
  ),
  student_avgs AS (
    SELECT student_id, AVG(score)::numeric AS avg_score
    FROM scoped_subs
    GROUP BY student_id
  ),
  grade_buckets AS (
    SELECT * FROM (VALUES
      ('0-49%', 'راسب', 0, 49),
      ('50-64%', 'مقبول', 50, 64),
      ('65-79%', 'جيد', 65, 79),
      ('80-89%', 'جيد جداً', 80, 89),
      ('90-100%', 'ممتاز', 90, 100)
    ) AS b(range, label, min_s, max_s)
  ),
  grade_counts AS (
    SELECT gb.range, gb.label,
      COUNT(sa.student_id)::int AS count
    FROM grade_buckets gb
    LEFT JOIN student_avgs sa
      ON ROUND(sa.avg_score) BETWEEN gb.min_s AND gb.max_s
    GROUP BY gb.range, gb.label, gb.min_s
    ORDER BY gb.min_s
  ),
  week_start AS (
    SELECT date_trunc('week', NOW() AT TIME ZONE 'UTC')::date AS d
  ),
  weekly AS (
    SELECT
      EXTRACT(DOW FROM ss.submitted_at AT TIME ZONE 'UTC')::int AS dow,
      COUNT(*) FILTER (WHERE ss.score >= 60)::int AS passed,
      COUNT(*) FILTER (WHERE ss.score < 60)::int AS failed
    FROM scoped_subs ss, week_start ws
    WHERE (ss.submitted_at AT TIME ZONE 'UTC')::date >= ws.d
    GROUP BY 1
  ),
  weekday_labels AS (
    SELECT * FROM (VALUES
      (0, 'الأحد'), (1, 'الاثنين'), (2, 'الثلاثاء'),
      (3, 'الأربعاء'), (4, 'الخميس'), (5, 'الجمعة'), (6, 'السبت')
    ) AS w(dow, day)
  ),
  popular AS (
    SELECT
      aq.title,
      COUNT(ss.*)::int AS attempts,
      CASE
        WHEN (SELECT COUNT(*) FROM active_links) > 0
        THEN ROUND((COUNT(ss.*)::numeric / (SELECT COUNT(*) FROM active_links)) * 100)::int
        ELSE 0
      END AS completion_rate,
      COALESCE(ROUND(AVG(ss.score))::int, 0) AS avg_score,
      CASE
        WHEN COUNT(ss.*) > 0
        THEN ROUND((COUNT(*) FILTER (WHERE ss.score >= 60)::numeric / COUNT(*)) * 100)::int
        ELSE 0
      END AS pass_rate
    FROM active_quizzes aq
    LEFT JOIN scoped_subs ss ON ss.quiz_id = aq.id
    GROUP BY aq.id, aq.title
    HAVING COUNT(ss.*) > 0
    ORDER BY COUNT(ss.*) DESC
    LIMIT 10
  ),
  top_perf AS (
    SELECT sa.student_id, p.full_name, ROUND(sa.avg_score)::int AS average_score
    FROM student_avgs sa
    JOIN profiles p ON p.id = sa.student_id
    ORDER BY sa.avg_score DESC
    LIMIT 1
  ),
  quiz_diff AS (
    SELECT
      aq.title,
      ROUND(AVG(ss.score))::int AS avg_score,
      ROUND((COUNT(*) FILTER (WHERE ss.score >= 60)::numeric / NULLIF(COUNT(*), 0)) * 100)::int AS pass_rate
    FROM active_quizzes aq
    JOIN scoped_subs ss ON ss.quiz_id = aq.id
    GROUP BY aq.id, aq.title
  ),
  hardest AS (
    SELECT title, avg_score, pass_rate FROM quiz_diff ORDER BY avg_score ASC NULLS LAST LIMIT 1
  ),
  easiest AS (
    SELECT title, avg_score, pass_rate FROM quiz_diff ORDER BY avg_score DESC NULLS LAST LIMIT 1
  )
  SELECT jsonb_build_object(
    'studentCount', (SELECT COUNT(*)::int FROM active_links),
    'quizCount', (SELECT COUNT(*)::int FROM teacher_quizzes),
    'pendingUpgrades', (
      SELECT COUNT(*)::int FROM student_teachers st
      WHERE st.teacher_id = p_teacher_id AND st.upgrade_requested = true
    ),
    'submissionCount', (SELECT COUNT(*)::int FROM scoped_subs),
    'averageScore', COALESCE((SELECT ROUND(AVG(score))::int FROM scoped_subs), 0),
    'passRate', COALESCE((
      SELECT ROUND((COUNT(*) FILTER (WHERE score >= 60)::numeric / NULLIF(COUNT(*), 0)) * 100)::int
      FROM scoped_subs
    ), 0),
    'perfectScoreStudentCount', (
      SELECT COUNT(DISTINCT student_id)::int FROM scoped_subs WHERE score = 100
    ),
    'completionRate', CASE
      WHEN (SELECT COUNT(*) FROM active_links) * (SELECT COUNT(*) FROM active_quizzes) > 0
      THEN ROUND(
        ((SELECT COUNT(*)::numeric FROM scoped_subs) /
         ((SELECT COUNT(*) FROM active_links) * (SELECT COUNT(*) FROM active_quizzes))) * 1000
      ) / 10
      ELSE 0
    END,
    'gradeDistribution', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'range', gc.range,
        'label', gc.label,
        'count', gc.count
      ) ORDER BY gc.range)
      FROM grade_counts gc
    ), '[]'::jsonb),
    'weeklyActivity', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'day', wl.day,
        'passed', COALESCE(w.passed, 0),
        'failed', COALESCE(w.failed, 0)
      ) ORDER BY wl.dow)
      FROM weekday_labels wl
      LEFT JOIN weekly w ON w.dow = wl.dow
    ), '[]'::jsonb),
    'popularExams', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'rank', r.ord,
        'title', r.title,
        'attempts', r.attempts,
        'completionRate', r.completion_rate
      ) ORDER BY r.ord)
      FROM (
        SELECT ROW_NUMBER() OVER () AS ord, title, attempts, completion_rate
        FROM popular
      ) r
    ), '[]'::jsonb),
    'topPerformer', (
      SELECT CASE WHEN EXISTS (SELECT 1 FROM top_perf) THEN
        (SELECT jsonb_build_object(
          'studentId', student_id,
          'name', COALESCE(full_name, 'طالب'),
          'averageScore', average_score
        ) FROM top_perf)
      ELSE NULL END
    ),
    'examDifficulty', jsonb_build_object(
      'hardest', (SELECT CASE WHEN EXISTS (SELECT 1 FROM hardest) THEN
        (SELECT jsonb_build_object('title', title, 'avgScore', avg_score, 'passRate', pass_rate) FROM hardest)
      ELSE NULL END),
      'easiest', (SELECT CASE WHEN EXISTS (SELECT 1 FROM easiest) THEN
        (SELECT jsonb_build_object('title', title, 'avgScore', avg_score, 'passRate', pass_rate) FROM easiest)
      ELSE NULL END)
    )
  );
$$;

COMMENT ON FUNCTION public.get_teacher_dashboard_kpis(uuid) IS
  'PERF-004: Aggregate teacher dashboard KPIs (no full student/submission dumps). Max 10 popular exams.';

-- Keep old name as alias to new aggregate shape (callers may use either)
CREATE OR REPLACE FUNCTION public.get_teacher_dashboard_analytics(p_teacher_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_teacher_dashboard_kpis(p_teacher_id);
$$;

REVOKE ALL ON FUNCTION public.get_teacher_dashboard_kpis(uuid)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_teacher_dashboard_kpis(uuid)
  FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_teacher_dashboard_kpis(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.get_teacher_dashboard_analytics(uuid)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_teacher_dashboard_analytics(uuid)
  FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_teacher_dashboard_analytics(uuid)
  TO service_role;

-- ── Admin quiz counts (PERF-005) ─────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_quiz_counts_by_teacher()
RETURNS TABLE(teacher_id uuid, quiz_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT created_by AS teacher_id, COUNT(*)::bigint
  FROM quizzes
  WHERE COALESCE(is_archived, false) = false
  GROUP BY created_by;
$$;

REVOKE ALL ON FUNCTION public.admin_quiz_counts_by_teacher()
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_quiz_counts_by_teacher()
  FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_quiz_counts_by_teacher()
  TO service_role;

-- Optional later (not dropped here): low-selectivity boolean singles
-- DROP INDEX IF EXISTS idx_quizzes_is_free;
-- DROP INDEX IF EXISTS idx_profiles_is_subscribed;
