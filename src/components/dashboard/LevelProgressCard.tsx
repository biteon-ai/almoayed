import {
  gamificationIconEmoji,
  type TeacherGamificationStatus,
} from "@/lib/teacher-gamification";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LevelProgressCardProps {
  status: TeacherGamificationStatus;
  compact?: boolean;
  spekitId?: typeof SPEKIT.gamifLevelCard | typeof SPEKIT.gamifResultsSummary;
}

function progressHint(status: TeacherGamificationStatus): string {
  if (!status.nextTier) {
    return "أنت في أعلى مستوى — أحسنت!";
  }
  const parts: string[] = [];
  if (status.remainingQuizzes > 0) {
    parts.push(
      status.remainingQuizzes === 1
        ? "اختبار واحد"
        : `${status.remainingQuizzes} اختبارات`
    );
  }
  if (status.remainingScorePoints > 0) {
    const gap = Math.ceil(status.remainingScorePoints);
    parts.push(`رفع المعدل بمقدار ${gap}%`);
  }
  if (parts.length === 0) {
    return `اقتربت من مستوى ${status.nextTier.levelName}`;
  }
  return `بقيت ${parts.join(" و")} للوصول إلى مستوى ${status.nextTier.levelName}`;
}

export function LevelProgressCard({
  status,
  compact = false,
  spekitId = SPEKIT.gamifLevelCard,
}: LevelProgressCardProps) {
  const fillPercent = Math.round(status.progressFill * 100);
  const title = status.currentTier
    ? status.currentTier.levelName
    : "لم تصل إلى مستوى بعد";
  const icon = status.currentTier
    ? gamificationIconEmoji(status.currentTier.iconType)
    : status.nextTier
      ? gamificationIconEmoji(status.nextTier.iconType)
      : "🏅";

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-xs"
        {...spekit(spekitId)}
      >
        <span className="text-2xl" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate text-sm font-bold">{title}</p>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width]"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{progressHint(status)}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="rounded-2xl border shadow-xs" {...spekit(spekitId)}>
      <CardHeader className="border-b bg-muted/20 px-5 py-4">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <span className="text-xl" aria-hidden>
            {icon}
          </span>
          <span>مستواك الحالي</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-lg font-bold">{title}</p>
          <p className="text-sm tabular-nums text-muted-foreground">
            {status.totalQuizzesCompleted} اختبار · متوسط{" "}
            {Math.round(status.averageScorePercentage)}%
          </p>
        </div>
        <div
          className={cn("h-3 overflow-hidden rounded-full bg-muted")}
          role="progressbar"
          aria-valuenow={fillPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="التقدم نحو المستوى التالي"
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width]"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">{progressHint(status)}</p>
      </CardContent>
    </Card>
  );
}
