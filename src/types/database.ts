export type UserRole = "TEACHER" | "STUDENT";
export type StudentTeacherStatus = "pending" | "active" | "deactivated";
export type StudentTier = "free" | "pro";
export type QuizType = "regular" | "session_group";

export interface BankDetails {
  bank_name?: string;
  account_holder?: string;
  account_number?: string;
  iban?: string;
  notes?: string;
}

export interface Profile {
  id: string;
  whatsapp_number: string;
  full_name: string;
  role: UserRole;
  is_subscribed: boolean;
  verification_token: string | null;
  school_name: string;
  address: string;
  bank_details: BankDetails;
  teacher_code: string | null;
  last_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentTeacher {
  id: string;
  student_id: string;
  teacher_id: string;
  status: StudentTeacherStatus;
  tier: StudentTier;
  upgrade_requested: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeacherGroup {
  id: string;
  teacher_id: string;
  group_name: string;
  created_at: string;
}

export interface Category {
  id: string;
  teacher_id: string | null;
  name: string;
  is_global: boolean;
  sort_order: number;
  created_at: string;
}

export interface Topic {
  id: string;
  category_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  created_by: string;
  category_id: string | null;
  topic_id: string | null;
  is_active: boolean;
  is_free: boolean;
  quiz_type: QuizType;
  target_group_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeacherQuiz extends Quiz {
  question_count: number;
}

export interface QuizListItem extends Quiz {
  isAccessible: boolean;
  isLocked: boolean;
}

/** [DASH-001] Quick stats for student dashboard header */
export interface DashboardStats {
  tier: StudentTier;
  completedQuizCount: number;
  overallAverageScore: number;
}

/** [DASH-001] Recent completed quiz row for My Scores tab */
export interface RecentScoreRow {
  quizId: string;
  quizTitle: string;
  score: number;
  submittedAt: string;
}

/** [DASH-001] Quiz card in horizontal carousel */
export interface QuizCarouselItem extends QuizListItem {
  questionCount: number;
  hasSubmission: boolean;
  /** Latest submission timestamp when the student has activity on this quiz */
  lastActivityAt: string | null;
}

/** [DASH-001] Bundled dashboard read model */
export interface StudentDashboardData {
  stats: DashboardStats;
  recentScores: RecentScoreRow[];
  quizzes: QuizCarouselItem[];
  weakPoints: CategoryPerformance[];
  teachers: StudentTeacherOption[];
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

export interface TeacherStudentRow {
  linkId: string;
  studentId: string;
  fullName: string;
  whatsappNumber: string;
  status: StudentTeacherStatus;
  tier: StudentTier;
  upgradeRequested: boolean;
  groupNames: string[];
}

export interface StudentTeacherOption {
  teacherId: string;
  teacherName: string;
  schoolName: string;
  teacherCode: string;
  tier: StudentTier;
  status: StudentTeacherStatus;
}

/** [PROFILE-001] Aggregated settings page read model */
export interface SettingsProfile {
  fullName: string;
  whatsappNumber: string;
  role: UserRole;
  activeTeacherCode: string | null;
  tier: StudentTier | null;
  upgradeRequested: boolean;
  teacherCode: string | null;
}

export interface ImportQuestionRow {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation_text: string;
  category_tag: string;
}
