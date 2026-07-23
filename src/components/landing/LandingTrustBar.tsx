import { LANDING_TRUST_METRICS } from "@/lib/landing-content";
import { BookOpen, Star, Users, Zap } from "lucide-react";

const ICONS = {
  students: Users,
  tests: BookOpen,
  satisfaction: Star,
  grading: Zap,
} as const;

export function LandingTrustBar() {
  return (
    <section className="border-y border-emerald-500/10 bg-emerald-500/[0.03] px-4 py-8 sm:px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {LANDING_TRUST_METRICS.map((metric) => {
            const Icon = ICONS[metric.id as keyof typeof ICONS] ?? Users;
            return (
              <div
                key={metric.id}
                className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-500/10 bg-card/60 p-4 text-center shadow-xs"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-black text-foreground">{metric.value}</p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {metric.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
