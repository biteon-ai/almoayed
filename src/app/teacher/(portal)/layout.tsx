import { logout } from "@/actions/auth";
import { getSession, requireTeacher } from "@/lib/auth";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { APP_SLOGAN } from "@/lib/constants";
import { Logo } from "@/components/brand/Logo";
import { NavbarProgress } from "@/components/layout/NavbarProgress";
import { TeacherHeaderNav } from "@/components/layout/TeacherHeaderNav";
import { TeacherPortalShell } from "@/components/layout/TeacherPortalShell";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

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
      <div className="min-h-dvh bg-gradient-to-b from-brand-50/40 to-background">
        <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur-md">
          <NavbarProgress />
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-brand-700">لوحة الأستاذ</p>
                <p className="text-[10px] text-muted-foreground">{APP_SLOGAN}</p>
              </div>
            </div>
            <TeacherHeaderNav variant="desktop" />
            <form action={logout}>
              <Button type="submit" variant="ghost" size="icon" aria-label="خروج">
                <LogOut className="size-5" />
              </Button>
            </form>
          </div>
          <TeacherHeaderNav variant="mobile" />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </TeacherPortalShell>
  );
}
