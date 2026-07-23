# Quickstart: Super Admin Dashboard (ADMIN-001)

## Prerequisites

- Branch `010-super-admin-dashboard`
- Local `.env` with Supabase + `SESSION_SECRET`
- After migration, bootstrap Super Admin credentials:

```bash
# .env.example additions (planned)
SUPER_ADMIN_EMAIL=admin@almoayed.local
SUPER_ADMIN_PASSWORD=change-me-in-production
```

```bash
npm install
npx supabase db push    # applies 006_super_admin.sql
npm run dev
```

---

## Manual QA path

### 1. Super Admin login

1. Open `/admin/login` (not linked from public `/login`).
2. Sign in with Super Admin email + password.
3. Confirm redirect to `/admin/dashboard`.
4. Confirm `/admin/emergency` still serves AUTH-005 teacher fallback (unchanged behavior, new URL).

### 2. KPI dashboard

1. On `/admin/dashboard`, verify five KPI cards with Arabic labels.
2. Cross-check counts against Supabase (profiles by role, quizzes, exam_submissions).
3. Toggle a teacher inactive (step 4) → refresh dashboard → inactive teacher count increments.

### 3. Create teacher

1. Go to `/admin/teachers` → «إضافة مدرس جديد».
2. Fill name, email, auto-generate password, select 2 subjects, status نشط.
3. Submit → note generated password in success dialog.
4. Sign out admin; open `/teacher/login` → sign in as new teacher → lands on `/teacher/dashboard`.
5. Confirm public `/login` has no teacher registration path.

### 4. Search, filter, toggle

1. As Super Admin, search teacher by email fragment.
2. Filter «معطّل» → empty if none; deactivate one teacher → appears in filter.
3. Attempt login as inactive teacher → Arabic denial.

### 5. Edit teacher

1. Edit teacher: change name, add subject, set max quiz limit to `1`.
2. As that teacher, create one quiz → second create should fail with Arabic limit message.
3. Super Admin raises limit → teacher can create again.

### 6. Impersonation

1. Click «تسجيل الدخول كـ مدرس» on active teacher.
2. Confirm teacher dashboard loads; sticky banner shows teacher name.
3. Navigate teacher routes — banner persists.
4. Click banner exit → returns to `/admin/teachers` as Super Admin.
5. Try impersonate inactive teacher → blocked with Arabic error.

### 7. Delete teacher

1. Create throwaway teacher with one draft quiz.
2. Delete → choose «أرشفة الاختبارات» → confirm.
3. Verify teacher removed; quiz `is_archived = true` in DB.
4. Repeat with «نقل الاختبارات» to another active teacher → `created_by` updated.

---

## Automated tests (planned)

```bash
npm run test -- tests/features/admin-001-super-admin.test.ts
npm run test:e2e -- e2e/admin-001-super-admin.spec.ts
```

Vitest: `requireSuperAdmin`, KPI aggregation, teacher CRUD validation, impersonation session restore, max quiz limit hook.

Playwright: login → create teacher → KPI visible → impersonation banner → exit (use test Super Admin seed).

---

## Build verification

```bash
npm run build
```

Update `.speckit/spec.yaml` with `ADMIN-001` acceptance before merge.
