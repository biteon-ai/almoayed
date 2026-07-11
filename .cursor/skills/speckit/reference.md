# Speckit Feature ID Quick Reference

Source of truth: `.speckit/spec.yaml`

## Implemented (do not break)

| ID | Name | Key files |
|----|------|-----------|
| AUTH-001 | WhatsApp login | `src/actions/auth.ts`, `src/app/login/` |
| AUTH-002 | Teacher code registration | `src/actions/auth.ts`, login form |
| AUTH-003 | Device session lock | `src/lib/auth.ts`, `src/lib/device-session.ts` |
| AUTH-004 | Logout | `src/actions/auth.ts` |
| MT-001 | Multi-tenant linking | `student_teachers`, `src/actions/student.ts` |
| MT-002 | Teacher switcher | `src/components/dashboard/TeacherSwitcher.tsx` |
| QUIZ-001 | Gatekeeper | `src/lib/quiz-gatekeeper.ts`, `src/actions/quiz.ts` |
| QUIZ-002 | Weak points | `src/lib/weak-points.ts`, `WeakPointsCard.tsx` |
| QUIZ-003 | WhatsApp share | `src/components/quiz/WhatsAppShare.tsx` |
| TIER-001 | Free/Pro gating | `src/lib/quiz-access.ts` |
| TIER-002 | Pro upgrade | `src/lib/tier-upgrade.ts`, `ProUpgradeCard.tsx` |
| TEACH-001 | Student management | `src/components/teacher/StudentManagement.tsx` |
| TEACH-002 | Groups | teacher groups actions + UI |
| TEACH-003 | Quiz CRUD | `src/app/teacher/quizzes/` |
| TEACH-004 | Bulk import | `src/lib/import-questions.ts`, `FileUploadZone.tsx` |
| TEACH-005 | Dashboard stats | `StatCard.tsx`, `src/actions/teacher.ts` |
| UI-001 | RTL mobile shell | `MobileShell.tsx`, `layout.tsx` |
| UI-002 | Status badges | `src/components/ui/status-badge.tsx` |
| ENABLE-001 | Spekit hooks | `src/lib/spekit-targets.ts` |

## Partial (known gaps)

See `spec.yaml` for TEACH-006–008, UI-003 entries.

## Spekit hook selector

CSS: `[data-spekit="<id>"]` — IDs defined in `SPEKIT` constant.

Core 7 hooks: `login-form`, `teacher-switcher`, `quiz-gatekeeper`, `weak-points-card`, `pro-upgrade-card`, `pro-approval-panel`, `bulk-import-zone`.

## Test commands

```bash
npm run test:unit      # Vitest — all Spekit feature tests
npm run test:e2e       # Playwright smoke
npm run test:ci        # Full quality gates + E2E
```
