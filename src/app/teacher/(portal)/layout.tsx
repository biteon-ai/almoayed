import { getSession, requireTeacher } from "@/lib/auth";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { APP_SLOGAN } from "@/lib/constants";
import { TeacherAppChrome } from "@/components/layout/TeacherAppChrome";
import { TeacherPortalShell } from "@/components/layout/TeacherPortalShell";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireTeacher();
  const session = await getSession();

  return (
    <TeacherPortalShell>
      {session.impersonation ? (
        <ImpersonationBanner teacherName={session.impersonation.teacherName} />
      ) : null}
      <TeacherAppChrome slogan={APP_SLOGAN}>{children}</TeacherAppChrome>
    </TeacherPortalShell>
  );
}
