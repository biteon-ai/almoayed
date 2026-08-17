# UI Component Contracts: TEACH-013

## Entry — `QuizQuestionsManager`

| Control | Label | Placement |
|---------|-------|-----------|
| Open paste | **«لصق نصي سريع»** | Adjacent to **«إضافة سؤال يدوياً»** (same toolbar/actions row) |

- Spekit: `data-spekit={SPEKIT.quickTextPasteOpen}` → `quick-text-paste-open`
- Does not remove or relocate file-import tab / manual add

## Dialog — `QuickTextPasteDialog` (NEW)

| Element | Requirement |
|---------|-------------|
| Shell | Shadcn `Dialog`, `dir="rtl"`, mobile-friendly full-width content |
| Spekit root | `quick-text-paste-dialog` |
| Textarea | Multi-line; placeholder = sample format (or abbreviated) |
| Copy example | **«نسخ نموذج التنسيق»** → clipboard + brief confirmation |
| Preview | Live list: valid vs invalid; Arabic `error_reason` on invalid |
| Save | **Confirm** disabled when no text or zero valid (or allowed but shows error) |
| Spekit submit | `quick-text-paste-submit` |
| Loading | Disable controls + spinner while Server Action pending |

### Post-save UX

| Outcome | UI |
|---------|-----|
| `imported ≥ 1` | Close dialog; toast: imported count; mention skipped invalids and/or cap if applicable; `router.refresh()` |
| `imported === 0` | Keep open; Arabic “لا يوجد أسئلة صالحة” (or equivalent) |

### Accessibility / RTL

- Touch targets `h-10`–`h-12`
- Labels Arabic; no raw native file controls in this dialog
- Preview scrollable if many blocks

## Out of scope UI

- Per-row edit controls in preview
- Replace-mode toggle
- File dropzone inside paste dialog
