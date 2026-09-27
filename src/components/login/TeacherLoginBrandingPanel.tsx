import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  Sparkles,
  Users,
} from "lucide-react";
import {
  APP_FOOTER_COPYRIGHT,
  APP_SLOGAN,
  TEACHER_APP_NAME,
  TEACHER_APP_SHORT_NAME,
} from "@/lib/constants";
import { AppVersion } from "@/components/brand/AppVersion";
import {
  LoginBrandHomeLink,
  LoginLandingBackLink,
} from "@/components/login/LoginLandingNav";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

const VALUE_PROPS = [
  {
    icon: ClipboardList,
    title: "إنشاء وإدارة الاختبارات لطلابك بسهولة",
  },
  {
    icon: Users,
    title: "متابعة أداء المجموعات والطلاب في مكان واحد",
  },
  {
    icon: BookOpen,
    title: "تقارير وتحليلات تساعد على تحسين النتائج",
  },
] as const;

type TeacherLoginBrandingPanelProps = {
  compact?: boolean;
  className?: string;
};

export function TeacherLoginBrandingPanel({
  compact = false,
  className,
}: TeacherLoginBrandingPanelProps) {
  return (
    <aside
      className={cn(
        "relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-800 via-indigo-600 to-slate-800 text-white",
        compact
          ? cn(
              "sticky top-0 z-40 shrink-0 px-4 py-3 sm:px-5 sm:py-3.5 lg:hidden",
              "border-b border-indigo-950/30 shadow-md shadow-indigo-950/25",
              "supports-[backdrop-filter]:bg-gradient-to-br supports-[backdrop-filter]:from-indigo-800/95 supports-[backdrop-filter]:via-indigo-600/95 supports-[backdrop-filter]:to-slate-800/95 supports-[backdrop-filter]:backdrop-blur-md"
            )
          : "hidden px-8 py-10 lg:flex lg:px-12 lg:py-14 xl:px-16",
        className
      )}
      {...spekit(SPEKIT.teacherLoginBrandHeader)}
    >
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />

      {compact ? (
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <LoginBrandHomeLink
              className="flex min-w-0 items-center gap-x-2.5"
              ringOffsetClassName="focus-visible:ring-offset-indigo-800"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-base font-black shadow-md backdrop-blur-sm">
                م
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-black leading-tight tracking-tight">
                  {TEACHER_APP_SHORT_NAME}
                </p>
                <p className="text-[11px] font-medium leading-tight text-indigo-100/90">
                  بوابة المدرسين
                </p>
              </div>
            </LoginBrandHomeLink>
            <LoginLandingBackLink
              spekitId={SPEKIT.teacherLoginLandingBack}
              ringOffsetClassName="focus-visible:ring-offset-indigo-800"
            />
          </div>
          <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm">
            <Sparkles className="h-3 w-3 shrink-0 text-amber-300" aria-hidden />
            <span className="truncate">{TEACHER_APP_NAME}</span>
          </div>
          <p className="max-w-md truncate text-xs font-bold leading-snug text-white/95 sm:text-sm">
            {APP_SLOGAN}
          </p>
        </div>
      ) : (
        <>
          <div className="relative z-10 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <LoginBrandHomeLink
                  className="flex min-w-0 items-center gap-3"
                  ringOffsetClassName="focus-visible:ring-offset-indigo-800"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-black shadow-lg backdrop-blur-sm">
                    م
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-black tracking-tight">
                      {TEACHER_APP_NAME}
                    </p>
                    <p className="text-sm font-medium text-indigo-100/90">
                      بوابة المدرسين
                    </p>
                  </div>
                </LoginBrandHomeLink>
                <LoginLandingBackLink
                  spekitId={SPEKIT.teacherLoginLandingBack}
                  ringOffsetClassName="focus-visible:ring-offset-indigo-800"
                />
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>إدارة الصف والاختبارات</span>
              </div>

              <p className="max-w-md text-lg font-bold leading-relaxed text-white/95 sm:text-xl">
                {APP_SLOGAN}
              </p>
              <p className="max-w-lg text-sm leading-relaxed text-indigo-50/85">
                سجّل دخولك لإدارة طلابك واختباراتك ومتابعة النتائج من هاتفك كتطبيق
                مستقل.
              </p>
            </div>

            <ul className="space-y-4">
              {VALUE_PROPS.map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <item.icon className="h-5 w-5 text-indigo-50" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold leading-relaxed text-white">
                      {item.title}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 flex flex-col gap-1.5 text-xs font-medium text-indigo-100/75">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span>{APP_FOOTER_COPYRIGHT}</span>
            </div>
            <AppVersion className="ms-6 text-indigo-100/55 dark:text-indigo-100/55" />
          </div>
        </>
      )}
    </aside>
  );
}
