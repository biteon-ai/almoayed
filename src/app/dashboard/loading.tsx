"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BookOpen, Target } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-6 space-y-8 animate-pulse-subtle">
      {/* Header skeleton */}
      <header className="flex items-center justify-between border-b border-brand-50/20 pb-4 dark:border-brand-950/20">
        <div className="space-y-2">
          {/* Logo placeholder */}
          <div className="h-6 w-28 rounded-lg bg-muted dark:bg-brand-950/40" />
          <div className="h-3 w-40 rounded bg-muted/65 dark:bg-brand-950/20" />
        </div>
        {/* Logout button placeholder */}
        <div className="h-9 w-9 rounded-full bg-muted dark:bg-brand-950/40" />
      </header>

      {/* Hero Welcome skeleton */}
      <section className="space-y-2 text-start">
        <div className="h-7 w-48 rounded-lg bg-muted dark:bg-brand-950/40" />
        <div className="h-4 w-36 rounded bg-muted/65 dark:bg-brand-950/20" />
      </section>

      {/* Quizzes List section skeleton */}
      <section className="space-y-3 text-start">
        <h2 className="flex items-center gap-2 text-lg font-bold text-muted-foreground/60">
          <BookOpen className="size-5 text-muted-foreground/30" />
          <div className="h-5 w-32 rounded bg-muted dark:bg-brand-950/40" />
        </h2>

        {/* Pulsing Quiz Cards */}
        {[1, 2].map((i) => (
          <Card key={i} className="border-brand-100/40 dark:border-brand-900/10 dark:bg-card/40">
            <CardHeader className="flex-row items-center justify-between space-y-0 p-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-2/3 rounded bg-muted dark:bg-brand-950/40" />
                <div className="h-3 w-1/3 rounded bg-muted/50 dark:bg-brand-950/20" />
              </div>
              <div className="size-5 rounded-full bg-muted dark:bg-brand-950/40" />
            </CardHeader>
          </Card>
        ))}
      </section>

      {/* Performance Analytics skeleton */}
      <section className="space-y-4 text-start">
        <h3 className="flex items-center gap-2 text-lg font-bold text-muted-foreground/60">
          <Target className="size-5 text-muted-foreground/30" />
          <div className="h-5 w-36 rounded bg-muted dark:bg-brand-950/40" />
        </h3>

        <Card className="border-brand-100/40 dark:border-brand-900/10 dark:bg-card/40 overflow-hidden">
          <CardHeader className="pb-3 border-b border-brand-50/20 dark:border-brand-950/20 px-5 py-4 flex-row items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4.5 w-32 rounded bg-muted dark:bg-brand-950/40" />
              <div className="h-3 w-44 rounded bg-muted/50 dark:bg-brand-950/20" />
            </div>
            <div className="h-7 w-12 rounded-md bg-muted dark:bg-brand-950/40" />
          </CardHeader>

          <CardContent className="p-5">
            {/* 3 Circular Ring placeholders */}
            <div className="grid grid-cols-2 xs:grid-cols-3 gap-4 justify-items-center">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center p-3.5 rounded-xl border border-dashed border-muted/50 dark:border-brand-950/40 w-full max-w-[130px] space-y-3">
                  {/* Circle Ring mockup */}
                  <div className="size-16 rounded-full border-[5.5px] border-muted dark:border-brand-950 flex items-center justify-center bg-transparent" />
                  {/* Category label mockup */}
                  <div className="h-3.5 w-14 rounded bg-muted dark:bg-brand-950/40" />
                  {/* Badge mockup */}
                  <div className="h-4 w-12 rounded-full bg-muted/65 dark:bg-brand-950/20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
