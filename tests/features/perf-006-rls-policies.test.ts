import { describe, expect, it } from "vitest";
import {
  lastCreatePolicyBody,
  listMigrationFiles,
  loadAllMigrationsSql,
  loadMigrationSql,
  sqlEnablesRls,
} from "../helpers/migrations-sql";

const FEATURE = "[PERF-006]";

/** Server-only tenant tables — deny-all (app uses service_role). */
const DENY_ALL_TABLES = [
  "student_teachers",
  "teacher_groups",
  "teacher_group_members",
  "categories",
  "topics",
  "auth_otp_states",
] as const;

const RLS_ENABLED_TABLES = [
  "profiles",
  "quizzes",
  "questions",
  "exam_submissions",
  "student_answers",
  "student_teachers",
  "teacher_groups",
  "teacher_group_members",
  "categories",
  "topics",
  "auth_otp_states",
  "gamification_tiers",
  "quiz_timed_sessions",
] as const;

const OWN_ROW_POLICIES_WITH_SELECT_AUTH_UID = [
  "profiles_select_own",
  "profiles_update_own",
  "exam_submissions_select_own",
  "exam_submissions_insert_own",
  "student_answers_select_own",
  "student_answers_insert_own",
  "quizzes_select_subscribed",
  "questions_select_subscribed",
] as const;

describe(`${FEATURE} RLS migration contracts`, () => {
  const allSql = loadAllMigrationsSql();
  const hardenSql = loadMigrationSql("011_db_scale_hardening.sql");

  it("ships numbered SQL migrations including 011 scale hardening", () => {
    const files = listMigrationFiles();
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain("011_db_scale_hardening.sql");
    expect(files).toContain("001_initial_schema.sql");
  });

  it.each(RLS_ENABLED_TABLES)(
    "enables RLS on %s somewhere in migration history",
    (table) => {
      expect(
        sqlEnablesRls(allSql, table),
        `Expected ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`
      ).toBe(true);
    }
  );

  it.each(DENY_ALL_TABLES)(
    "011 defines deny-all policy on %s (USING false / WITH CHECK false)",
    (table) => {
      const policyName = `${table}_deny_all`;
      const body = lastCreatePolicyBody(hardenSql, policyName);
      expect(body, `Missing CREATE POLICY "${policyName}" in 011`).toBeTruthy();
      expect(body!.toLowerCase()).toContain("using (false)");
      expect(body!.toLowerCase()).toContain("with check (false)");
    }
  );

  it("007 keeps gamification_tiers deny-all", () => {
    const sql = loadMigrationSql("007_gamification_tiers.sql");
    const body = lastCreatePolicyBody(sql, "gamification_tiers_deny_all");
    expect(body).toBeTruthy();
    expect(body!.toLowerCase()).toContain("using (false)");
  });

  it.each(OWN_ROW_POLICIES_WITH_SELECT_AUTH_UID)(
    "011 wraps auth.uid() as (SELECT auth.uid()) in %s",
    (policyName) => {
      const body = lastCreatePolicyBody(hardenSql, policyName);
      expect(body, `Missing CREATE POLICY "${policyName}" in 011`).toBeTruthy();
      expect(
        body!,
        `${policyName} must use (SELECT auth.uid()) initplan pattern`
      ).toMatch(/\(SELECT\s+auth\.uid\(\)\)/i);
      expect(
        body!.replace(/\(SELECT\s+auth\.uid\(\)\)/gi, ""),
        `${policyName} must not keep bare auth.uid() after rewrite`
      ).not.toMatch(/auth\.uid\(\)/i);
    }
  );

  it("013 quiz_timed_sessions policies scope to own student_id", () => {
    const sql = loadMigrationSql("013_quiz_timer.sql");
    expect(sqlEnablesRls(sql, "quiz_timed_sessions")).toBe(true);
    const selectOwn = lastCreatePolicyBody(sql, "quiz_timed_sessions_select_own");
    const insertOwn = lastCreatePolicyBody(sql, "quiz_timed_sessions_insert_own");
    expect(selectOwn).toBeTruthy();
    expect(insertOwn).toBeTruthy();
    expect(selectOwn!.toLowerCase()).toContain("student_id");
    expect(insertOwn!.toLowerCase()).toContain("student_id");
  });
});
