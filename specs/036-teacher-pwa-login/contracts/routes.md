# Contracts: Routes (UI-021 / UI-022)

## `/teacher/login`

| Concern | Contract |
|---------|----------|
| Audience | Signed-out teachers; public (middleware allows) |
| Manifest | Teacher package via segment `layout.tsx` |
| Shell | Sticky compact indigo header + form; version footer |
| Home control | Browser only; hidden in standalone / iOS standalone |
| Install CTAs | Teacher variant present when not installed |
| Signed-in | Server redirect to teacher dashboard (parity with `/login`) |
| Auth | Existing email/password + AUTH-009 recovery modes |

## `/` (marketing)

| Concern | Contract |
|---------|----------|
| Standalone + portal `teacher` | Client replace → `/teacher/login` |
| Standalone + portal missing/`student` | Client replace → `/login` (unchanged default) |
| Browser (not standalone) | No forced login redirect from this guard |

## `/login` (student)

| Concern | Contract |
|---------|----------|
| Unchanged | Student manifest (root), emerald shell, UI-010 / UI-012 / UI-020 behavior |
| Side effect | May set portal hint `student` when shell mounts |

## Related teacher auth routes

| Route | This feature |
|-------|----------------|
| `/teacher/reset` | No requirement to host teacher manifest; may inherit root student manifest |
| `/teacher/magic` | Same — recovery completion pages out of install-package scope |

Optional follow-up (out of scope unless install tests fail): share teacher layout metadata with reset/magic.

## Portal hint

| Event | Effect |
|-------|--------|
| Mount student login shell | `almoayed-pwa-portal = student` |
| Mount teacher login shell | `almoayed-pwa-portal = teacher` |
| Standalone `/` redirect | Reads hint; default student |
