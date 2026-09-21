export type UserRole = "TEACHER" | "STUDENT" | "SUPER_ADMIN";
export type TeacherAccountStatus = "active" | "inactive";
export type AuthMethod = "whatsapp" | "email";
export type StudentTeacherStatus = "pending" | "active" | "deactivated";
export type StudentTier = "free" | "pro";
export type QuizType = "regular" | "session_group";

/** QUIZ-005 — pedagogical quiz category (distinct from audience quiz_type) */
export type AssessmentCategory = "practice" | "evaluation" | "challenge";

export interface BankDetails {
  bank_name?: string;
  account_holder?: string;
  account_number?: string;
  iban?: string;
  notes?: string;
}

export interface Profile {
  id: string;
  whatsapp_number: string | null;
  full_name: string;
  role: UserRole;
  is_subscribed: boolean;
  verification_token: string | null;
  school_name: string;
  address: string;
  bank_details: BankDetails;
  teacher_code: string | null;
  last_session_id: string | null;
  email: string | null;
  password_hash: string | null;
  phone_number: string | null;
  teacher_account_status: TeacherAccountStatus;
  max_quiz_limit: number | null;
  auth_method: AuthMethod;
  birth_date: string | null;
  education_stage: EducationStage | null;
  province: string | null;
  city: string | null;
  referral_source: ReferralSource | null;
  primary_subject: string | null;
  onboarding_completed: boolean;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

/** [PROFILE-002] Student education stage */
export type EducationStage =
  | "primary"
  | "preparatory"
  | "secondary"
  | "baccalaureate"
  | "university"
  | "other";

/** [PROFILE-002] How the student got the teacher code */
export type ReferralSource =
  | "class"
  | "whatsapp"
  | "friend"
  | "social"
  | "other";

/** [PROFILE-002] Student demographics (camelCase for UI/actions) */
export interface StudentDemographics {
  birthDate: string | null;
  educationStage: EducationStage | null;
  province: string | null;
  city: string | null;
  address: string;
  email: string | null;
  referralSource: ReferralSource | null;
  primarySubject: string | null;
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
  is_archived: boolean;
  /** Soft-delete / Trash marker — null = active list; set = in Trash (TEACH-011) */
  deleted_at: string | null;
  quiz_type: QuizType;
  target_group_id: string | null;
  /** QUIZ-004 — teacher-enabled countdown */
  is_timed: boolean;
  /** QUIZ-004 — whole minutes 1–180 when timed; null when untimed */
  duration_minutes: number | null;
  /** QUIZ-005 — practice / evaluation / challenge */
  assessment_category: AssessmentCategory;
  /** QUIZ-005 — 0 = unlimited; 1–10 = finite cap */
  max_attempts: number;
  created_at: string;
  updated_at: string;
}

/** QUIZ-005 — student attempt summary on quiz load */
export interface QuizAttemptState {
  usedAttempts: number;
  maxAttempts: number;
  canStartNewAttempt: boolean;
  bestScore: number | null;
  latestSubmissionId: string | null;
  reviewSubmissionId: string | null;
}

/** [ADMIN-001] Platform KPI snapshot */
export interface AdminKpiSnapshot {
  totalUsers: number;
  totalTeachers: number;
  activeTeachers: number;
  inactiveTeachers: number;
  totalStudents: number;
  totalExams: number;
  publishedExams: number;
  draftExams: number;
  completedAttempts: number;
}

export interface SubjectCatalogItem {
  id: string;
  nameAr: string;
  slug: string;
}

/** [ADMIN-001] Teacher row for Super Admin roster */
export interface AdminTeacherRow {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  status: TeacherAccountStatus;
  subjects: SubjectCatalogItem[];
  quizCount: number;
  maxQuizLimit: number | null;
  createdAt: string;
}

/** [MT-003] Student row for Super Admin platform directory */
export interface AdminStudentRow {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  teacherLinkCount: number;
  createdAt: string;
}

/** [MT-003] Teacher link summary on admin student profile */
export interface AdminStudentTeacherLink {
  linkId: string;
  teacherId: string;
  teacherName: string;
  status: StudentTeacherStatus;
  tier: StudentTier;
  linkedAt: string;
}

/** [MT-003] Full student profile for Super Admin detail page */
export interface AdminStudentDetail extends AdminStudentRow {
  email: string | null;
  schoolName: string;
  birthDate: string | null;
  educationStage: EducationStage | null;
  province: string | null;
  city: string | null;
  address: string;
  onboardingCompleted: boolean;
  profileCompleted: boolean;
  submissionCount: number;
  teacherLinks: AdminStudentTeacherLink[];
}

export interface TeacherQuiz extends Quiz {
  question_count: number;
  /** Groups assigned via quiz_groups junction (TEACH-001) */
  assigned_groups: Array<{ id: string; name: string }>;
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

/** [DASH-001] Quiz card in horizontal carousel */
export interface QuizCarouselItem extends QuizListItem {
  questionCount: number;
  hasSubmission: boolean;
  /** Latest submission timestamp when the student has activity on this quiz */
  lastActivityAt: string | null;
  /** Resolved category label for student UI filters */
  categoryName: string;
  /** Best submission score when completed (QUIZ-005) */
  lastScore: number | null;
  /** Estimated duration derived from question count */
  estimatedMinutes: number;
  /** QUIZ-005 */
  usedAttempts: number;
  maxAttempts: number;
  canRetake: boolean;
  bestScore: number | null;
}

/** [DASH-001] Recent completed quiz row for My Scores tab */
export interface RecentScoreRow {
  submissionId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  submittedAt: string;
  categoryName: string;
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

/** [QUIZ-006] Per-attempt question and option display order. */
export interface AttemptPresentation {
  questionIds: string[];
  optionOrders: Record<string, string[]>;
}

export interface ExamSubmission {
  id: string;
  student_id: string;
  quiz_id: string;
  score: number;
  submitted_at: string;
  /** [QUIZ-006] Snapshot of question IDs in the order shown; null on legacy rows. */
  question_order: string[] | null;
  /** [QUIZ-006] Map of questionId → option texts in display order; null on legacy rows. */
  option_orders: Record<string, string[]> | null;
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
    /** [QUIZ-006] Options in the order shown on this attempt. */
    options: string[];
  }>;
}

/** Result shape for teacher student hub mutations */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: "fullName" | "whatsapp" | "group" | "tier" };

export interface TeacherStudentRow {
  linkId: string;
  studentId: string;
  fullName: string;
  whatsappNumber: string;
  status: StudentTeacherStatus;
  tier: StudentTier;
  upgradeRequested: boolean;
  groupNames: string[];
  /** Singular group for this teacher (hub UX); null if unassigned */
  groupId: string | null;
  /** student_teachers.created_at — registration / link date */
  createdAt: string;
}

export interface StudentTeacherOption {
  teacherId: string;
  teacherName: string;
  schoolName: string;
  teacherCode: string;
  tier: StudentTier;
  status: StudentTeacherStatus;
}

/** [TEACH-005] Teacher dashboard analytics read model */
export interface TeacherDashboardAnalytics {
  studentCount: number;
  quizCount: number;
  pendingUpgrades: number;
  kpis: {
    completionRate: number;
    completedAttempts: number;
    totalAttempts: number;
    completionTrendPct: number;
    passRate: number;
    perfectScoreStudentPct: number;
    perfectScoreStudentCount: number;
    averageScore: number;
    averageScoreLabel: string;
    topPerformer: {
      studentId: string;
      name: string;
      averageScore: number;
    } | null;
  };
  gradeDistribution: Array<{
    range: string;
    label: string;
    count: number;
    fill: string;
  }>;
  weeklyActivity: Array<{
    day: string;
    passed: number;
    failed: number;
  }>;
  examDifficulty: {
    hardest: { title: string; avgScore: number; passRate: number } | null;
    easiest: { title: string; avgScore: number; passRate: number } | null;
  };
  popularExams: Array<{
    rank: number;
    title: string;
    attempts: number;
    completionRate: number;
  }>;
}

/** [TEACH-001] Per-student analytics read model for teacher detail view */
export interface TeacherStudentAnalytics {
  kpis: {
    completionRate: number;
    completedAttempts: number;
    totalAccessibleQuizzes: number;
    passRate: number;
    averageScore: number;
    averageScoreLabel: string;
    perfectScores: number;
  };
  recentSubmissions: Array<{
    quizId: string;
    quizTitle: string;
    score: number;
    submittedAt: string;
    passed: boolean;
  }>;
  scoreHistory: Array<{
    date: string;
    score: number;
    quizTitle: string;
  }>;
  quizBreakdown: Array<{
    quizId: string;
    title: string;
    score: number | null;
    submittedAt: string | null;
    accessible: boolean;
    passed: boolean | null;
  }>;
  weakPoints: CategoryPerformance[];
}

export interface TeacherStudentDetail {
  student: TeacherStudentRow;
  analytics: TeacherStudentAnalytics;
  demographics: StudentDemographics | null;
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
  /** [PROFILE-002] Present for students */
  demographics?: StudentDemographics | null;
  onboardingCompleted?: boolean;
  profileCompleted?: boolean;
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

/** [GAMIF-001/002] Teacher-configured level reward icons */
export type GamificationIconType =
  | "cup"
  | "diamond"
  | "star"
  | "shield"
  | "badge"
  | "badge_bronze"
  | "badge_silver"
  | "badge_gold"
  | "star_bronze"
  | "star_silver"
  | "star_gold"
  | "cup_bronze"
  | "cup_silver"
  | "cup_gold"
  | "crown";

export interface GamificationTier {
  id: string;
  teacher_id: string;
  level_number: number;
  level_name: string;
  min_completed_quizzes: number;
  min_avg_score: number;
  icon_type: GamificationIconType;
  created_at: string;
  updated_at: string;
}

/** Payload row for saveGamificationTiers (order = array index → level_number) */
export interface GamificationTierSaveInput {
  id?: string;
  levelName: string;
  minCompletedQuizzes: number;
  minAvgScore: number;
  iconType: GamificationIconType;
}

/** [AUTH-009] One-time teacher password-reset or magic-link grant */
export type TeacherLoginTokenPurpose = "password_reset" | "magic_link";

export interface TeacherLoginToken {
  id: string;
  profile_id: string;
  purpose: TeacherLoginTokenPurpose;
  token_hash: string;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
}
