import Link from "next/link";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { LANDING_AUDIENCE } from "@/lib/landing-content";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, GraduationCap, School } from "lucide-react";

const ROLE_ICONS = {
  student: GraduationCap,
  teacher: School,
} as const;

const ROLE_STYLES = {
  student: {
    card: "border-emerald-500/25 bg-gradient-to-br from-emerald-50/60 via-card to-background dark:from-emerald-950/25",
    icon: "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20",
    check: "text-emerald-600",
  },
  teacher: {
    card: "border-teal-500/25 bg-gradient-to-br from-teal-50/60 via-card to-background dark:from-teal-950/25",
    icon: "bg-teal-600 text-white shadow-lg shadow-teal-600/20",
    check: "text-teal-600",
  },
} as const;

export function LandingAudience() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-16">
      <div className="container mx-auto w-full max-w-7xl space-y-10">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            لمن صُممت المنصة؟
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            اختر مسارك وابدأ رحلتك التعليمية في دقائق.
          </p>
        </div>

        <div className="grid w-full min-w-0 grid-cols-1 gap-8 md:grid-cols-2">
          {LANDING_AUDIENCE.map((card) => {
            const Icon = ROLE_ICONS[card.role];
            const sectionId = card.role === "student" ? "students" : "teachers";
            const styles = ROLE_STYLES[card.role];

            return (
              <Card
                key={card.role}
                id={sectionId}
                className={cn(
                  "scroll-mt-24 min-w-0 overflow-visible rounded-3xl border-2 p-8 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                  styles.card
                )}
              >
                <div className="flex min-w-0 flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                        styles.icon
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-2xl font-black text-foreground">
                        {card.title}
                      </h3>
                    </div>
                  </div>

                  <ul className="space-y-3 text-sm text-foreground/85 sm:text-base">
                    {card.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2.5">
                        <Check
                          className={cn("mt-0.5 h-4 w-4 shrink-0", styles.check)}
                        />
                        <span className="break-words leading-relaxed">
                          {benefit}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={card.ctaHref}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "h-11 w-full gap-2 rounded-xl bg-emerald-600 font-bold text-white shadow-md hover:bg-emerald-700"
                    )}
                  >
                    <span>{card.ctaLabel}</span>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
