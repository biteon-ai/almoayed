import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LANDING_FEATURES } from "@/lib/landing-content";
import { cn } from "@/lib/utils";
import { BarChart3, BookOpen, Flame } from "lucide-react";

const ICONS = {
  "interactive-tests": BookOpen,
  analytics: BarChart3,
  streak: Flame,
} as const;

const FEATURE_STYLES = {
  "interactive-tests": {
    icon: "text-emerald-600 bg-emerald-500/15 dark:bg-emerald-500/20",
    hover: "hover:border-emerald-500/35",
  },
  analytics: {
    icon: "text-teal-600 bg-teal-500/15 dark:bg-teal-500/20",
    hover: "hover:border-teal-500/35",
  },
  streak: {
    icon: "text-amber-600 bg-amber-500/15 dark:bg-amber-500/20",
    hover: "hover:border-amber-500/35",
  },
} as const;

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-16">
      <div className="container mx-auto w-full max-w-7xl space-y-10">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <Badge className="rounded-full border-emerald-200/50 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-300">
            مميزات المنصة
          </Badge>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            لماذا المؤيد؟
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            كل ما يحتاجه الطالب والمدرس في منصة واحدة — من الاختبار إلى التحليل
            والمتابعة.
          </p>
        </div>

        <div className="grid w-full min-w-0 grid-cols-1 gap-6 md:grid-cols-3">
          {LANDING_FEATURES.map((feature) => {
            const Icon =
              ICONS[feature.id as keyof typeof ICONS] ?? BookOpen;
            const styles =
              FEATURE_STYLES[feature.id as keyof typeof FEATURE_STYLES] ??
              FEATURE_STYLES["interactive-tests"];

            return (
              <Card
                key={feature.id}
                className={cn(
                  "group min-w-0 overflow-visible rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300 sm:p-8",
                  "hover:-translate-y-1 hover:shadow-xl dark:border-border/50 dark:bg-card/90",
                  styles.hover
                )}
              >
                <div className="flex h-full min-w-0 flex-col gap-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
                      styles.icon
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <h3 className="text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-emerald-600">
                      {feature.title}
                    </h3>
                    <p className="break-words text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
