# Contracts: Quiz Attempt Limits UI (QUIZ-005)

## Teacher — create / edit

| Control | Behavior |
|---------|----------|
| «نوع الاختبار» | Radio/segmented: «تدريب / واجب» · «اختبار تقييمي / نصفي» · «تحدي / مسابقة» |
| «عدد المحاولات المسموحة» | Toggle «غير محدود»; when off, number input 1–10 |
| Category change | Updates attempt default per category unless teacher already customized attempts |
| Save | Persists `assessment_category` + `max_attempts` |
| Validation | Arabic errors for out-of-range attempts |

Spekit: `quiz-attempt-settings` on settings card/section.

Suggested layout: adjacent to or below QUIZ-004 timer card on same quiz metadata form.

## Student — quiz catalog (grid + carousel)

| State | Primary CTA | Secondary info |
|-------|---------------|----------------|
| Not started | «ابدأ الاختبار الآن» | — |
| In progress (unsubmitted session) | «متابعة» | — |
| Completed, retakes remain | «إعادة الاختبار» | Best score badge + «محاولة X من Y» or «محاولات غير محدودة» |
| Completed, exhausted | «مراجعة النتيجة» | Score %; no «إعادة الاختبار» label |

Touch: `h-10`–`h-12` buttons; RTL `text-start`.

## Student — `/quiz/[id]` runner

| State | Behavior |
|-------|----------|
| Fresh attempt | Normal runner; optional banner «محاولة N من M» when finite max |
| Review only | Results view from `latestSubmissionId`; banner «انتهت المحاولات المتاحة» |
| Challenge + P2 | `ChallengeLeaderboard` section below title or after submit |

Spekit: `quiz-attempt-badge` on attempt progress chip (optional).

## Challenge leaderboard (P2)

| Element | Behavior |
|---------|----------|
| Container | Visible only when `assessment_category === 'challenge'` |
| Empty | Arabic «لا توجد نتائج بعد» until first submission |
| Row | Rank #, display name, score % |
| Viewer | Highlight own row when submitted; «لم تشارك بعد» when not |
| Refresh | On page load / after submit navigation (no live socket) |

Spekit: `challenge-leaderboard`.
