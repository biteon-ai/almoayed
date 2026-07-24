import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import {
  ADMIN_STUDENTS_PAGE_SIZE,
  clampPage,
  rangeFromPage,
  toPagedResult,
  type PageInput,
  type PagedResult,
} from "@/lib/pagination-server";
import type {
  AdminStudentDetail,
  AdminStudentRow,
  AdminStudentTeacherLink,
  EducationStage,
  StudentTeacherStatus,
  StudentTier,
} from "@/types/database";

const STUDENT_LIST_COLUMNS =
  "id, full_name, phone_number, whatsapp_number, created_at, role";

type StudentListProfile = {
  id: string;
  full_name: string;
  phone_number: string | null;
  whatsapp_number: string | null;
  created_at: string;
  role: string;
};

function applyStudentListFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters?: { q?: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  let next = query.eq("role", "STUDENT");
  const qNorm = filters?.q?.trim();
  if (qNorm) {
    const escaped = qNorm.replace(/[%_\\]/g, "\\$&");
    next = next.or(
      `full_name.ilike.%${escaped}%,phone_number.ilike.%${escaped}%,whatsapp_number.ilike.%${escaped}%`
    );
  }
  return next;
}

async function buildTeacherLinkCountMap(
  supabase: ReturnType<typeof createAdminClient>,
  studentIds: string[]
): Promise<Map<string, number>> {
  const countMap = new Map<string, number>();
  if (studentIds.length === 0) return countMap;

  const { data: links } = await supabase
    .from("student_teachers")
    .select("student_id")
    .in("student_id", studentIds);

  for (const row of links ?? []) {
    const sid = row.student_id as string;
    countMap.set(sid, (countMap.get(sid) ?? 0) + 1);
  }

  return countMap;
}

export async function listStudents(
  filters?: { q?: string },
  pageInput?: PageInput
): Promise<PagedResult<AdminStudentRow>> {
  const supabase = createAdminClient();
  const pageSize = pageInput?.pageSize ?? ADMIN_STUDENTS_PAGE_SIZE;
  const requestedPage = pageInput?.page ?? 1;

  const countQuery = applyStudentListFilters(
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    filters
  );
  const { count } = await countQuery;
  const total = count ?? 0;
  const page = clampPage(requestedPage, pageSize, total);
  const { from, to } = rangeFromPage(page, pageSize);

  const dataQuery = applyStudentListFilters(
    supabase.from("profiles").select(STUDENT_LIST_COLUMNS),
    filters
  )
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data: studentsRaw } = await dataQuery;
  const students = (studentsRaw ?? []) as StudentListProfile[];
  if (!students.length) {
    return toPagedResult([], total, page, pageSize);
  }

  const studentIds = students.map((s) => s.id);
  const linkCounts = await buildTeacherLinkCountMap(supabase, studentIds);

  const items: AdminStudentRow[] = students.map((s) => ({
    id: s.id,
    fullName: s.full_name,
    phoneNumber: s.phone_number,
    whatsappNumber: s.whatsapp_number,
    teacherLinkCount: linkCounts.get(s.id) ?? 0,
    createdAt: s.created_at,
  }));

  return toPagedResult(items, total, page, pageSize);
}

export async function getStudentById(
  studentId: string
): Promise<AdminStudentDetail | null> {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone_number, whatsapp_number, email, school_name, birth_date, education_stage, province, city, address, onboarding_completed, profile_completed, created_at, role"
    )
    .eq("id", studentId)
    .eq("role", "STUDENT")
    .maybeSingle();

  if (!profile) return null;

  const [{ data: links }, { count: submissionCount }] = await Promise.all([
    supabase
      .from("student_teachers")
      .select("id, teacher_id, status, tier, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("exam_submissions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId),
  ]);

  const teacherIds = Array.from(
    new Set((links ?? []).map((l) => l.teacher_id as string))
  );
  const teacherNameMap = new Map<string, string>();

  if (teacherIds.length > 0) {
    const { data: teachers } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", teacherIds);

    for (const t of teachers ?? []) {
      teacherNameMap.set(t.id as string, t.full_name as string);
    }
  }

  const teacherLinks: AdminStudentTeacherLink[] = (links ?? []).map((l) => ({
    linkId: l.id as string,
    teacherId: l.teacher_id as string,
    teacherName: teacherNameMap.get(l.teacher_id as string) ?? "—",
    status: l.status as StudentTeacherStatus,
    tier: l.tier as StudentTier,
    linkedAt: l.created_at as string,
  }));

  return {
    id: profile.id,
    fullName: profile.full_name,
    phoneNumber: profile.phone_number,
    whatsappNumber: profile.whatsapp_number,
    teacherLinkCount: teacherLinks.length,
    createdAt: profile.created_at,
    email: profile.email,
    schoolName: profile.school_name ?? "",
    birthDate: profile.birth_date,
    educationStage: profile.education_stage as EducationStage | null,
    province: profile.province,
    city: profile.city,
    address: profile.address ?? "",
    onboardingCompleted: Boolean(profile.onboarding_completed),
    profileCompleted: Boolean(profile.profile_completed),
    submissionCount: submissionCount ?? 0,
    teacherLinks,
  };
}

export async function hardDeleteStudent(
  adminId: string,
  studentId: string,
  input: { confirm: boolean }
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.confirm) {
    return { ok: false, error: "يجب تأكيد الحذف النهائي." };
  }

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", studentId)
    .maybeSingle();

  if (!profile) {
    return { ok: false, error: "الطالب غير موجود." };
  }

  if (profile.role !== "STUDENT") {
    return {
      ok: false,
      error: "يمكن حذف حسابات الطلاب فقط عبر هذه العملية.",
    };
  }

  const { count: linkCount } = await supabase
    .from("student_teachers")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId);

  const { error: deleteError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", studentId)
    .eq("role", "STUDENT");

  if (deleteError) {
    return {
      ok: false,
      error: "فشل حذف حساب الطالب. قد تكون هناك بيانات مرتبطة.",
    };
  }

  await writeAdminAuditLog({
    adminId,
    action: "student.hard_delete",
    targetId: studentId,
    metadata: {
      fullName: profile.full_name,
      teacherLinkCount: linkCount ?? 0,
    },
  });

  return { ok: true };
}
