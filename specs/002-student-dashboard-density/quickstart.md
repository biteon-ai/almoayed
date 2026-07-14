# Quickstart: DASH-001 Student Dashboard Mobile Density

Manual verification after implementation.

## Prerequisites

- Dev server: `npm run dev`
- Demo student: WhatsApp `963987654321`
- Mobile viewport: Chrome DevTools → 390×844 (iPhone 12 Pro) or equivalent
- Branch: `002-student-dashboard-density`

## 1. Above-the-fold density (SC-001)

1. Log in as demo student → `/dashboard`.
2. Without scrolling, confirm visible:
   - One-line welcome (no subtitle on mobile)
   - Quick Stats row: Tier, Completed count, Average %
   - Quiz carousel (card or empty state)
   - Tab labels: نتائجي | نقاط الضعف | أساتذتي
3. Resize to desktop (`md`+) → subtitle reappears under welcome.

## 2. Quiz carousel (US2)

1. If multiple quizzes exist, swipe/scroll carousel horizontally.
2. Accessible card shows: title, question count, Start/Continue button.
3. On Free tier with Pro quizzes: locked cards appear inline with upgrade button.
4. Tap Start → navigates to `/quiz/[id]`.
5. After completing a quiz, return to dashboard → card shows "متابعة".

## 3. Tab: نتائجي (US3)

1. Tap **نتائجي** → up to 5 recent scores with quiz titles.
2. Scores match completed submissions for current teacher.
3. Switch teacher (Teachers tab) → scores refresh for new teacher context.

## 4. Tab: نقاط الضعف

1. Tap **نقاط الضعف** → compact category rows (no rings/recommendations).
2. If no data → onboarding empty state.

## 5. Tab: أساتذتي

1. Confirm **no** teacher switcher above page header area.
2. Tap **أساتذتي** → teacher switcher visible.
3. If multiple teachers: switch → page refreshes with new quizzes/stats.

## 6. Stats accuracy

1. Note completed count and average on stats row.
2. Compare to My Scores tab entries — average should equal rounded mean of all completed scores (not just last 5).

## 7. RTL

1. Confirm `dir="rtl"` — carousel scrolls naturally; tab order reads right-to-left.

## 8. Automated tests

```bash
npm run test -- tests/features/dash-001-dashboard-density.test.ts
npm run test:e2e -- e2e/student-dashboard.spec.ts
npm run lint && npm run typecheck
```

## 9. Registry sync

- `.speckit/spec.yaml`: add `DASH-001` with acceptance criteria from spec SC-001–SC-004
