# Research: Student Dashboard Mobile Density (DASH-001)

**Date**: 2026-07-14  
**Status**: Complete — all Technical Context items resolved

## 1. Dashboard data fetching strategy

**Decision**: Single Server Action `getStudentDashboardData()` returning `{ stats, recentScores, quizzes, weakPoints, teachers }` (or stats+scores+quizzes bundled; weak points/teachers may stay parallel in page if simpler).

**Rationale**: Current dashboard runs 3 parallel calls; new stats/scores need submission joins. Bundling reduces latency and guarantees consistent teacher scope in one query context.

**Alternatives considered**:
- Separate `getDashboardStats()` + `getRecentScores()` — rejected (extra round-trips on mobile).
- Client-side aggregation — rejected (constitution: server-side privileged reads).

## 2. Overall average score calculation

**Decision**: `Math.round(mean(exam_submissions.score))` for submissions where `student_id = profileId` AND quiz `created_by = currentTeacherId`.

**Rationale**: Clarification session 2026-07-14 — matches Quick Stats “Overall Average Score” paired with completed count.

**Alternatives considered**:
- Category mastery average (QUIZ-002) — rejected (clarified against).
- Best-score-only average — rejected.

## 3. Quiz carousel item fields

**Decision**: Extend quiz list items with:
- `questionCount: number` — count from `questions` table (same pattern as teacher quiz list).
- `hasSubmission: boolean` — exists row in `exam_submissions` for student+quiz.
- Button label: `hasSubmission ? "متابعة" : "ابدأ"` (Continue links to `/quiz/[id]` which shows results if submitted).

**Rationale**: Spec FR-003 requires question count and Start/Continue. App allows one submission per quiz; “Continue” means re-enter completed quiz/results view.

**Alternatives considered**:
- Separate in-progress draft table — rejected (no draft model in schema).

## 4. Pro-locked quizzes in carousel

**Decision**: Single carousel mixing accessible and locked items. Locked cards use dimmed border/background, `Lock` icon, compact upgrade button calling `requestProUpgrade()`.

**Rationale**: Clarification — inline locked cards preserve upgrade funnel without vertical `ProUpgradeCard` stack.

**Alternatives considered**:
- Second carousel row — rejected (clarified).
- Hide locked quizzes — rejected.

## 5. Shadcn Tabs implementation

**Decision**: Add `src/components/ui/tabs.tsx` using `@base-ui/react/tabs` with same `cn()` + CVA styling as existing primitives (`button.tsx`, `card.tsx`).

**Rationale**: No tabs component exists in repo; spec requires Shadcn Tabs. Base UI is already the project's headless layer.

**Alternatives considered**:
- Radix `@radix-ui/react-tabs` — rejected (project standardized on Base UI).
- Custom div toggle — rejected (accessibility + keyboard nav).

## 6. Weak Points tab content

**Decision**: New `WeakPointsTab` — vertical compact rows: category tag, `{success_percentage}%`, Badge weak (&lt;50) / strong (≥80) / neutral. Reuse `WEAK_THRESHOLD` / `STRONG_THRESHOLD` from `WeakPointsCard`. Empty state mirrors onboarding copy (shortened).

**Rationale**: Clarification — no rings grid or recommendation blocks in tab.

**Alternatives considered**:
- Reuse full `WeakPointsCard` — rejected (vertical bloat).
- Rings only — rejected.

## 7. Teacher switcher placement

**Decision**: Remove top-of-page `TeacherSwitcher`; render only inside Teachers tab (`أساتذتي`). Page refresh after switch unchanged.

**Rationale**: FR-007 + density goal; avoids duplicate controls.

## 8. Mobile welcome block

**Decision**: `<h1 className="text-lg ... md:text-xl">` one line on mobile; subtitle `<p>` hidden with `hidden md:block`.

**Rationale**: Clarification — one-line greeting on mobile; desktop keeps full welcome.

## 9. Horizontal carousel CSS

**Decision**: Container classes: `flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none`; cards: `snap-start shrink-0 w-[72vw] max-w-[280px]`.

**Rationale**: Spec cites Tailwind utilities; fixed card width enables predictable above-the-fold layout on 390px viewport.

**RTL note**: Native horizontal scroll in RTL follows browser direction; use `scroll-snap-align: start` with logical `start` — no `flex-row-reverse` needed when `dir="rtl"` is set on ancestor.

## 10. My Scores tab data

**Decision**: Last 5 submissions for current teacher, `ORDER BY submitted_at DESC`, display quiz title + score + optional relative date.

**Rationale**: Clarification session — 5 rows, current teacher, newest first.

## 11. Feature registry ID

**Decision**: Register as `DASH-001` in `.speckit/spec.yaml` during implementation; note dependency on QUIZ-002, MT-001, TIER-001.

**Rationale**: Consistent with AUTH-*, QUIZ-*, PROFILE-* naming.

## 12. Spekit hooks

**Decision**: Reuse existing `studentDashboard`, `studentQuizList`, `weakPointsCard`, `teacherSwitcher`, `proUpgradeCard` targets where elements map; add optional `dashboard-tabs` if tab strip needs help anchor.

**Rationale**: Minimal diff — relocate elements, don't rename unless UX moves require new IDs.
