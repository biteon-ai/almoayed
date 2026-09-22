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
  loginOtpCta: "login-otp-cta",
  loginDemoStudent: "login-demo-student",
  loginDemoTeacher: "login-demo-teacher",
  loginVerificationPanel: "login-verification-panel",
  loginLoading: "login-loading",
  activeLoginLoader: "active-login-loader",
  adminLoginForm: "admin-login-form",

  // ── AUTH-008 / TEACH-015 trial join ──────────────────────────
  joinForm: "join-form",
  joinFirstName: "join-first-name",
  joinLastName: "join-last-name",
  joinClassLevel: "join-class-level",
  joinBirthDate: "join-birth-date",
  joinWhatsapp: "join-whatsapp",
  joinSubmit: "join-submit",
  trialInviteCopy: "trial-invite-copy",
  trialInviteWhatsapp: "trial-invite-whatsapp",

  // ── UI-010 PWA install ───────────────────────────────────────
  pwaInstallButtons: "pwa-install-buttons",
  pwaInstallAndroid: "pwa-install-android",
  pwaInstallIos: "pwa-install-ios",
  pwaInstallModal: "pwa-install-modal",

  // ── MT-001 / MT-002 ──────────────────────────────────────────
  teacherSwitcher: "teacher-switcher",

  // ── LAND-001 ─────────────────────────────────────────────────
  landingPage: "landing-page",

  // ── Student dashboard ────────────────────────────────────────
  studentDashboard: "student-dashboard",
  studentWelcome: "student-welcome",
  studentQuizzesPage: "student-quizzes-page",
  studentResultsPage: "student-results-page",
  studentQuizList: "student-quiz-list",
  studentQuizItem: "student-quiz-item",
  studentQuizEmpty: "student-quiz-empty",
  studentLogout: "student-logout",
  studentHeaderBack: "student-header-back",

  // ── QUIZ-001 ─────────────────────────────────────────────────
  quizPage: "quiz-page",
  quizGatekeeper: "quiz-gatekeeper",
  quizTimer: "quiz-timer",
  quizTimerBar: "quiz-timer-bar",
  quizTimerSettings: "quiz-timer-settings",
  quizTimerCard: "quiz-timer-card",
  quizAttemptSettings: "quiz-attempt-settings",
  quizEditSettingsPanel: "quiz-edit-settings-panel",
  quizEditSettingsSave: "quiz-edit-settings-save",
  quizAttemptBadge: "quiz-attempt-badge",
  challengeLeaderboard: "challenge-leaderboard",
  quizProgress: "quiz-progress",
  quizEmptyState: "quiz-empty-state",
  quizQuestionList: "quiz-question-list",
  questionCard: "question-card",
  quizSubmitButton: "quiz-submit-button",
  quizResultsShare: "quiz-results-share",
  quizResultsReview: "quiz-results-review",
  quizPendingSync: "quiz-pending-sync",
  quizRetakeCta: "quiz-retake-cta",

  // ── OFFLINE-001 ──────────────────────────────────────────────
  offlineStatusBanner: "offline-status-banner",
  offlineSyncNow: "offline-sync-now",
  pendingSyncBadge: "pending-sync-badge",

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
  teacherAnalyticsKpis: "teacher-analytics-kpis",
  teacherGradeDistributionChart: "teacher-grade-distribution-chart",
  teacherWeeklyActivityChart: "teacher-weekly-activity-chart",
  teacherExamDifficultyPanel: "teacher-exam-difficulty-panel",
  teacherPopularExamsPanel: "teacher-popular-exams-panel",

  // ── TEACH-001 ────────────────────────────────────────────────
  teacherStudentsPage: "teacher-students-page",
  studentFilters: "student-filters",
  studentCard: "student-card",
  studentActivateButton: "student-activate-button",
  studentDeactivateButton: "student-deactivate-button",
  studentManualProUpgrade: "student-manual-pro-upgrade",
  addStudentButton: "add-student-button",
  addStudentDialog: "add-student-dialog",
  studentSearch: "student-search",
  studentPagination: "student-pagination",
  teacherStudentDetailPage: "teacher-student-detail-page",
  studentDetailBackLink: "student-detail-back-link",
  studentDetailKpis: "student-detail-kpis",
  studentDetailScoreChart: "student-detail-score-chart",
  studentDetailWeakPoints: "student-detail-weak-points",
  studentDetailRecentSubmissions: "student-detail-recent-submissions",
  studentDetailQuizBreakdown: "student-detail-quiz-breakdown",

  // ── TEACH-002 ────────────────────────────────────────────────
  createGroupForm: "create-group-form",
  studentGroupSelect: "student-group-select",

  // ── TEACH-003 ────────────────────────────────────────────────
  teacherQuizzesPage: "teacher-quizzes-page",
  teacherQuizKpis: "teacher-quiz-kpis",
  teacherQuizNewButton: "teacher-quiz-new-button",
  quizListItem: "quiz-list-item",
  quizStatusBadges: "quiz-status-badges",
  quizToggleActions: "quiz-toggle-actions",
  quizEditLink: "quiz-edit-link",
  quizAssignGroupAction: "quiz-assign-group-action",
  quizAssignedGroups: "quiz-assigned-groups",
  assignGroupModal: "assign-group-modal",
  assignGroupSave: "assign-group-save",
  teacherQuizCreateForm: "teacher-quiz-create-form",
  teacherQuizCreateFlags: "teacher-quiz-create-flags",
  quizSetupImportBanner: "quiz-setup-import-banner",

  // ── TEACH-011 ────────────────────────────────────────────────
  quizDeleteAction: "quiz-delete-action",
  quizTrashTab: "quiz-trash-tab",
  quizRestoreAction: "quiz-restore-action",
  quizPermanentDeleteAction: "quiz-permanent-delete-action",
  quizTrashBanner: "quiz-trash-banner",

  // ── TEACH-004 / TEACH-012 ────────────────────────────────────
  teacherQuizEditPage: "teacher-quiz-edit-page",
  bulkImportZone: "bulk-import-zone",
  bulkImportSubmit: "bulk-import-submit",
  importValidationTips: "import-validation-tips",
  importExcelTemplateDownload: "import-excel-template-download",
  importDocxTemplateDownload: "import-docx-template-download",
  docxImportPreview: "docx-import-preview",
  docxImportConfirm: "docx-import-confirm",
  quickTextPasteOpen: "quick-text-paste-open",
  quickTextPasteDialog: "quick-text-paste-dialog",
  quickTextPasteSubmit: "quick-text-paste-submit",
  quickTextPasteSettings: "quick-text-paste-settings",
  quickTextPasteMathNotice: "quick-text-paste-math-notice",
  quickTextPasteLlmPrompt: "quick-text-paste-llm-prompt",
  manualQuestionForm: "manual-question-form",
  teacherQuestionsList: "teacher-questions-list",
  questionEditButton: "question-edit-button",
  questionEditDialog: "question-edit-dialog",
  questionEditForm: "question-edit-form",
  questionListItem: "question-list-item",

  // ── PROFILE-001 ──────────────────────────────────────────────
  profileTierInfo: "profile-tier-info",
  profileTeacherCode: "profile-teacher-code",
  profileSessionManagement: "profile-session-management",

  // ── PROFILE-002 ──────────────────────────────────────────────
  studentOnboarding: "student-onboarding",
  profileCompletionModal: "profile-completion-modal",
  profileCompletionSubmit: "profile-completion-submit",
  studentDemographicsSettings: "student-demographics-settings",

  // ── ADMIN-001 ────────────────────────────────────────────────
  adminLayout: "admin-layout",
  adminNavDashboard: "admin-nav-dashboard",
  adminNavTeachers: "admin-nav-teachers",
  adminKpiTotalUsers: "admin-kpi-total-users",
  adminKpiTeachers: "admin-kpi-teachers",
  adminKpiStudents: "admin-kpi-students",
  adminKpiExams: "admin-kpi-exams",
  adminKpiAttempts: "admin-kpi-attempts",
  adminTeachersTable: "admin-teachers-table",
  adminAddTeacherBtn: "admin-add-teacher-btn",
  adminTeacherSearch: "admin-teacher-search",
  adminTeacherStatusFilter: "admin-teacher-status-filter",
  adminTeacherStatsActive: "admin-teacher-stats-active",
  adminCreateTeacherModal: "admin-create-teacher-modal",
  adminCreateTeacherSubmit: "admin-create-teacher-submit",
  adminTeacherFormPage: "admin-teacher-form-page",
  adminEditTeacherSubmit: "admin-edit-teacher-submit",
  adminDeleteTeacherDialog: "admin-delete-teacher-dialog",
  adminImpersonationBanner: "admin-impersonation-banner",
  adminImpersonationExit: "admin-impersonation-exit",
  teacherEmailLoginForm: "teacher-email-login-form",

  // ── AUTH-009 ─────────────────────────────────────────────────
  teacherLoginBack: "teacher-login-back",
  teacherForgotPasswordLink: "teacher-forgot-password-link",
  teacherForgotPasswordForm: "teacher-forgot-password-form",
  teacherForgotPasswordSubmit: "teacher-forgot-password-submit",
  teacherMagicLinkCta: "teacher-magic-link-cta",
  teacherMagicLinkForm: "teacher-magic-link-form",
  teacherMagicLinkSubmit: "teacher-magic-link-submit",
  teacherResetForm: "teacher-reset-form",
  teacherResetPassword: "teacher-reset-password",
  teacherResetPasswordConfirm: "teacher-reset-password-confirm",
  teacherResetSubmit: "teacher-reset-submit",
  teacherMagicConsume: "teacher-magic-consume",

  // ── ADMIN-002 ────────────────────────────────────────────────
  adminNavSettings: "admin-nav-settings",
  adminPlatformSettings: "admin-platform-settings",
  adminDemoModeSwitch: "admin-demo-mode-switch",
  adminFixedOtpSwitch: "admin-fixed-otp-switch",
  adminFixedOtpCode: "admin-fixed-otp-code",
  adminSettingsSave: "admin-settings-save",
  loginFixedOtpField: "login-fixed-otp-field",

  // ── MT-003 ───────────────────────────────────────────────────
  unlinkStudentAction: "unlink-student-action",
  adminNavStudents: "admin-nav-students",
  adminStudentsTable: "admin-students-table",
  adminStudentPurgeAction: "admin-student-purge-action",
  adminStudentSearch: "admin-student-search",
  adminStudentViewAction: "admin-student-view-action",
  adminStudentDetailPage: "admin-student-detail-page",

  // ── UI-007 ───────────────────────────────────────────────────
  resultsCard: "results-card",
  resultsScoreBadge: "results-score-badge",

  // ── UI-006 ───────────────────────────────────────────────────
  navbarProgress: "navbar-progress",
  topNavLoader: "top-nav-loader",

  // ── GAMIF-001 ────────────────────────────────────────────────
  gamifSettingsPage: "gamif-settings-page",
  gamifTierList: "gamif-tier-list",
  gamifTierAdd: "gamif-tier-add",
  gamifTierForm: "gamif-tier-form",
  gamifIconSelect: "gamif-icon-select",
  gamifTiersSave: "gamif-tiers-save",
  gamifLoadPresets: "gamif-load-presets",
  gamificationHeaderActions: "gamification-header-actions",
  gamificationEmptyState: "gamification-empty-state",
  gamificationPresetBtn: "gamification-preset-btn",
  gamifLevelCard: "gamif-level-card",
  gamifBadgeGallery: "gamif-badge-gallery",
  gamifRewardsCount: "gamif-rewards-count",
  gamifRewardsExpand: "gamif-rewards-expand",
  gamifRewardsTrack: "gamif-rewards-track",
  gamifResultsSummary: "gamif-results-summary",

  // ── UI-012 / UI-013 native shell + drawer ────────────────────
  nativeProfileDrawer: "native-profile-drawer",
  nativeDrawerClose: "native-drawer-close",
  nativeThemeSwitcher: "native-theme-switcher",
  nativeOfflineList: "native-offline-list",
  nativeDrawerSettings: "native-drawer-settings",
  nativeShareApp: "native-share-app",
  nativeContactUs: "native-contact-us",
  nativeAppVersion: "native-app-version",

  // ── DASH-002 action tiles ────────────────────────────────────
  dashboardActionTiles: "dashboard-action-tiles",
  dashboardTileProgress: "dashboard-tile-progress",
  dashboardTileQuizzes: "dashboard-tile-quizzes",
  dashboardTileResults: "dashboard-tile-results",
  dashboardTileContinue: "dashboard-tile-continue",

  // ── UI-015 in-app A2HS sheet ─────────────────────────────────
  pwaInstallSheet: "pwa-install-sheet",
  pwaInstallSheetAndroid: "pwa-install-sheet-android",
  pwaInstallSheetGuide: "pwa-install-sheet-guide",
  pwaInstallSheetDismiss: "pwa-install-sheet-dismiss",

  // ── UI-016 quiz player ───────────────────────────────────────
  quizPlayerHeader: "quiz-player-header",
  quizExitButton: "quiz-exit-button",
  quizExitDialog: "quiz-exit-dialog",
  quizQuestionPager: "quiz-question-pager",
  quizJumpSheet: "quiz-jump-sheet",
  quizAllQuestions: "quiz-all-questions",

  // ── UI-017 step nav + submit confirm ─────────────────────────
  quizStepPrev: "quiz-step-prev",
  quizStepNext: "quiz-step-next",
  quizSubmitConfirm: "quiz-submit-confirm",
  quizUnansweredAlert: "quiz-unanswered-alert",
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
