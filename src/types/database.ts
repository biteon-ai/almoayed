export type UserRole = "TEACHER" | "STUDENT";

export interface Profile {
  id: string;
  whatsapp_number: string;
  full_name: string;
  role: UserRole;
  is_subscribed: boolean;
  verification_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_image_url: string | null;
  options: string[];
  correct_answer: string;
  explanation_text: string;
  explanation_media_url: string | null;
  category_tag: string;
  sort_order: number;
}

/** Question data safe to show during exam (no answers/explanations) */
export type ExamQuestion = Pick<
  Question,
  "id" | "quiz_id" | "question_text" | "question_image_url" | "options" | "sort_order"
>;

export interface ExamSubmission {
  id: string;
  student_id: string;
  quiz_id: string;
  score: number;
  submitted_at: string;
}

export interface StudentAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  student_answer: string;
  is_correct: boolean;
}

export interface CategoryPerformance {
  category_tag: string;
  total_attempted: number;
  correct_count: number;
  success_percentage: number;
}

export interface QuizSubmitResult {
  submissionId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  answers: Array<{
    questionId: string;
    studentAnswer: string;
    isCorrect: boolean;
    correctAnswer: string;
    explanationText: string;
    explanationMediaUrl: string | null;
    categoryTag: string;
    questionText: string;
    questionImageUrl: string | null;
  }>;
}
