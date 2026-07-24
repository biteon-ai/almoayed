#!/usr/bin/env node
/**
 * [PERF-TEST-001] Node fallback stress runner (no k6 binary required).
 * Same probe scenarios + thresholds as tests/stress/k6-critical-paths.js
 */
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  loadEnvFile,
  baseUrl,
  perfSecret,
  writeReport,
  stamp,
  ensureOutDir,
  mdTable,
  REPO_ROOT,
} from "./lib/helpers.mjs";

loadEnvFile();
ensureOutDir();

const BASE = baseUrl();
const SECRET = perfSecret();
const VUS = Number(process.env.PERF_VUS || 20);
const DURATION_RAW = process.env.PERF_DURATION || "30s";

const scenarios = JSON.parse(
  readFileSync(join(REPO_ROOT, "scripts/perf-test/scenarios.json"), "utf8")
);

function parseDurationMs(raw) {
  const m = String(raw).trim().match(/^(\d+(?:\.\d+)?)(ms|s|m)?$/i);
  if (!m) return 30_000;
  const n = Number(m[1]);
  const unit = (m[2] || "s").toLowerCase();
  if (unit === "ms") return n;
  if (unit === "m") return n * 60_000;
  return n * 1000;
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return sorted[idx];
}

async function probe(scenario) {
  const t0 = performance.now();
  let ttfbMs = null;
  try {
    const res = await fetch(`${BASE}/api/perf/probe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SECRET}`,
      },
      body: JSON.stringify({ scenario }),
    });
    ttfbMs = performance.now() - t0;
    const body = await res.json().catch(() => ({}));
    const duration = performance.now() - t0;
    const authFail = body.authFailure === 1 || res.status === 401;
    return {
      scenario,
      status: res.status,
      ok: res.status === 200 && body.ok === true,
      authFail,
      duration,
      ttfb: ttfbMs,
      failed: res.status >= 400 || body.ok === false,
    };
  } catch (error) {
    return {
      scenario,
      status: 0,
      ok: false,
      authFail: false,
      duration: performance.now() - t0,
      ttfb: performance.now() - t0,
      failed: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function vuWorker(stopAt, results) {
  const list = scenarios.scenarios;
  let i = 0;
  while (performance.now() < stopAt) {
    const scenario = list[i % list.length];
    i += 1;
    results.push(await probe(scenario));
    await new Promise((r) => setTimeout(r, 100));
  }
}

export async function runNodeStress() {
  if (!SECRET) {
    throw new Error("PERF_TEST_SECRET is not set");
  }

  const health = await fetch(`${BASE}/api/perf/probe`);
  if (!health.ok) {
    throw new Error(
      `Perf probe not reachable at ${BASE}/api/perf/probe (status ${health.status}). Start the app: npm run dev`
    );
  }
  const info = await health.json();
  if (!info.enabled) {
    throw new Error(
      "Perf probe disabled — set PERF_TEST_SECRET and ensure demo/dev mode."
    );
  }

  const durationMs = parseDurationMs(DURATION_RAW);
  const stopAt = performance.now() + durationMs;
  const results = [];

  console.log(
    `▶ Node stress fallback VUs=${VUS} duration=${DURATION_RAW} base=${BASE}`
  );

  await Promise.all(
    Array.from({ length: VUS }, () => vuWorker(stopAt, results))
  );

  const durations = results.map((r) => r.duration).sort((a, b) => a - b);
  const ttfbs = results.map((r) => r.ttfb).sort((a, b) => a - b);
  const failRate = results.length
    ? results.filter((r) => r.failed).length / results.length
    : 1;
  const authFailRate = results.length
    ? results.filter((r) => r.authFail).length / results.length
    : 0;

  const p95 = percentile(durations, 95);
  const ttfbP95 = percentile(ttfbs, 95);
  const thr = scenarios.thresholds;

  const checks = [
    {
      name: "http_req_duration p95 < 500ms",
      pass: p95 != null && p95 < thr.http_req_duration_p95_ms,
      value: p95 != null ? `${p95.toFixed(1)} ms` : "n/a",
    },
    {
      name: "ttfb p95 < 400ms",
      pass: ttfbP95 != null && ttfbP95 < thr.ttfb_p95_ms,
      value: ttfbP95 != null ? `${ttfbP95.toFixed(1)} ms` : "n/a",
    },
    {
      name: "failed rate < 5%",
      pass: failRate < thr.http_req_failed_rate_max,
      value: `${(failRate * 100).toFixed(2)}%`,
    },
    {
      name: "auth_failure_rate == 0",
      pass: authFailRate <= thr.auth_failure_rate_max,
      value: `${(authFailRate * 100).toFixed(2)}%`,
    },
  ];

  const byScenario = new Map();
  for (const r of results) {
    const cur = byScenario.get(r.scenario) || { n: 0, ok: 0, sum: 0 };
    cur.n += 1;
    cur.ok += r.ok ? 1 : 0;
    cur.sum += r.duration;
    byScenario.set(r.scenario, cur);
  }

  const md = [
    `# PERF-TEST-001 stress run (Node fallback)`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `Engine: **Node fetch pool** (k6 not on PATH; Docker k6 unavailable or skipped).`,
    ``,
    `| Setting | Value |`,
    `| --- | --- |`,
    `| Base URL | ${BASE} |`,
    `| VUs | ${VUS} |`,
    `| Duration | ${DURATION_RAW} |`,
    `| Requests | ${results.length} |`,
    ``,
    mdTable(
      ["Threshold", "Value", "Pass"],
      checks.map((c) => [c.name, c.value, c.pass ? "✅" : "❌"])
    ),
    ``,
    mdTable(
      ["Scenario", "Requests", "OK %", "Avg ms"],
      [...byScenario.entries()].map(([name, s]) => [
        name,
        String(s.n),
        s.n ? `${((s.ok / s.n) * 100).toFixed(1)}%` : "0%",
        s.n ? (s.sum / s.n).toFixed(1) : "n/a",
      ])
    ),
    ``,
  ].join("\n");

  const out = writeReport(`stress-node-${stamp()}.md`, md);
  console.log(md);
  console.log(`Wrote ${out}`);

  const allPass = checks.every((c) => c.pass);
  return { ok: allPass, out, checks, requestCount: results.length };
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  runNodeStress()
    .then((r) => process.exit(r.ok ? 0 : 1))
    .catch((err) => {
      console.error(err.message || err);
      process.exit(1);
    });
}
