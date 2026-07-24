# Data Model: PERF-001 / PERF-002 / PERF-003

Performance work mostly **indexes and derived aggregates** on existing entities. No new user-facing domain tables.

## Existing entities (touched)

### Student–teacher link (`student_teachers`)

| Field (relevant) | Role in performance |
|------------------|---------------------|
| `student_id` | Student multi-teacher lists |
| `teacher_id` | Teacher roster / dashboard scope (MT-002) |
| `status` | Active vs pending filters |

**New indexes**:
- `(teacher_id, status)`
- `(student_id, status)`

Existing: per-column indexes + UNIQUE `(student_id, teacher_id)`.

---

### Quiz (`quizzes`)

| Field (relevant) | Role in performance |
|------------------|---------------------|
| `created_by` | Teacher ownership scope |
| `is_active` | Student/teacher active lists |
| `is_archived` | Teacher archive views |

**New indexes**:
- `(created_by, is_active)`
- `(created_by, is_archived)` (if EXPLAIN justifies; include in migration when filter is hot)

List/dashboard reads MUST use lean column sets (id, title, flags, timestamps, group refs) — not full `*`.

---

### Quiz attempt (`exam_submissions`)

Product language “quiz attempts” maps to `exam_submissions` in this schema.

| Field (relevant) | Role in performance |
|------------------|---------------------|
| `student_id` | Student progress |
| `quiz_id` | Per-quiz attempt |
| `submitted_at` | Activity timelines |
| `score` | Grade buckets / KPIs |

Existing indexes: `student_id`, `quiz_id`, `submitted_at DESC`, UNIQUE `(student_id, quiz_id)`.

Optional additive: `(quiz_id, submitted_at DESC)` for teacher-popular / recent activity if RPC plans need it.

**Never** expose submission grading detail through caches in a way that bypasses QUIZ-001 for in-progress exams (exam question payloads stay on gatekeeper select lists).

---

## Derived: Teacher dashboard aggregation

Logical result of RPC `get_teacher_dashboard_analytics(p_teacher_id uuid)` (name final in migration):

| Field group | Meaning |
|-------------|---------|
| KPI counts | Students, quizzes, pending links, groups, submissions (teacher-scoped) |
| Grade buckets | Distribution of scores for attempts on this teacher’s quizzes |
| Weekly activity | Attempt counts by week (teacher-scoped) |
| Popular exams | Top quizzes by attempt count for this teacher |

**Validation / security**:
- `p_teacher_id` MUST equal the authenticated teacher’s `session.profileId` (enforced in Server Action before RPC).
- Function is `SECURITY DEFINER` or equivalent only if required for admin-client patterns already used; still filter strictly by `p_teacher_id`.
- Output contains **aggregates and quiz metadata titles/ids only** — no `correct_answer` / explanation fields.

---

## Derived: Request-scoped auth memo

Not a DB entity. Per RSC request:

```text
cache(requireStudent) → one session decrypt + one device-lock check
cache(requireTeacher) → same
```

Cross-request caches (if added later) MUST key:

```text
[resource, profileId, currentTeacherId | teacherProfileId]
```

Invalidation: existing `revalidatePath` on mutations + teacher switch action.

---

## Deferred UI widget

Logical client boundary (not a table):

| Widget | Eager? | Notes |
|--------|--------|-------|
| Teacher Recharts suite | Lazy | `next/dynamic` |
| Student-detail Recharts | Lazy | `next/dynamic` |
| XLSX import helpers | Already lazy | keep `import()` |
| Quiz runner / gatekeeper UI | Eager for quiz routes | do not defer in a way that breaks exam UX |

---

## State transitions

None for user lifecycle. Performance flags are operational (indexes present / RPC deployed / dynamic chunks shipped), tracked in `.speckit/spec.yaml` feature status rather than DB state.
