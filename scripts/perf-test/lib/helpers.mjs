#!/usr/bin/env node
/**
 * Shared helpers for PERF-TEST-001 runners.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(__dirname, "../../..");
export const PERF_OUT_DIR = join(REPO_ROOT, "scripts/perf-test/out");

export function loadEnvFile() {
  const envPath = join(REPO_ROOT, ".env");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function ensureOutDir() {
  mkdirSync(PERF_OUT_DIR, { recursive: true });
}

export function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function mdTable(headers, rows) {
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
  return `${head}\n${sep}\n${body}`;
}

export function writeReport(name, markdown) {
  ensureOutDir();
  const path = join(PERF_OUT_DIR, name);
  writeFileSync(path, markdown, "utf8");
  return path;
}

export function baseUrl() {
  return (
    process.env.PERF_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function perfSecret() {
  return process.env.PERF_TEST_SECRET?.trim() || "";
}
