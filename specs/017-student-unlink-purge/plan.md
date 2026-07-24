# Implementation Plan: Student Unlink vs Admin Hard Delete

**Branch**: `017-student-unlink-purge` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/017-student-unlink-purge/spec.md` (Clarified 2026-07-24)

**Feature ID (registry)**: `MT-003` (extends `TEACH-001` · `ADMIN-001`)

## Summary

Lock teacher student removal to relationship unlink only (clear Arabic «إزالة من قائمتك» copy + Spekit), and add a Super Admin `/admin/students` directory that lists all student-role profiles (including orphans) with a two-step AlertDialog hard-delete that cascades student-owned rows, refuses non-student roles, and audits the purge.

**Technical approach**: Tighten teacher UI around existing `deleteStudentLink`; add `src/lib/admin/students.ts` + admin students API/pages/table/dialog mirroring teachers ADMIN-001 patterns; Vitest safety contracts; update `.speckit/spec.yaml` + Spekit; `npm run build`.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC, Server Actions, admin API routes |
| **Database** | **Supabase** PostgreSQL — no new migration required (existing CASCADE FKs) |
| **Data access** | Teacher: Server Actions + admin client; Super Admin: `src/lib/admin/*` + `/api/admin/*` |
| **Session / auth** | iron-session — `requireTeacher` / `requireSuperAdmin` |
| **UI** | Tailwind, Shadcn AlertDialog, RTL Tajawal, Spekit |
| **Testing** | Vitest `tests/features/mt-003-*.test.ts` |
| **Target platform** | Mobile-first PWA |
| **Spec registry** | `.speckit/spec.yaml` → MT-003 |

**Feature-specific overrides**:

- **Primary Dependencies**: Existing stack only.
- **Storage / tables touched**: `student_teachers`, `teacher_group_members` (teacher unlink); `profiles` DELETE for student-role only (admin); cascades submissions/answers/links.
- **Performance Goals**: Admin students first page usable with search; default page size 20.
- **Constraints**: MT-001/002 structures; QUIZ-001 unchanged; no teacher `profiles` delete; RTL; double AlertDialog (no type-to-confirm).
- **Scale/Scope**: Teacher copy/Spekit + admin students CRUD-list + hard delete; no soft-delete profiles; no advanced analytics.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped queries | PASS — unlink filters `teacher_id = session.profileId` |
| QUIZ-001 | No answer leakage pre-submit | PASS — exam paths untouched |
| Server layer | Privileged data via server only | PASS — teacher Server Action; admin lib + API with Super Admin |
| RTL UX | Arabic RTL, touch, Spekit | PASS — dialogs/nav/table RTL; `unlink-student-action` |
| Minimal diff | Match existing patterns | PASS — reuse `deleteStudentLink`; mirror admin teachers table/API |
| Passwordless | WhatsApp iron-session | PASS — no auth redesign |

**Feature compliance**: **PASS** — no constitution exceptions.

**Post-design re-check**: **PASS** — teacher path cannot delete profiles; admin purge role-guarded; CASCADE uses existing FKs; double-confirm is UI + `confirm: true` API; orphans included in list filter `role=STUDENT`.

## Project Structure

### Documentation (this feature)

```text
specs/017-student-unlink-purge/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── admin-students.md
│   └── ui-components.md
└── tasks.md                # /speckit-tasks
```

### Source Code (planned touch points)

```text
src/actions/teacher.ts                    # keep deleteStudentLink semantics
src/components/teacher/DeleteStudentConfirmDialog.tsx
src/components/teacher/StudentsTable.tsx
src/components/teacher/StudentManagement.tsx
src/lib/spekit-targets.ts
.speckit/spekit-targets.yaml
.speckit/spec.yaml

src/lib/admin/students.ts                 # NEW listStudents + hardDeleteStudent
src/app/api/admin/students/route.ts       # NEW GET
src/app/api/admin/students/[id]/route.ts # NEW DELETE
src/app/admin/(portal)/students/page.tsx  # NEW
src/app/admin/(portal)/layout.tsx         # nav link
src/components/admin/AdminStudentsTable.tsx          # NEW
src/components/admin/DeleteStudentPurgeDialog.tsx    # NEW two-step

tests/features/mt-003-student-unlink-purge.test.ts
```

**Structure decision**: Prefer admin `lib` + API (like teachers) over a new `actions/admin.ts`. Prefer no migration. Prefer two-step AlertDialog component over typed confirm.

## Complexity Tracking

> No constitution violations.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
