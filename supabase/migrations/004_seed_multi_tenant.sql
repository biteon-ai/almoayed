-- Backfill multi-tenant demo data after migration 003

UPDATE profiles
SET
  school_name = 'معهد المؤيد للرياضيات',
  address = 'دمشق، سوريا',
  teacher_code = COALESCE(teacher_code, 'AlMoayed-DEMO')
WHERE id = '11111111-1111-1111-1111-111111111111' AND role = 'TEACHER';

INSERT INTO student_teachers (student_id, teacher_id, status, tier)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'active',
  'free'
)
ON CONFLICT (student_id, teacher_id) DO NOTHING;

UPDATE quizzes
SET is_active = TRUE, is_free = TRUE, quiz_type = 'regular'
WHERE id = '33333333-3333-3333-3333-333333333333';

-- Premium locked quiz for demo gating
INSERT INTO quizzes (id, title, created_by, is_active, is_free, quiz_type)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'اختبار متقدم — تفاضل وتكامل (Pro)',
  '11111111-1111-1111-1111-111111111111',
  TRUE,
  FALSE,
  'regular'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation_text, category_tag, sort_order)
SELECT * FROM (VALUES
  (
    '44444444-4444-4444-4444-444444444444'::uuid,
    'ما مشتقة x³؟',
    '["3x²", "x²", "3x", "x³"]'::jsonb,
    '3x²',
    'باستخدام قاعدة القوة: d/dx(xⁿ) = nxⁿ⁻¹',
    'تفاضل',
    1
  )
) AS v(quiz_id, question_text, options, correct_answer, explanation_text, category_tag, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM questions WHERE quiz_id = v.quiz_id
);
