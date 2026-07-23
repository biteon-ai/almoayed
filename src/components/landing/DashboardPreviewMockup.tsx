import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Flame, Target, TrendingUp } from "lucide-react";

export function DashboardPreviewMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50/80 via-background to-teal-50/40 p-5 shadow-xl dark:from-emerald-950/30 dark:to-background sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Badge className="border-emerald-200/60 bg-emerald-500/15 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            لوحة الطالب
          </Badge>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
            <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />7
            أيام
          </span>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {[
            { icon: BookOpen, label: "مكتمل", value: "12" },
            { icon: Target, label: "المعدل", value: "87%" },
            { icon: TrendingUp, label: "هذا الأسبوع", value: "+3" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border bg-card/80 p-2.5 text-center shadow-xs"
            >
              <stat.icon className="mx-auto mb-1 h-4 w-4 text-emerald-600" />
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              <p className="text-sm font-black text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-2xl border border-emerald-500/15 bg-card/90 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-foreground">تفاضل وتكامل</p>
            <span className="text-xs font-semibold text-emerald-600">65%</span>
          </div>
          <Progress className="h-2 rounded-full bg-emerald-100 dark:bg-emerald-950" value={65} />
          <p className="text-[11px] text-muted-foreground">15 سؤالاً • قيد التقدم</p>
        </div>
      </div>
    </div>
  );
}
