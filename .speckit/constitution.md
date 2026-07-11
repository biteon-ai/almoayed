# Al-Moayed (المؤيد) — Project Constitution

**Slogan:** حل بيدك ما حدا بفيدك  
**Product:** Mobile-first, RTL Arabic PWA for Syrian Baccalaureate math (students + teachers)

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
| Framework | Next.js 14 App Router, RSC, Server Actions |
| Language | TypeScript (strict) |
| UI | Tailwind CSS, Shadcn/UI (Base UI), RTL |
| Database | Supabase PostgreSQL + RLS |
| Session | iron-session (`profileId`, `role`, `sessionToken`, `currentTeacherId`) |

## Key paths

```
src/actions/auth.ts          AUTH
src/actions/quiz.ts          Student quiz + weak points
src/actions/student.ts       MT-002, TIER-002 student side
src/actions/teacher.ts       TEACH-* teacher admin
src/middleware.ts            Route protection
src/lib/spekit-targets.ts    Spekit DOM hooks (58 targets)
supabase/migrations/         Schema source of truth
```

## When changing behavior

- Update `.speckit/spec.yaml` feature status or acceptance criteria.
- If adding UI help surfaces, add `data-spekit` via `src/lib/spekit-targets.ts`.
- Run `npm run build` before considering work complete.
