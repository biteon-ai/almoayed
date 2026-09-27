import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TeacherLoginForm } from "./teacher-login-form";
import { TeacherLoginPageShell } from "./teacher-login-page-shell";

export const dynamic = "force-dynamic";

export default async function TeacherLoginPage() {
  const session = await getSession();
  if (session.isLoggedIn) {
    redirect(
      session.role === "TEACHER"
        ? "/teacher/dashboard"
        : session.role === "SUPER_ADMIN"
          ? "/admin/dashboard"
          : "/dashboard"
    );
  }

  return (
    <TeacherLoginPageShell>
      <TeacherLoginForm />
    </TeacherLoginPageShell>
  );
}
