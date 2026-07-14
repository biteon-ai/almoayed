# Al-Moayed — Default Implementation Plan Context

Use this as the **project-wide stack reference** when running `/speckit-plan`. Per-feature plans should extend `.specify/templates/plan-template.md`.

## Stack (fixed for this repo)

| Layer | Technology |
|-------|------------|
| **Frontend / SSR** | Next.js 14 App Router (`src/app/`) |
| **API / mutations** | Next.js Server Actions (`src/actions/`) |
| **Database** | Supabase PostgreSQL |
| **Auth / session** | iron-session + Supabase `profiles` |
| **Styling** | Tailwind + Shadcn/Base UI, RTL Arabic |
| **Tests** | Vitest + Playwright |
| **Deploy** | Vercel (typical) or `next start` |

## Data layer rules

1. Schema changes → new SQL file under `supabase/migrations/`.
2. Reads/writes from teacher/student flows → Server Actions with `createAdminClient()`.
3. Never expose service-role Supabase keys to the client bundle.
4. Multi-tenant: filter by `session.profileId` / `currentTeacherId`.

## Where features live

- Registry: `.speckit/spec.yaml`
- Routes: `src/app/teacher/`, `src/app/dashboard/`, `src/app/quiz/[id]/`
- Teacher admin actions: `src/actions/teacher.ts`
- Student quiz actions: `src/actions/quiz.ts`

## Quality gates

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

See `.speckit/constitution.md` for non-negotiable architecture rules.
