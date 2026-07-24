# Quickstart: App Performance (PERF-001 / 002 / 003)

## Prerequisites

- Branch `014-app-performance`
- Local `.env` (Supabase + `SESSION_SECRET`)
- Demo teacher `963912345678` / student `963987654321`

```bash
npm install
npx supabase db push    # applies 010_perf_indexes_and_teacher_dashboard_rpc.sql
npm run dev
```

---

## Baseline (capture before / after)

Use Chrome DevTools mobile throttling (4G) or Lighthouse mobile.

| Metric | Student `/dashboard` | Teacher `/teacher` dashboard |
|--------|----------------------|------------------------------|
| TTI / LCP (note tool) | _manual — capture in PR_ → expected ≥30% faster after PERF-001/002 | _manual — capture in PR_ → KPI shell &lt;3s target |
| JS transfer (exclude chart chunk after) | Recharts deferred (PERF-003) — main hub excludes chart chunk | Same — `TeacherDashboardCharts` / score chart dynamic |
| Time until KPI cards readable | — | RPC single round-trip (PERF-002) vs prior multi-query |
| Font weights | Tajawal 400/700/800 + `display:swap` | Same |
| PWA icons | `icon-512` ~107KB (was ~276KB); `icon-192` / apple-touch re-optimized | — |

Directionally: SC-001/002/008 improvements come from auth `cache()`, lean selects, dashboard RPC, deferred Recharts, trimmed font weights, and compressed icons. Record exact Lighthouse numbers in the PR when validating on demo accounts.

---

## Manual QA path

### 1. Auth still works (no session regression)

1. Login as student → dashboard loads.
2. Login as teacher → dashboard loads.
3. Logout / expired session → protected routes redirect to login.

### 2. Multi-tenant isolation (SC-005)

1. Student with two teachers: switch active teacher.
2. Confirm quiz lists / progress / gamification match the **new** teacher only (no flash of previous teacher’s data).

### 3. Teacher dashboard RPC (PERF-002)

1. Open `/teacher` dashboard — KPI cards, grade distribution, weekly activity, popular exams populate.
2. Compare counts to a known seed (demo) for sanity.
3. Force RPC error (optional local break) → analytics falls back to lean multi-query; shell remains.

### 4. Quiz gatekeeper (SC-006)

1. Open an unsubmitted quiz as student → no answers/explanations.
2. Submit → results show grading fields as today.

### 5. Charts deferred (PERF-003)

1. Hard-reload teacher dashboard with Network panel.
2. Confirm Recharts chunk loads separately (not in main hub bundle).
3. Charts appear after placeholder; Spekit hooks on chrome still present immediately.

### 6. Fonts

1. Throttle network; reload any authenticated page.
2. Arabic text visible quickly (swap); settles on Tajawal; RTL intact.

---

## Automated checks

```bash
npx vitest run tests/features/perf-002-dashboard-rpc.test.ts tests/features/quiz-001-gatekeeper.test.ts tests/features/mt-002-tenant.test.ts
npm run build
```

Cover: RPC JSON → UI mapper / lean-select invariants; gatekeeper + tenant regression suites.

---

## Registry exit

After implementation, ensure `.speckit/spec.yaml` lists `PERF-001`, `PERF-002`, `PERF-003` with acceptance notes and `npm run build` succeeds.
