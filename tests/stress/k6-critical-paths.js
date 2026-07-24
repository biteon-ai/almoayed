/**
 * [PERF-TEST-001] k6 stress script — critical probe paths.
 *
 * Requires:
 *   - App running (npm run dev / start)
 *   - PERF_TEST_SECRET set (same as server)
 *   - k6 installed: https://k6.io/docs/get-started/installation/
 *
 * Env (k6 -e):
 *   BASE_URL=http://localhost:3000
 *   PERF_TEST_SECRET=...
 *   VUS=20|50|100
 *   DURATION=30s
 */
import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const SECRET = __ENV.PERF_TEST_SECRET || "";
const VUS = Number(__ENV.VUS || 20);
const DURATION = __ENV.DURATION || "30s";

const authFailRate = new Rate("auth_failure_rate");
const probeDuration = new Trend("probe_duration_ms", true);
const ttfb = new Trend("ttfb_ms", true);

export const options = {
  scenarios: {
    stress: {
      executor: "constant-vus",
      vus: VUS,
      duration: DURATION,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<500"],
    auth_failure_rate: ["rate==0"],
    ttfb_ms: ["p(95)<400"],
  },
};

const SCENARIOS = [
  "health",
  "login-demo",
  "dashboard",
  "quiz-fetch",
  "teacher-rpc",
  "submit-dry",
];

function probe(scenario) {
  const res = http.post(
    `${BASE_URL}/api/perf/probe`,
    JSON.stringify({ scenario }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SECRET}`,
      },
      tags: { scenario },
    }
  );

  const waiting = res.timings.waiting;
  ttfb.add(waiting);
  probeDuration.add(res.timings.duration);

  let body = {};
  try {
    body = res.json();
  } catch (_) {
    body = {};
  }

  const authFail = body.authFailure === 1 || res.status === 401;
  authFailRate.add(authFail);

  check(res, {
    [`${scenario} status 200`]: (r) => r.status === 200,
    [`${scenario} ok true`]: () => body.ok === true,
    [`${scenario} no auth failure`]: () => !authFail,
  });

  return res;
}

export function setup() {
  if (!SECRET) {
    throw new Error("PERF_TEST_SECRET is required for k6 stress run");
  }
  const health = http.get(`${BASE_URL}/api/perf/probe`);
  if (health.status !== 200) {
    throw new Error(
      `Perf probe not reachable at ${BASE_URL}/api/perf/probe (status ${health.status}). Start the app first.`
    );
  }
  const info = health.json();
  if (!info.enabled) {
    throw new Error(
      "Perf probe disabled — set PERF_TEST_SECRET and ensure demo/dev mode."
    );
  }
  return { baseUrl: BASE_URL, vus: VUS };
}

export default function () {
  group("critical-paths", () => {
    for (const scenario of SCENARIOS) {
      probe(scenario);
      sleep(0.1);
    }
  });
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values["p(95)"];
  const fail = data.metrics.http_req_failed?.values.rate;
  const auth = data.metrics.auth_failure_rate?.values.rate;
  const waitingP95 = data.metrics.ttfb_ms?.values["p(95)"];

  const md = [
    `# PERF-TEST-001 k6 summary`,
    ``,
    `- Base URL: ${BASE_URL}`,
    `- VUs: ${VUS}`,
    `- Duration: ${DURATION}`,
    ``,
    `| Metric | Value | Threshold |`,
    `| --- | --- | --- |`,
    `| http_req_duration p95 | ${p95 != null ? p95.toFixed(1) + " ms" : "n/a"} | < 500 ms |`,
    `| ttfb_ms p95 | ${waitingP95 != null ? waitingP95.toFixed(1) + " ms" : "n/a"} | < 400 ms |`,
    `| http_req_failed rate | ${fail != null ? (fail * 100).toFixed(2) + "%" : "n/a"} | < 5% |`,
    `| auth_failure_rate | ${auth != null ? (auth * 100).toFixed(2) + "%" : "n/a"} | 0% |`,
    ``,
  ].join("\n");

  // stdout only — file export is handled by --summary-export from the runner
  // (avoids Docker permission errors writing into the mounted volume as non-root).
  return { stdout: md };
}
