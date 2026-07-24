import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import {
  generateSecurePassword,
  hashPassword,
  isValidEmail,
} from "@/lib/admin/passwords";
import {
  ADMIN_TEACHERS_PAGE_SIZE,
  clampPage,
  rangeFromPage,
  toPagedResult,
  type PageInput,
  type PagedResult,
} from "@/lib/pagination-server";
import type {
  AdminTeacherRow,
  Profile,
  SubjectCatalogItem,
  TeacherAccountStatus,
} from "@/types/database";

const TEACHER_LIST_COLUMNS =
  "id, full_name, email, phone_number, teacher_account_status, max_quiz_limit, created_at, role";

type TeacherListProfile = Pick<
  Profile,
  | "id"
  | "full_name"
  | "email"
  | "phone_number"
  | "max_quiz_limit"
  | "created_at"
  | "role"
> & {
  teacher_account_status: TeacherAccountStatus;
};

export async function listSubjectCatalog(): Promise<SubjectCatalogItem[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("subject_catalog")
    .select("id, name_ar, slug, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    nameAr: row.name_ar,
    slug: row.slug,
  }));
}

async function mapTeacherRow(
  profile: TeacherListProfile,
  quizCount: number,
  subjects: SubjectCatalogItem[]
): Promise<AdminTeacherRow> {
  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email ?? "",
    phoneNumber: profile.phone_number,
    status: profile.teacher_account_status,
    subjects,
    quizCount,
    maxQuizLimit: profile.max_quiz_limit,
    createdAt: profile.created_at,
  };
}

function applyTeacherListFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters?: { q?: string; status?: "active" | "inactive" | "all" }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  let next = query.eq("role", "TEACHER");
  if (filters?.status && filters.status !== "all") {
    next = next.eq("teacher_account_status", filters.status);
  }
  const qNorm = filters?.q?.trim();
  if (qNorm) {
    const escaped = qNorm.replace(/[%_\\]/g, "\\$&");
    next = next.or(`full_name.ilike.%${escaped}%,email.ilike.%${escaped}%`);
  }
  return next;
}

async function buildQuizCountMap(
  supabase: ReturnType<typeof createAdminClient>,
  teacherIds: string[]
): Promise<Map<string, number>> {
  const countMap = new Map<string, number>();

  const { data: rpcCounts, error: rpcError } = await supabase.rpc(
    "admin_quiz_counts_by_teacher"
  );

  if (!rpcError && rpcCounts) {
    for (const row of rpcCounts as { teacher_id: string; quiz_count: number }[]) {
      countMap.set(row.teacher_id, Number(row.quiz_count));
    }
    return countMap;
  }

  if (teacherIds.length === 0) return countMap;

  const { data: quizCounts } = await supabase
    .from("quizzes")
    .select("created_by")
    .in("created_by", teacherIds)
    .eq("is_archived", false);

  for (const q of quizCounts ?? []) {
    countMap.set(q.created_by, (countMap.get(q.created_by) ?? 0) + 1);
  }

  return countMap;
}

export async function listTeachers(
  filters?: { q?: string; status?: "active" | "inactive" | "all" },
  pageInput?: PageInput
): Promise<PagedResult<AdminTeacherRow>> {
  const supabase = createAdminClient();
  const pageSize = pageInput?.pageSize ?? ADMIN_TEACHERS_PAGE_SIZE;
  const requestedPage = pageInput?.page ?? 1;

  const countQuery = applyTeacherListFilters(
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    filters
  );
  const { count } = await countQuery;
  const total = count ?? 0;
  const page = clampPage(requestedPage, pageSize, total);
  const { from, to } = rangeFromPage(page, pageSize);

  const dataQuery = applyTeacherListFilters(
    supabase.from("profiles").select(TEACHER_LIST_COLUMNS),
    filters
  )
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data: teachersRaw } = await dataQuery;
  const teachers = (teachersRaw ?? []) as TeacherListProfile[];
  if (!teachers.length) {
    return toPagedResult([], total, page, pageSize);
  }

  const teacherIds = teachers.map((t: TeacherListProfile) => t.id);

  const [{ data: assignments }, { data: subjects }, countMap] = await Promise.all([
    supabase
      .from("teacher_subject_assignments")
      .select("teacher_id, subject_id")
      .in("teacher_id", teacherIds),
    supabase.from("subject_catalog").select("id, name_ar, slug"),
    buildQuizCountMap(supabase, teacherIds),
  ]);

  const subjectMap = new Map(
    (subjects ?? []).map((s) => [s.id, { id: s.id, nameAr: s.name_ar, slug: s.slug }])
  );

  const teacherSubjects = new Map<string, SubjectCatalogItem[]>();
  for (const a of assignments ?? []) {
    const sub = subjectMap.get(a.subject_id);
    if (!sub) continue;
    const list = teacherSubjects.get(a.teacher_id) ?? [];
    list.push(sub);
    teacherSubjects.set(a.teacher_id, list);
  }

  const items: AdminTeacherRow[] = [];
  for (const t of teachers as TeacherListProfile[]) {
    items.push(
      await mapTeacherRow(
        t,
        countMap.get(t.id) ?? 0,
        teacherSubjects.get(t.id) ?? []
      )
    );
  }

  return toPagedResult(items, total, page, pageSize);
}

async function syncTeacherSubjects(
  teacherId: string,
  subjectIds: string[]
): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("teacher_subject_assignments")
    .delete()
    .eq("teacher_id", teacherId);

  if (subjectIds.length === 0) return;

  await supabase.from("teacher_subject_assignments").insert(
    subjectIds.map((subjectId) => ({
      teacher_id: teacherId,
      subject_id: subjectId,
    }))
  );
}

export async function getTeacherById(
  teacherId: string
): Promise<AdminTeacherRow | null> {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", teacherId)
    .eq("role", "TEACHER")
    .maybeSingle<Profile>();

  if (!profile) return null;

  const [{ count: quizCount }, { data: assignments }, { data: catalogRows }] =
    await Promise.all([
      supabase
        .from("quizzes")
        .select("id", { count: "exact", head: true })
        .eq("created_by", teacherId)
        .eq("is_archived", false),
      supabase
        .from("teacher_subject_assignments")
        .select("subject_id")
        .eq("teacher_id", teacherId),
      supabase.from("subject_catalog").select("id, name_ar, slug"),
    ]);

  const subjectMap = new Map(
    (catalogRows ?? []).map((s) => [s.id, { id: s.id, nameAr: s.name_ar, slug: s.slug }])
  );

  const subjects: SubjectCatalogItem[] = (assignments ?? [])
    .map((row) => subjectMap.get(row.subject_id))
    .filter((s): s is SubjectCatalogItem => s !== undefined);

  return mapTeacherRow(
    profile as Profile & { teacher_account_status: TeacherAccountStatus },
    quizCount ?? 0,
    subjects
  );
}

export type CreateTeacherInput = {
  fullName: string;
  email: string;
  password?: string;
  generatePassword?: boolean;
  phoneNumber?: string | null;
  subjectIds: string[];
  status: TeacherAccountStatus;
  maxQuizLimit?: number | null;
};

export async function createTeacher(
  adminId: string,
  input: CreateTeacherInput
): Promise<
  | { ok: true; teacher: AdminTeacherRow; generatedPassword?: string }
  | { ok: false; error: string }
> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();

  if (!fullName) return { ok: false, error: "الاسم الكامل مطلوب." };
  if (!isValidEmail(email)) return { ok: false, error: "البريد الإلكتروني غير صالح." };

  let plainPassword = input.password?.trim();
  let generatedPassword: string | undefined;

  if (input.generatePassword || !plainPassword) {
    generatedPassword = generateSecurePassword(12);
    plainPassword = generatedPassword;
  }

  if (!plainPassword || plainPassword.length < 8) {
    return { ok: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." };
  }

  const supabase = createAdminClient();

  const { data: emailConflict } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (emailConflict) {
    return { ok: false, error: "البريد الإلكتروني مستخدم مسبقاً." };
  }

  const passwordHash = await hashPassword(plainPassword);

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      full_name: fullName,
      email,
      password_hash: passwordHash,
      phone_number: input.phoneNumber?.trim() || null,
      role: "TEACHER",
      auth_method: "email",
      teacher_account_status: input.status,
      max_quiz_limit: input.maxQuizLimit ?? null,
      whatsapp_number: null,
      is_subscribed: true,
    })
    .select("*")
    .single<Profile>();

  if (error || !created) {
    return { ok: false, error: "فشل إنشاء حساب المدرس." };
  }

  await syncTeacherSubjects(created.id, input.subjectIds);

  await writeAdminAuditLog({
    adminId,
    action: "teacher.create",
    targetId: created.id,
    metadata: { email },
  });

  const teacher = await getTeacherById(created.id);
  if (!teacher) return { ok: false, error: "فشل تحميل بيانات المدرس." };

  return { ok: true, teacher, generatedPassword };
}

export type UpdateTeacherInput = {
  fullName?: string;
  email?: string;
  phoneNumber?: string | null;
  subjectIds?: string[];
  status?: TeacherAccountStatus;
  maxQuizLimit?: number | null;
  newPassword?: string;
  generatePassword?: boolean;
};

export async function updateTeacher(
  adminId: string,
  teacherId: string,
  input: UpdateTeacherInput
): Promise<
  | { ok: true; teacher: AdminTeacherRow; generatedPassword?: string }
  | { ok: false; error: string }
> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", teacherId)
    .eq("role", "TEACHER")
    .maybeSingle<Profile>();

  if (!existing) return { ok: false, error: "المدرس غير موجود." };

  const patch: Record<string, unknown> = {};

  if (input.fullName !== undefined) {
    const name = input.fullName.trim();
    if (!name) return { ok: false, error: "الاسم الكامل مطلوب." };
    patch.full_name = name;
  }

  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    if (!isValidEmail(email)) return { ok: false, error: "البريد الإلكتروني غير صالح." };
    const { data: conflict } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .neq("id", teacherId)
      .maybeSingle();
    if (conflict) return { ok: false, error: "البريد الإلكتروني مستخدم مسبقاً." };
    patch.email = email;
  }

  if (input.phoneNumber !== undefined) {
    patch.phone_number = input.phoneNumber?.trim() || null;
  }

  if (input.status !== undefined) {
    patch.teacher_account_status = input.status;
  }

  if (input.maxQuizLimit !== undefined) {
    patch.max_quiz_limit = input.maxQuizLimit;
  }

  let generatedPassword: string | undefined;
  if (input.generatePassword) {
    generatedPassword = generateSecurePassword(12);
    patch.password_hash = await hashPassword(generatedPassword);
  } else if (input.newPassword?.trim()) {
    if (input.newPassword.trim().length < 8) {
      return { ok: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." };
    }
    patch.password_hash = await hashPassword(input.newPassword.trim());
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from("profiles").update(patch).eq("id", teacherId);
    if (error) return { ok: false, error: "فشل تحديث بيانات المدرس." };
  }

  if (input.subjectIds !== undefined) {
    await syncTeacherSubjects(teacherId, input.subjectIds);
  }

  await writeAdminAuditLog({
    adminId,
    action: "teacher.update",
    targetId: teacherId,
  });

  const teacher = await getTeacherById(teacherId);
  if (!teacher) return { ok: false, error: "فشل تحميل بيانات المدرس." };

  return { ok: true, teacher, generatedPassword };
}

export type DeleteTeacherInput = {
  confirm: boolean;
  disposition?: "reassign" | "archive";
  reassignToTeacherId?: string;
};

export async function deleteTeacher(
  adminId: string,
  teacherId: string,
  input: DeleteTeacherInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.confirm) {
    return { ok: false, error: "يجب تأكيد الحذف." };
  }

  const supabase = createAdminClient();

  const { data: teacher } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", teacherId)
    .eq("role", "TEACHER")
    .maybeSingle();

  if (!teacher) return { ok: false, error: "المدرس غير موجود." };

  const { count: quizCount } = await supabase
    .from("quizzes")
    .select("id", { count: "exact", head: true })
    .eq("created_by", teacherId);

  const hasQuizzes = (quizCount ?? 0) > 0;

  if (hasQuizzes) {
    if (!input.disposition) {
      return { ok: false, error: "يجب اختيار مصير الاختبارات." };
    }

    if (input.disposition === "reassign") {
      if (!input.reassignToTeacherId) {
        return { ok: false, error: "يجب اختيار مدرس لنقل الاختبارات." };
      }
      if (input.reassignToTeacherId === teacherId) {
        return { ok: false, error: "لا يمكن نقل الاختبارات لنفس المدرس." };
      }

      const { data: target } = await supabase
        .from("profiles")
        .select("id, teacher_account_status")
        .eq("id", input.reassignToTeacherId)
        .eq("role", "TEACHER")
        .eq("teacher_account_status", "active")
        .maybeSingle();

      if (!target) {
        return { ok: false, error: "المدرس المستهدف غير موجود أو غير نشط." };
      }

      const { error: reassignError } = await supabase
        .from("quizzes")
        .update({ created_by: input.reassignToTeacherId })
        .eq("created_by", teacherId);

      if (reassignError) {
        return { ok: false, error: "فشل نقل الاختبارات." };
      }
    } else {
      const { error: archiveError } = await supabase
        .from("quizzes")
        .update({ is_archived: true, is_active: false })
        .eq("created_by", teacherId);

      if (archiveError) {
        return { ok: false, error: "فشل أرشفة الاختبارات." };
      }
    }
  }

  const { error: deleteError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", teacherId);

  if (deleteError) {
    return { ok: false, error: "فشل حذف حساب المدرس. قد تكون هناك بيانات مرتبطة." };
  }

  await writeAdminAuditLog({
    adminId,
    action: "teacher.delete",
    targetId: teacherId,
    metadata: {
      disposition: input.disposition ?? null,
      reassignToTeacherId: input.reassignToTeacherId ?? null,
    },
  });

  return { ok: true };
}
