import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXAM_QUESTION_SELECT_FIELDS } from "@/lib/quiz-gatekeeper";

const scenarios = JSON.parse(
  readFileSync(
    join(process.cwd(), "scripts/perf-test/scenarios.json"),
    "utf8"
  )
) as {
  featureId: string;
  scenarios: string[];
  thresholds: {
    http_req_duration_p95_ms: number;
    auth_failure_rate_max: number;
  };
  lighthouseRoutes: string[];
};

describe("[PERF-TEST-001] stress suite contract", () => {
  it("defines critical probe scenarios including auth/dashboard/quiz paths", () => {
    expect(scenarios.featureId).toBe("PERF-TEST-001");
    expect(scenarios.scenarios).toEqual(
      expect.arrayContaining([
        "login-demo",
        "dashboard",
        "quiz-fetch",
        "submit-dry",
        "teacher-rpc",
      ])
    );
  });

  it("asserts p95 under 500ms and zero auth failures", () => {
    expect(scenarios.thresholds.http_req_duration_p95_ms).toBe(500);
    expect(scenarios.thresholds.auth_failure_rate_max).toBe(0);
  });

  it("keeps QUIZ-001 exam select free of solution fields for quiz-fetch profiling", () => {
    expect(EXAM_QUESTION_SELECT_FIELDS).not.toMatch(
      /correct_answer|explanation/
    );
  });

  it("includes Lighthouse routes for login and dashboard", () => {
    expect(scenarios.lighthouseRoutes).toContain("/login");
    expect(scenarios.lighthouseRoutes).toContain("/dashboard");
  });
});
