import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { APP_SLOGAN } from "@/lib/constants";
import { SPEKIT, spekitAttr } from "@/lib/spekit-targets";
import { Logo } from "@/components/brand/Logo";
import { LogoutActionButton } from "@/components/layout/LogoutActionButton";
import { LayoutDashboard, GraduationCap, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();

  return (
    <div
      className="min-h-dvh bg-gradient-to-b from-brand-50/40 to-background"
      data-spekit={spekitAttr(SPEKIT.adminLayout)}
    >
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur-md dark:bg-background/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div>
              <p className="text-xs font-bold text-brand-700">Super Admin</p>
              <p className="text-[10px] text-muted-foreground">{APP_SLOGAN}</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href="/admin/dashboard"
              data-spekit={spekitAttr(SPEKIT.adminNavDashboard)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold hover:bg-muted"
              )}
            >
              <LayoutDashboard className="size-4" />
              لوحة التحكم
            </Link>
            <Link
              href="/admin/teachers"
              data-spekit={spekitAttr(SPEKIT.adminNavTeachers)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold hover:bg-muted"
              )}
            >
              <Users className="size-4" />
              إدارة المدرسين
            </Link>
            <Link
              href="/admin/students"
              data-spekit={spekitAttr(SPEKIT.adminNavStudents)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold hover:bg-muted"
              )}
            >
              <GraduationCap className="size-4" />
              إدارة الطلاب
            </Link>
            <Link
              href="/admin/settings"
              data-spekit={spekitAttr(SPEKIT.adminNavSettings)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold hover:bg-muted"
              )}
            >
              <Settings className="size-4" />
              إعدادات المنصة
            </Link>
            <LogoutActionButton aria-label="خروج" />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
