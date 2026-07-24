# Al-Moayed (المؤيد) — Project Constitution

**Slogan:** حلّ بإيدك، ما حدا بيفيدك.  
**Product:** Mobile-first, RTL Arabic PWA for Syrian Baccalaureate math (students + teachers)

> Canonical copy: `.speckit/constitution.md` — keep both in sync when amending.

## Non-negotiable principles

1. **RTL-first Arabic UX** — Tajawal font, `dir="rtl"`, `text-start`, touch targets `h-10`–`h-12`.
2. **Multi-tenant isolation** — Every teacher-scoped query MUST filter by active `currentTeacherId` from session. Never leak cross-teacher data.
3. **Gatekeeper quiz security (QUIZ-001)** — `getQuizForStudent` exposes exam fields only. Correct answers and explanations ONLY after valid `exam_submissions` row exists.
4. **Server-side data layer** — No client Supabase reads for privileged data. Use Server Actions + admin client + `requireStudent` / `requireTeacher`.
5. **Passwordless auth** — WhatsApp number identity via iron-session; no email/password flows.
6. **Minimal diffs** — Match existing Shadcn/Base UI patterns; do not over-engineer.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 14** App Router, RSC, Server Actions |
| Language | TypeScript (strict) |
| UI | Tailwind CSS, Shadcn/UI (Base UI), RTL |
| Database | **Supabase** PostgreSQL + RLS |
| Session | iron-session (`profileId`, `role`, `sessionToken`, `currentTeacherId`) |

## Key paths

```
src/actions/auth.ts          AUTH
src/actions/quiz.ts          Student quiz + weak points
src/actions/student.ts       MT-002, TIER-002 student side
src/actions/teacher.ts       TEACH-* teacher admin
src/lib/supabase/admin.ts    Server-side Supabase client
src/middleware.ts            Route protection
supabase/migrations/         Schema source of truth
.speckit/spec.yaml           Feature registry
```

## When changing behavior

- Update `.speckit/spec.yaml` feature status or acceptance criteria.
- If adding UI help surfaces, add `data-spekit` via `src/lib/spekit-targets.ts`.
- Run `npm run lint && npm run typecheck && npm run test` before considering work complete.

**Version**: 1.0.0 | **Ratified**: 2026-07-14 | **Last Amended**: 2026-07-14
