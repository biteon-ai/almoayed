import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEMO_STUDENT, DEMO_TEACHER } from "@/lib/constants";
import { EXAM_QUESTION_SELECT_FIELDS } from "@/lib/quiz-gatekeeper";
import { QUIZ_LIST_SELECT } from "@/lib/perf-selects";
import { isAuthDemoBypassEnabled } from "@/lib/admin-fallback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProbeScenario =
  | "health"
  | "login-demo"
  | "dashboard"
  | "quiz-fetch"
  | "teacher-rpc"
  | "submit-dry";

type ProbeBody = {
  scenario?: ProbeScenario;
};

function unauthorized() {
  return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
}

function forbidden() {
  return NextResponse.json(
    { error: "مسار القياس معطّل خارج بيئة التطوير/الديمو." },
    { status: 403 }
  );
}

function assertPerfAuth(request: Request): boolean {
  const secret = process.env.PERF_TEST_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const alt = request.headers.get("x-perf-test-secret")?.trim() ?? "";
  return bearer === secret || alt === secret;
}

function isProbeEnabled(): boolean {
  if (process.env.NODE_ENV === "production" && !isAuthDemoBypassEnabled()) {
    return false;
  }
  return Boolean(process.env.PERF_TEST_SECRET?.trim());
}

async function timeStep<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ label: string; ms: number; ok: boolean; detail?: string; value?: T }> {
  const start = performance.now();
  try {
    const value = await fn();
    return { label, ms: Math.round(performance.now() - start), ok: true, value };
  } catch (error) {
    return {
      label,
      ms: Math.round(performance.now() - start),
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * [PERF-TEST-001] Gated probe for k6 / local stress.
 * Does not mint iron-session cookies (auth validation stays on real routes).
 * QUIZ-001: quiz-fetch uses EXAM_QUESTION_SELECT_FIELDS only.
 * MT-002: dashboard/quiz scoped to demo student's active teacher.
 */
export async function POST(request: Request) {
  if (!isProbeEnabled()) return forbidden();
  if (!assertPerfAuth(request)) return unauthorized();

  let body: ProbeBody = {};
  try {
    body = (await request.json()) as ProbeBody;
  } catch {
    body = {};
  }

  const scenario: ProbeScenario = body.scenario ?? "health";
  const wallStart = performance.now();
  const steps: Array<{ label: string; ms: number; ok: boolean; detail?: string }> =
    [];

  const supabase = createAdminClient();

  if (scenario === "health") {
    const step = await timeStep("supabase-profiles-head", async () => {
      const { error, count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      return count ?? 0;
    });
    steps.push({ label: step.label, ms: step.ms, ok: step.ok, detail: step.detail });
    return NextResponse.json({
      ok: steps.every((s) => s.ok),
      scenario,
      totalMs: Math.round(performance.now() - wallStart),
      steps,
    });
  }

  if (scenario === "login-demo") {
    const step = await timeStep("resolve-demo-student", async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, full_name, whatsapp_number")
        .eq("whatsapp_number", DEMO_STUDENT.whatsapp_number)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("demo student missing");
      return data;
    });
    steps.push({ label: step.label, ms: step.ms, ok: step.ok, detail: step.detail });
    return NextResponse.json({
      ok: steps.every((s) => s.ok),
      scenario,
      totalMs: Math.round(performance.now() - wallStart),
      steps,
      authFailure: step.ok ? 0 : 1,
    });
  }

  if (scenario === "teacher-rpc") {
    const teacherStep = await timeStep("resolve-demo-teacher", async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("whatsapp_number", DEMO_TEACHER.whatsapp_number)
        .eq("role", "TEACHER")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data?.id) throw new Error("demo teacher missing");
      return data.id as string;
    });
    steps.push({
      label: teacherStep.label,
      ms: teacherStep.ms,
      ok: teacherStep.ok,
      detail: teacherStep.detail,
    });

    if (teacherStep.ok && teacherStep.value) {
      const rpcStep = await timeStep("get_teacher_dashboard_kpis", async () => {
        const primary = await supabase.rpc("get_teacher_dashboard_kpis", {
          p_teacher_id: teacherStep.value,
        });
        if (!primary.error) return primary.data;
        const legacy = await supabase.rpc("get_teacher_dashboard_analytics", {
          p_teacher_id: teacherStep.value,
        });
        if (legacy.error) throw new Error(legacy.error.message);
        return legacy.data;
      });
      steps.push({
        label: rpcStep.label,
        ms: rpcStep.ms,
        ok: rpcStep.ok,
        detail: rpcStep.detail,
      });
    }

    return NextResponse.json({
      ok: steps.every((s) => s.ok),
      scenario,
      totalMs: Math.round(performance.now() - wallStart),
      steps,
    });
  }

  // Shared student context for dashboard / quiz / submit-dry
  const studentStep = await timeStep("resolve-demo-student", async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("whatsapp_number", DEMO_STUDENT.whatsapp_number)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.id) throw new Error("demo student missing");
    return data.id as string;
  });
  steps.push({
    label: studentStep.label,
    ms: studentStep.ms,
    ok: studentStep.ok,
    detail: studentStep.detail,
  });
  if (!studentStep.ok || !studentStep.value) {
    return NextResponse.json(
      {
        ok: false,
        scenario,
        totalMs: Math.round(performance.now() - wallStart),
        steps,
        authFailure: 1,
      },
      { status: 500 }
    );
  }

  const studentId = studentStep.value;

  const linkStep = await timeStep("student-teachers-active", async () => {
    const { data, error } = await supabase
      .from("student_teachers")
      .select("teacher_id, status, tier")
      .eq("student_id", studentId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.teacher_id) throw new Error("no active teacher (MT-002)");
    return data;
  });
  steps.push({
    label: linkStep.label,
    ms: linkStep.ms,
    ok: linkStep.ok,
    detail: linkStep.detail,
  });
  if (!linkStep.ok || !linkStep.value) {
    return NextResponse.json(
      {
        ok: false,
        scenario,
        totalMs: Math.round(performance.now() - wallStart),
        steps,
      },
      { status: 500 }
    );
  }

  const teacherId = linkStep.value.teacher_id as string;

  if (scenario === "dashboard") {
    const quizStep = await timeStep("quizzes-by-teacher", async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select(QUIZ_LIST_SELECT)
        .eq("created_by", teacherId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    });
    steps.push({
      label: quizStep.label,
      ms: quizStep.ms,
      ok: quizStep.ok,
      detail: quizStep.detail,
    });

    const quizIds = (quizStep.value ?? []).map((q) => q.id as string);
    const subStep = await timeStep("exam-submissions-scoped", async () => {
      if (!quizIds.length) return [];
      const { data, error } = await supabase
        .from("exam_submissions")
        .select("id, quiz_id, score, submitted_at")
        .eq("student_id", studentId)
        .in("quiz_id", quizIds);
      if (error) throw new Error(error.message);
      return data ?? [];
    });
    steps.push({
      label: subStep.label,
      ms: subStep.ms,
      ok: subStep.ok,
      detail: subStep.detail,
    });

    return NextResponse.json({
      ok: steps.every((s) => s.ok),
      scenario,
      totalMs: Math.round(performance.now() - wallStart),
      steps,
      meta: {
        teacherId,
        quizCount: quizIds.length,
        submissionCount: (subStep.value ?? []).length,
      },
    });
  }

  if (scenario === "quiz-fetch" || scenario === "submit-dry") {
    const pickStep = await timeStep("pick-active-quiz", async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("id, title, created_by, is_active, is_free")
        .eq("created_by", teacherId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data?.id) throw new Error("no active quiz for demo teacher");
      return data;
    });
    steps.push({
      label: pickStep.label,
      ms: pickStep.ms,
      ok: pickStep.ok,
      detail: pickStep.detail,
    });

    if (pickStep.ok && pickStep.value) {
      const quizId = pickStep.value.id as string;
      const qStep = await timeStep("exam-questions-gatekeeper", async () => {
        const { data, error } = await supabase
          .from("questions")
          .select(EXAM_QUESTION_SELECT_FIELDS)
          .eq("quiz_id", quizId)
          .order("sort_order", { ascending: true });
        if (error) throw new Error(error.message);
        const rows = data ?? [];
        for (const row of rows) {
          if (
            "correct_answer" in row ||
            "explanation_text" in row ||
            "explanation_media_url" in row
          ) {
            throw new Error("[QUIZ-001] forbidden field in probe payload");
          }
        }
        return rows;
      });
      steps.push({
        label: qStep.label,
        ms: qStep.ms,
        ok: qStep.ok,
        detail: qStep.detail,
      });

      if (scenario === "submit-dry" && qStep.ok) {
        const dry = await timeStep("submit-dry-score-compute", async () => {
          const n = (qStep.value ?? []).length;
          // Dry-run only — no exam_submissions write under load.
          return { totalQuestions: n, simulatedScore: n ? 100 : 0 };
        });
        steps.push({
          label: dry.label,
          ms: dry.ms,
          ok: dry.ok,
          detail: dry.detail,
        });
      }
    }

    return NextResponse.json({
      ok: steps.every((s) => s.ok),
      scenario,
      totalMs: Math.round(performance.now() - wallStart),
      steps,
    });
  }

  return NextResponse.json(
    { ok: false, error: `unknown scenario: ${scenario}` },
    { status: 400 }
  );
}

export async function GET() {
  return NextResponse.json({
    service: "perf-probe",
    feature: "PERF-TEST-001",
    enabled: isProbeEnabled(),
    scenarios: [
      "health",
      "login-demo",
      "dashboard",
      "quiz-fetch",
      "teacher-rpc",
      "submit-dry",
    ],
  });
}
