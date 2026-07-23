import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { sessionOptions, type SessionData } from "@/lib/session";
import type { Profile } from "@/types/database";

export async function startTeacherImpersonation(
  adminSession: SessionData,
  teacherId: string
): Promise<{ ok: true; teacherName: string } | { ok: false; error: string }> {
  if (adminSession.impersonation) {
    return { ok: false, error: "أنت بالفعل في جلسة انتحال شخصية." };
  }

  const supabase = createAdminClient();
  const { data: teacher } = await supabase
    .from("profiles")
    .select("id, full_name, role, teacher_account_status")
    .eq("id", teacherId)
    .eq("role", "TEACHER")
    .maybeSingle<Pick<Profile, "id" | "full_name" | "role" | "teacher_account_status">>();

  if (!teacher) {
    return { ok: false, error: "المدرس غير موجود." };
  }

  if (teacher.teacher_account_status === "inactive") {
    return { ok: false, error: "لا يمكن انتحال شخصية حساب معطّل." };
  }

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  session.impersonation = {
    adminProfileId: adminSession.profileId,
    adminRole: "SUPER_ADMIN",
    teacherId: teacher.id,
    teacherName: teacher.full_name,
    startedAt: new Date().toISOString(),
  };
  session.profileId = teacher.id;
  session.fullName = teacher.full_name;
  session.role = "TEACHER";
  session.currentTeacherId = null;

  await session.save();

  await writeAdminAuditLog({
    adminId: adminSession.profileId,
    action: "impersonate.start",
    targetId: teacher.id,
    metadata: { teacherName: teacher.full_name },
  });

  return { ok: true, teacherName: teacher.full_name };
}

export async function exitTeacherImpersonation(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.impersonation) {
    return { ok: false, error: "لا توجد جلسة انتحال نشطة." };
  }

  const supabase = createAdminClient();
  const { data: admin } = await supabase
    .from("profiles")
    .select("id, full_name, whatsapp_number, last_session_id")
    .eq("id", session.impersonation.adminProfileId)
    .maybeSingle<Profile>();

  if (!admin) {
    return { ok: false, error: "تعذر استعادة جلسة الأدمن." };
  }

  await writeAdminAuditLog({
    adminId: session.impersonation.adminProfileId,
    action: "impersonate.end",
    targetId: session.impersonation.teacherId,
  });

  session.profileId = admin.id;
  session.fullName = admin.full_name;
  session.role = "SUPER_ADMIN";
  session.whatsappNumber = admin.whatsapp_number ?? "";
  session.sessionToken = admin.last_session_id ?? session.sessionToken;
  session.currentTeacherId = null;
  session.impersonation = undefined;

  await session.save();
  return { ok: true };
}

export async function getImpersonationFromSession(): Promise<
  SessionData["impersonation"] | undefined
> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session.impersonation;
}
