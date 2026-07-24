# PERF-TEST-001 — Stress & performance suite

## Prerequisites

1. `.env` with Supabase + `PERF_TEST_SECRET` (any long random string).
2. App running for k6 / Lighthouse: `npm run dev`
3. Optional: [k6](https://k6.io/docs/get-started/installation/) on PATH
4. Optional: Chrome for Lighthouse (`npx lighthouse`)

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run test:stress` | Stress `/api/perf/probe` — native k6 → Docker `grafana/k6` → Node fallback |
| `npm run test:perf` | DB profile + stress + Lighthouse → `scripts/perf-test/out/LATEST.md` |
| `npm run test:perf:db` | Supabase RPC / join timings only |
| `npm run test:perf:lighthouse` | Lighthouse FCP/LCP/INP\|TBT/CLS for `/login` + `/dashboard` |

### VU presets

```bash
# App must be running for stress (npm run dev)
PERF_VUS=50 PERF_DURATION=45s npm run test:stress
PERF_VUS=100 npm run test:stress
PERF_STRESS_ENGINE=node npm run test:stress   # force Node pool
PERF_STRESS_ENGINE=docker npm run test:stress # force Docker k6
PERF_SKIP_K6=1 PERF_SKIP_LIGHTHOUSE=1 npm run test:perf   # DB only
```

> If k6 is not installed, `test:stress` still runs via a Node concurrent fetch pool (same thresholds). Optional: install [k6](https://k6.io/docs/get-started/installation/) or use Docker.
## Probe API

`POST /api/perf/probe` with `Authorization: Bearer $PERF_TEST_SECRET`

- Disabled without secret; blocked in production unless demo bypass is on.
- Scenarios exercise demo-scoped DB paths (MT-002 teacher link, QUIZ-001 exam select).
- `submit-dry` does **not** write `exam_submissions`.

## Output

Markdown tables land in `scripts/perf-test/out/` (gitignored except README).
