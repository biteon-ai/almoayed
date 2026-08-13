/**
 * Optional live RLS probes against a real Supabase project.
 * Skips when anon credentials are missing or point at the CI placeholder host.
 *
 * Expectation: unauthenticated / anon JWT cannot read server-only deny-all tables
 * (defense-in-depth; Server Actions use service_role which bypasses RLS).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const FEATURE = "[PERF-006]";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  process.env.SUPABASE_ANON_KEY?.trim() ||
  "";

const isPlaceholderHost =
  !url ||
  url.includes("example.supabase.co") ||
  anonKey.includes("ci-anon-key");

const canProbeLive = Boolean(url && anonKey && !isPlaceholderHost);

const DENY_ALL_TABLES = [
  "student_teachers",
  "teacher_groups",
  "teacher_group_members",
  "categories",
  "topics",
  "auth_otp_states",
  "gamification_tiers",
] as const;

function anonClient(): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

describe.skipIf(!canProbeLive)(
  `${FEATURE} live anon RLS denial (optional)`,
  () => {
    it.each(DENY_ALL_TABLES)(
      "anon select on %s returns empty or permission error",
      async (table) => {
        const supabase = anonClient();
        const { data, error } = await supabase.from(table).select("*").limit(1);
        const denied =
          Boolean(error) ||
          data === null ||
          (Array.isArray(data) && data.length === 0);
        expect(
          denied,
          `Expected anon RLS denial on ${table}; got data=${JSON.stringify(data)} error=${error?.message}`
        ).toBe(true);
      }
    );

    it("anon cannot insert into exam_submissions without matching auth.uid()", async () => {
      const supabase = anonClient();
      const { error } = await supabase.from("exam_submissions").insert({
        student_id: "00000000-0000-4000-8000-000000000000",
        quiz_id: "00000000-0000-4000-8000-000000000001",
        score: 0,
      });
      expect(
        error,
        "anon insert into exam_submissions should fail RLS"
      ).toBeTruthy();
    });
  }
);

describe(`${FEATURE} live RLS probe gate`, () => {
  it("documents skip when live Supabase anon credentials are unavailable", () => {
    if (!canProbeLive) {
      expect(canProbeLive).toBe(false);
      return;
    }
    expect(url.startsWith("http")).toBe(true);
    expect(anonKey.length).toBeGreaterThan(20);
  });
});
