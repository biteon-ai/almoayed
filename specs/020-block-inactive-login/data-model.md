# Data Model: Block Inactive Account Login (AUTH-007)

**Date**: 2026-08-02  
**Migration**: None — reuse existing schema

## Entities (existing)

### `profiles`

| Field | Type | Role in AUTH-007 |
|-------|------|------------------|
| `id` | UUID PK | Session subject |
| `role` | `TEACHER` \| `STUDENT` \| `SUPER_ADMIN` | Chooses which inactivity rule |
| `teacher_account_status` | `active` \| `inactive` | Teacher gate (ADMIN-001) |
| `last_session_id` | text \| null | AUTH-003 — **must not change** on refused login |
| `whatsapp_number` | text \| null | Login identity |

No new profile columns for students in v1.

### `student_teachers`

| Field | Type | Role in AUTH-007 |
|-------|------|------------------|
| `student_id` | UUID FK → profiles | Student subject |
| `teacher_id` | UUID FK → profiles | Active teacher candidates |
| `status` | `pending` \| `active` \| `deactivated` | Student gate + re-scope |
| `created_at` | timestamptz | Deterministic “oldest active” pick |

## Derived eligibility (application layer)

```text
TeacherMayLogin(profile) :=
  profile.role = TEACHER
  AND profile.teacher_account_status = 'active'

StudentIsAuth007Blocked(links[]) :=
  count(links where status = active) = 0
  AND count(links where status = deactivated) ≥ 1

StudentMayFullLogin(links[]) :=
  count(links where status = active) ≥ 1

StudentPendingOnly(links[]) :=
  count(active) = 0 AND count(deactivated) = 0
  AND (count(pending) ≥ 1 OR links empty with AUTH-002 pending flow)
```

## State transitions (unchanged writers)

```text
Teacher (admin):
  active ──(admin set inactive)──► inactive
  inactive ──(admin set active)──► active

Student link (teacher hub):
  pending ──(teacher activate)──► active
  active ──(teacher deactivate)──► deactivated
  deactivated ──(teacher activate)──► active
```

AUTH-007 **reads** these states; it does not introduce new transitions.

## Session fields impacted

| Session field | On refused login | On mid-session inactive | On re-scope |
|---------------|------------------|-------------------------|-------------|
| `isLoggedIn` | remains false / not set | redirect (stale until next login) | stays true |
| `sessionToken` / `last_session_id` | **not updated** | unchanged until next successful login | unchanged |
| `currentTeacherId` | N/A | cleared implicitly on next login | set to another active teacher |

## Validation rules

1. Never call `profiles.update({ last_session_id })` if eligibility fails.
2. Super-admin portal login unchanged except when minting a **teacher** session for an inactive teacher profile.
3. Demo identities still subject to the same eligibility rules when demo bypass is enabled.
