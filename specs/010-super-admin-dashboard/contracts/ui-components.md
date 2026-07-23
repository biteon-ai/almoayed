# UI Component Contracts: ADMIN-001

**Theme**: Al-Moayed emerald/teal, RTL (`dir="rtl"`), dark mode, rounded geometry, touch targets `h-10`–`h-12`.  
**Spekit**: Add hooks to `src/lib/spekit-targets.ts` + `.speckit/spekit-targets.yaml`.

---

## Layout shell

### `AdminLayout` — `src/app/admin/layout.tsx`

| Responsibility | Details |
|----------------|---------|
| RTL shell | Wrap children in `MobileShell` or admin-specific shell matching teacher dashboard density |
| Nav | Links: «لوحة التحكم» (`/admin/dashboard`), «إدارة المدرسين» (`/admin/teachers`) |
| Auth gate | RSC: redirect to `/admin/login` if not `SUPER_ADMIN` |
| Dark mode | Inherit existing theme provider |

**Spekit**: `admin-layout`, `admin-nav-dashboard`, `admin-nav-teachers`

---

## Dashboard page

### `AdminDashboardPage` — `src/app/admin/dashboard/page.tsx`

| Element | Contract |
|---------|----------|
| KPI grid | 5 cards: إجمالي المستخدمين، إجمالي المدرسين (نشط/معطّل)، إجمالي الطلاب، إجمالي الاختبارات، إجمالي المحاولات المكتملة |
| Data load | RSC fetch via shared `getAdminKpis()` lib (used by route + page) |
| Loading | Skeleton cards Arabic RTL |
| Error | Inline Arabic retry |

**Spekit**: `admin-kpi-total-users`, `admin-kpi-teachers`, `admin-kpi-students`, `admin-kpi-exams`, `admin-kpi-attempts`

---

## Teachers page

### `AdminTeachersPage` — `src/app/admin/teachers/page.tsx`

| Element | Contract |
|---------|----------|
| Header | Title «إدارة المدرسين» + primary «إضافة مدرس جديد» |
| Toolbar | Search input (name/email), status filter (الكل / نشط / معطّل) |
| Table | Responsive card/table hybrid; columns: الاسم، البريد، الحالة، المواد، عدد الاختبارات، إجراءات |
| Empty state | «لا يوجد مدرسون يطابقون البحث» |
| Row actions | Edit, toggle status, impersonate, delete |

Client island: `AdminTeachersTable.tsx` with SWR or fetch to `GET /api/admin/teachers`.

**Spekit**: `admin-teachers-table`, `admin-add-teacher-btn`, `admin-teacher-search`, `admin-teacher-status-filter`

---

## Modals

### `CreateTeacherModal.tsx`

| Field | UI control |
|-------|------------|
| الاسم الكامل | `Input` required |
| البريد الإلكتروني | `Input type=email` required |
| كلمة المرور الأولية | `Input` + «توليد تلقائي» toggle |
| رقم الهاتف | `Input` optional |
| المواد والفرع | Multi-select (Shadcn-style; no native `<select>`) |
| حالة الحساب | Switch or segmented: نشط / معطّل |
| حد الاختبارات | `Input type=number` optional |

Submit → `POST /api/admin/teachers`. Show generated password in success dialog (copy button).

**Spekit**: `admin-create-teacher-modal`, `admin-create-teacher-submit`

### `EditTeacherModal.tsx`

Same fields as create except password section is «إعادة تعيين كلمة المرور» (optional). Submit → `PUT /api/admin/teachers/[id]`.

**Spekit**: `admin-edit-teacher-modal`

### `DeleteTeacherDialog.tsx`

| Element | Contract |
|---------|----------|
| Warning | Arabic copy on irreversible delete |
| Quiz disposition | Radio: «نقل الاختبارات إلى مدرس آخر» (teacher picker) / «أرشفة الاختبارات» |
| Confirm | Destructive button «حذف حساب المدرس» |

**Spekit**: `admin-delete-teacher-dialog`

---

## Impersonation

### `ImpersonationBanner.tsx` — `src/components/admin/ImpersonationBanner.tsx`

| Property | Value |
|----------|-------|
| Visibility | When `session.impersonation` present (teacher layouts + shared root) |
| Position | Sticky top, high z-index, emerald/teal warning tint |
| Copy | «تسجيل الدخول بصفتك المدرس: [اسم المدرس] - انقر هنا للعودة للوحة الأدmin» |
| Action | Click → `POST /api/admin/impersonate/exit` → redirect admin |

Mount in `src/app/teacher/layout.tsx` (and optionally student layout guard — should not appear for students).

**Spekit**: `admin-impersonation-banner`, `admin-impersonation-exit`

---

## Login

### `SuperAdminLoginForm` — `src/app/admin/login/page.tsx` (replace/emerge from emergency form)

| Field | Label |
|-------|-------|
| Email | البريد الإلكتروني |
| Password | كلمة المرور |

Submit → login API/Action; redirect `/admin/dashboard`.

Move AUTH-005 emergency form to `/admin/emergency/page.tsx` (preserve behavior).

**Spekit**: `admin-login-form` (update target description)

---

## Teacher email login (supporting)

### `TeacherEmailLoginPage` — `src/app/teacher/login/page.tsx`

Email + password for admin-provisioned teachers. Not linked from public `/login`.

**Spekit**: `teacher-email-login-form`

---

## Shared UI primitives

Reuse existing: `Button`, `Input`, `Label`, `Dialog`, `AlertDialog`, `Badge`, `StatusBadge`, `MobileShell`.

New if missing: multi-select combobox pattern (match `StudentGroupSelect` style).

---

## Accessibility & RTL

- All labels in Arabic; `text-start` alignment
- Focus trap in modals
- Status badges: نشط (success), معطّل (muted/destructive)
- Table horizontal scroll on narrow viewports
