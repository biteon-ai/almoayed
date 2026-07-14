/**
 * Seed exactly 20 Arabic dashboard mock exams for DASH-001 smart-queue testing.
 *
 * Usage:
 *   npx tsx scripts/seed-20-dashboard-exams.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Schema note: this repo uses `quizzes` + `exam_submissions`, not a flat `exams`
 * table. The `MOCK_EXAMS` array below mirrors your requested shape for clarity;
 * `seedDashboardExams()` maps it to the real tables.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Constants ───────────────────────────────────────────────────────────────

const DEMO_TEACHER_ID = "11111111-1111-1111-1111-111111111111";
const DEMO_STUDENT_ID = "22222222-2222-2222-2222-222222222222";

const CATEGORY_MATH = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const CATEGORY_PHYSICS = "dd0c0001-0001-4001-8001-000000000001";
const CATEGORY_SCIENCE = "dd0c0002-0001-4001-8001-000000000001";

const CATEGORY_NAME_TO_ID: Record<string, string> = {
  رياضيات: CATEGORY_MATH,
  فيزياء: CATEGORY_PHYSICS,
  علوم: CATEGORY_SCIENCE,
};

/** Requested conceptual shape (maps to quizzes + exam_submissions). */
export type MockExamStatus = "not_started" | "in_progress" | "completed";

export interface MockExam {
  id: string;
  title: string;
  category: string;
  questions_count: number;
  is_pro: boolean;
  status: MockExamStatus;
  /** ISO timestamp — for active rows this becomes exam_submissions.submitted_at */
  updated_at: string;
  created_at: string;
  /** Optional final score when status !== not_started */
  score?: number;
  /** category_tag on generated placeholder questions */
  question_tag: string;
}

const SUBMISSION_IDS = [
  "ee000001-0001-4001-8001-000000000001",
  "ee000002-0001-4001-8001-000000000002",
  "ee000003-0001-4001-8001-000000000003",
  "ee000004-0001-4001-8001-000000000004",
  "ee000005-0001-4001-8001-000000000005",
  "ee000006-0001-4001-8001-000000000006",
  "ee000007-0001-4001-8001-000000000007",
  "ee000008-0001-4001-8001-000000000008",
  "ee000009-0001-4001-8001-000000000009",
  "ee000010-0001-4001-8001-000000000010",
  "ee000011-0001-4001-8001-000000000011",
  "ee000012-0001-4001-8001-000000000012",
] as const;

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
}

/** Exactly 20 exams — composition validated below. */
export const MOCK_EXAMS: MockExam[] = [
  // 1 × Continue highlight (newest activity)
  {
    id: "dd000001-0001-4001-8001-000000000001",
    title: "تفاضل وتكامل المتقدم",
    category: "رياضيات",
    questions_count: 15,
    is_pro: true,
    status: "in_progress",
    updated_at: new Date().toISOString(),
    created_at: daysAgo(30),
    score: 42,
    question_tag: "تفاضل",
  },
  // 3 × other in_progress
  {
    id: "dd000002-0001-4001-8001-000000000002",
    title: "أشعة وعقديات — الوحدة الثانية",
    category: "رياضيات",
    questions_count: 12,
    is_pro: false,
    status: "in_progress",
    updated_at: hoursAgo(2),
    created_at: daysAgo(28),
    score: 55,
    question_tag: "أشعة",
  },
  {
    id: "dd000003-0001-4001-8001-000000000003",
    title: "ميكانيك — حركة المقذوفات",
    category: "فيزياء",
    questions_count: 10,
    is_pro: true,
    status: "in_progress",
    updated_at: daysAgo(1),
    created_at: daysAgo(25),
    score: 38,
    question_tag: "فيزياء",
  },
  {
    id: "dd000004-0001-4001-8001-000000000004",
    title: "جبر خطي — المصفوفات",
    category: "رياضيات",
    questions_count: 8,
    is_pro: false,
    status: "in_progress",
    updated_at: daysAgo(3),
    created_at: daysAgo(22),
    score: 61,
    question_tag: "جبر",
  },
  // 8 × completed
  {
    id: "dd000005-0001-4001-8001-000000000005",
    title: "كيمياء عضوية — الألكانات",
    category: "علوم",
    questions_count: 20,
    is_pro: false,
    status: "completed",
    updated_at: daysAgo(5),
    created_at: daysAgo(40),
    score: 88,
    question_tag: "كيمياء",
  },
  {
    id: "dd000006-0001-4001-8001-000000000006",
    title: "هندسة — المثلثات والزوايا",
    category: "رياضيات",
    questions_count: 10,
    is_pro: false,
    status: "completed",
    updated_at: daysAgo(7),
    created_at: daysAgo(38),
    score: 76,
    question_tag: "هندسة",
  },
  {
    id: "dd000007-0001-4001-8001-000000000007",
    title: "فيزياء — الكهرباء الساكنة",
    category: "فيزياء",
    questions_count: 12,
    is_pro: true,
    status: "completed",
    updated_at: daysAgo(9),
    created_at: daysAgo(35),
    score: 92,
    question_tag: "فيزياء",
  },
  {
    id: "dd000008-0001-4001-8001-000000000008",
    title: "تفاضل — قواعد الاشتقاق",
    category: "رياضيات",
    questions_count: 14,
    is_pro: false,
    status: "completed",
    updated_at: daysAgo(11),
    created_at: daysAgo(33),
    score: 84,
    question_tag: "تفاضل",
  },
  {
    id: "dd000009-0001-4001-8001-000000000009",
    title: "تكامل — التكامل المحدود",
    category: "رياضيات",
    questions_count: 16,
    is_pro: true,
    status: "completed",
    updated_at: daysAgo(13),
    created_at: daysAgo(31),
    score: 79,
    question_tag: "تكامل",
  },
  {
    id: "dd000010-0001-4001-8001-000000000010",
    title: "أشعة — الدوائر",
    category: "رياضيات",
    questions_count: 11,
    is_pro: false,
    status: "completed",
    updated_at: daysAgo(15),
    created_at: daysAgo(29),
    score: 95,
    question_tag: "أشعة",
  },
  {
    id: "dd000011-0001-4001-8001-000000000011",
    title: "عقدية — المعادلات التربيعية",
    category: "رياضيات",
    questions_count: 9,
    is_pro: false,
    status: "completed",
    updated_at: daysAgo(17),
    created_at: daysAgo(27),
    score: 70,
    question_tag: "عقدية",
  },
  {
    id: "dd000012-0001-4001-8001-000000000012",
    title: "ميكانيك — قوانين نيوتن",
    category: "فيزياء",
    questions_count: 13,
    is_pro: true,
    status: "completed",
    updated_at: daysAgo(19),
    created_at: daysAgo(24),
    score: 86,
    question_tag: "فيزياء",
  },
  // 8 × not_started
  {
    id: "dd000013-0001-4001-8001-000000000013",
    title: "هندسة — الإحداثيات",
    category: "رياضيات",
    questions_count: 10,
    is_pro: false,
    status: "not_started",
    updated_at: daysAgo(14),
    created_at: daysAgo(14),
    question_tag: "هندسة",
  },
  {
    id: "dd000014-0001-4001-8001-000000000014",
    title: "جبر — أنظمة المعادلات",
    category: "رياضيات",
    questions_count: 12,
    is_pro: false,
    status: "not_started",
    updated_at: daysAgo(12),
    created_at: daysAgo(12),
    question_tag: "جبر",
  },
  {
    id: "dd000015-0001-4001-8001-000000000015",
    title: "فيزياء — الموجات والصوت",
    category: "فيزياء",
    questions_count: 15,
    is_pro: true,
    status: "not_started",
    updated_at: daysAgo(10),
    created_at: daysAgo(10),
    question_tag: "فيزياء",
  },
  {
    id: "dd000016-0001-4001-8001-000000000016",
    title: "كيمياء — التفاعلات الكيميائية",
    category: "علوم",
    questions_count: 18,
    is_pro: false,
    status: "not_started",
    updated_at: daysAgo(8),
    created_at: daysAgo(8),
    question_tag: "كيمياء",
  },
  {
    id: "dd000017-0001-4001-8001-000000000017",
    title: "تفاضل وتكامل — متسلسلات",
    category: "رياضيات",
    questions_count: 20,
    is_pro: true,
    status: "not_started",
    updated_at: daysAgo(6),
    created_at: daysAgo(6),
    question_tag: "تفاضل",
  },
  {
    id: "dd000018-0001-4001-8001-000000000018",
    title: "رياضيات — الاحتمالات والإحصاء",
    category: "رياضيات",
    questions_count: 14,
    is_pro: false,
    status: "not_started",
    updated_at: daysAgo(4),
    created_at: daysAgo(4),
    question_tag: "احتمالات",
  },
  {
    id: "dd000019-0001-4001-8001-000000000019",
    title: "هندسة — التحويلات الهندسية",
    category: "رياضيات",
    questions_count: 11,
    is_pro: true,
    status: "not_started",
    updated_at: daysAgo(2),
    created_at: daysAgo(2),
    question_tag: "هندسة",
  },
  {
    id: "dd000020-0001-4001-8001-000000000020",
    title: "فيزياء — الكهرومغناطيسية",
    category: "فيزياء",
    questions_count: 12,
    is_pro: false,
    status: "not_started",
    updated_at: daysAgo(1),
    created_at: daysAgo(1),
    question_tag: "فيزياء",
  },
];

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local optional if vars already exported
  }
}

function assertComposition(exams: MockExam[]) {
  if (exams.length !== 20) {
    throw new Error(`Expected 20 exams, got ${exams.length}`);
  }
  const inProgress = exams.filter((e) => e.status === "in_progress");
  const completed = exams.filter((e) => e.status === "completed");
  const notStarted = exams.filter((e) => e.status === "not_started");
  const pro = exams.filter((e) => e.is_pro);
  const free = exams.filter((e) => !e.is_pro);

  if (inProgress.length !== 4) throw new Error("Expected 4 in_progress exams");
  if (completed.length !== 8) throw new Error("Expected 8 completed exams");
  if (notStarted.length !== 8) throw new Error("Expected 8 not_started exams");
  if (pro.length !== 8) throw new Error("Expected 8 Pro exams");
  if (free.length !== 12) throw new Error("Expected 12 Free exams");

  const sorted = [...inProgress].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
  if (sorted[0]?.title !== "تفاضل وتكامل المتقدم") {
    throw new Error("Continue highlight exam must have the newest updated_at");
  }
}

export async function seedDashboardExams() {
  assertComposition(MOCK_EXAMS);

  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Extra categories + Pro tier for Continue highlight on Pro exam
  await supabase.from("categories").upsert([
    { id: CATEGORY_PHYSICS, teacher_id: null, name: "فيزياء", is_global: true, sort_order: 2 },
    { id: CATEGORY_SCIENCE, teacher_id: null, name: "علوم", is_global: true, sort_order: 3 },
  ]);

  await supabase
    .from("student_teachers")
    .update({ tier: "pro" })
    .eq("student_id", DEMO_STUDENT_ID)
    .eq("teacher_id", DEMO_TEACHER_ID);

  const quizRows = MOCK_EXAMS.map((exam) => ({
    id: exam.id,
    title: exam.title,
    created_by: DEMO_TEACHER_ID,
    category_id: CATEGORY_NAME_TO_ID[exam.category] ?? CATEGORY_MATH,
    is_active: true,
    is_free: !exam.is_pro,
    quiz_type: "regular" as const,
    created_at: exam.created_at,
    updated_at: exam.updated_at,
  }));

  const { error: quizError } = await supabase.from("quizzes").upsert(quizRows);
  if (quizError) throw quizError;

  const questionRows = MOCK_EXAMS.flatMap((exam) =>
    Array.from({ length: exam.questions_count }, (_, i) => ({
      quiz_id: exam.id,
      question_text: `سؤال ${i + 1} — ${exam.title}`,
      options: ["أ", "ب", "ج", "د"],
      correct_answer: "أ",
      explanation_text: `شرح الإجابة الصحيحة للسؤال ${i + 1}`,
      category_tag: exam.question_tag,
      sort_order: i + 1,
    }))
  );

  const { error: questionError } = await supabase
    .from("questions")
    .upsert(questionRows, { onConflict: "quiz_id,sort_order", ignoreDuplicates: true });
  if (questionError && !questionError.message.includes("duplicate")) {
    // questions table may lack unique on (quiz_id, sort_order) — fall back to insert
    const { error: insertError } = await supabase.from("questions").insert(questionRows);
    if (insertError && !insertError.message.includes("duplicate")) throw insertError;
  }

  const submissionRows = MOCK_EXAMS.filter((e) => e.status !== "not_started").map(
    (exam, index) => ({
      id: SUBMISSION_IDS[index],
      student_id: DEMO_STUDENT_ID,
      quiz_id: exam.id,
      score: exam.score ?? 0,
      submitted_at: exam.updated_at,
    })
  );

  const { error: submissionError } = await supabase
    .from("exam_submissions")
    .upsert(submissionRows, { onConflict: "student_id,quiz_id" });
  if (submissionError) throw submissionError;

  console.log("Seeded 20 dashboard mock exams successfully.");
  console.log(
    "Continue highlight:",
    MOCK_EXAMS.find((e) => e.status === "in_progress" && e.is_pro)?.title
  );
}

// Direct Supabase insert snippet (same data, minimal):
export async function insertWithSupabaseClient(
  supabase: ReturnType<typeof createClient>
) {
  await supabase.from("quizzes").insert(
    MOCK_EXAMS.map((exam) => ({
      id: exam.id,
      title: exam.title,
      created_by: DEMO_TEACHER_ID,
      category_id: CATEGORY_NAME_TO_ID[exam.category] ?? CATEGORY_MATH,
      is_active: true,
      is_free: !exam.is_pro,
      quiz_type: "regular",
      created_at: exam.created_at,
      updated_at: exam.updated_at,
    }))
  );
}

if (process.argv[1]?.endsWith("seed-20-dashboard-exams.ts")) {
  seedDashboardExams().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
