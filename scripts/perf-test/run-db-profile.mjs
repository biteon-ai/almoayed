#!/usr/bin/env node
/**
 * [PERF-TEST-001] Database query profiling against Supabase (service role).
 * Times RPCs and multi-tenant joins — no iron-session bypass of production auth.
 */
import { createClient } from "@supabase/supabase-js";
import {
  loadEnvFile,
  mdTable,
  writeReport,
  stamp,
  REPO_ROOT,
} from "./lib/helpers.mjs";

loadEnvFile();

const DEMO_STUDENT = "963987654321";
const DEMO_TEACHER = "963912345678";

const QUIZ_LIST_SELECT =
  "id, title, created_by, category_id, topic_id, is_active, is_free, is_archived, quiz_type, target_group_id, created_at, updated_at";
const EXAM_QUESTION_SELECT =
  "id, quiz_id, question_text, question_image_url, options, sort_order";

async function time(label, fn) {
  const start = performance.now();
  try {
    const result = await fn();
    return {
      label,
      ms: Math.round(performance.now() - start),
      ok: true,
      note: typeof result === "string" ? result : "",
    };
  } catch (error) {
    return {
      label,
      ms: Math.round(performance.now() - start),
      ok: false,
      note: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rows = [];

  const teacher = await time("resolve demo teacher", async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("whatsapp_number", DEMO_TEACHER)
      .eq("role", "TEACHER")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.id) throw new Error("demo teacher missing");
    return data.id;
  });
  rows.push(teacher);
  const teacherId = teacher.ok
    ? (
        await supabase
          .from("profiles")
          .select("id")
          .eq("whatsapp_number", DEMO_TEACHER)
          .maybeSingle()
      ).data?.id
    : null;

  const student = await time("resolve demo student", async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("whatsapp_number", DEMO_STUDENT)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.id) throw new Error("demo student missing");
    return data.id;
  });
  rows.push(student);
  const studentId = student.ok
    ? (
        await supabase
          .from("profiles")
          .select("id")
          .eq("whatsapp_number", DEMO_STUDENT)
          .maybeSingle()
      ).data?.id
    : null;

  if (teacherId) {
    rows.push(
      await time("RPC get_teacher_dashboard_analytics", async () => {
        const { error } = await supabase.rpc("get_teacher_dashboard_analytics", {
          p_teacher_id: teacherId,
        });
        if (error) throw new Error(error.message);
        return "ok";
      })
    );

    rows.push(
      await time("quizzes by created_by + is_active (index pair)", async () => {
        const { data, error } = await supabase
          .from("quizzes")
          .select(QUIZ_LIST_SELECT)
          .eq("created_by", teacherId)
          .eq("is_active", true);
        if (error) throw new Error(error.message);
        return `${data?.length ?? 0} rows`;
      })
    );

    rows.push(
      await time("student_teachers by teacher_id + status", async () => {
        const { data, error } = await supabase
          .from("student_teachers")
          .select("student_id, tier, status")
          .eq("teacher_id", teacherId)
          .eq("status", "active");
        if (error) throw new Error(error.message);
        return `${data?.length ?? 0} rows`;
      })
    );
  }

  if (studentId) {
    rows.push(
      await time("student_teachers by student_id + status (MT-002)", async () => {
        const { data, error } = await supabase
          .from("student_teachers")
          .select("teacher_id, status, tier")
          .eq("student_id", studentId)
          .eq("status", "active");
        if (error) throw new Error(error.message);
        if (!data?.length) throw new Error("no active teacher link");
        return `${data.length} links`;
      })
    );

    const teacherForStudent = (
      await supabase
        .from("student_teachers")
        .select("teacher_id")
        .eq("student_id", studentId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle()
    ).data?.teacher_id;

    if (teacherForStudent) {
      rows.push(
        await time("quiz-fetch gatekeeper select (QUIZ-001)", async () => {
          const { data: quiz, error: qErr } = await supabase
            .from("quizzes")
            .select("id")
            .eq("created_by", teacherForStudent)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle();
          if (qErr) throw new Error(qErr.message);
          if (!quiz?.id) return "no quiz";
          const { data, error } = await supabase
            .from("questions")
            .select(EXAM_QUESTION_SELECT)
            .eq("quiz_id", quiz.id);
          if (error) throw new Error(error.message);
          for (const row of data ?? []) {
            if ("correct_answer" in row || "explanation_text" in row) {
              throw new Error("QUIZ-001 leak");
            }
          }
          return `${data?.length ?? 0} questions`;
        })
      );
    }
  }

  const table = mdTable(
    ["Query", "ms", "ok", "note"],
    rows.map((r) => [
      r.label,
      String(r.ms),
      r.ok ? "✅" : "❌",
      (r.note || "").replace(/\|/g, "/"),
    ])
  );

  const md = [
    `# PERF-TEST-001 Database query profile`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    `Repo: \`${REPO_ROOT}\``,
    ``,
    table,
    ``,
    `## Notes`,
    ``,
    `- Timings are client-observed round-trips (network + DB).`,
    `- Composite indexes from PERF-002 should keep teacher/student scoped filters fast.`,
    `- Quiz fetch uses gatekeeper column list only (no answers/explanations).`,
    ``,
  ].join("\n");

  const out = writeReport(`db-profile-${stamp()}.md`, md);
  console.log(md);
  console.log(`\nWrote ${out}`);

  if (rows.some((r) => !r.ok)) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
