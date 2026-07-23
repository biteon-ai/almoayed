# Server Action Contracts: GAMIF-001

**Module**: `src/actions/gamification.ts`  
**Auth**: `requireTeacher()` for tier CRUD; `requireStudent()` for student status.  
**Client**: `createAdminClient()` only.

```ts
type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }; // Arabic message for UI
```

---

## Teacher: `getGamificationTiers`

```ts
getGamificationTiers(): Promise<GamificationTier[]>
```

- `requireTeacher()` → `teacher_id = session.profileId`.
- Select ordered by `level_number` ASC.
- Never accept a client-supplied teacher id.

---

## Teacher: `saveGamificationTiers`

```ts
saveGamificationTiers(tiers: Array<{
  id?: string; // existing row; omit for new
  levelName: string;
  minCompletedQuizzes: number;
  minAvgScore: number;
  iconType: GamificationIconType;
}>): Promise<ActionResult>
```

**Behavior**:
1. Scope to `session.profileId`.
2. Reject if `tiers.length > 20`.
3. Validate fields + effort ladder (via `validateGamificationLadder` in lib).
4. Assign `level_number` = index + 1.
5. **Replace semantics**: upsert/replace teacher’s full set — delete rows not in payload ids; insert new; update existing. Prefer transaction or delete-all-then-insert for simplicity if ids are ephemeral (document choice in tasks: **delete all for teacher then insert** is acceptable for ≤20 rows).
6. `revalidatePath("/teacher/settings/gamification")` (and settings parent if linked).

**Errors (Arabic examples)**:
- «الحد الأقصى 20 مستوى»
- «المستويات الأعلى يجب ألا تكون أسهل من المستويات الأدنى»
- «اسم المستوى مطلوب»

---

## Student: `getStudentGamificationStatus`

```ts
getStudentGamificationStatus(): Promise<TeacherGamificationStatus | null>
```

- `requireStudent()`; `teacherId = session.currentTeacherId` (or `getActiveTeacherId()`).
- Verify `student_teachers` link for `(profileId, teacherId)` — prefer `status = 'active'`.
- Load tiers for that teacher; if empty → return `null` (UI hides).
- Load submissions for student on quizzes with `created_by = teacherId`.
- Return computed status from `computeTeacherGamificationStatus(...)`.

**Do not** accept arbitrary `studentId`/`teacherId` from the client for the default dashboard path. Optional overload for tests/admin deferred.

---

## Pure lib (not Server Actions) — `src/lib/teacher-gamification.ts`

| Export | Purpose |
|--------|---------|
| `validateGamificationLadder(tiers)` | Effort + field validation |
| `computeTeacherGamificationStatus({ tiers, submissions })` | Current/next/progress/badges |
| Icon label map | Arabic labels for cup/diamond/star/shield/badge |

Unit-test these without Supabase.

---

## Security checklist

| Rule | Enforcement |
|------|-------------|
| MT-002 | Teacher id from session only |
| Student isolation | Status only for self + active teacher |
| QUIZ-001 | Read scores only; never return correct answers |
| No Pro gate | No tier/subscription check on save |
