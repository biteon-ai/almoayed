# Quickstart: Database Scale Hardening (PERF-004 / 005 / 006)

## Prerequisites

- Branch `015-db-scale-hardening`
- Local `.env` (Supabase + `SESSION_SECRET`)
- Demo teacher `963912345678` / student `963987654321`
- Prefer `014` migrations already applied (`010_*`)

```bash
npm install
npx supabase db push    # applies 011_db_scale_hardening.sql
npm run dev
```

---

## Manual QA path

### 1. Teacher dashboard KPIs (PERF-004 / SC-001)

1. Open `/teacher` dashboard as demo teacher.
2. Confirm KPI cards, grade distribution, weekly activity, and ≤10 popular exams populate.
3. In Network/server logs, confirm payload is compact (no huge student/submission arrays).
4. Optional: break RPC locally → lean fallback still shows KPIs; break both → Arabic section error, shell remains.

### 2. Server pagination (PERF-005 / SC-002)

1. Teacher **Students** — change pages; each request returns one page (8) + total.
2. Teacher **Quizzes** — pages of 6; question counts visible without loading question bodies.
3. Student `/quizzes` and `/results` — pages of 4; scoped to active teacher.
4. Request an absurd page (e.g. page 999) — UI lands on last valid page, not an empty dead state.
5. Spekit pagination hooks still present; RTL controls work.

### 3. Student home window (FR-005a)

1. With many active quizzes, open student `/dashboard`.
2. Confirm home does not pull the entire quiz catalog (cap 12).

### 4. Admin teachers (SC-003)

1. Open admin teachers directory; page through results.
2. Quiz counts appear without a platform-wide “load every quiz” step.

### 5. Gatekeeper + tenant (SC-007 / SC-008)

1. Unsubmitted quiz → no answers/explanations.
2. Switch active teacher → lists/KPIs match new teacher only.

### 6. Build + registry

```bash
npx vitest run tests/features/perf-004-*.test.ts tests/features/perf-005-*.test.ts tests/features/perf-006-*.test.ts tests/features/quiz-001-gatekeeper.test.ts
npm run build
```

Ensure `.speckit/spec.yaml` lists `PERF-004`, `PERF-005`, `PERF-006`.

Optional: `npm run test:perf` / probe after implement if harness covers new RPC name.
