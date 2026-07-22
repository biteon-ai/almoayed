# UI Component Contracts: TEACH-001 Hub

**Route**: `/teacher/students`  
**Layout**: `dir="rtl"`; Tajawal; touch targets `h-10`–`h-12`.  
**Presentation**: Unified card/row list at all breakpoints (clarification Q5).

---

## Page shell (`page.tsx` + hub)

**Loads (RSC)**: `getTeacherStudents()`, `getTeacherGroups()`.  
**Renders**: Title «إدارة الطلاب», primary CTA «إضافة طالب جديد», hub client component.  
**Spekit**: `SPEKIT.teacherStudentsPage` on root.

---

## Filter & search bar

| Control | Behavior |
|---------|----------|
| Search input | Placeholder `بحث باسم الطالب أو رقم الواتساب...`; filters `fullName` / `whatsappNumber` (substring, trim); resets page → 1 |
| Tier | الكل \| مجاني \| Pro |
| Status | كل الحالات \| نشط \| معلق \| معطل |
| Group | الكل + each `teacher_groups` + treat unassigned as filterable if product needs (optional: «بدون مجموعة» filter — nice-to-have; assign clear is mandatory) |

**Spekit**: `SPEKIT.studentFilters` (preserve); optional `studentSearch`.

---

## Student card / row

**Shows**: Name, WhatsApp, group badge (or empty), tier badge, status badge.  
**Actions**:
- تفعيل / تعطيل (deactivate → AlertDialog first)
- Pro approve / revoke (no confirm; toast)
- Group `Select` including «بدون مجموعة»
- تعديل → `EditStudentDialog`
- حذف / إلغاء الربط → `DeleteStudentConfirmDialog`

**Spekit**: `studentCard`, `studentActivateButton`, `studentDeactivateButton`, `studentManualProUpgrade`, `studentGroupSelect`.

---

## Pagination

- Page size **8**
- Copy: «الصفحة X من Y»
- Buttons: «السابق» / «التالي» (disabled at ends)
- Empty filtered: «لا يوجد طلاب يطابقون خيارات البحث»
- Empty roster (no students at all): distinct Arabic empty + keep Add CTA

**Spekit** (optional): `studentPagination`

---

## `AddStudentDialog`

**Fields**: اسم الطالب, رقم الواتساب  
**Submit**: `createStudentManually` → success toast + close + refresh list  
**Spekit** (optional): `addStudentDialog`

---

## `EditStudentDialog`

**Fields**: اسم (editable), واتساب (read-only), مجموعة (select + بدون مجموعة)  
**Submit**: `updateStudentInfo`

---

## Confirm dialogs (`AlertDialog`)

| Dialog | Title / body intent |
|--------|---------------------|
| Deactivate | Explain temporary exam access lock; confirm → `deactivated` |
| Delete / unlink | «هل أنت أؤكد حذف هذا الطالب من قائمتك؟» → `deleteStudentLink` |

Cancel leaves state unchanged.

---

## Success feedback

Non-blocking Arabic status region after successful create / edit / status / tier / group / unlink.
