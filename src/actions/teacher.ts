"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireTeacher } from "@/lib/auth";
import {
  decodeImportTextBuffer,
  importRowsToQuestionInserts,
  parseCsvQuestions,
  parseWordLikeText,
  parseXlsxQuestions,
} from "@/lib/import-questions";
import type {
  ActionResult,
  Category,
  EducationStage,
  ImportQuestionRow,
  Question,
  Quiz,
  ReferralSource,
  StudentTeacherStatus,
  StudentTier,
  TeacherDashboardAnalytics,
  TeacherGroup,
  TeacherQuiz,
  TeacherStudentDetail,
  TeacherStudentRow,
  Topic,
} from "@/types/database";
import {
  isValidWhatsAppE164,
  sanitizeWhatsAppForDb,
} from "@/lib/constants";
import {
  isTeacherDashboardKpiPayload,
  mapTeacherDashboardKpiPayload,
  mapTeacherDashboardRpcPayload,
} from "@/lib/teacher-analytics";
import type { TeacherDashboardRpcPayload } from "@/lib/teacher-analytics";
import { computeTeacherStudentAnalytics } from "@/lib/student-analytics";
import {
  CATEGORY_LIST_SELECT,
  QUIZ_LIST_SELECT,
  TEACHER_GROUP_LIST_SELECT,
  TOPIC_LIST_SELECT,
} from "@/lib/perf-selects";
import {
  clampPage,
  rangeFromPage,
  toPagedResult,
  type PageInput,
  type PagedResult,
} from "@/lib/pagination-server";
import { QUIZ_PAGE_SIZE, STUDENT_PAGE_SIZE } from "@/lib/paginate-students";

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

export async function getTeacherDashboardAnalytics(): Promise<TeacherDashboardAnalytics> {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const tid = teacherId(session);

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_teacher_dashboard_kpis",
    { p_teacher_id: tid }
  );

  if (!rpcError && rpcData && isTeacherDashboardKpiPayload(rpcData)) {
    return mapTeacherDashboardKpiPayload(rpcData);
  }

  // Legacy analytics name if KPIs not yet migrated
  if (rpcError) {
    const legacy = await supabase.rpc("get_teacher_dashboard_analytics", {
      p_teacher_id: tid,
    });
    if (!legacy.error && legacy.data) {
      if (isTeacherDashboardKpiPayload(legacy.data)) {
        return mapTeacherDashboardKpiPayload(legacy.data);
      }
      if (
        legacy.data &&
        typeof legacy.data === "object" &&
        Array.isArray((legacy.data as TeacherDashboardRpcPayload).studentLinks)
      ) {
        return mapTeacherDashboardRpcPayload(
          legacy.data as TeacherDashboardRpcPayload
        );
      }
    }
    console.error("[PERF-004] get_teacher_dashboard_kpis RPC", rpcError);
  }

  // Lean multi-query aggregate fallback (no full catalog dump into KPI mapper)
  try {
    return await leanTeacherDashboardKpiFallback(supabase, tid);
  } catch (err) {
    console.error("[PERF-004] lean dashboard fallback failed", err);
    throw new Error("تعذر تحميل ملخص لوحة التحكم. حاول مرة أخرى.");
  }
}

async function leanTeacherDashboardKpiFallback(
  supabase: ReturnType<typeof createAdminClient>,
  tid: string
): Promise<TeacherDashboardAnalytics> {
  const [studentsRes, quizzesRes, pendingRes] = await Promise.all([
    supabase
      .from("student_teachers")
      .select("student_id")
      .eq("teacher_id", tid)
      .eq("status", "active"),
    supabase
      .from("quizzes")
      .select("id, title, is_active")
      .eq("created_by", tid)
      .eq("is_archived", false)
      .is("deleted_at", null),
    supabase
      .from("student_teachers")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", tid)
      .eq("upgrade_requested", true),
  ]);

  const studentIds = (studentsRes.data ?? []).map((r) => r.student_id as string);
  const quizzes = quizzesRes.data ?? [];
  const activeQuizIds = quizzes
    .filter((q) => q.is_active)
    .map((q) => q.id as string);

  let submissions: Array<{
    student_id: string;
    quiz_id: string;
    score: number;
    submitted_at: string;
  }> = [];

  if (studentIds.length && activeQuizIds.length) {
    const { data } = await supabase
      .from("exam_submissions")
      .select("student_id, quiz_id, score, submitted_at")
      .in("student_id", studentIds)
      .in("quiz_id", activeQuizIds);
    submissions = data ?? [];
  }

  // Aggregate in Node without shipping row arrays to the UI mapper contract
  const titleById = new Map(
    quizzes.map((q) => [q.id as string, q.title as string])
  );
  const attemptsByQuiz = new Map<string, number>();
  for (const s of submissions) {
    attemptsByQuiz.set(s.quiz_id, (attemptsByQuiz.get(s.quiz_id) ?? 0) + 1);
  }
  const popularExams = Array.from(attemptsByQuiz.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([quizId, attempts], i) => ({
      rank: i + 1,
      title: titleById.get(quizId) ?? "",
      attempts,
      completionRate:
        studentIds.length > 0
          ? Math.round((attempts / studentIds.length) * 100)
          : 0,
    }));

  const submissionCount = submissions.length;
  const averageScore =
    submissionCount > 0
      ? Math.round(
          submissions.reduce((sum, s) => sum + s.score, 0) / submissionCount
        )
      : 0;
  const passRate =
    submissionCount > 0
      ? Math.round(
          (submissions.filter((s) => s.score >= 60).length / submissionCount) *
            100
        )
      : 0;

  return mapTeacherDashboardKpiPayload({
    studentCount: studentIds.length,
    quizCount: quizzes.length,
    pendingUpgrades: pendingRes.count ?? 0,
    submissionCount,
    averageScore,
    passRate,
    perfectScoreStudentCount: new Set(
      submissions.filter((s) => s.score === 100).map((s) => s.student_id)
    ).size,
    completionRate:
      studentIds.length * activeQuizIds.length > 0
        ? Math.round(
            (submissionCount / (studentIds.length * activeQuizIds.length)) *
              1000
          ) / 10
        : 0,
    gradeDistribution: [],
    weeklyActivity: [],
    popularExams,
    topPerformer: null,
    examDifficulty: { hardest: null, easiest: null },
  });
}

export async function getTeacherStudents(
  filters?: {
    tier?: StudentTier | "all";
    status?: StudentTeacherStatus | "all";
  },
  pageInput?: PageInput
): Promise<PagedResult<TeacherStudentRow>> {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const tid = teacherId(session);
  const pageSize = pageInput?.pageSize ?? STUDENT_PAGE_SIZE;
  const requestedPage = pageInput?.page ?? 1;

  let countQuery = supabase
    .from("student_teachers")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", tid);

  if (filters?.tier && filters.tier !== "all") {
    countQuery = countQuery.eq("tier", filters.tier);
  }
  if (filters?.status && filters.status !== "all") {
    countQuery = countQuery.eq("status", filters.status);
  }

  const { count } = await countQuery;
  const total = count ?? 0;
  const page = clampPage(requestedPage, pageSize, total);
  const { from, to } = rangeFromPage(page, pageSize);

  let query = supabase
    .from("student_teachers")
    .select(
      `
      id, student_id, status, tier, upgrade_requested, created_at,
      profiles:student_id (full_name, whatsapp_number)
    `
    )
    .eq("teacher_id", tid)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters?.tier && filters.tier !== "all") {
    query = query.eq("tier", filters.tier);
  }
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data: links } = await query;
  if (!links?.length) {
    return toPagedResult([], total, page, pageSize);
  }

  const { data: groups } = await supabase
    .from("teacher_groups")
    .select("id, group_name")
    .eq("teacher_id", tid);

  const groupIds = groups?.map((g) => g.id) ?? [];
  const groupNameById = new Map(groups?.map((g) => [g.id, g.group_name]) ?? []);

  let members: { student_id: string; group_id: string }[] = [];
  if (groupIds.length) {
    const pageStudentIds = links.map((l) => l.student_id as string);
    const { data: m } = await supabase
      .from("teacher_group_members")
      .select("student_id, group_id")
      .in("group_id", groupIds)
      .in("student_id", pageStudentIds);
    members = m ?? [];
  }

  const groupMap = new Map<string, string[]>();
  const groupIdMap = new Map<string, string>();
  for (const m of members) {
    const name = groupNameById.get(m.group_id) ?? "";
    const list = groupMap.get(m.student_id) ?? [];
    if (name) list.push(name);
    groupMap.set(m.student_id, list);
    if (!groupIdMap.has(m.student_id)) {
      groupIdMap.set(m.student_id, m.group_id);
    }
  }

  const items = links.map((l) => {
    const p = l.profiles as unknown as {
      full_name: string;
      whatsapp_number: string;
    };
    const sid = l.student_id as string;
    return {
      linkId: l.id as string,
      studentId: sid,
      fullName: p.full_name,
      whatsappNumber: p.whatsapp_number,
      status: l.status as StudentTeacherStatus,
      tier: l.tier as StudentTier,
      upgradeRequested: l.upgrade_requested as boolean,
      groupNames: groupMap.get(sid) ?? [],
      groupId: groupIdMap.get(sid) ?? null,
      createdAt: (l.created_at as string) ?? "",
    };
  });

  return toPagedResult(items, total, page, pageSize);
}

export async function getTeacherStudentDetail(
  studentId: string
): Promise<TeacherStudentDetail | null> {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const tid = teacherId(session);

  const { data: link } = await supabase
    .from("student_teachers")
    .select(
      `
      id, student_id, status, tier, upgrade_requested, created_at,
      profiles:student_id (
        full_name, whatsapp_number,
        birth_date, education_stage, province, city, address, email,
        referral_source, primary_subject
      )
    `
    )
    .eq("teacher_id", tid)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!link) return null;

  const profile = link.profiles as unknown as {
    full_name: string;
    whatsapp_number: string;
    birth_date: string | null;
    education_stage: string | null;
    province: string | null;
    city: string | null;
    address: string | null;
    email: string | null;
    referral_source: string | null;
    primary_subject: string | null;
  };

  const [{ data: groups }, { data: quizzes }] = await Promise.all([
    supabase
      .from("teacher_groups")
      .select("id, group_name")
      .eq("teacher_id", tid),
    supabase
      .from("quizzes")
      .select(QUIZ_LIST_SELECT)
      .eq("created_by", tid)
      .is("deleted_at", null),
  ]);

  const groupIds = (groups ?? []).map((group) => group.id as string);
  const groupNameById = new Map(
    (groups ?? []).map((group) => [group.id as string, group.group_name as string])
  );

  const studentGroupIds: string[] = [];
  let studentGroupId: string | null = null;
  const groupNames: string[] = [];

  if (groupIds.length) {
    const { data: members } = await supabase
      .from("teacher_group_members")
      .select("group_id")
      .eq("student_id", studentId)
      .in("group_id", groupIds);

    for (const member of members ?? []) {
      const gid = member.group_id as string;
      studentGroupIds.push(gid);
      const name = groupNameById.get(gid);
      if (name) groupNames.push(name);
      if (!studentGroupId) studentGroupId = gid;
    }
  }

  const quizList = (quizzes as Quiz[]) ?? [];
  const quizIds = quizList.map((quiz) => quiz.id);

  let submissions: Array<{
    quiz_id: string;
    score: number;
    submitted_at: string;
  }> = [];

  if (quizIds.length) {
    const { data } = await supabase
      .from("exam_submissions")
      .select("quiz_id, score, submitted_at")
      .eq("student_id", studentId)
      .in("quiz_id", quizIds)
      .order("submitted_at", { ascending: false });
    submissions = data ?? [];
  }

  let answerStats: Array<{ is_correct: boolean; category_tag: string }> = [];
  if (quizIds.length) {
    const { data: answers } = await supabase
      .from("student_answers")
      .select(
        `
        is_correct,
        questions (category_tag),
        exam_submissions!inner (student_id, quiz_id)
      `
      )
      .eq("exam_submissions.student_id", studentId)
      .in("exam_submissions.quiz_id", quizIds);

    answerStats = (answers ?? []).map((row) => ({
      is_correct: row.is_correct as boolean,
      category_tag:
        (row.questions as unknown as { category_tag: string })?.category_tag ??
        "عام",
    }));
  }

  const student: TeacherStudentRow = {
    linkId: link.id as string,
    studentId,
    fullName: profile.full_name,
    whatsappNumber: profile.whatsapp_number,
    status: link.status as StudentTeacherStatus,
    tier: link.tier as StudentTier,
    upgradeRequested: link.upgrade_requested as boolean,
    groupNames,
    groupId: studentGroupId,
    createdAt: (link.created_at as string) ?? "",
  };

  const analytics = computeTeacherStudentAnalytics({
    tier: student.tier,
    groupIds: studentGroupIds,
    quizzes: quizList,
    submissions,
    answerStats,
  });

  const demographics: NonNullable<TeacherStudentDetail["demographics"]> = {
    birthDate: profile.birth_date,
    educationStage: (profile.education_stage as EducationStage | null) ?? null,
    province: profile.province,
    city: profile.city,
    address: profile.address ?? "",
    email: profile.email,
    referralSource: (profile.referral_source as ReferralSource | null) ?? null,
    primarySubject: profile.primary_subject,
  };

  return {
    student,
    analytics,
    demographics,
  };
}

export async function updateStudentStatus(
  linkId: string,
  status: StudentTeacherStatus
) {
  if (status === "pending") {
    throw new Error("لا يمكن تعيين حالة معلق يدوياً.");
  }

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

export async function toggleStudentStatus(
  linkId: string,
  status: "active" | "deactivated"
): Promise<ActionResult> {
  try {
    await updateStudentStatus(linkId, status);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "فشل تحديث الحالة.",
    };
  }
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
    .select(TEACHER_GROUP_LIST_SELECT)
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

export type QuizGroupAssignmentModalData = {
  quizId: string;
  quizTitle: string;
  groups: TeacherGroup[];
  assignedGroupIds: string[];
};

export async function getQuizGroupAssignmentModalData(
  quizId: string
): Promise<QuizGroupAssignmentModalData | null> {
  const session = await requireTeacher();
  const supabase = createAdminClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, created_by")
    .eq("id", quizId)
    .eq("created_by", session.profileId)
    .maybeSingle();

  if (!quiz) return null;

  const [{ data: groups }, { data: assignments }] = await Promise.all([
    supabase
      .from("teacher_groups")
      .select(TEACHER_GROUP_LIST_SELECT)
      .eq("teacher_id", session.profileId)
      .order("group_name", { ascending: true }),
    supabase
      .from("quiz_groups")
      .select("group_id")
      .eq("quiz_id", quizId),
  ]);

  return {
    quizId: quiz.id as string,
    quizTitle: quiz.title as string,
    groups: (groups as TeacherGroup[]) ?? [],
    assignedGroupIds: (assignments ?? []).map((row) => row.group_id as string),
  };
}

export async function updateQuizGroupAssignments(
  quizId: string,
  groupIds: string[]
): Promise<ActionResult> {
  const session = await requireTeacher();
  const supabase = createAdminClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, created_by")
    .eq("id", quizId)
    .eq("created_by", session.profileId)
    .maybeSingle();

  if (!quiz) {
    return { ok: false, error: "الاختبار غير موجود أو ليس ضمن حسابك." };
  }

  const uniqueGroupIds = Array.from(new Set(groupIds.filter(Boolean)));

  const { data: teacherGroups } = await supabase
    .from("teacher_groups")
    .select("id")
    .eq("teacher_id", session.profileId);

  const ownedGroupIds = new Set(
    (teacherGroups ?? []).map((row) => row.id as string)
  );

  for (const groupId of uniqueGroupIds) {
    if (!ownedGroupIds.has(groupId)) {
      return { ok: false, error: "إحدى المجموعات المحددة غير موجودة." };
    }
  }

  const { error: deleteError } = await supabase
    .from("quiz_groups")
    .delete()
    .eq("quiz_id", quizId);

  if (deleteError) {
    return { ok: false, error: "فشل تحديث تعيين المجموعات." };
  }

  if (uniqueGroupIds.length > 0) {
    const { error: insertError } = await supabase.from("quiz_groups").insert(
      uniqueGroupIds.map((groupId) => ({
        quiz_id: quizId,
        group_id: groupId,
      }))
    );

    if (insertError) {
      return { ok: false, error: "فشل حفظ تعيين المجموعات." };
    }
  }

  const { error: quizUpdateError } = await supabase
    .from("quizzes")
    .update({
      quiz_type: uniqueGroupIds.length > 0 ? "session_group" : "regular",
      target_group_id: uniqueGroupIds[0] ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quizId)
    .eq("created_by", session.profileId);

  if (quizUpdateError) {
    return { ok: false, error: "فشل تحديث نوع الاختبار." };
  }

  revalidatePath("/teacher/quizzes");
  revalidatePath(`/teacher/quizzes/${quizId}`);
  revalidatePath("/quizzes");
  return { ok: true };
}

export async function assignStudentToGroup(groupId: string, studentId: string) {
  const result = await setStudentGroup({ studentId, groupId });
  if (!result.ok) throw new Error(result.error);
}

export async function setStudentGroup(input: {
  studentId: string;
  groupId: string | null;
}): Promise<ActionResult> {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const tid = session.profileId;

  const { data: teacherGroups } = await supabase
    .from("teacher_groups")
    .select("id")
    .eq("teacher_id", tid);

  const ownedIds = (teacherGroups ?? []).map((g) => g.id as string);

  if (ownedIds.length) {
    await supabase
      .from("teacher_group_members")
      .delete()
      .eq("student_id", input.studentId)
      .in("group_id", ownedIds);
  }

  if (input.groupId) {
    if (!ownedIds.includes(input.groupId)) {
      return { ok: false, error: "المجموعة غير موجودة." };
    }
    const { error } = await supabase.from("teacher_group_members").insert({
      group_id: input.groupId,
      student_id: input.studentId,
    });
    if (error) {
      return { ok: false, error: "فشل إضافة الطالب للمجموعة." };
    }
  }

  revalidatePath("/teacher/students");
  return { ok: true };
}

export async function createStudentManually(input: {
  fullName: string;
  whatsappNumber: string;
  groupId?: string | null;
  tier?: StudentTier;
}): Promise<ActionResult> {
  try {
    const session = await requireTeacher();
    const supabase = createAdminClient();
    const tid = session.profileId;

    const fullName = input.fullName.trim();
    const whatsapp = sanitizeWhatsAppForDb(input.whatsappNumber);
    const tier: StudentTier = input.tier === "pro" ? "pro" : "free";
    const groupId = input.groupId?.trim() || null;

    if (!fullName) {
      return {
        ok: false,
        error: "يرجى إدخال اسم الطالب.",
        field: "fullName",
      };
    }
    if (!isValidWhatsAppE164(whatsapp)) {
      return {
        ok: false,
        error: "يرجى إدخال رقم واتساب صحيح",
        field: "whatsapp",
      };
    }

    if (groupId) {
      const { data: ownedGroup } = await supabase
        .from("teacher_groups")
        .select("id")
        .eq("id", groupId)
        .eq("teacher_id", tid)
        .maybeSingle();
      if (!ownedGroup) {
        return {
          ok: false,
          error: "المجموعة الدراسية غير موجودة.",
          field: "group",
        };
      }
    }

    const { data: existingProfile, error: lookupErr } = await supabase
      .from("profiles")
      .select("id, role, full_name")
      .eq("whatsapp_number", whatsapp)
      .maybeSingle();

    if (lookupErr) {
      console.error("Error looking up student profile:", lookupErr);
      return {
        ok: false,
        error:
          lookupErr.message ||
          "فشل البحث عن ملف الطالب (خطأ في الخادم)",
      };
    }

    let studentId = existingProfile?.id as string | undefined;

    if (existingProfile) {
      if (existingProfile.role !== "STUDENT") {
        return {
          ok: false,
          error: "هذا الرقم مسجّل بحساب غير طالب.",
          field: "whatsapp",
        };
      }
    } else {
      const { data: created, error: createErr } = await supabase
        .from("profiles")
        .insert({
          whatsapp_number: whatsapp,
          full_name: fullName,
          role: "STUDENT",
        })
        .select("id")
        .single();
      if (createErr || !created) {
        console.error("Error creating student:", createErr);
        return mapStudentCreateError(
          createErr,
          "فشل إنشاء ملف الطالب (خطأ في الخادم)"
        );
      }
      studentId = created.id as string;
    }

    const { data: existingLink, error: linkLookupErr } = await supabase
      .from("student_teachers")
      .select("id")
      .eq("student_id", studentId!)
      .eq("teacher_id", tid)
      .maybeSingle();

    if (linkLookupErr) {
      console.error("Error looking up student link:", linkLookupErr);
      return {
        ok: false,
        error:
          linkLookupErr.message ||
          "فشل التحقق من ربط الطالب (خطأ في الخادم)",
      };
    }

    if (existingLink) {
      return {
        ok: false,
        error: "رقم الواتساب موجود مسبقاً في قائمتك.",
        field: "whatsapp",
      };
    }

    const { error: linkErr } = await supabase.from("student_teachers").insert({
      student_id: studentId!,
      teacher_id: tid,
      status: "active",
      tier,
      upgrade_requested: false,
    });

    if (linkErr) {
      console.error("Error linking student:", linkErr);
      return mapStudentCreateError(
        linkErr,
        "فشل ربط الطالب بقائمتك (خطأ في الخادم)"
      );
    }

    if (existingProfile && fullName !== existingProfile.full_name) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", studentId!);
    }

    if (groupId) {
      const { error: memberErr } = await supabase
        .from("teacher_group_members")
        .insert({
          group_id: groupId,
          student_id: studentId!,
        });
      if (memberErr) {
        console.error("Error assigning student group:", memberErr);
        return {
          ok: false,
          error:
            memberErr.message ||
            "تمت إضافة الطالب لكن فشل تعيين المجموعة.",
          field: "group",
        };
      }
    }

    revalidatePath("/teacher/students");
    return { ok: true };
  } catch (error: unknown) {
    console.error("Error creating student:", error);
    const err = error as { code?: string; message?: string };
    if (
      err?.code === "P2002" ||
      err?.code === "23505" ||
      err?.message?.toLowerCase().includes("unique constraint") ||
      err?.message?.toLowerCase().includes("duplicate key")
    ) {
      return {
        ok: false,
        error: "رقم الواتساب هذا مسجل بالفعل لطالب آخر",
        field: "whatsapp",
      };
    }
    return {
      ok: false,
      error:
        (error instanceof Error ? error.message : undefined) ||
        "فشل إنشاء ملف الطالب (خطأ في الخادم)",
    };
  }
}

/** Map Supabase/Postgres insert errors to Arabic ActionResult messages. */
function mapStudentCreateError(
  err: { code?: string; message?: string; details?: string; hint?: string } | null,
  fallback: string
): ActionResult {
  if (!err) return { ok: false, error: fallback };

  const code = err.code ?? "";
  const message = (err.message ?? "").toLowerCase();

  if (
    code === "23505" ||
    code === "P2002" ||
    message.includes("unique constraint") ||
    message.includes("duplicate key")
  ) {
    return {
      ok: false,
      error: "رقم الواتساب هذا مسجل بالفعل لطالب آخر",
      field: "whatsapp",
    };
  }

  // Prefer server message so teachers/devs see the real cause (enum, check, RLS…)
  const detail = [err.message, err.details, err.hint]
    .filter(Boolean)
    .join(" — ");

  return {
    ok: false,
    error: detail || fallback,
  };
}

export async function updateStudentInfo(input: {
  linkId: string;
  fullName: string;
  whatsappNumber: string;
  groupId: string | null;
}): Promise<ActionResult> {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const tid = session.profileId;
  const fullName = input.fullName.trim();
  const whatsapp = sanitizeWhatsAppForDb(input.whatsappNumber);

  if (!fullName) {
    return {
      ok: false,
      error: "يرجى إدخال اسم الطالب.",
      field: "fullName",
    };
  }
  if (!whatsapp) {
    return {
      ok: false,
      error: "يرجى إدخال رقم واتساب صحيح",
      field: "whatsapp",
    };
  }
  if (!isValidWhatsAppE164(whatsapp)) {
    return {
      ok: false,
      error: "يرجى إدخال رقم واتساب صحيح",
      field: "whatsapp",
    };
  }

  const { data: link } = await supabase
    .from("student_teachers")
    .select("id, student_id")
    .eq("id", input.linkId)
    .eq("teacher_id", tid)
    .maybeSingle();

  if (!link) {
    return { ok: false, error: "الطالب غير موجود في قائمتك." };
  }

  const studentId = link.student_id as string;

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("id, whatsapp_number")
    .eq("id", studentId)
    .maybeSingle();

  if (!currentProfile) {
    return { ok: false, error: "ملف الطالب غير موجود." };
  }

  if (currentProfile.whatsapp_number !== whatsapp) {
    const { data: conflict } = await supabase
      .from("profiles")
      .select("id")
      .eq("whatsapp_number", whatsapp)
      .neq("id", studentId)
      .maybeSingle();

    if (conflict) {
      return {
        ok: false,
        error: "رقم الواتساب هذا مستخدم بالفعل لطالب آخر",
        field: "whatsapp",
      };
    }
  }

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      whatsapp_number: whatsapp,
    })
    .eq("id", studentId);

  if (profileErr) {
    if (profileErr.code === "23505") {
      return {
        ok: false,
        error: "رقم الواتساب هذا مستخدم بالفعل لطالب آخر",
        field: "whatsapp",
      };
    }
    return { ok: false, error: "فشل تحديث بيانات الطالب." };
  }

  const groupResult = await setStudentGroup({
    studentId,
    groupId: input.groupId,
  });
  if (!groupResult.ok) return groupResult;

  revalidatePath("/teacher/students");
  return { ok: true };
}

export async function deleteStudentLink(linkId: string): Promise<ActionResult> {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const tid = session.profileId;

  const { data: link } = await supabase
    .from("student_teachers")
    .select("id, student_id")
    .eq("id", linkId)
    .eq("teacher_id", tid)
    .maybeSingle();

  if (!link) {
    return { ok: false, error: "الطالب غير موجود في قائمتك." };
  }

  const { data: teacherGroups } = await supabase
    .from("teacher_groups")
    .select("id")
    .eq("teacher_id", tid);
  const ownedIds = (teacherGroups ?? []).map((g) => g.id as string);

  if (ownedIds.length) {
    await supabase
      .from("teacher_group_members")
      .delete()
      .eq("student_id", link.student_id)
      .in("group_id", ownedIds);
  }

  const { error } = await supabase
    .from("student_teachers")
    .delete()
    .eq("id", linkId)
    .eq("teacher_id", tid);

  if (error) {
    return { ok: false, error: "فشل إزالة الطالب من قائمتك." };
  }

  revalidatePath("/teacher/students");
  return { ok: true };
}

export async function getTeacherCategories(): Promise<Category[]> {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select(CATEGORY_LIST_SELECT)
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
    .select(TOPIC_LIST_SELECT)
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

export type QuizListView = "active" | "trash";

export async function getTeacherQuizzes(
  pageInput?: PageInput,
  opts?: { view?: QuizListView }
): Promise<PagedResult<TeacherQuiz>> {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const pageSize = pageInput?.pageSize ?? QUIZ_PAGE_SIZE;
  const requestedPage = pageInput?.page ?? 1;
  const view: QuizListView = opts?.view === "trash" ? "trash" : "active";

  let countQuery = supabase
    .from("quizzes")
    .select("id", { count: "exact", head: true })
    .eq("created_by", session.profileId);

  countQuery =
    view === "trash"
      ? countQuery.not("deleted_at", "is", null)
      : countQuery.is("deleted_at", null);

  const { count } = await countQuery;

  const total = count ?? 0;
  const page = clampPage(requestedPage, pageSize, total);
  const { from, to } = rangeFromPage(page, pageSize);

  let dataQuery = supabase
    .from("quizzes")
    .select(`${QUIZ_LIST_SELECT}, questions(count)`)
    .eq("created_by", session.profileId);

  dataQuery =
    view === "trash"
      ? dataQuery
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false })
      : dataQuery
          .is("deleted_at", null)
          .order("updated_at", { ascending: false })
          .order("created_at", { ascending: false });

  const { data } = await dataQuery.range(from, to);

  const baseItems = (data ?? []).map((row) => {
    const { questions, ...quiz } = row as Quiz & {
      questions: { count: number }[];
    };
    return {
      ...(quiz as Quiz),
      question_count: questions?.[0]?.count ?? 0,
    };
  });

  const quizIds = baseItems.map((quiz) => quiz.id);
  const assignmentsByQuiz = new Map<
    string,
    Array<{ id: string; name: string }>
  >();

  if (quizIds.length > 0) {
    const { data: assignmentRows } = await supabase
      .from("quiz_groups")
      .select("quiz_id, group_id, teacher_groups(group_name)")
      .in("quiz_id", quizIds);

    for (const row of assignmentRows ?? []) {
      const quizId = row.quiz_id as string;
      const groupId = row.group_id as string;
      const groupName =
        (row.teacher_groups as { group_name?: string } | null)?.group_name ??
        "مجموعة";
      const list = assignmentsByQuiz.get(quizId) ?? [];
      list.push({ id: groupId, name: groupName });
      assignmentsByQuiz.set(quizId, list);
    }
  }

  const items: TeacherQuiz[] = baseItems.map((quiz) => ({
    ...quiz,
    assigned_groups: assignmentsByQuiz.get(quiz.id) ?? [],
  }));

  return toPagedResult(items, total, page, pageSize);
}

export async function getTeacherQuizById(
  quizId: string
): Promise<TeacherQuiz | null> {
  const session = await requireTeacher();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("quizzes")
    .select(`${QUIZ_LIST_SELECT}, questions(count)`)
    .eq("created_by", session.profileId)
    .eq("id", quizId)
    .maybeSingle();

  if (!data) return null;
  const { questions, ...quiz } = data as Quiz & {
    questions: { count: number }[];
  };

  const { data: assignmentRows } = await supabase
    .from("quiz_groups")
    .select("group_id, teacher_groups(group_name)")
    .eq("quiz_id", quizId);

  const assigned_groups = (assignmentRows ?? []).map((row) => ({
    id: row.group_id as string,
    name:
      (row.teacher_groups as { group_name?: string } | null)?.group_name ??
      "مجموعة",
  }));

  return {
    ...(quiz as Quiz),
    question_count: questions?.[0]?.count ?? 0,
    assigned_groups,
  };
}

export type QuizTrashActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function softDeleteQuiz(
  quizId: string
): Promise<QuizTrashActionResult> {
  const session = await requireTeacher();
  const supabase = createAdminClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, deleted_at")
    .eq("id", quizId)
    .eq("created_by", session.profileId)
    .maybeSingle();

  if (!quiz) {
    return { ok: false, error: "الاختبار غير موجود أو ليس ضمن حسابك." };
  }
  if (quiz.deleted_at) {
    return { ok: false, error: "هذا الاختبار موجود مسبقاً في سلة المهملات." };
  }

  const { error } = await supabase
    .from("quizzes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", quizId)
    .eq("created_by", session.profileId)
    .is("deleted_at", null);

  if (error) {
    return { ok: false, error: "فشل نقل الاختبار إلى سلة المهملات." };
  }

  revalidatePath("/teacher/quizzes");
  revalidatePath(`/teacher/quizzes/${quizId}`);
  return { ok: true };
}

export async function restoreQuiz(
  quizId: string
): Promise<QuizTrashActionResult> {
  const session = await requireTeacher();
  const supabase = createAdminClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, deleted_at")
    .eq("id", quizId)
    .eq("created_by", session.profileId)
    .maybeSingle();

  if (!quiz) {
    return { ok: false, error: "الاختبار غير موجود أو ليس ضمن حسابك." };
  }
  if (!quiz.deleted_at) {
    return { ok: false, error: "هذا الاختبار ليس في سلة المهملات." };
  }

  const { error } = await supabase
    .from("quizzes")
    .update({ deleted_at: null })
    .eq("id", quizId)
    .eq("created_by", session.profileId)
    .not("deleted_at", "is", null);

  if (error) {
    return { ok: false, error: "فشل استعادة الاختبار." };
  }

  revalidatePath("/teacher/quizzes");
  revalidatePath(`/teacher/quizzes/${quizId}`);
  return { ok: true };
}

export async function permanentlyDeleteQuiz(
  quizId: string
): Promise<QuizTrashActionResult> {
  const session = await requireTeacher();
  const supabase = createAdminClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, deleted_at")
    .eq("id", quizId)
    .eq("created_by", session.profileId)
    .maybeSingle();

  if (!quiz) {
    return { ok: false, error: "الاختبار غير موجود أو ليس ضمن حسابك." };
  }
  if (!quiz.deleted_at) {
    return {
      ok: false,
      error: "يجب نقل الاختبار إلى سلة المهملات قبل الحذف النهائي.",
    };
  }

  const { error } = await supabase
    .from("quizzes")
    .delete()
    .eq("id", quizId)
    .eq("created_by", session.profileId)
    .not("deleted_at", "is", null);

  if (error) {
    return { ok: false, error: "فشل الحذف النهائي للاختبار." };
  }

  revalidatePath("/teacher/quizzes");
  revalidatePath(`/teacher/quizzes/${quizId}`);
  return { ok: true };
}

export async function createQuiz(formData: FormData) {
  const session = await requireTeacher();
  const supabase = createAdminClient();

  const { data: teacherProfile } = await supabase
    .from("profiles")
    .select("max_quiz_limit")
    .eq("id", session.profileId)
    .maybeSingle();

  if (teacherProfile?.max_quiz_limit != null) {
    const { count } = await supabase
      .from("quizzes")
      .select("id", { count: "exact", head: true })
      .eq("created_by", session.profileId)
      .eq("is_archived", false);

    if ((count ?? 0) >= teacherProfile.max_quiz_limit) {
      throw new Error(
        `وصلت إلى حد الاختبارات (${teacherProfile.max_quiz_limit}). تواصل مع الإدارة لرفع الحد.`
      );
    }
  }

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("عنوان الاختبار مطلوب.");

  const { parseTimerFormFields } = await import("@/lib/quiz-timer");
  const { parseAttemptFormFields } = await import("@/lib/quiz-attempts");
  const timerFields = parseTimerFormFields(formData);
  const attemptFields = parseAttemptFormFields(formData);

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
      is_timed: timerFields.is_timed,
      duration_minutes: timerFields.duration_minutes,
      assessment_category: attemptFields.assessment_category,
      max_attempts: attemptFields.max_attempts,
    })
    .select()
    .single();

  if (error || !data) throw new Error("فشل إنشاء الاختبار.");
  revalidatePath("/teacher/quizzes");
  return data.id as string;
}

export async function updateQuizFlags(
  quizId: string,
  flags: {
    is_active?: boolean;
    is_free?: boolean;
    quiz_type?: string;
    is_timed?: boolean;
    duration_minutes?: number | null;
    assessment_category?: string;
    max_attempts?: number;
  }
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

  if (flags.is_timed !== undefined || flags.duration_minutes !== undefined) {
    const { validateDurationMinutes } = await import("@/lib/quiz-timer");
    const isTimed = flags.is_timed ?? false;
    if (!isTimed) {
      flags.is_timed = false;
      flags.duration_minutes = null;
    } else {
      const validated = validateDurationMinutes(flags.duration_minutes);
      if (!validated.ok) throw new Error(validated.error);
      flags.duration_minutes = validated.value;
      flags.is_timed = true;
    }
  }

  if (
    flags.assessment_category !== undefined ||
    flags.max_attempts !== undefined
  ) {
    const { parseAssessmentCategory, validateMaxAttempts } = await import(
      "@/lib/quiz-attempts"
    );
    if (flags.assessment_category !== undefined) {
      const category = parseAssessmentCategory(flags.assessment_category);
      if (!category) throw new Error("نوع الاختبار غير صالح.");
      flags.assessment_category = category;
    }
    if (flags.max_attempts !== undefined) {
      const validated = validateMaxAttempts({
        unlimited: flags.max_attempts === 0,
        value: flags.max_attempts,
      });
      if (!validated.ok) throw new Error(validated.error);
      flags.max_attempts = validated.value;
    }
  }

  const { error } = await supabase
    .from("quizzes")
    .update(flags)
    .eq("id", quizId)
    .eq("created_by", session.profileId);
  if (error) throw new Error("فشل تحديث الاختبار.");
  revalidatePath("/teacher/quizzes");
  revalidatePath(`/teacher/quizzes/${quizId}`);
}

export async function updateQuizTimerSettings(
  quizId: string,
  input: { isTimed: boolean; durationMinutes: number | null }
): Promise<ActionResult> {
  try {
    await updateQuizFlags(quizId, {
      is_timed: input.isTimed,
      duration_minutes: input.isTimed ? input.durationMinutes : null,
    });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "فشل تحديث إعدادات التوقيت.",
    };
  }
}

export async function updateQuizAttemptSettings(
  quizId: string,
  input: {
    assessmentCategory: import("@/types/database").AssessmentCategory;
    maxAttempts: number;
  }
): Promise<ActionResult> {
  try {
    await updateQuizFlags(quizId, {
      assessment_category: input.assessmentCategory,
      max_attempts: input.maxAttempts,
    });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "فشل تحديث إعدادات المحاولات.",
    };
  }
}

/** Toggle quiz active/hidden with ActionResult for UI confirmation flows. */
export async function toggleQuizStatus(
  quizId: string,
  nextActive: boolean
): Promise<ActionResult> {
  try {
    await updateQuizFlags(quizId, { is_active: nextActive });
    return { ok: true };
  } catch (cause) {
    return {
      ok: false,
      error:
        cause instanceof Error
          ? cause.message
          : "فشل تحديث حالة الاختبار.",
    };
  }
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

  if (options.length < 2) {
    throw new Error("أضف خيارين على الأقل.");
  }

  const question_text = (formData.get("question_text") as string)?.trim();
  if (!question_text) throw new Error("نص السؤال مطلوب.");

  const { data: maxRow } = await supabase
    .from("questions")
    .select("sort_order")
    .eq("quiz_id", quizId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order =
    Number(formData.get("sort_order")) ||
    ((maxRow?.sort_order as number | undefined) ?? 0) + 1;

  const { error } = await supabase.from("questions").insert({
    quiz_id: quizId,
    question_text,
    options,
    correct_answer: (formData.get("correct_answer") as string)?.trim(),
    explanation_text: (formData.get("explanation_text") as string)?.trim() ?? "",
    category_tag: (formData.get("category_tag") as string)?.trim() || "عام",
    sort_order,
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

/**
 * NOTE: Bulk Import Strategy — Append-Only
 * Duplicate detection is explicitly out of scope.
 * Every imported item is treated as a new entry with a fresh unique ID.
 *
 * Default mode is `append`: all valid rows insert as new questions.
 * `replace` clears existing quiz questions first — still no per-row dedup.
 */
export async function importQuestionRows(
  quizId: string,
  rows: ImportQuestionRow[],
  options?: { mode?: "append" | "replace" }
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
  const mode = options?.mode === "replace" ? "replace" : "append";

  if (mode === "replace") {
    const { error: clearErr } = await supabase
      .from("questions")
      .delete()
      .eq("quiz_id", quizId);
    if (clearErr) throw new Error("فشل مسح الأسئلة الحالية قبل الاستبدال.");
  }

  const inserts = importRowsToQuestionInserts(validRows).map((q) => ({
    ...q,
    quiz_id: quizId,
  }));

  const { error } = await supabase.from("questions").insert(inserts);
  if (error) throw new Error("فشل استيراد الأسئلة.");
  revalidatePath(`/teacher/quizzes/${quizId}`);
  return { imported: inserts.length };
}

/** File-upload entry point for bulk question import — delegates to `importQuestionRows`. */
export async function importQuestions(quizId: string, formData: FormData) {
  const session = await requireTeacher();
  await assertQuizOwnedByTeacher(quizId, session.profileId);

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("اختار ملف للاستيراد.");

  const buffer = await file.arrayBuffer();
  const ext = file.name.split(".").pop()?.toLowerCase();
  const text =
    ext === "txt" || ext === "doc"
      ? decodeImportTextBuffer(buffer)
      : await file.text();
  const importMode =
    formData.get("import_mode") === "replace" ? "replace" : "append";
  const defaultCategory =
    ((formData.get("default_category") as string) || "").trim() || "عام";

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

  const normalized = rows.map((row) => ({
    ...row,
    category_tag:
      !row.category_tag || row.category_tag === "عام"
        ? defaultCategory
        : row.category_tag,
  }));

  return importQuestionRows(quizId, normalized, { mode: importMode });
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

export async function duplicateQuestion(quizId: string, questionId: string) {
  const session = await requireTeacher();
  await assertQuizOwnedByTeacher(quizId, session.profileId);
  const supabase = createAdminClient();

  const { data: source } = await supabase
    .from("questions")
    .select("*")
    .eq("id", questionId)
    .eq("quiz_id", quizId)
    .single();

  if (!source) throw new Error("السؤال غير موجود.");

  const { data: maxRow } = await supabase
    .from("questions")
    .select("sort_order")
    .eq("quiz_id", quizId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = ((maxRow?.sort_order as number | undefined) ?? 0) + 1;

  const { error } = await supabase.from("questions").insert({
    quiz_id: quizId,
    question_text: source.question_text,
    question_image_url: source.question_image_url,
    options: source.options,
    correct_answer: source.correct_answer,
    explanation_text: source.explanation_text,
    explanation_media_url: source.explanation_media_url,
    category_tag: source.category_tag,
    sort_order,
  });

  if (error) throw new Error("فشل تكرار السؤال.");
  revalidatePath(`/teacher/quizzes/${quizId}`);
}
