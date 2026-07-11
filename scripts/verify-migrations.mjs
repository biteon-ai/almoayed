#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

function fail(message) {
  console.error(`❌ FAIL: [CI-MIGRATIONS] ${message}`);
  process.exit(1);
}

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  fail("No SQL migration files found.");
}

const seen = new Set();
for (const file of files) {
  if (!/^\d{3}_[\w-]+\.sql$/.test(file)) {
    fail(`Invalid migration filename: ${file}`);
  }
  if (seen.has(file)) {
    fail(`Duplicate migration: ${file}`);
  }
  seen.add(file);

  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
  if (!sql.trim()) {
    fail(`Empty migration: ${file}`);
  }
}

console.log(`✅ PASS: [CI-MIGRATIONS] ${files.length} migrations verified.`);
