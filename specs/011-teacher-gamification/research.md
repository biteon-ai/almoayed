# Research: Teacher-Driven Gamification (GAMIF-001)

**Date**: 2026-07-23  
**Branch**: `011-teacher-gamification`

## R1 — Source of completed quizzes & scores

**Decision**: Use existing `exam_submissions` joined to `quizzes` where `quizzes.created_by = teacherId`. A row means completed. Score is `exam_submissions.score` (0–100 integer).

**Rationale**: Schema already enforces `UNIQUE (student_id, quiz_id)` and insert-on-submit; product treats a submission row as a finished attempt (QUIZ-001 gatekeeper). No separate `quiz_submissions` table exists.

**Alternatives considered**:
- New analytics/cache table — rejected for v1 (stale unlocks vs live rules; extra write path).
- Count `student_answers` — rejected (not quiz-level aggregate; heavier).

**Note**: Current submit path inserts once; retakes fail on unique constraint. Spec’s “best score per quiz” remains the correct aggregate rule; with one row it equals that score. If retakes later upsert, use `GREATEST` / max score per quiz.

---

## R2 — Distinct quiz counting & average

**Decision**:
- `total_quizzes_completed` = count of distinct `quiz_id` in submissions for quizzes owned by the teacher.
- `average_score_percentage` = mean of those rows’ scores (best score per quiz if multiple ever exist).

**Rationale**: Matches clarification session (unique quizzes + best score). Aligns with unique constraint today.

**Alternatives considered**:
- Count every historical submission including retakes — rejected (clarification A).
- Average all attempts while counting unique quizzes — rejected (clarification C).

---

## R3 — Progress bar (bottleneck)

**Decision**: Toward next unmet tier:

```text
quizProgress = clamp(completed / next.min_completed_quizzes, 0..1)  // if min==0 → 1 for quiz dim
scoreProgress = clamp(avg / next.min_avg_score, 0..1)               // if min==0 → 1 for score dim
barFill = min(quizProgress, scoreProgress)
```

Copy lists remaining quizzes (`max(0, min_quizzes - completed)`) and/or score gap (`max(0, min_avg - avg)`).

**Rationale**: Clarification B; single honest bar when one dimension blocks.

**Alternatives considered**: Average of dimensions; dual bars; quiz-only bar — rejected per clarify.

---

## R4 — Persist unlocks vs derive live

**Decision**: No student unlock / cache table. Derive current tier, unlock flags, and progress on each read from tiers + submissions.

**Rationale**: Spec: live rules; tightening tiers can re-lock. Simpler migration and no invalidation bugs.

**Alternatives considered**: Materialized `student_gamification_cache` — deferred unless perf requires it later.

---

## R5 — Table & column naming

**Decision**: Table `gamification_tiers` with columns aligned to original request + `level_number` as ordered position (renormalized 1..n on save). `icon_type` text with CHECK in (`cup`,`diamond`,`star`,`shield`,`badge`).

**Rationale**: Matches deliverable naming; indexed `teacher_id`.

**Alternatives considered**: `teacher_gamification_tiers` — clearer but longer; stick to requested name.

---

## R6 — Teacher route placement

**Decision**: `/teacher/settings/gamification` under `(portal)/settings/`, linked from the existing settings page (and/or in-page section nav). Keep main teacher bottom/header nav on «الإعدادات».

**Rationale**: Settings already exists; avoids nav clutter; matches request “settings/gamification or /teacher/gamification”.

**Alternatives considered**: Top-level `/teacher/gamification` nav item — unnecessary for config frequency.

---

## R7 — Naming vs existing streak helper

**Decision**: Keep `src/lib/student-gamification.ts` (streaks/daily goal/achievements). Add `src/lib/teacher-gamification.ts` + types like `TeacherGamificationStatus` for GAMIF-001. Student UI labels use «المستوى» / reward icons, not streak copy.

**Rationale**: Avoid conflating product features; both can appear on dashboard without shared types.

---

## R8 — Action module layout

**Decision**: New `src/actions/gamification.ts` with `getGamificationTiers`, `saveGamificationTiers`, `getStudentGamificationStatus`. Validate `student_teachers` link + `currentTeacherId` for student reads.

**Rationale**: teacher.ts is large; feature boundary is clear for tests and Spekit mapping.

**Alternatives considered**: Fold into teacher.ts / quiz.ts — rejected for file size and clarity.

---

## R9 — Empty / Pro / max

**Decision** (from clarify): Hide student UI when zero tiers; no Pro gate; max 20 tiers enforced in action + UI.

**Rationale**: Spec clarifications session 2026-07-23.

---

## R10 — Effort ladder validation

**Decision**: After sorting by `level_number`, for each consecutive pair require `min_completed_quizzes[i] >= min_completed_quizzes[i-1]` AND `min_avg_score[i] >= min_avg_score[i-1]`. Reject otherwise with Arabic error.

**Rationale**: Spec assumption on “greater or equal effort”.

---

## Unresolved → none

All Technical Context unknowns resolved; ready for data-model and contracts.
