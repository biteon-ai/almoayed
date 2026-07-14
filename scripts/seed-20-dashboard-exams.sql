-- =============================================================================
-- Al-Moayed — 20 Arabic dashboard mock exams (DASH-001 smart queue)
-- Run in Supabase SQL Editor (service role / postgres).
--
-- Schema mapping (requested "exams" → actual tables):
--   exams.title          → quizzes.title
--   exams.category       → categories.name (via quizzes.category_id)
--   exams.questions_count→ COUNT(questions) per quiz
--   exams.is_pro         → quizzes.is_free = FALSE
--   exams.status         → derived from exam_submissions (see comments below)
--   exams.updated_at     → exam_submissions.submitted_at (dashboard activity)
--   exams.created_at     → quizzes.created_at
--
-- Status rules for demo student (22222222-…):
--   not_started  → no row in exam_submissions
--   in_progress  → exam_submissions row (UI badge: قيد التقدم)
--   completed    → exam_submissions row with score (also counted in stats)
--
-- Prerequisite: migrations 001–004 applied (demo teacher + student exist).
-- =============================================================================

BEGIN;

-- ── Demo IDs ────────────────────────────────────────────────────────────────
-- Teacher: 11111111-1111-1111-1111-111111111111
-- Student: 22222222-2222-2222-2222-222222222222

-- ── Extra categories (math global category already exists from migration 003) ─
INSERT INTO categories (id, teacher_id, name, is_global, sort_order)
VALUES
  ('dd0c0001-0001-4001-8001-000000000001', NULL, 'فيزياء', TRUE, 2),
  ('dd0c0002-0001-4001-8001-000000000001', NULL, 'علوم',   TRUE, 3)
ON CONFLICT (id) DO NOTHING;

-- Upgrade demo student to Pro so the highlighted Pro exam appears in "Continue"
UPDATE student_teachers
SET tier = 'pro', updated_at = NOW()
WHERE student_id = '22222222-2222-2222-2222-222222222222'
  AND teacher_id = '11111111-1111-1111-1111-111111111111';

-- ── 20 quizzes ──────────────────────────────────────────────────────────────
INSERT INTO quizzes (
  id, title, created_by, category_id,
  is_active, is_free, quiz_type,
  created_at, updated_at
) VALUES
  -- 4 × in_progress (newest activity first for smart queue)
  ('dd000001-0001-4001-8001-000000000001', 'تفاضل وتكامل المتقدم',                    '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', TRUE, FALSE, 'regular', NOW() - INTERVAL '30 days', NOW()),
  ('dd000002-0001-4001-8001-000000000002', 'أشعة وعقديات — الوحدة الثانية',           '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', TRUE, TRUE,  'regular', NOW() - INTERVAL '28 days', NOW() - INTERVAL '2 hours'),
  ('dd000003-0001-4001-8001-000000000003', 'ميكانيك — حركة المقذوفات',                '11111111-1111-1111-1111-111111111111', 'dd0c0001-0001-4001-8001-000000000001', TRUE, FALSE, 'regular', NOW() - INTERVAL '25 days', NOW() - INTERVAL '1 day'),
  ('dd000004-0001-4001-8001-000000000004', 'جبر خطي — المصفوفات',                     '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', TRUE, TRUE,  'regular', NOW() - INTERVAL '22 days', NOW() - INTERVAL '3 days'),
  -- 8 × completed
  ('dd000005-0001-4001-8001-000000000005', 'كيمياء عضوية — الألكانات',                '11111111-1111-1111-1111-111111111111', 'dd0c0002-0001-4001-8001-000000000001', TRUE, TRUE,  'regular', NOW() - INTERVAL '40 days', NOW() - INTERVAL '5 days'),
  ('dd000006-0001-4001-8001-000000000006', 'هندسة — المثلثات والزوايا',               '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', TRUE, TRUE,  'regular', NOW() - INTERVAL '38 days', NOW() - INTERVAL '7 days'),
  ('dd000007-0001-4001-8001-000000000007', 'فيزياء — الكهرباء الساكنة',               '11111111-1111-1111-1111-111111111111', 'dd0c0001-0001-4001-8001-000000000001', TRUE, FALSE, 'regular', NOW() - INTERVAL '35 days', NOW() - INTERVAL '9 days'),
  ('dd000008-0001-4001-8001-000000000008', 'تفاضل — قواعد الاشتقاق',                  '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', TRUE, TRUE,  'regular', NOW() - INTERVAL '33 days', NOW() - INTERVAL '11 days'),
  ('dd000009-0001-4001-8001-000000000009', 'تكامل — التكامل المحدود',                 '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', TRUE, FALSE, 'regular', NOW() - INTERVAL '31 days', NOW() - INTERVAL '13 days'),
  ('dd000010-0001-4001-8001-000000000010', 'أشعة — الدوائر',                          '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', TRUE, TRUE,  'regular', NOW() - INTERVAL '29 days', NOW() - INTERVAL '15 days'),
  ('dd000011-0001-4001-8001-000000000011', 'عقدية — المعادلات التربيعية',             '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', TRUE, TRUE,  'regular', NOW() - INTERVAL '27 days', NOW() - INTERVAL '17 days'),
  ('dd000012-0001-4001-8001-000000000012', 'ميكانيك — قوانين نيوتن',                  '11111111-1111-1111-1111-111111111111', 'dd0c0001-0001-4001-8001-000000000001', TRUE, FALSE, 'regular', NOW() - INTERVAL '24 days', NOW() - INTERVAL '19 days'),
  -- 8 × not_started
  ('dd000013-0001-4001-8001-000000000013', 'هندسة — الإحداثيات',                      '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', TRUE, TRUE,  'regular', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
  ('dd000014-0001-4001-8001-000000000014', 'جبر — أنظمة المعادلات',                   '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', TRUE, TRUE,  'regular', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
  ('dd000015-0001-4001-8001-000000000015', 'فيزياء — الموجات والصوت',                 '11111111-1111-1111-1111-111111111111', 'dd0c0001-0001-4001-8001-000000000001', TRUE, FALSE, 'regular', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('dd000016-0001-4001-8001-000000000016', 'كيمياء — التفاعلات الكيميائية',           '11111111-1111-1111-1111-111111111111', 'dd0c0002-0001-4001-8001-000000000001', TRUE, TRUE,  'regular', NOW() - INTERVAL '8 days',  NOW() - INTERVAL '8 days'),
  ('dd000017-0001-4001-8001-000000000017', 'تفاضل وتكامل — متسلسلات',                 '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', TRUE, FALSE, 'regular', NOW() - INTERVAL '6 days',  NOW() - INTERVAL '6 days'),
  ('dd000018-0001-4001-8001-000000000018', 'رياضيات — الاحتمالات والإحصاء',           '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', TRUE, TRUE,  'regular', NOW() - INTERVAL '4 days',  NOW() - INTERVAL '4 days'),
  ('dd000019-0001-4001-8001-000000000019', 'هندسة — التحويلات الهندسية',              '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', TRUE, FALSE, 'regular', NOW() - INTERVAL '2 days',  NOW() - INTERVAL '2 days'),
  ('dd000020-0001-4001-8001-000000000020', 'فيزياء — الكهرومغناطيسية',                '11111111-1111-1111-1111-111111111111', 'dd0c0001-0001-4001-8001-000000000001', TRUE, TRUE,  'regular', NOW() - INTERVAL '1 day',   NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
  title       = EXCLUDED.title,
  category_id = EXCLUDED.category_id,
  is_free     = EXCLUDED.is_free,
  updated_at  = EXCLUDED.updated_at;

-- ── Questions (placeholder bank — counts match questions_count column below) ─
-- Quiz 1: 15 | 2: 12 | 3: 10 | 4: 8 | 5: 20 | 6: 10 | 7: 12 | 8: 14
-- 9: 16 | 10: 11 | 11: 9 | 12: 13 | 13: 10 | 14: 12 | 15: 15 | 16: 18
-- 17: 20 | 18: 14 | 19: 11 | 20: 12

INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation_text, category_tag, sort_order)
SELECT
  v.quiz_id,
  'سؤال ' || gs.n || ' — ' || v.title,
  '["أ", "ب", "ج", "د"]'::jsonb,
  'أ',
  'شرح الإجابة الصحيحة للسؤال ' || gs.n,
  v.category_tag,
  gs.n
FROM (
  VALUES
    ('dd000001-0001-4001-8001-000000000001'::uuid, 'تفاضل وتكامل المتقدم',          'تفاضل', 15),
    ('dd000002-0001-4001-8001-000000000002'::uuid, 'أشعة وعقديات — الوحدة الثانية', 'أشعة',  12),
    ('dd000003-0001-4001-8001-000000000003'::uuid, 'ميكانيك — حركة المقذوفات',       'فيزياء', 10),
    ('dd000004-0001-4001-8001-000000000004'::uuid, 'جبر خطي — المصفوفات',            'جبر',    8),
    ('dd000005-0001-4001-8001-000000000005'::uuid, 'كيمياء عضوية — الألكانات',       'كيمياء', 20),
    ('dd000006-0001-4001-8001-000000000006'::uuid, 'هندسة — المثلثات والزوايا',      'هندسة', 10),
    ('dd000007-0001-4001-8001-000000000007'::uuid, 'فيزياء — الكهرباء الساكنة',      'فيزياء', 12),
    ('dd000008-0001-4001-8001-000000000008'::uuid, 'تفاضل — قواعد الاشتقاق',         'تفاضل', 14),
    ('dd000009-0001-4001-8001-000000000009'::uuid, 'تكامل — التكامل المحدود',        'تكامل', 16),
    ('dd000010-0001-4001-8001-000000000010'::uuid, 'أشعة — الدوائر',                 'أشعة',  11),
    ('dd000011-0001-4001-8001-000000000011'::uuid, 'عقدية — المعادلات التربيعية',    'عقدية',  9),
    ('dd000012-0001-4001-8001-000000000012'::uuid, 'ميكانيك — قوانين نيوتن',         'فيزياء', 13),
    ('dd000013-0001-4001-8001-000000000013'::uuid, 'هندسة — الإحداثيات',             'هندسة', 10),
    ('dd000014-0001-4001-8001-000000000014'::uuid, 'جبر — أنظمة المعادلات',           'جبر',   12),
    ('dd000015-0001-4001-8001-000000000015'::uuid, 'فيزياء — الموجات والصوت',        'فيزياء', 15),
    ('dd000016-0001-4001-8001-000000000016'::uuid, 'كيمياء — التفاعلات الكيميائية',  'كيمياء', 18),
    ('dd000017-0001-4001-8001-000000000017'::uuid, 'تفاضل وتكامل — متسلسلات',        'تفاضل', 20),
    ('dd000018-0001-4001-8001-000000000018'::uuid, 'رياضيات — الاحتمالات والإحصاء',  'احتمالات', 14),
    ('dd000019-0001-4001-8001-000000000019'::uuid, 'هندسة — التحويلات الهندسية',     'هندسة', 11),
    ('dd000020-0001-4001-8001-000000000020'::uuid, 'فيزياء — الكهرومغناطيسية',       'فيزياء', 12)
) AS v(quiz_id, title, category_tag, question_count)
CROSS JOIN LATERAL generate_series(1, v.question_count) AS gs(n)
WHERE NOT EXISTS (
  SELECT 1 FROM questions q
  WHERE q.quiz_id = v.quiz_id AND q.sort_order = gs.n
);

-- ── Student activity (exam_submissions) for in_progress + completed ─────────
-- submitted_at drives lastActivityAt / smart-queue ordering (newest = Continue)
INSERT INTO exam_submissions (id, student_id, quiz_id, score, submitted_at)
VALUES
  ('ee000001-0001-4001-8001-000000000001', '22222222-2222-2222-2222-222222222222', 'dd000001-0001-4001-8001-000000000001', 42, NOW()),                          -- in_progress (Continue highlight)
  ('ee000002-0001-4001-8001-000000000002', '22222222-2222-2222-2222-222222222222', 'dd000002-0001-4001-8001-000000000002', 55, NOW() - INTERVAL '2 hours'),     -- in_progress
  ('ee000003-0001-4001-8001-000000000003', '22222222-2222-2222-2222-222222222222', 'dd000003-0001-4001-8001-000000000003', 38, NOW() - INTERVAL '1 day'),       -- in_progress
  ('ee000004-0001-4001-8001-000000000004', '22222222-2222-2222-2222-222222222222', 'dd000004-0001-4001-8001-000000000004', 61, NOW() - INTERVAL '3 days'),      -- in_progress
  ('ee000005-0001-4001-8001-000000000005', '22222222-2222-2222-2222-222222222222', 'dd000005-0001-4001-8001-000000000005', 88, NOW() - INTERVAL '5 days'),      -- completed
  ('ee000006-0001-4001-8001-000000000006', '22222222-2222-2222-2222-222222222222', 'dd000006-0001-4001-8001-000000000006', 76, NOW() - INTERVAL '7 days'),      -- completed
  ('ee000007-0001-4001-8001-000000000007', '22222222-2222-2222-2222-222222222222', 'dd000007-0001-4001-8001-000000000007', 92, NOW() - INTERVAL '9 days'),      -- completed
  ('ee000008-0001-4001-8001-000000000008', '22222222-2222-2222-2222-222222222222', 'dd000008-0001-4001-8001-000000000008', 84, NOW() - INTERVAL '11 days'),     -- completed
  ('ee000009-0001-4001-8001-000000000009', '22222222-2222-2222-2222-222222222222', 'dd000009-0001-4001-8001-000000000009', 79, NOW() - INTERVAL '13 days'),     -- completed
  ('ee000010-0001-4001-8001-000000000010', '22222222-2222-2222-2222-222222222222', 'dd000010-0001-4001-8001-000000000010', 95, NOW() - INTERVAL '15 days'),     -- completed
  ('ee000011-0001-4001-8001-000000000011', '22222222-2222-2222-2222-222222222222', 'dd000011-0001-4001-8001-000000000011', 70, NOW() - INTERVAL '17 days'),     -- completed
  ('ee000012-0001-4001-8001-000000000012', '22222222-2222-2222-2222-222222222222', 'dd000012-0001-4001-8001-000000000012', 86, NOW() - INTERVAL '19 days')      -- completed
ON CONFLICT (student_id, quiz_id) DO UPDATE SET
  score        = EXCLUDED.score,
  submitted_at = EXCLUDED.submitted_at;

COMMIT;

-- ── Verify: conceptual exams view ───────────────────────────────────────────
-- SELECT
--   q.id,
--   q.title,
--   c.name AS category,
--   (SELECT COUNT(*)::int FROM questions qq WHERE qq.quiz_id = q.id) AS questions_count,
--   NOT q.is_free AS is_pro,
--   CASE
--     WHEN es.id IS NULL THEN 'not_started'
--     WHEN es.score >= 75 THEN 'completed'
--     ELSE 'in_progress'
--   END AS status,
--   COALESCE(es.submitted_at, q.updated_at) AS updated_at,
--   q.created_at
-- FROM quizzes q
-- LEFT JOIN categories c ON c.id = q.category_id
-- LEFT JOIN exam_submissions es
--   ON es.quiz_id = q.id
--  AND es.student_id = '22222222-2222-2222-2222-222222222222'
-- WHERE q.id LIKE 'dd0000%'
-- ORDER BY COALESCE(es.submitted_at, q.updated_at) DESC NULLS LAST;
