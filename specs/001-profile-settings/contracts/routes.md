# Route Contracts: PROFILE-001

## Pages

### `GET /settings`

| Attribute | Value |
|-----------|-------|
| Auth | Required — any role |
| Layout | Mobile-first, `max-w-lg` centered (match student dashboard) |
| Metadata | `title: "الإعدادات \| المؤيد"` |
| Server component | Loads `getSettingsProfile()`, renders role sections |

**Sections (top to bottom)**:
1. Page header — "الإعدادات"
2. Profile card — name (editable), WhatsApp (disabled Input)
3. Role extras — StudentProfileExtras OR TeacherCodeSection
4. ActiveSessionsCard — `data-spekit="profile-session-management"`
5. LogoutConfirmButton — destructive outline, full width on mobile

### `GET /teacher/settings`

| Attribute | Value |
|-----------|-------|
| Auth | Required — `TEACHER` only (middleware) |
| Layout | Teacher layout shell (`src/app/teacher/layout.tsx`) |
| Content | Same shared settings component as `/settings` |

**Equivalence**: Identical DOM for shared sections; teacher nav highlights settings link.

---

## Middleware updates

**Current matcher**: `/dashboard/*`, `/quiz/*`, `/teacher/*`

**Add**:
- `/settings` — require `session.isLoggedIn`; do **not** redirect teachers away
- `/teacher/settings` — already covered by `/teacher/*` (teacher role only)

**Suggested logic**:

```typescript
if (pathname === "/settings" || pathname.startsWith("/settings/")) {
  if (!session.isLoggedIn) redirect("/login?from=/settings");
  return response; // both roles allowed
}
```

---

## Navigation entry points

| Location | Link | Persona |
|----------|------|---------|
| Student dashboard header | `/settings` | STUDENT |
| Teacher layout nav | `/teacher/settings` | TEACHER |

---

## Spekit DOM contracts

| Element | `data-spekit` | When present |
|---------|---------------|--------------|
| Tier badge | `profile-tier-info` | Student only |
| Teacher code block | `profile-teacher-code` | Student (read-only) + Teacher (with copy) |
| Active sessions card | `profile-session-management` | Always |

Use `spekit(SPEKIT.profileTierInfo)` helper from `src/lib/spekit-targets.ts`.

---

## Client component contracts

### ProfileForm
- Controlled input for name; `useTransition` on save
- Submit via `updateProfileName` Server Action

### TeacherCodeSection
- `navigator.clipboard.writeText(code)` with toast fallback
- Code displayed `dir="ltr"` in monospace

### LogoutConfirmButton
- Shadcn AlertDialog — confirm → `<form action={logout}>` submit

### ActiveSessionsCard
- Shows green/active indicator for current device
- Button triggers `logoutOtherDevices()` with loading state
