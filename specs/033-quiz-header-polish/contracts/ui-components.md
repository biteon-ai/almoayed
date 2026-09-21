# Contracts: UI components (UI-018)

Locale `ar-SY`, `dir="rtl"` on the page. Tap targets `min-h-11`. Visual left/right on the card-header **action row** are **physical** (row uses `dir="ltr"`). Extends UI-017 player chrome.

## Card-header action row

While taking, a single row at the top of the question card:

| Slot | Physical side | Control | Spekit |
|------|---------------|---------|--------|
| Compact submit | **left** | Short «تسليم» + small flag or check icon | `quiz-submit-button` |
| Number stepper | **right** | Existing compact `QuestionPager` | `quiz-question-pager` |

Rules:
- Submit is `shrink-0` (not `flex-1`). Copy is «تسليم», never «تسليم الإجابات وإنهاء الاختبار».
- Stepper is not centered while taking; it stays flush to the visual right (`ms-auto`).
- Answered-progress bar (`quiz-progress`) remains **under** this row (UI-017). Do not reuse it as the timer bar.
- Review mode: no compact taking submit.

## Compact submit states

| State | Appearance | Tap |
|-------|------------|-----|
| Incomplete | faded, `disabled`, not tappable | no confirm, no unanswered dialog, no grade |
| Complete | full opacity, enabled | opens existing `quiz-submit-confirm` |
| Pending | disabled, «جاري التسليم...» / «جاري الحفظ...» | no double submit |
| Empty quiz | not a successful-grade CTA | — |

Confirm dialog copy stays UI-017. Timed auto-submit does not open it.

## Timer + countdown bar

`QuizTimerBadge` (Spekit `quiz-timer`) still shows `MM:SS` + «الوقت المتبقي».

Under that row, timed taking only:

| Element | Rule | Spekit |
|---------|------|--------|
| Thin linear bar | fill width = remaining ÷ attempt duration; empty at `00:00` | `quiz-timer-bar` |
| Warning | same rose treatment as digits when remaining is in the 2-minute warning window | (inherits badge) |
| Untimed | no bar | — |
| Submitted / review | live bar not shown (header already hides live timer) | — |

`role="progressbar"` on the timer bar: `aria-valuemin=0`, `aria-valuemax=100`, `aria-valuenow` = rounded remaining percent, `aria-label` remaining-time (e.g. «الوقت المتبقي»).

## «كل الأسئلة»

Player header end-column control. Copy unchanged. Spekit `quiz-all-questions` on the **button**. Sheet remains `quiz-jump-sheet`. Visual weight aligned with the compact timer (not oversized, not faint text-only). Jump-and-dismiss unchanged.

## Unchanged

- `quiz-exit-dialog` save-and-leave
- `quiz-submit-confirm` copy
- Gatekeeper: no solutions until successful submit
- QUIZ-004 auto-submit at zero
- Card-header answered-progress (`quiz-progress`)
