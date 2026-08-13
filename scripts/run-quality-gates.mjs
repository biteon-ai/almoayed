#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const steps = [
  { id: "CI-LINT", cmd: "npm", args: ["run", "lint"] },
  { id: "CI-TYPES", cmd: "npm", args: ["run", "typecheck"] },
  { id: "CI-BUILD", cmd: "npm", args: ["run", "build"] },
  { id: "CI-MIGRATIONS", cmd: "node", args: ["scripts/verify-migrations.mjs"] },
  { id: "CI-UNIT", cmd: "npm", args: ["run", "test:unit"] },
  { id: "CI-RLS", cmd: "npm", args: ["run", "test:rls"] },
];

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

for (const step of steps) {
  runStep(step);
}

console.log("\n✅ All quality gates passed.");
