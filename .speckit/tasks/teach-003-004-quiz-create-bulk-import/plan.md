# Implementation Plan: TEACH-003/004 Quiz Create + Bulk Import Flow

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 App Router, RSC + Client Components |
| UI | Tailwind, Shadcn/Base UI, RTL Arabic |
| Data | Supabase via Server Actions in `src/actions/teacher.ts` |
| Session | iron-session `requireTeacher()` |
| Tests | Vitest (`tests/features/`), Playwright (`e2e/`) |

## Project Structure (this feature)

```
src/app/teacher/quizzes/new/page.tsx          → mounts QuizCreateWizard
src/components/teacher/QuizCreateWizard.tsx     → create + redirect
src/components/teacher/QuizCreateForm.tsx       → step-1 form (no is_active checkbox)
src/app/teacher/quizzes/[id]/page.tsx           → edit dashboard
src/components/teacher/EditQuizBulkImportSection.tsx → setup banner + BulkQuestionUpload
src/components/teacher/BulkQuestionUpload.tsx   → dropzone + importQuestions client action
src/components/teacher/EditQuizImportToast.tsx  → ?imported=N toast
src/components/teacher/QuizListItem.tsx         → activation guard UI
src/actions/teacher.ts                          → createQuiz, importQuestions, updateQuizFlags
src/types/database.ts                           → TeacherQuiz + question_count
```

## Key Design Decisions

1. **Durable URL (Option B)**: No in-memory wizard step 2 on `/new`; redirect to edit page with `?setup=import`.
2. **Append re-import (Option A)**: Second file always appends parsed rows.
3. **Inactive until questions (Option C)**: `createQuiz` forces `is_active=false`; `updateQuizFlags` guards activation.
4. **No activation nudge (Option A)**: Toast only; teacher activates from quiz list.

## Implementation Status

Core UI and server actions are **implemented**. Remaining work: unit tests, Spekit registry sync, manual/E2E verification, spec.yaml audit.
