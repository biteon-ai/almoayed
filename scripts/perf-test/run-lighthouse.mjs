#!/usr/bin/env node
/**
 * [PERF-TEST-001] Lighthouse CLI audit for /login and /dashboard.
 * Reports FCP, LCP, INP (TBT proxy when INP unavailable), CLS.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  loadEnvFile,
  baseUrl,
  mdTable,
  writeReport,
  stamp,
  ensureOutDir,
  PERF_OUT_DIR,
} from "./lib/helpers.mjs";

loadEnvFile();
ensureOutDir();

const BASE = baseUrl();
const PATHS = ["/login", "/dashboard"];

function runLighthouse(path) {
  const url = `${BASE}${path}`;
  const outJson = join(
    PERF_OUT_DIR,
    `lighthouse-${path.replace(/\W+/g, "_")}-${stamp()}.json`
  );

  const args = [
    "--yes",
    "lighthouse",
    url,
    "--only-categories=performance",
    "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage",
    "--output=json",
    `--output-path=${outJson}`,
    "--quiet",
  ];

  console.log(`▶ Lighthouse ${url}`);
  const result = spawnSync("npx", args, {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  });

  if (result.status !== 0 || !existsSync(outJson)) {
    return {
      path,
      ok: false,
      error: `lighthouse failed (is Chrome available? exit ${result.status})`,
    };
  }

  const report = JSON.parse(readFileSync(outJson, "utf8"));
  const audits = report.audits ?? {};
  const metric = (id) => {
    const a = audits[id];
    if (!a) return "n/a";
    if (a.displayValue) return a.displayValue;
    if (typeof a.numericValue === "number") {
      return id.includes("shift")
        ? a.numericValue.toFixed(3)
        : `${Math.round(a.numericValue)} ms`;
    }
    return "n/a";
  };

  return {
    path,
    ok: true,
    score: report.categories?.performance?.score != null
      ? Math.round(report.categories.performance.score * 100)
      : "n/a",
    fcp: metric("first-contentful-paint"),
    lcp: metric("largest-contentful-paint"),
    // INP may be absent in lab; Total Blocking Time is the closest lab proxy.
    inp: metric("interaction-to-next-paint") !== "n/a"
      ? metric("interaction-to-next-paint")
      : `TBT ${metric("total-blocking-time")}`,
    cls: metric("cumulative-layout-shift"),
    json: outJson,
  };
}

function main() {
  const results = PATHS.map(runLighthouse);
  const table = mdTable(
    ["Route", "Perf score", "FCP", "LCP", "INP / TBT", "CLS", "ok"],
    results.map((r) => [
      r.path,
      r.ok ? String(r.score) : "—",
      r.ok ? r.fcp : "—",
      r.ok ? r.lcp : "—",
      r.ok ? r.inp : "—",
      r.ok ? r.cls : "—",
      r.ok ? "✅" : `❌ ${r.error || ""}`,
    ])
  );

  const md = [
    `# PERF-TEST-001 Lighthouse / Core Web Vitals`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    `Base URL: ${BASE}`,
    ``,
    `> Note: \`/dashboard\` requires an authenticated session. Without cookies,`,
    `> Lighthouse may audit the login redirect — capture with a logged-in Chrome profile`,
    `> or accept public-route metrics for \`/login\` as the primary lab signal.`,
    ``,
    table,
    ``,
  ].join("\n");

  const out = writeReport(`lighthouse-${stamp()}.md`, md);
  console.log(md);
  console.log(`\nWrote ${out}`);

  if (results.every((r) => !r.ok)) process.exit(1);
}

main();
