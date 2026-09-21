# Contracts: UI components (UI-017)

Locale `ar-SY`, `dir="rtl"`. Tap targets `min-h-11`. Extends UI-016 player chrome.

## Question step nav

Removed from the taking sticky bar and review footer. Stepping is the compact card-header pager (`quiz-question-pager`). Spekit `quiz-step-prev` / `quiz-step-next` remain on `QuestionStepNav` if remounted later.

## Compact pager (question card header)

Replaces the static «السؤال N» badge. Centered stepper inside the card header (`dir="ltr"` so glyphs stay physical). Arabic RTL order: `[ < التالي ] [next] [current] [prev] [ > السابق ]`. Example on Q7: `[ < ] [ 8 ] [ 7 ] [ 6 ] [ > ]`. Current stays the middle highlighted slot. Empty spacers at first/last. Spekit `quiz-question-pager`.

«كل الأسئلة» sits in the player header (visual left, beside the timer) and still opens `QuestionJumpSheet` (`quiz-jump-sheet`). A thin emerald progress bar (`quiz-progress`) sits under the stepper in the card header; answered count stays in `aria-label` (no visible «N من N • %» text).

## Submit (inline with pager)

Shown in the card-header action row when on the last question **or** when every question is answered. Spekit `quiz-submit-button`.

| Layout | Rule |
|--------|------|
| Row | `dir="ltr"` 2-column flex: submit **left**, stepper **right** |
| Other questions | Submit hidden; stepper stays centered |
| Sticky bottom bar | Removed (no full-width spacer) |

Tap still opens unanswered warning when blanks remain, or the Arabic confirm when complete. Timed auto-submit skips confirm.

## Submit confirmation

`AlertDialog`.

| Element | Copy | Spekit |
|---------|------|--------|
| Dialog | `role="alertdialog"` | `quiz-submit-confirm` |
| Title | هل أنت متأكد من تسليم الإجابات؟ | |
| Description | لا يمكنك التراجع بعد التأكيد. | |
| Cancel | إلغاء | |
| Confirm | تأكيد التسليم | |

Confirm → existing submit path (online grade / offline enqueue). Cancel → no enqueue. Expiry auto-submit must not open this dialog; if open, close it.

## Centered chrome

| Surface | Rule |
|---------|------|
| Card header | Compact 3-pill stepper centered in the card header |
| Stem / choices | Stay `text-start` |
| Player header | Equal-width side cells; timer centered; exit in start cell |

## Unchanged

- `quiz-exit-dialog` save-and-leave
- `quiz-timer` MM:SS + 2-minute warning
- Gatekeeper: no solutions until successful submit
- `QuestionJumpSheet` dismiss-on-jump
