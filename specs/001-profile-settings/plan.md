# Implementation Plan: User Profile & Settings

**Branch**: `main` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-profile-settings/spec.md`

**Feature ID (registry)**: `PROFILE-001` (supersedes partial `TEACH-008` for settings UI; school/bank fields remain future scope)

## Summary

Add a mobile-first Arabic RTL settings page at `/settings` for all authenticated users, with `/teacher/settings` reusing the same shared component tree. Students see tier badge, active teacher code, and Pro upgrade entry; teachers see copyable teacher code. Core actions: update display name, rotate session token to invalidate other devices (AUTH-003), and logout with confirmation. Register three new Spekit hooks for in-app help.

**Technical approach**: One RSC page shell + client subcomponents for form/copy/confirm dialogs. Server Actions in `src/actions/profile.ts` (or extend `auth.ts` for session actions). Extend middleware matcher for `/settings`. No schema migration — uses existing `profiles` and `student_teachers` tables.

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for Syrian Baccalaureate math

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC, Server Actions, `src/app/` routes |
| **Database** | **Supabase** PostgreSQL — schema in `supabase/migrations/`, RLS enabled |
| **Data access** | Server Actions + `createAdminClient()` — **no** client Supabase for privileged reads |
| **Session / auth** | iron-session (`requireStudent` / `requireTeacher`), WhatsApp login, AUTH-003 device lock |
| **UI** | Tailwind CSS, Shadcn/Base UI, RTL (`dir="rtl"`, `text-start`), touch targets `h-10`–`h-12` |
| **Testing** | Vitest (`tests/features/`), Playwright (`e2e/`) |
| **Target platform** | Mobile-first PWA (Vercel or Node hosting) |
| **Spec registry** | `.speckit/spec.yaml` (feature IDs: AUTH-*, PROFILE-*, etc.) |

**Feature-specific overrides**:

- **Primary Dependencies**: None beyond stack defaults (`lucide-react` icons, existing Shadcn Card/Button/Input/Label/Badge)
- **Storage / tables touched**: `profiles` (`full_name`, `last_session_id`), `student_teachers` (`tier`, `upgrade_requested` read-only for display)
- **Performance Goals**: Standard web — settings page loads profile data in one server round-trip
- **Constraints**: Role-adaptive UI via `session.role`; student teacher code/tier scoped to `session.currentTeacherId`; session rotation must update both DB and iron-session cookie atomically
- **Scale/Scope**: Two routes, ~6–8 new/edited files, 3 Server Actions, 3 Spekit targets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md`

| Gate | Requirement | Status |
|------|-------------|--------|
| MT-002 | Teacher-scoped student data filtered by `currentTeacherId` | PASS — student tier/code reads use active teacher context |
| QUIZ-001 | No answer leakage | N/A — no quiz data on settings page |
| Server layer | Privileged data via Server Actions + admin client | PASS — profile fetch/update in server actions |
| RTL UX | Arabic RTL, Tajawal, touch targets | PASS — follow dashboard/teacher layout patterns |
| Minimal diff | Match existing patterns | PASS — reuse `requestProUpgrade`, `logout`, `getTeacherProfile` patterns |

**Feature compliance**: PASS — no justified exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/001-profile-settings/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 entities
├── quickstart.md        # Manual verification steps
├── contracts/           # Server action + route contracts
│   ├── server-actions.md
│   └── routes.md
└── spec.md
```

### Source Code (planned)

```text
src/
├── app/
│   ├── settings/
│   │   └── page.tsx                    # Shared settings page (require auth via layout or page)
│   └── teacher/
│       └── settings/
│           └── page.tsx                # Re-export or redirect to shared SettingsPage
├── actions/
│   ├── profile.ts                      # updateProfileName, getSettingsProfile, logoutOtherDevices
│   └── auth.ts                         # existing logout() — reuse
├── components/
│   └── settings/
│       ├── SettingsPage.tsx            # Server wrapper / layout
│       ├── ProfileForm.tsx             # Client: name edit + save
│       ├── StudentProfileExtras.tsx    # Tier badge, teacher code, Pro request
│       ├── TeacherCodeSection.tsx      # Client: copy button
│       ├── ActiveSessionsCard.tsx      # Session status + logout others
│       └── LogoutConfirmButton.tsx     # Client: AlertDialog + logout form
├── lib/
│   └── spekit-targets.ts               # + profile-tier-info, profile-teacher-code, profile-session-management
└── middleware.ts                         # Add /settings to protected matcher

tests/
├── features/profile-001-settings.test.ts
e2e/profile-settings.spec.ts
```

**Structure decision**: Single shared settings route at `/settings` with role-conditional sections; `/teacher/settings` renders identical tree (not a redirect) so teacher nav context stays under `/teacher/*`. Alternative redirect rejected — teacher layout nav expects `/teacher/*` paths.

## Phase 0: Research

See [research.md](./research.md). All technical unknowns resolved — no NEEDS CLARIFICATION remaining.

## Phase 1: Design

See [data-model.md](./data-model.md) and [contracts/](./contracts/).

**Key decisions**:
1. `logoutOtherDevices()` rotates `last_session_id` with new token, saves to current iron-session — invalidates stale cookies elsewhere.
2. `updateProfileName()` updates `profiles.full_name` + `session.fullName` in cookie.
3. `/teacher/settings` uses same `SettingsPage` component; middleware allows teachers on both paths.
4. Spekit IDs added to `SPEKIT` constant + `.speckit/spekit-targets.yaml`.

## Phase 2: Implementation Outline (for `/speckit-tasks`)

| Step | Task | Depends on |
|------|------|------------|
| 1 | Add Spekit target IDs + yaml registry | — |
| 2 | `src/actions/profile.ts` — getSettingsProfile, updateProfileName, logoutOtherDevices | — |
| 3 | Settings components (ProfileForm, role extras, sessions, logout confirm) | 2 |
| 4 | `src/app/settings/page.tsx` + `src/app/teacher/settings/page.tsx` | 3 |
| 5 | Middleware: protect `/settings`; allow teachers on `/settings` | 4 |
| 6 | Nav links from dashboard + teacher layout to settings | 4 |
| 7 | Vitest unit tests (name validation, session rotation logic) | 2 |
| 8 | Playwright E2E (student + teacher settings smoke) | 4 |
| 9 | Update `.speckit/spec.yaml` — PROFILE-001 implemented, TEACH-008 notes | 8 |

**Out of scope (v1)**: Teacher `school_name`, `address`, `bank_details` editor (remains TEACH-008 partial for extended profile fields).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [none] | — | — |

## Post-Design Constitution Re-check

All gates still PASS after Phase 1 design. Session rotation reuses AUTH-003 model; no new security surface beyond existing login flow.
