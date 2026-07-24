# Quickstart: MT-003 Student Unlink vs Admin Hard Delete

## Prerequisites

- Branch `017-student-unlink-purge`
- Demo teacher + student accounts; Super Admin credentials

## Teacher unlink QA

1. Login as teacher → `/teacher/students`
2. Confirm control reads «إزالة من قائمتك» and has `data-spekit="unlink-student-action"`
3. Open confirm → cancel → student remains
4. Confirm remove → student leaves list; toast «تمت الإزالة من قائمتك.»
5. Verify (admin or DB): student `profiles` row and prior `exam_submissions` still exist
6. If dual-teacher fixture: Teacher B link intact

## Admin purge QA

1. Login Super Admin → `/admin/students`
2. Find student (including an orphan if available)
3. Start purge → dialog 1 shows link count → cancel → still present
4. Start purge → confirm step 1 → cancel step 2 → still present
5. Confirm both steps → student gone from admin table and all teacher rosters
6. Attempt API delete on a TEACHER id → Arabic error / no delete

## Automated

```bash
npx vitest run tests/features/mt-003-student-unlink-purge.test.ts
npm run build
```

## Registry

- Register `MT-003` in `.speckit/spec.yaml`
- Spekit: `unlink-student-action` (+ admin targets as implemented)
