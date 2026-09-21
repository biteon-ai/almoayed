# Contracts: UI components (UI-016)

Locale `ar-SY`, `dir="rtl"`, Tajawal. Primary tap targets `min-h-11` (44px). Spekit via `src/lib/spekit-targets.ts` + `.speckit/spekit-targets.yaml`.

Student shell (`StudentHeader`, `StudentBottomNav`) stays. A2HS sheet remains hidden on `/quiz/*` (UI-015).

## Quiz player header

Sticky under the student header. Does not include title cards, progress rings, or lock banners.

| Element | Copy / behavior | Spekit |
|---------|-----------------|--------|
| Root | slim bar, stays visible while the stem scrolls | `quiz-player-header` |
| Exit | icon + accessible name «خروج» or «رجوع» | `quiz-exit-button` |
| Timer | `MM:SS` + «الوقت المتبقي»; omit if untimed; `role="timer"` | `quiz-timer` (existing) |
| Warning | remaining ≤ 2 minutes and > 0: soft rose/amber accent, may pulse | same `quiz-timer` |

## Exit dialog

`AlertDialog`. Distinct confirm vs cancel.

| Element | Copy | Spekit |
|---------|------|--------|
| Dialog | `role="alertdialog"` | `quiz-exit-dialog` |
| Title | هل أنت متأكد أنك تريد الخروج؟ | |
| Description | سيتم حفظ تقدّمك. | |
| Cancel | بقاء | |
| Confirm | خروج | |

Confirm → flush in-progress → `/quizzes`. Cancel → same question. After submit, header exit skips this dialog.

## Question card

One question. Full width of the player column (`max-w-3xl` centered). Generous padding, light shadow, semantic surface (`bg-card` / background — not a hard-coded white island that ignores dark mode). Motion: `quiz-question-enter` on `activeIndex` change; none when `prefers-reduced-motion: reduce`.

| Element | Copy / behavior | Spekit |
|---------|-----------------|--------|
| Card | stem + options | `question-card` (existing) |
| Badge | السؤال {n} (1-based) | |
| Category chip | **only** when `showResult` | |
| Choice row | `min-h-11`, letter badge A, B, C… on **start** side | |
| Selected (taking) | row + badge use `#065f46`, white letter | |
| Review | existing correct/wrong + explanation; still no leak before submit | |

Math stem and question image remain inside the card; page padding must clear sticky header and `bottom-16` bar so the last option is tappable.

## Question pager

Horizontal strip, `overflow-x-auto`, no wrap, RTL.

| Element | Behavior | Spekit |
|---------|----------|--------|
| Root | chips `min-h-11 min-w-11`; current vs answered vs empty | `quiz-question-pager` |
| Chip | `aria-label="السؤال N"`; `aria-current="step"` on active | |
| Overview | «كل الأسئلة» opens the jump sheet | |

Hidden when `questions.length === 0`.

## Jump sheet

`Dialog` bottom sheet (`inset-x-0 bottom-16`, rounded top, `md` may center). Dismiss: jump, backdrop, close.

| Element | Copy | Spekit |
|---------|------|--------|
| Sheet | كل الأسئلة | `quiz-jump-sheet` |
| Grid | reuse number statuses; cells `min-h-11` | |

## Sticky action bar

Keep `fixed inset-x-0 bottom-16` (phone) / `md:bottom-0`. Tokens `bg-background/90`, `border-border`.

| Element | Copy | Spekit |
|---------|------|--------|
| Progress | `{answered} من {total}` and/or percent | `quiz-progress` |
| Submit | تسليم الإجابات وإنهاء الاختبار | `quiz-submit-button` |
| Pending | existing online/offline submit labels | same |
| Validation | يرجى الإجابة على جميع الأسئلة قبل تسليم الاختبار. | |

Hidden when submitted, pending-sync, time-locked, or empty.

## Compact prev/next

Optional under the card: السابق / التالي, `min-h-11`, disabled at ends. Not a substitute for the pager.

## Taking layout (must not appear)

- `QuizSidebar` title card, lock line, progress ring, and always-on number grid **above** the question
- Category/tag chips on the answering card
- Duplicate floating timer badge once the header owns `quiz-timer`

## Post-submit (same page)

Submit bar + exit guard off. Pager/sheet still jump. Review blocks (`quiz-results-review`, WhatsApp share) stay. Header back → `/quizzes` without save copy.

## Empty / blocked / offline

Existing empty-quiz card + dashboard link (`quiz-empty-state`). Pending-sync card (`quiz-pending-sync`) and expiry notice stay above the player. Access errors on the page are unchanged.
