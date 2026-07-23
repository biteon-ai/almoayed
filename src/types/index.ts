export type {
  ActionResult,
  BankDetails,
  Category,
  CategoryPerformance,
  DashboardStats,
  ExamQuestion,
  ExamSubmission,
  ImportQuestionRow,
  Profile,
  Question,
  Quiz,
  QuizCarouselItem,
  QuizListItem,
  QuizSubmitResult,
  QuizType,
  RecentScoreRow,
  SettingsProfile,
  StudentAnswer,
  StudentDashboardData,
  StudentTeacher,
  StudentTeacherOption,
  StudentTeacherStatus,
  StudentTier,
  TeacherDashboardAnalytics,
  TeacherGroup,
  TeacherQuiz,
  TeacherStudentAnalytics,
  TeacherStudentDetail,
  TeacherStudentRow,
  Topic,
  UserRole,
} from "./database";

export type { LoginState } from "./auth";

/** Shared KPI block used on teacher dashboard analytics panels. */
export type KPIMetrics = import("./database").TeacherDashboardAnalytics["kpis"];

/** Per-student KPI block on the teacher student detail view. */
export type StudentKPIMetrics = import("./database").TeacherStudentAnalytics["kpis"];
