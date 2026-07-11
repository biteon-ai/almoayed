import Link from "next/link";
import { logout } from "@/actions/auth";
import { requireTeacher } from "@/lib/auth";
import { APP_SLOGAN } from "@/lib/constants";
import { Logo } from "@/components/brand/Logo";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT } from "@/lib/spekit-targets";

const navItems = [
  { href: "/teacher/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/teacher/students", label: "الطلاب", icon: Users },
  { href: "/teacher/quizzes", label: "الاختبارات", icon: BookOpen },
];

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireTeacher();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-50/40 to-background">
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-brand-700">لوحة الأستاذ</p>
              <p className="text-[10px] text-muted-foreground">{APP_SLOGAN}</p>
            </div>
          </div>
          <nav
            className="hidden items-center gap-1 md:flex"
            data-spekit={SPEKIT.teacherLayoutNav}
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="icon" aria-label="خروج">
              <LogOut className="size-5" />
            </Button>
          </form>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto border-t px-4 py-2 md:hidden"
          data-spekit={SPEKIT.teacherLayoutNavMobile}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 gap-1")}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
