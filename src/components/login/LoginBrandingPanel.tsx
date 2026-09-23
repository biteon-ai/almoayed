import {
  BookOpen,
  GraduationCap,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import {
  APP_DESCRIPTION,
  APP_FOOTER_COPYRIGHT,
  APP_NAME,
  APP_PLATFORM_BADGE,
  APP_SLOGAN,
} from "@/lib/constants";
import { AppVersion } from "@/components/brand/AppVersion";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

const VALUE_PROPS = [
  {
    icon: BookOpen,
    title: "اختبارات متوافقة مع كافة المناهج والمواد",
  },
  {
    icon: Zap,
    title: "تصحيح فوري وتقارير أداء دقيقة",
  },
  {
    icon: Users,
    title: "حسابات خاصة بالطلاب والمدرسين لجميع المراحل",
  },
] as const;

type LoginBrandingPanelProps = {
  compact?: boolean;
  className?: string;
};

export function LoginBrandingPanel({
  compact = false,
  className,
}: LoginBrandingPanelProps) {
  return (
    <aside
      className={cn(
        "relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 text-white",
        compact
          ? cn(
              // Mobile PWA: sticky brand bar — stays visible while the form scrolls
              "sticky top-0 z-40 shrink-0 px-4 py-3 sm:px-5 sm:py-3.5 lg:hidden",
              "border-b border-emerald-800/20 shadow-md shadow-emerald-950/20",
              "supports-[backdrop-filter]:bg-gradient-to-br supports-[backdrop-filter]:from-emerald-700/95 supports-[backdrop-filter]:via-emerald-600/95 supports-[backdrop-filter]:to-teal-700/95 supports-[backdrop-filter]:backdrop-blur-md"
            )
          : "hidden px-8 py-10 lg:flex lg:px-12 lg:py-14 xl:px-16",
        className
      )}
      {...spekit(SPEKIT.loginBrandHeader)}
    >
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />

      {compact ? (
        <div className="relative z-10 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-base font-black shadow-md backdrop-blur-sm">
              م
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black leading-tight tracking-tight">
                {APP_NAME}
              </p>
              <p className="text-[11px] font-medium leading-tight text-emerald-100/90">
                للاختبارات
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm sm:ms-auto">
              <Sparkles className="h-3 w-3 text-amber-300" aria-hidden />
              <span>{APP_PLATFORM_BADGE}</span>
            </div>
          </div>
          <p className="max-w-md truncate text-xs font-bold leading-snug text-white/95 sm:text-sm">
            {APP_SLOGAN}
          </p>
        </div>
      ) : (
        <>
          <div className="relative z-10 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-black shadow-lg backdrop-blur-sm">
                  م
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight">
                    {APP_NAME}
                  </p>
                  <p className="text-sm font-medium text-emerald-100/90">
                    للاختبارات
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>{APP_PLATFORM_BADGE}</span>
              </div>

              <p className="max-w-md text-lg font-bold leading-relaxed text-white/95 sm:text-xl">
                {APP_SLOGAN}
              </p>
              <p className="max-w-lg text-sm leading-relaxed text-emerald-50/85">
                {APP_DESCRIPTION}
              </p>
            </div>

            <ul className="space-y-4">
              {VALUE_PROPS.map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <item.icon className="h-5 w-5 text-emerald-50" />
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

          <div className="relative z-10 flex flex-col gap-1.5 text-xs font-medium text-emerald-100/75">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span>{APP_FOOTER_COPYRIGHT}</span>
            </div>
            <AppVersion className="ms-6 text-emerald-100/55 dark:text-emerald-100/55" />
          </div>
        </>
      )}
    </aside>
  );
}
