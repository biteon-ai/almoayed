# Data Model: PERF-004 / PERF-005 / PERF-006

Scale hardening is primarily **indexes, RLS policies, SQL functions, and read contracts** on existing entities. No new user-facing domain tables.

## Existing entities (touched)

### Student–teacher link (`student_teachers`)

| Field | Role |
|-------|------|
| `teacher_id`, `status` | Roster paging + KPI active set (MT-002) |
| `upgrade_requested` | Pending upgrades KPI + partial index |

**New**: partial index `(teacher_id) WHERE upgrade_requested = true`  
**RLS**: deny-all for non–service-role callers

---

### Teacher groups / members (`teacher_groups`, `teacher_group_members`)

Used by fallback paths and student access rules. **RLS**: deny-all. No new columns.

---

### Categories / topics

Server-managed catalogs. **RLS**: deny-all. No new columns.

---

### Auth OTP states (`auth_otp_states`)

Server-only OTP replay protection. **RLS**: deny-all.

---

### Quiz (`quizzes`)

| Field | Role |
|-------|------|
| `created_by` | Teacher scope + admin quiz counts |
| `updated_at` / `created_at` | Teacher quiz list order |
| `is_active` / `is_archived` | Filters |

**New index**: `(created_by, updated_at DESC, created_at DESC)`  
List reads: `QUIZ_LIST_SELECT` + `questions(count)` — never `*` on hubs.

---

### Questions (`questions`)

| Field | Role |
|-------|------|
| `quiz_id`, `sort_order` | Exam order + count embeds |

**New index**: `(quiz_id, sort_order)`  
Counts via embed/aggregation only on hubs; full rows on question editors only.

---

### Exam submissions (`exam_submissions`)

| Field | Role |
|-------|------|
| `student_id`, `quiz_id`, `score`, `submitted_at` | KPI aggregates, results paging |

**New index**: `(student_id, submitted_at DESC)`  
KPI RPC aggregates only — no answer columns (answers live on `student_answers` / questions).

---

### Profiles (`profiles`)

Admin directory / auth: explicit columns. **Never** select `password_hash` on list/directory paths.

---

## Derived: Dashboard KPI summary (RPC)

Logical result of `get_teacher_dashboard_kpis(p_teacher_id uuid)` (name may replace/alias prior analytics function — see contracts):

| Group | Contents |
|-------|----------|
| Counts | `studentCount`, `quizCount`, `pendingUpgrades`, `submissionCount` |
| Scalars | `averageScore`, `passRate`, completion-style rates (document approximation if any) |
| `gradeDistribution` | Buckets matching existing UI labels/ranges |
| `weeklyActivity` | Per weekday passed/failed counts (teacher-scoped) |
| `popularExams` | **Max 10** — rank, title, attempts, completion/avg fields needed by UI |
| Optional first-paint extras | hardest/easiest exam aggregates, top performer (single row) if cheap in SQL |

**Validation / security**:
- Server Action sets `p_teacher_id` from session only.
- `REVOKE` from `PUBLIC`/`anon`/`authenticated`; `GRANT` to `service_role`.
- No `correct_answer` / explanation fields.

---

## Derived: Paged list result

Not a DB table. Application contract:

| Field | Meaning |
|-------|---------|
| `items` | Current page rows (lean) |
| `total` | Filtered total count |
| `page` | Clamped page number (≥1) |
| `pageSize` | Page size used |

**Page sizes (defaults)**:

| Hub | pageSize |
|-----|----------|
| Teacher students | 8 |
| Teacher quizzes | 6 |
| Student exams list | 4 |
| Student results list | 4 |
| Admin teachers | 20 |
| Student home window (not paged) | **12** max |

**Clamp rule**: If `page > lastPage`, return `lastPage`’s items + `total` (empty catalog → `page=1`, `items=[]`, `total=0`).

---

## Derived: Admin quiz counts

`admin_quiz_counts_by_teacher()` → rows `(teacher_id, quiz_count)` for non-archived quizzes, or equivalent scoped aggregate for the current teacher id page.

---

## Unchanged / out of model scope

- iron-session fields  
- QUIZ-001 exam question select lists  
- Realtime / Storage / JSONB GIN  
- Dropping old boolean indexes (optional later, documented only)
