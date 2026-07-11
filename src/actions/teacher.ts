"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireTeacher } from "@/lib/auth";
import {
  importRowsToQuestionInserts,
  parseCsvQuestions,
  parseWordLikeText,
  parseXlsxQuestions,
} from "@/lib/import-questions";
import type {
  Category,
  ImportQuestionRow,
  Question,
  Quiz,
  StudentTeacherStatus,
  StudentTier,
  TeacherGroup,
  TeacherQuiz,
  TeacherStudentRow,
  Topic,
} from "@/types/database";

function teacherId(session: { profileId: string }) {
  return session.profileId;
}

export async function getTeacherProfile() {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, school_name, address, bank_details, teacher_code, whatsapp_number")
    .eq("id", session.profileId)
    .single();
  return data;
}

export async function getTeacherStats() {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const tid = teacherId(session);

  const [students, quizzes, pendingUpgrades] = await Promise.all([
    supabase
      .from("student_teachers")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", tid),
    supabase
      .from("quizzes")
      .select("id", { count: "exact", head: true })
      .eq("created_by", tid),
    supabase
      .from("student_teachers")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", tid)
      .eq("upgrade_requested", true),
  ]);

  return {
    studentCount: students.count ?? 0,
    quizCount: quizzes.count ?? 0,
    pendingUpgrades: pendingUpgrades.count ?? 0,
  };
}

export async function getTeacherStudents(filters?: {
  tier?: StudentTier | "all";
  status?: StudentTeacherStatus | "all";
}): Promise<TeacherStudentRow[]> {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const tid = teacherId(session);

  let query = supabase
    .from("student_teachers")
    .select(
      `
      id, student_id, status, tier, upgrade_requested,
      profiles:student_id (full_name, whatsapp_number)
    `
    )
    .eq("teacher_id", tid)
    .order("created_at", { ascending: false });

  if (filters?.tier && filters.tier !== "all") {
    query = query.eq("tier", filters.tier);
  }
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data: links } = await query;
  if (!links) return [];

  const { data: groups } = await supabase
    .from("teacher_groups")
    .select("id, group_name")
    .eq("teacher_id", tid);

  const groupIds = groups?.map((g) => g.id) ?? [];
  const groupNameById = new Map(groups?.map((g) => [g.id, g.group_name]) ?? []);

  let members: { student_id: string; group_id: string }[] = [];
  if (groupIds.length) {
    const { data: m } = await supabase
      .from("teacher_group_members")
      .select("student_id, group_id")
      .in("group_id", groupIds);
    members = m ?? [];
  }

  const groupMap = new Map<string, string[]>();
  for (const m of members) {
    const name = groupNameById.get(m.group_id) ?? "";
    const list = groupMap.get(m.student_id) ?? [];
    if (name) list.push(name);
    groupMap.set(m.student_id, list);
  }

  return links.map((l) => {
    const p = l.profiles as unknown as {
      full_name: string;
      whatsapp_number: string;
    };
    return {
      linkId: l.id as string,
      studentId: l.student_id as string,
      fullName: p.full_name,
      whatsappNumber: p.whatsapp_number,
      status: l.status as StudentTeacherStatus,
      tier: l.tier as StudentTier,
      upgradeRequested: l.upgrade_requested as boolean,
      groupNames: groupMap.get(l.student_id as string) ?? [],
    };
  });
}

export async function updateStudentStatus(
  linkId: string,
  status: StudentTeacherStatus
) {
  const session = await requireTeacher();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("student_teachers")
    .update({ status })
    .eq("id", linkId)
    .eq("teacher_id", session.profileId);

  if (error) throw new Error("فشل تحديث حالة الطالب.");

  if (status === "active") {
    const { data: link } = await supabase
      .from("student_teachers")
      .select("student_id")
      .eq("id", linkId)
      .single();
    if (link) {
      await supabase
        .from("profiles")
        .update({ is_subscribed: true })
        .eq("id", link.student_id);
    }
  }

  revalidatePath("/teacher/students");
}

export async function updateStudentTier(linkId: string, tier: StudentTier) {
  const session = await requireTeacher();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("student_teachers")
    .update({ tier, upgrade_requested: false })
    .eq("id", linkId)
    .eq("teacher_id", session.profileId);

  if (error) throw new Error("فشل تحديث مستوى الطالب.");
  revalidatePath("/teacher/students");
}

export async function approveProUpgrade(linkId: string) {
  await updateStudentTier(linkId, "pro");
}

export async function getTeacherGroups(): Promise<TeacherGroup[]> {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("teacher_groups")
    .select("*")
    .eq("teacher_id", session.profileId)
    .order("created_at", { ascending: false });
  return (data as TeacherGroup[]) ?? [];
}

export async function createTeacherGroup(groupName: string) {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const { error } = await supabase.from("teacher_groups").insert({
    teacher_id: session.profileId,
    group_name: groupName,
  });
  if (error) throw new Error("فشل إنشاء المجموعة.");
  revalidatePath("/teacher/students");
}

export async function assignStudentToGroup(groupId: string, studentId: string) {
  const session = await requireTeacher();
  const supabase = createAdminClient();

  const { data: group } = await supabase
    .from("teacher_groups")
    .select("id")
    .eq("id", groupId)
    .eq("teacher_id", session.profileId)
    .single();

  if (!group) throw new Error("المجموعة غير موجودة.");

  const { error } = await supabase.from("teacher_group_members").upsert(
    { group_id: groupId, student_id: studentId },
    { onConflict: "group_id,student_id" }
  );
  if (error) throw new Error("فشل إضافة الطالب للمجموعة.");
  revalidatePath("/teacher/students");
}

export async function getTeacherCategories(): Promise<Category[]> {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .or(`teacher_id.eq.${session.profileId},is_global.eq.true`)
    .order("sort_order");
  return (data as Category[]) ?? [];
}

export async function createCategory(name: string) {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const { error } = await supabase.from("categories").insert({
    teacher_id: session.profileId,
    name,
    is_global: false,
  });
  if (error) throw new Error("فشل إنشاء القسم.");
  revalidatePath("/teacher/quizzes");
}

export async function getTopicsByCategory(categoryId: string): Promise<Topic[]> {
  await requireTeacher();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("topics")
    .select("*")
    .eq("category_id", categoryId)
    .order("sort_order");
  return (data as Topic[]) ?? [];
}

export async function createTopic(categoryId: string, name: string) {
  await requireTeacher();
  const supabase = createAdminClient();
  const { error } = await supabase.from("topics").insert({
    category_id: categoryId,
    name,
  });
  if (error) throw new Error("فشل إنشاء الموضوع.");
  revalidatePath("/teacher/quizzes");
}

export async function getTeacherQuizzes(): Promise<TeacherQuiz[]> {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("quizzes")
    .select("*, questions(count)")
    .eq("created_by", session.profileId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    const { questions, ...quiz } = row as Quiz & {
      questions: { count: number }[];
    };
    return {
      ...(quiz as Quiz),
      question_count: questions?.[0]?.count ?? 0,
    };
  });
}

export async function createQuiz(formData: FormData) {
  const session = await requireTeacher();
  const supabase = createAdminClient();

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("عنوان الاختبار مطلوب.");

  const { data, error } = await supabase
    .from("quizzes")
    .insert({
      title,
      created_by: session.profileId,
      category_id: (formData.get("category_id") as string) || null,
      topic_id: (formData.get("topic_id") as string) || null,
      is_active: false,
      is_free: formData.get("is_free") !== "off",
      quiz_type: (formData.get("quiz_type") as string) || "regular",
      target_group_id: (formData.get("target_group_id") as string) || null,
    })
    .select()
    .single();

  if (error || !data) throw new Error("فشل إنشاء الاختبار.");
  revalidatePath("/teacher/quizzes");
  return data.id as string;
}

export async function updateQuizFlags(
  quizId: string,
  flags: { is_active?: boolean; is_free?: boolean; quiz_type?: string }
) {
  const session = await requireTeacher();
  const supabase = createAdminClient();

  if (flags.is_active === true) {
    const { count, error: countError } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("quiz_id", quizId);

    if (countError) throw new Error("فشل التحقق من الأسئلة.");
    if (!count) {
      throw new Error("أضف سؤالاً واحداً على الأقل قبل التفعيل.");
    }
  }

  const { error } = await supabase
    .from("quizzes")
    .update(flags)
    .eq("id", quizId)
    .eq("created_by", session.profileId);
  if (error) throw new Error("فشل تحديث الاختبار.");
  revalidatePath("/teacher/quizzes");
}

export async function getQuizQuestions(quizId: string): Promise<Question[]> {
  const session = await requireTeacher();
  const supabase = createAdminClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("id", quizId)
    .eq("created_by", session.profileId)
    .single();

  if (!quiz) return [];

  const { data } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("sort_order");
  return (data as Question[]) ?? [];
}

export async function addQuestion(quizId: string, formData: FormData) {
  const session = await requireTeacher();
  const supabase = createAdminClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("id", quizId)
    .eq("created_by", session.profileId)
    .single();

  if (!quiz) throw new Error("الاختبار غير موجود.");

  const options = [
    formData.get("option_a"),
    formData.get("option_b"),
    formData.get("option_c"),
    formData.get("option_d"),
  ]
    .map((o) => (o as string)?.trim())
    .filter(Boolean);

  const { error } = await supabase.from("questions").insert({
    quiz_id: quizId,
    question_text: (formData.get("question_text") as string)?.trim(),
    options,
    correct_answer: (formData.get("correct_answer") as string)?.trim(),
    explanation_text: (formData.get("explanation_text") as string)?.trim() ?? "",
    category_tag: (formData.get("category_tag") as string)?.trim() || "عام",
    sort_order: Number(formData.get("sort_order") ?? 0) || 1,
  });

  if (error) throw new Error("فشل إضافة السؤال.");
  revalidatePath(`/teacher/quizzes/${quizId}`);
}

export async function updateQuestion(
  quizId: string,
  questionId: string,
  formData: FormData
) {
  const session = await requireTeacher();
  await assertQuizOwnedByTeacher(quizId, session.profileId);

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("questions")
    .select("id")
    .eq("id", questionId)
    .eq("quiz_id", quizId)
    .single();

  if (!existing) throw new Error("السؤال غير موجود.");

  const options = [
    formData.get("option_a"),
    formData.get("option_b"),
    formData.get("option_c"),
    formData.get("option_d"),
  ]
    .map((o) => (o as string)?.trim())
    .filter(Boolean);

  if (options.length < 2) {
    throw new Error("أضف خيارين على الأقل.");
  }

  const question_text = (formData.get("question_text") as string)?.trim();
  if (!question_text) throw new Error("نص السؤال مطلوب.");

  const { error } = await supabase
    .from("questions")
    .update({
      question_text,
      options,
      correct_answer: (formData.get("correct_answer") as string)?.trim(),
      explanation_text:
        (formData.get("explanation_text") as string)?.trim() ?? "",
      category_tag:
        (formData.get("category_tag") as string)?.trim() || "عام",
    })
    .eq("id", questionId)
    .eq("quiz_id", quizId);

  if (error) throw new Error("فشل تحديث السؤال.");
  revalidatePath(`/teacher/quizzes/${quizId}`);
}

async function assertQuizOwnedByTeacher(quizId: string, profileId: string) {
  const supabase = createAdminClient();
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("id", quizId)
    .eq("created_by", profileId)
    .single();

  if (!quiz) throw new Error("الاختبار غير موجود.");
}

export async function importQuestionRows(
  quizId: string,
  rows: ImportQuestionRow[]
) {
  const session = await requireTeacher();
  await assertQuizOwnedByTeacher(quizId, session.profileId);

  const validRows = rows.filter(
    (row) =>
      row.question_text?.trim() &&
      [row.option_a, row.option_b, row.option_c, row.option_d].filter((o) =>
        o?.trim()
      ).length >= 2
  );

  if (!validRows.length) {
    throw new Error("ما في أسئلة صالحة للحفظ.");
  }

  const supabase = createAdminClient();
  const inserts = importRowsToQuestionInserts(validRows).map((q) => ({
    ...q,
    quiz_id: quizId,
  }));

  const { error } = await supabase.from("questions").insert(inserts);
  if (error) throw new Error("فشل استيراد الأسئلة.");
  revalidatePath(`/teacher/quizzes/${quizId}`);
  return { imported: inserts.length };
}

export async function importQuestions(quizId: string, formData: FormData) {
  const session = await requireTeacher();
  await assertQuizOwnedByTeacher(quizId, session.profileId);

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("اختار ملف للاستيراد.");

  const buffer = await file.arrayBuffer();
  const text = await file.text();
  const ext = file.name.split(".").pop()?.toLowerCase();

  let rows;
  if (ext === "csv") {
    rows = parseCsvQuestions(text);
  } else if (ext === "xlsx" || ext === "xls") {
    rows = await parseXlsxQuestions(buffer);
  } else if (ext === "docx") {
    throw new Error(
      "ملفات Word تُعرَض للمعاينة في المتصفح. ارفع .docx من جديد وانتظر شاشة المراجعة."
    );
  } else if (ext === "doc" || ext === "txt") {
    rows = parseWordLikeText(text);
  } else {
    throw new Error("صيغة غير مدعومة. استخدم CSV أو XLSX أو TXT أو DOCX.");
  }

  const supabase = createAdminClient();
  const inserts = importRowsToQuestionInserts(rows).map((q) => ({
    ...q,
    quiz_id: quizId,
  }));

  if (!inserts.length) throw new Error("ما لقينا أسئلة صالحة بالملف.");

  const { error } = await supabase.from("questions").insert(inserts);
  if (error) throw new Error("فشل استيراد الأسئلة.");
  revalidatePath(`/teacher/quizzes/${quizId}`);
  return { imported: inserts.length };
}

export async function deleteQuestion(quizId: string, questionId: string) {
  const session = await requireTeacher();
  const supabase = createAdminClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("id", quizId)
    .eq("created_by", session.profileId)
    .single();

  if (!quiz) throw new Error("غير مصرح.");

  await supabase.from("questions").delete().eq("id", questionId).eq("quiz_id", quizId);
  revalidatePath(`/teacher/quizzes/${quizId}`);
}
