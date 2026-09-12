import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { DashboardPreviewMockup } from "@/components/landing/DashboardPreviewMockup";
import { LANDING_HERO } from "@/lib/landing-content";
import { cn } from "@/lib/utils";
import { ArrowLeft, Sparkles } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="container relative z-10 mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-6 text-center lg:text-start">
          <Badge className="gap-1.5 rounded-full border-emerald-200/60 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>{LANDING_HERO.badge}</span>
          </Badge>

          <h1 className="text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {LANDING_HERO.title}
          </h1>

          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base lg:mx-0">
            {LANDING_HERO.subtitle}
          </p>

          <div className="flex scroll-mt-20 flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href={LANDING_HERO.primaryCta.href}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 w-full gap-2 rounded-xl bg-emerald-600 px-6 font-bold text-white shadow-md hover:bg-emerald-700 sm:w-auto"
              )}
            >
              <span>{LANDING_HERO.primaryCta.label}</span>
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link
              href={LANDING_HERO.secondaryCta.href}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 w-full gap-2 rounded-xl border-emerald-200 px-6 font-bold text-emerald-700 hover:bg-emerald-50 sm:w-auto"
              )}
            >
              <span>{LANDING_HERO.secondaryCta.label}</span>
            </Link>
          </div>
        </div>

        <DashboardPreviewMockup />
      </div>
    </section>
  );
}
