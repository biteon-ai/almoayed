import type { ExamQuestion, Question, Quiz, QuizCarouselItem } from "@/types/database";

export function createQuiz(overrides: Partial<Quiz> = {}): Quiz {
  return {
    id: "quiz-001",
    title: "اختبار تجريبي",
    slug: "اختبار-تجريبي-quiz001",
    created_by: "teacher-profile-001",
    category_id: null,
    topic_id: null,
    is_active: true,
    is_free: true,
    is_archived: false,
    deleted_at: null,
    quiz_type: "regular",
    target_group_id: null,
    is_timed: false,
    duration_minutes: null,
    assessment_category: "evaluation",
    max_attempts: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function createQuizCarouselItem(
  overrides: Partial<QuizCarouselItem> & Pick<QuizCarouselItem, "id">
): QuizCarouselItem {
  return {
    ...createQuiz({ id: overrides.id, title: overrides.title ?? "اختبار" }),
    isAccessible: true,
    isLocked: false,
    questionCount: 3,
    hasSubmission: false,
    lastActivityAt: null,
    categoryName: "عام",
    lastScore: null,
    bestScore: null,
    usedAttempts: 0,
    maxAttempts: 1,
    canRetake: true,
    estimatedMinutes: 6,
    ...overrides,
  };
}

export function createQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "question-001",
    quiz_id: "quiz-001",
    question_text: "ما ناتج 2 + 2؟",
    question_image_url: null,
    options: ["3", "4", "5", "6"],
    correct_answer: "4",
    explanation_text: "2 + 2 = 4",
    explanation_media_url: null,
    category_tag: "جبر",
    sort_order: 1,
    ...overrides,
  };
}

export function createExamQuestion(
  overrides: Partial<ExamQuestion> = {}
): ExamQuestion {
  const full = createQuestion(overrides);
  return {
    id: full.id,
    quiz_id: full.quiz_id,
    question_text: full.question_text,
    question_image_url: full.question_image_url,
    options: full.options,
    sort_order: full.sort_order,
  };
}
