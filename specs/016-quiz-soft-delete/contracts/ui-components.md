# Contracts: UI (TEACH-011)

## Route: `/teacher/quizzes`

| Concern | Behavior |
|---------|----------|
| Tabs | «اختباراتي» (`view=active`) · «سلة المهملات» (`view=trash`); Spekit `quiz-trash-tab` on Trash control |
| Active cards | Existing toggles + **«حذف»** (Trash icon); Spekit `quiz-delete-action`; loading on pending id |
| Trash cards | Title/meta + **«استعادة»** (`quiz-restore-action`) + **«حذف نهائي»** (`quiz-permanent-delete-action`) |
| Soft delete | No confirm dialog; remove from local active list / `router.refresh()` |
| Permanent delete | Shadcn `AlertDialog` Arabic copy e.g. «هل أنت متأكد من حذف هذا الاختبار بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء» (+ history loss). Cancel = no-op. Confirm → `permanentlyDeleteQuiz` with loading / disable double submit |
| Empty states | Arabic empty for active and for Trash |
| RTL | `dir="rtl"` shell; touch targets `h-10`–`h-12`; Tajawal |

Search params: `?page=&view=active|trash` (reset page to 1 on view switch).

## Route: `/teacher/quizzes/[id]`

| Concern | Behavior |
|---------|----------|
| Soft-deleted quiz | Render page (not redirect). Banner «في سلة المهملات» (`quiz-trash-banner`) + Restore (+ optional Permanent Delete with same dialog) |
| Active quiz | No trash banner; optional soft-delete entry may live on list only for v1 |

## Out of UI scope

- Bulk empty Trash / multi-select
- Soft-delete confirmation dialog
- Auto-purge countdowns
