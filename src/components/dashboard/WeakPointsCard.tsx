import type { CategoryPerformance } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeakPointsCardProps {
  categories: CategoryPerformance[];
}

const WEAK_THRESHOLD = 50;

export function WeakPointsCard({ categories }: WeakPointsCardProps) {
  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">تحليل نقاط القوة والضعف</CardTitle>
          <CardDescription>
            بعد ما تخلص اختبار، رح يظهر هون تحليل أدائك حسب الأقسام.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const weakCategories = categories.filter(
    (c) => c.success_percentage < WEAK_THRESHOLD
  );

  return (
    <div className="space-y-4">
      {weakCategories.map((cat) => (
        <Card
          key={cat.category_tag}
          className="border-2 border-amber-500 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40"
        >
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 size-6 shrink-0 text-amber-600" />
            <p className="text-sm font-bold leading-relaxed text-amber-900 dark:text-amber-100">
              ⚠️ تنبيه نقاط الضعف: مستواك ضعيف في قسم{" "}
              <span className="underline decoration-amber-600 decoration-2">
                {cat.category_tag}
              </span>
              ، يرجى مراجعة الحلول بيدك!
            </p>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="size-5 text-brand-600" />
            أداؤك حسب الأقسام
          </CardTitle>
          <CardDescription>
            نسبة النجاح بكل قسم من أسئلة الاختبارات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map((cat) => {
            const isWeak = cat.success_percentage < WEAK_THRESHOLD;
            return (
              <div key={cat.category_tag} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{cat.category_tag}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isWeak ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {cat.correct_count}/{cat.total_attempted}
                    </Badge>
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        isWeak ? "text-destructive" : "text-brand-600"
                      )}
                    >
                      {cat.success_percentage}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={cat.success_percentage}
                  className={cn("h-2", isWeak && "[&>div]:bg-destructive")}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
