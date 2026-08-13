import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

/** Sorted migration filenames ending in `.sql`. */
export function listMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

/** Concatenated SQL of all migrations in apply order. */
export function loadAllMigrationsSql(): string {
  return listMigrationFiles()
    .map((file) => readFileSync(join(MIGRATIONS_DIR, file), "utf8"))
    .join("\n\n");
}

export function loadMigrationSql(filename: string): string {
  return readFileSync(join(MIGRATIONS_DIR, filename), "utf8");
}

/** Last `CREATE POLICY "name" …` statement body for a policy (case-insensitive name). */
export function lastCreatePolicyBody(
  sql: string,
  policyName: string
): string | null {
  const escaped = policyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `CREATE\\s+POLICY\\s+"${escaped}"[\\s\\S]*?(?=\\nCREATE\\s+POLICY\\s+|\\nCREATE\\s+(?:OR\\s+REPLACE\\s+)?(?:FUNCTION|INDEX|TABLE|TRIGGER|VIEW)|\\nALTER\\s+TABLE|\\n--|$)`,
    "gi"
  );
  let last: string | null = null;
  let match: RegExpExecArray | null;
  while ((match = re.exec(sql)) !== null) {
    last = match[0];
  }
  return last;
}

export function sqlEnablesRls(sql: string, table: string): boolean {
  const re = new RegExp(
    `ALTER\\s+TABLE\\s+${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
    "i"
  );
  return re.test(sql);
}
