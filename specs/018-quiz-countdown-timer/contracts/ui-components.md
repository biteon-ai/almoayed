# Contracts: Quiz Timer UI (QUIZ-004)

## Teacher — create / edit

| Control | Behavior |
|---------|----------|
| «تفعيل التوقيت» | Toggle; off by default on create |
| «مدة الاختبار بالدقائق» | Visible only when toggle on; integer 1–180; Arabic validation on save |
| Save | Persists `is_timed` + `duration_minutes` (or clears duration when off) |

Suggested Spekit (optional teacher): `quiz-timer-settings` on the toggle group — primary required hook remains student `quiz-timer`.

## Student — `/quiz/[id]` runner

| Control | Behavior |
|---------|----------|
| Timer badge | Sticky floating at top; `data-spekit="quiz-timer"`; `dir` inherits RTL shell |
| Format | `MM:SS` (minutes may be ≥ 60) |
| Warning | When remaining ≤ 2:00 and > 0: urgent color + slight pulse |
| Expiry | At 0: disable answer inputs; show «انتهى الوقت المحدد للاختبار! جاري تسليم إجاباتك تلقائياً...»; call `submitQuiz`; redirect/navigate to results for submission id |
| Late reopen | If `remainingSeconds === 0` on load with no results → same expiry path immediately |
| Untimed | No badge |

Touch: badge must not block primary question controls (SC-006); prefer top sticky bar with safe padding on question list.
