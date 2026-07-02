-- المؤيد — Sample seed data (run after migration)

INSERT INTO profiles (id, whatsapp_number, full_name, role, is_subscribed)
VALUES
  ('11111111-1111-1111-1111-111111111111', '963912345678', 'أستاذ المؤيد', 'TEACHER', TRUE),
  ('22222222-2222-2222-2222-222222222222', '963987654321', 'أحمد الطالب', 'STUDENT', TRUE)
ON CONFLICT (whatsapp_number) DO NOTHING;

INSERT INTO quizzes (id, title, created_by)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'اختبار الأشعة والعقديات — الوحدة الأولى', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation_text, category_tag, sort_order)
VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    'ما معادلة المستقيم المار بالنقطتين (1,2) و (3,6)؟',
    '["y = 2x", "y = x + 1", "y = 3x - 1", "y = x + 2"]'::jsonb,
    'y = 2x',
    'الميل m = (6-2)/(3-1) = 2. باستخدام النقطة (1,2): y - 2 = 2(x - 1) ⟹ y = 2x',
    'أشعة',
    1
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'ما قيمة (2+3i)(1-i)؟',
    '["5 + i", "5 - i", "2 + 5i", "-1 + 5i"]'::jsonb,
    '5 + i',
    '(2+3i)(1-i) = 2 - 2i + 3i - 3i² = 2 + i + 3 = 5 + i',
    'عقدية',
    2
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'ما معادلة الدائرة مركزها (0,0) ونصف قطرها 5؟',
    '["x² + y² = 25", "x² + y² = 5", "x + y = 5", "x² - y² = 25"]'::jsonb,
    'x² + y² = 25',
    'معادلة الدائرة: (x-a)² + (y-b)² = r². مع المركز (0,0) و r=5 نحصل x² + y² = 25',
    'أشعة',
    3
  );
