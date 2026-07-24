-- PERF-002: Composite indexes + teacher dashboard analytics RPC (single round-trip payload)

-- Indexes for multi-tenant filter pairs (no CONCURRENTLY — Supabase migrator uses transactions)
CREATE INDEX IF NOT EXISTS idx_student_teachers_teacher_status
  ON student_teachers (teacher_id, status);

CREATE INDEX IF NOT EXISTS idx_student_teachers_student_status
  ON student_teachers (student_id, status);

CREATE INDEX IF NOT EXISTS idx_quizzes_created_by_active
  ON quizzes (created_by, is_active);

CREATE INDEX IF NOT EXISTS idx_quizzes_created_by_archived
  ON quizzes (created_by, is_archived);

CREATE INDEX IF NOT EXISTS idx_exam_submissions_quiz_submitted
  ON exam_submissions (quiz_id, submitted_at DESC);

-- Returns one JSON payload of lean rows for Node-side computeTeacherDashboardAnalytics.
-- SECURITY DEFINER: called via service-role admin client; always filter by p_teacher_id.
CREATE OR REPLACE FUNCTION public.get_teacher_dashboard_analytics(p_teacher_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH active_links AS (
    SELECT st.student_id, st.tier::text AS tier
    FROM student_teachers st
    WHERE st.teacher_id = p_teacher_id
      AND st.status = 'active'
  ),
  teacher_quizzes AS (
    SELECT
      q.id,
      q.title,
      q.created_by,
      q.category_id,
      q.topic_id,
      q.is_active,
      q.is_free,
      q.is_archived,
      q.quiz_type::text AS quiz_type,
      q.target_group_id,
      q.created_at,
      q.updated_at
    FROM quizzes q
    WHERE q.created_by = p_teacher_id
  ),
  teacher_groups AS (
    SELECT tg.id
    FROM teacher_groups tg
    WHERE tg.teacher_id = p_teacher_id
  ),
  group_members AS (
    SELECT tgm.student_id, tgm.group_id
    FROM teacher_group_members tgm
    WHERE tgm.group_id IN (SELECT id FROM teacher_groups)
      AND tgm.student_id IN (SELECT student_id FROM active_links)
  ),
  submissions AS (
    SELECT
      es.student_id,
      es.quiz_id,
      es.score,
      es.submitted_at
    FROM exam_submissions es
    WHERE es.student_id IN (SELECT student_id FROM active_links)
      AND es.quiz_id IN (SELECT id FROM teacher_quizzes)
  ),
  profiles AS (
    SELECT p.id, p.full_name
    FROM profiles p
    WHERE p.id IN (SELECT student_id FROM active_links)
  )
  SELECT jsonb_build_object(
    'studentLinks', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'student_id', al.student_id,
      'tier', al.tier
    )) FROM active_links al), '[]'::jsonb),
    'quizzes', COALESCE((SELECT jsonb_agg(to_jsonb(tq)) FROM teacher_quizzes tq), '[]'::jsonb),
    'submissions', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'student_id', s.student_id,
      'quiz_id', s.quiz_id,
      'score', s.score,
      'submitted_at', s.submitted_at
    )) FROM submissions s), '[]'::jsonb),
    'profiles', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', pr.id,
      'full_name', pr.full_name
    )) FROM profiles pr), '[]'::jsonb),
    'groupMembers', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'student_id', gm.student_id,
      'group_id', gm.group_id
    )) FROM group_members gm), '[]'::jsonb),
    'studentCount', (
      SELECT COUNT(*)::int FROM student_teachers st
      WHERE st.teacher_id = p_teacher_id
    ),
    'quizCount', (SELECT COUNT(*)::int FROM teacher_quizzes),
    'pendingUpgrades', (
      SELECT COUNT(*)::int FROM student_teachers st
      WHERE st.teacher_id = p_teacher_id
        AND st.upgrade_requested = true
    )
  );
$$;

COMMENT ON FUNCTION public.get_teacher_dashboard_analytics(uuid) IS
  'PERF-002: Single-round-trip lean payload for teacher dashboard analytics (MT-002 scoped by p_teacher_id).';
