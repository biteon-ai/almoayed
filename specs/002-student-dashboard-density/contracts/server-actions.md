# Server Action Contracts: DASH-001

**Module**: `src/actions/quiz.ts` (extend)  
**Auth**: `requireStudent()` + `getStudentContext()` for teacher scope

---

## `getStudentDashboardData()`

**Type**: Query (no mutation)  
**Auth**: Student with active subscription (`is_subscribed` gate remains on page)

**Returns**: `StudentDashboardData` (see data-model.md)

**Behavior**:
1. Resolve `teacherId`, `tier`, `groupIds` via `getStudentContext()`.
2. If no `teacherId`, return zeroed stats, empty arrays.
3. Fetch quizzes (active, with questions), question counts, submission flags.
4. Fetch submissions for stats + recent 5 scores (teacher-scoped join).
5. Call `getWeakPoints()` and `getStudentTeachers()` (or inline equivalent).

**Errors**:
- Unauthenticated → redirect `/login` (via `requireStudent`)

**Side effects**: None

---

## Extended quiz list fields

**Function**: `getAvailableQuizzes()` **or** internal helper used by bundle

**Additional fields per item**:

| Field | Type | Source |
|-------|------|--------|
| `questionCount` | number | `COUNT(questions)` per quiz |
| `hasSubmission` | boolean | `EXISTS exam_submissions` for student+quiz |

**Existing fields unchanged**: `isAccessible`, `isLocked`, quiz metadata from `computeQuizListItem`.

---

## Unchanged actions (reused)

| Action | Module | Usage |
|--------|--------|-------|
| `getWeakPoints()` | `quiz.ts` | Weak Points tab data |
| `getStudentTeachers()` | `student.ts` | Teachers tab |
| `switchTeacher(id)` | `student.ts` | Teachers tab select |
| `requestProUpgrade()` | `student.ts` | Locked carousel card CTA |
| `logout()` | `auth.ts` | Header (unchanged) |

---

## Page loader contract (`src/app/dashboard/page.tsx`)

**RSC responsibilities**:
1. `requireStudent()` + subscription check
2. Single `getStudentDashboardData()` call (preferred) or `Promise.all` with bundle + weak points + teachers
3. Pass props to presentational components
4. Preserve `data-spekit={SPEKIT.studentDashboard}` on root

**Must NOT**:
- Fetch Supabase from client components
- Render top-level `TeacherSwitcher` (FR-007)
- Mount full `WeakPointsCard` on page root (FR-006)
