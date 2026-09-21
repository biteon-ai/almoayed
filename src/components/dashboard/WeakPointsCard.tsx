import type { CategoryPerformance } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Target, Sparkles, Trophy, BookOpen } from "lucide-react";
import { PercentText } from "@/components/ui/rtl-num";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

interface WeakPointsCardProps {
  categories: CategoryPerformance[];
}

const WEAK_THRESHOLD = 50;
const STRONG_THRESHOLD = 80;

export function WeakPointsCard({ categories }: WeakPointsCardProps) {
  if (categories.length === 0) {
    return (
      <Card
        className="border border-dashed border-brand-200 dark:border-brand-900 bg-brand-50/10 dark:bg-brand-950/5 text-center p-6 rounded-2xl animate-fade-in"
        {...spekit(SPEKIT.weakPointsCard)}
      >
        <CardHeader className="pb-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/50 mb-3 border border-brand-100 dark:border-brand-900/30">
            <Target className="size-6 text-brand-600 dark:text-brand-400 animate-pulse" />
          </div>
          <CardTitle className="text-base font-extrabold text-foreground">تحليل مستوى المهارات</CardTitle>
          <CardDescription className="text-xs max-w-xs mx-auto leading-relaxed mt-1">
            حلّ أول اختبار إلك، ورح يظهر هون فوراً رسم بياني تفاعلي لتحليل نقاط قوتك والأشياء اللي بدها شوية مراجعة.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Find lowest and highest performing categories for smart tips
  const sortedCategories = [...categories].sort(
    (a, b) => a.success_percentage - b.success_percentage
  );
  
  const weakCategories = categories.filter(
    (c) => c.success_percentage < WEAK_THRESHOLD
  );

  const averageSuccess = Math.round(
    categories.reduce((acc, curr) => acc + curr.success_percentage, 0) / categories.length
  );

  return (
    <div className="space-y-5 animate-slide-up">
      <Card
        className="border-brand-100/60 dark:border-brand-900/30 bg-white dark:bg-card/90 shadow-md rounded-2xl overflow-hidden"
        {...spekit(SPEKIT.weakPointsCard)}
      >
        <CardHeader className="pb-3 border-b border-brand-50/50 dark:border-brand-950/30 px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-extrabold flex items-center gap-1.5 text-foreground">
                <Target className="size-5 text-brand-600" />
                <span>أداؤك حسب الأقسام</span>
              </CardTitle>
              <CardDescription className="text-xs">
                مستوى تمكنك الإجمالي من المفاهيم الرياضية
              </CardDescription>
            </div>
            <div className="text-start">
              <div className="text-xs text-muted-foreground font-bold">المعدل العام</div>
              <div className={cn(
                "text-lg font-black tracking-tight",
                averageSuccess >= STRONG_THRESHOLD ? "text-green-600" : averageSuccess < WEAK_THRESHOLD ? "text-destructive" : "text-brand-600"
              )}>
                <PercentText value={averageSuccess} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {/* Mastery SVG Progress Rings Grid */}
          <div className="grid grid-cols-2 xs:grid-cols-3 gap-4 justify-items-center">
            {categories.map((cat) => {
              const success = cat.success_percentage;
              const isWeak = success < WEAK_THRESHOLD;
              const isStrong = success >= STRONG_THRESHOLD;
              
              // SVG properties
              const radius = 26;
              const strokeWidth = 5.5;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (success / 100) * circumference;

              return (
                <div key={cat.category_tag} className="flex flex-col items-center p-3.5 rounded-xl border border-brand-50 bg-brand-50/5 dark:border-brand-950/40 dark:bg-brand-950/5 w-full max-w-[130px] transition-shadow duration-200 hover:shadow-inner">
                  {/* Circular Mastery Ring */}
                  <div className="relative size-16 flex items-center justify-center">
                    <svg className="size-full -rotate-90">
                      {/* Background circle track */}
                      <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        className="stroke-muted/30 dark:stroke-brand-950"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                      />
                      {/* Progress circle bar */}
                      <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        className={cn(
                          "transition-all duration-500 ease-out",
                          isStrong ? "stroke-green-500" : isWeak ? "stroke-destructive" : "stroke-brand-500"
                        )}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    {/* Inner Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[13px] font-black tracking-tighter text-foreground font-mono">
                        <PercentText value={Math.round(success)} />
                      </span>
                    </div>
                  </div>

                  {/* Category Details */}
                  <div className="mt-3 text-center space-y-1">
                    <span className="block text-xs font-extrabold text-foreground truncate max-w-[100px]">
                      {cat.category_tag}
                    </span>
                    <Badge
                      variant={isWeak ? "destructive" : isStrong ? "secondary" : "outline"}
                      className={cn(
                        "h-auto rounded-full border-0 px-3 py-1 text-[10px] font-medium leading-none",
                        isStrong && "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                      )}
                    >
                      {cat.correct_count} / {cat.total_attempted} صح
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Smart Recommendations Section */}
      <div className="space-y-3" {...spekit(SPEKIT.weakPointsRecommendations)}>
        <h3 className="flex items-center gap-1.5 px-1 text-sm font-extrabold text-foreground">
          <Sparkles className="size-4 fill-amber-500/10 text-amber-500" />
          <span>توصيات ذكية مخصصة إلك</span>
        </h3>

        <div className="space-y-2.5">
          {/* 1. Weak category warnings */}
          {weakCategories.map((cat) => (
            <Card
              key={cat.category_tag}
              className="rounded-xl border-destructive/20 bg-destructive/5 transition-all duration-300"
            >
              <CardContent className="flex items-start gap-3 p-4">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                <div className="text-start">
                  <h4 className="text-xs font-black text-destructive">
                    تنبيه مراجعة هامة: قسم {cat.category_tag}
                  </h4>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-destructive/80">
                    مستواك فيه <PercentText value={cat.success_percentage} />. شوية مراجعة للحلول
                    والشروحات رح تعوض النقص وتثبت معلوماتك. ركز وحل بإيدك!
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* 2. Motivational messages */}
          {sortedCategories.length > 0 && (
            <Card
              className={cn(
                "overflow-hidden rounded-xl border bg-gradient-to-l",
                sortedCategories[sortedCategories.length - 1].success_percentage >=
                  STRONG_THRESHOLD
                  ? "border-green-200/60 from-green-50/20 to-transparent dark:border-green-950/45"
                  : "border-brand-100/60 from-brand-50/10 to-transparent dark:border-brand-900/30"
              )}
            >
              <CardContent className="flex items-start gap-3 p-4 text-start">
                {sortedCategories[sortedCategories.length - 1].success_percentage >=
                STRONG_THRESHOLD ? (
                  <>
                    <Trophy className="mt-0.5 size-5 shrink-0 animate-bounce text-green-600 dark:text-green-500" />
                    <div>
                      <h4 className="text-xs font-black text-green-700 dark:text-green-400">
                        نجم اللوحة اليوم 🌟
                      </h4>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-green-700/80 dark:text-green-400/80">
                        أداؤك متميز ببحث **
                        {sortedCategories[sortedCategories.length - 1].category_tag}**
                        بنسبة تمكن{" "}
                        {
                          sortedCategories[sortedCategories.length - 1]
                            .success_percentage
                        }
                        %. استمر بنشر شغفك وسرّع من وتيرتك!
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <BookOpen className="mt-0.5 size-5 shrink-0 text-brand-600 dark:text-brand-400" />
                    <div>
                      <h4 className="text-xs font-black text-brand-800 dark:text-brand-300">
                        ملاحظة الأستاذ للتقدم
                      </h4>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-muted-foreground">
                        أفضل نقاط قوتك تكمن في قسم **
                        {sortedCategories[sortedCategories.length - 1].category_tag}
                        **. عم تبذل جهد طيب، تابع حلّ الاختبارات لترفع بقية
                        الأبحاث للـ 600 علامة كاملة.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
