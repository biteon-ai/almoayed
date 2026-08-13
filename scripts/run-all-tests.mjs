#!/usr/bin/env node
/**
 * Full local/CI test pipeline: quality gates → RLS → e2e → optional perf.
 *
 * Usage:
 *   npm run test:all
 *   INCLUDE_PERF=1 npm run test:all   # also run stress/Lighthouse (needs PERF_TEST_SECRET + server)
 *   SKIP_E2E=1 npm run test:all       # gates + RLS only
 */
import { spawnSync } from "node:child_process";

const steps = [
  { id: "CI-LINT", cmd: "npm", args: ["run", "lint"] },
  { id: "CI-TYPES", cmd: "npm", args: ["run", "typecheck"] },
  { id: "CI-BUILD", cmd: "npm", args: ["run", "build"] },
  { id: "CI-MIGRATIONS", cmd: "node", args: ["scripts/verify-migrations.mjs"] },
  { id: "CI-UNIT", cmd: "npm", args: ["run", "test:unit"] },
  { id: "CI-RLS", cmd: "npm", args: ["run", "test:rls"] },
];

if (process.env.SKIP_E2E !== "1") {
  steps.push({ id: "CI-E2E", cmd: "npm", args: ["run", "test:e2e"] });
}

if (process.env.INCLUDE_PERF === "1") {
  steps.push({ id: "CI-PERF", cmd: "npm", args: ["run", "test:perf"] });
}

function runStep(step) {
  console.log(`\n▶ Running ${step.id}…`);
  const result = spawnSync(step.cmd, step.args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    console.error(`\n❌ FAIL: ${step.id} — pipeline halted (exit 1).`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${step.id}`);
}

console.log(
  [
    "Al-Moayed test:all",
    `steps: ${steps.map((s) => s.id).join(" → ")}`,
    process.env.INCLUDE_PERF === "1"
      ? "perf: included"
      : "perf: skipped (set INCLUDE_PERF=1 to enable)",
    process.env.SKIP_E2E === "1" ? "e2e: skipped" : "e2e: included",
  ].join(" | ")
);

for (const step of steps) {
  runStep(step);
}

console.log("\n✅ All test:all steps passed.");
