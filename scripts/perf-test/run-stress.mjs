#!/usr/bin/env node
/**
 * [PERF-TEST-001] Run stress against /api/perf/probe
 * Preference: native k6 → Docker grafana/k6 → Node fetch fallback
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  loadEnvFile,
  baseUrl,
  perfSecret,
  writeReport,
  stamp,
  ensureOutDir,
  REPO_ROOT,
  PERF_OUT_DIR,
} from "./lib/helpers.mjs";
import { runNodeStress } from "./run-stress-node.mjs";

loadEnvFile();
ensureOutDir();

const BASE = baseUrl();
const SECRET = perfSecret();
const VUS = process.env.PERF_VUS || "20";
const DURATION = process.env.PERF_DURATION || "30s";
const SCRIPT_HOST = join(REPO_ROOT, "tests/stress/k6-critical-paths.js");
const SCRIPT_DOCKER = "/work/tests/stress/k6-critical-paths.js";
const FORCE_NODE = process.env.PERF_STRESS_ENGINE === "node";
const FORCE_DOCKER = process.env.PERF_STRESS_ENGINE === "docker";

function whichK6() {
  const r = spawnSync("k6", ["version"], { encoding: "utf8" });
  return r.status === 0;
}

function whichDocker() {
  const r = spawnSync("docker", ["version"], { encoding: "utf8" });
  return r.status === 0;
}

/**
 * @param {string[]} prefixCmd e.g. ["k6","run"] or docker … grafana/k6 run
 * @param {string} label
 * @param {{ scriptPath: string, summaryPath: string }} paths
 */
function runK6(prefixCmd, label, paths) {
  console.log(`▶ ${label} VUs=${VUS} duration=${DURATION} base=${BASE}`);
  const result = spawnSync(
    prefixCmd[0],
    [
      ...prefixCmd.slice(1),
      "-e",
      `BASE_URL=${BASE}`,
      "-e",
      `PERF_TEST_SECRET=${SECRET}`,
      "-e",
      `VUS=${VUS}`,
      "-e",
      `DURATION=${DURATION}`,
      "--summary-export",
      paths.summaryPath,
      paths.scriptPath,
    ],
    { stdio: "inherit", env: process.env, cwd: REPO_ROOT }
  );

  const md = [
    `# PERF-TEST-001 k6 stress run`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `| Setting | Value |`,
    `| --- | --- |`,
    `| Engine | ${label} |`,
    `| Base URL | ${BASE} |`,
    `| VUs | ${VUS} |`,
    `| Duration | ${DURATION} |`,
    `| Script | \`${paths.scriptPath}\` |`,
    `| Exit | ${result.status ?? "n/a"} |`,
    `| Summary export | \`${paths.summaryPath}\` |`,
    ``,
    `Thresholds: p95 duration < 500ms, auth_failure_rate == 0, failed rate < 5%.`,
    ``,
  ].join("\n");

  const out = writeReport(`k6-run-${stamp()}.md`, md);
  console.log(`\nWrote ${out}`);
  return result.status ?? 1;
}

async function main() {
  if (!SECRET) {
    console.error(
      "PERF_TEST_SECRET is not set. Add it to .env (see .env.example)."
    );
    process.exit(1);
  }

  if (!existsSync(SCRIPT_HOST)) {
    console.error(`Missing k6 script: ${SCRIPT_HOST}`);
    process.exit(1);
  }

  if (!FORCE_NODE && whichK6() && !FORCE_DOCKER) {
    const summaryPath = join(PERF_OUT_DIR, `k6-summary-${stamp()}.json`);
    process.exit(
      runK6(["k6", "run"], "k6 (native)", {
        scriptPath: SCRIPT_HOST,
        summaryPath,
      })
    );
  }

  if (!FORCE_NODE && whichDocker()) {
    console.log("▶ Trying Docker image grafana/k6 …");
    const stampId = stamp();
    // Paths inside the container (repo mounted at /work)
    const summaryDocker = `/work/scripts/perf-test/out/k6-summary-${stampId}.json`;
    const uid = typeof process.getuid === "function" ? process.getuid() : 1000;
    const gid = typeof process.getgid === "function" ? process.getgid() : 1000;
    const status = runK6(
      [
        "docker",
        "run",
        "--rm",
        "--network=host",
        "-u",
        `${uid}:${gid}`,
        "-v",
        `${REPO_ROOT}:/work`,
        "-w",
        "/work",
        "grafana/k6",
        "run",
      ],
      "k6 (docker grafana/k6)",
      {
        scriptPath: SCRIPT_DOCKER,
        summaryPath: summaryDocker,
      }
    );
    if (status === 0) process.exit(0);
    console.warn(
      `Docker k6 exited ${status}; falling back to Node stress engine.`
    );
  }

  try {
    const result = await runNodeStress();
    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
