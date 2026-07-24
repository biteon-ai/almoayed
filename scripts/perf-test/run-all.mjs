#!/usr/bin/env node
/**
 * [PERF-TEST-001] Orchestrate DB profile + optional k6 + Lighthouse; write combined markdown.
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  loadEnvFile,
  ensureOutDir,
  PERF_OUT_DIR,
  stamp,
  writeReport,
  REPO_ROOT,
} from "./lib/helpers.mjs";

loadEnvFile();
ensureOutDir();

function runNode(script, label) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync("node", [join(REPO_ROOT, script)], {
    stdio: "inherit",
    env: process.env,
    cwd: REPO_ROOT,
  });
  return { label, status: result.status ?? 1 };
}

function latestReports(prefix) {
  try {
    return readdirSync(PERF_OUT_DIR)
      .filter((f) => f.startsWith(prefix) && f.endsWith(".md"))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

function main() {
  const skipK6 = process.env.PERF_SKIP_K6 === "1";
  const skipLh = process.env.PERF_SKIP_LIGHTHOUSE === "1";

  const results = [];
  results.push(runNode("scripts/perf-test/run-db-profile.mjs", "DB profile"));

  if (!skipK6) {
    results.push(runNode("scripts/perf-test/run-stress.mjs", "k6 stress"));
  } else {
    results.push({ label: "k6 stress", status: 0, skipped: true });
  }

  if (!skipLh) {
    results.push(
      runNode("scripts/perf-test/run-lighthouse.mjs", "Lighthouse")
    );
  } else {
    results.push({ label: "Lighthouse", status: 0, skipped: true });
  }

  const sections = [];
  for (const prefix of ["db-profile-", "k6-run-", "k6-skipped-", "lighthouse-"]) {
    const files = latestReports(prefix);
    if (files[0]) {
      sections.push(
        `## ${files[0]}\n\n` +
          readFileSync(join(PERF_OUT_DIR, files[0]), "utf8")
      );
    }
  }

  const overview = [
    `# PERF-TEST-001 Combined performance report`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `| Step | Exit |`,
    `| --- | --- |`,
    ...results.map(
      (r) =>
        `| ${r.label} | ${r.skipped ? "skipped" : r.status === 0 ? "✅ 0" : `❌ ${r.status}`} |`
    ),
    ``,
    ...sections,
  ].join("\n");

  const out = writeReport(`perf-summary-${stamp()}.md`, overview);
  // Also write a stable latest pointer
  writeFileSync(join(PERF_OUT_DIR, "LATEST.md"), overview, "utf8");
  console.log(`\n✅ Combined report: ${out}`);
  console.log(`   Latest pointer: ${join(PERF_OUT_DIR, "LATEST.md")}`);

  const hardFail = results.some((r) => !r.skipped && r.status !== 0 && r.status !== 2);
  // status 2 = k6 not installed (soft skip documented)
  if (hardFail) process.exit(1);
}

main();
