/**
 * Stable DOM hooks for Spekit Spots / Bites targeting.
 * CSS selector: [data-spekit="<id>"]
 * @see .speckit/spekit-targets.yaml
 */
export const SPEKIT = {
  // ── AUTH-001 / AUTH-002 ──────────────────────────────────────
  loginBrandHeader: "login-brand-header",
  loginForm: "login-form",
  loginWhatsappField: "login-whatsapp-field",
  loginTeacherCode: "login-teacher-code",
  loginNameField: "login-name-field",
  loginSubmit: "login-submit",
  loginDemoStudent: "login-demo-student",
  loginDemoTeacher: "login-demo-teacher",
  loginVerificationPanel: "login-verification-panel",
  loginLoading: "login-loading-overlay",

  // ── MT-001 / MT-002 ──────────────────────────────────────────
  teacherSwitcher: "teacher-switcher",

  // ── Student dashboard ────────────────────────────────────────
  studentDashboard: "student-dashboard",
  studentWelcome: "student-welcome",
  studentQuizList: "student-quiz-list",
  studentQuizItem: "student-quiz-item",
  studentQuizEmpty: "student-quiz-empty",
  studentLogout: "student-logout",

  // ── QUIZ-001 ─────────────────────────────────────────────────
  quizPage: "quiz-page",
  quizGatekeeper: "quiz-gatekeeper",
  quizProgress: "quiz-progress",
  quizEmptyState: "quiz-empty-state",
  quizQuestionList: "quiz-question-list",
  questionCard: "question-card",
  quizSubmitButton: "quiz-submit-button",
  quizResultsShare: "quiz-results-share",
  quizResultsReview: "quiz-results-review",

  // ── QUIZ-002 ─────────────────────────────────────────────────
  weakPointsCard: "weak-points-card",
  weakPointsRecommendations: "weak-points-recommendations",

  // ── TIER-001 / TIER-002 ─────────────────────────────────────
  proUpgradeCard: "pro-upgrade-card",
  proUpgradeRequestButton: "pro-upgrade-request-button",
  proApprovalPanel: "pro-approval-panel",
  proApproveButton: "pro-approve-button",

  // ── Teacher layout & dashboard ───────────────────────────────
  teacherLayoutNav: "teacher-layout-nav",
  teacherLayoutNavMobile: "teacher-layout-nav-mobile",
  teacherDashboard: "teacher-dashboard",
  teacherCodeCard: "teacher-code-card",
  teacherStatsGrid: "teacher-stats-grid",
  teacherStatStudents: "teacher-stat-students",
  teacherStatQuizzes: "teacher-stat-quizzes",
  teacherStatProRequests: "teacher-stat-pro-requests",
  teacherQuickActions: "teacher-quick-actions",

  // ── TEACH-001 ────────────────────────────────────────────────
  teacherStudentsPage: "teacher-students-page",
  studentFilters: "student-filters",
  studentCard: "student-card",
  studentActivateButton: "student-activate-button",
  studentDeactivateButton: "student-deactivate-button",
  studentManualProUpgrade: "student-manual-pro-upgrade",

  // ── TEACH-002 ────────────────────────────────────────────────
  createGroupForm: "create-group-form",
  studentGroupSelect: "student-group-select",

  // ── TEACH-003 ────────────────────────────────────────────────
  teacherQuizzesPage: "teacher-quizzes-page",
  teacherQuizNewButton: "teacher-quiz-new-button",
  quizListItem: "quiz-list-item",
  quizStatusBadges: "quiz-status-badges",
  quizToggleActions: "quiz-toggle-actions",
  quizEditLink: "quiz-edit-link",
  teacherQuizCreateForm: "teacher-quiz-create-form",
  teacherQuizCreateFlags: "teacher-quiz-create-flags",
  quizSetupImportBanner: "quiz-setup-import-banner",

  // ── TEACH-004 ────────────────────────────────────────────────
  teacherQuizEditPage: "teacher-quiz-edit-page",
  bulkImportZone: "bulk-import-zone",
  bulkImportSubmit: "bulk-import-submit",
  docxImportPreview: "docx-import-preview",
  docxImportConfirm: "docx-import-confirm",
  manualQuestionForm: "manual-question-form",
  teacherQuestionsList: "teacher-questions-list",
  questionEditButton: "question-edit-button",
  questionEditDialog: "question-edit-dialog",
  questionEditForm: "question-edit-form",
  questionListItem: "question-list-item",
} as const;

export type SpekitTarget = (typeof SPEKIT)[keyof typeof SPEKIT];

/** Spread onto any element: `{...spekit(SPEKIT.loginForm)}` */
export function spekit(id: SpekitTarget) {
  return { "data-spekit": id } as const;
}

/** For server components: `data-spekit={SPEKIT.studentDashboard}` */
export function spekitAttr(id: SpekitTarget) {
  return id;
}
