import {
  gamificationIconEmoji,
  type TeacherGamificationStatus,
} from "@/lib/teacher-gamification";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface BadgeGalleryProps {
  status: TeacherGamificationStatus;
}

export function BadgeGallery({ status }: BadgeGalleryProps) {
  return (
    <Card className="rounded-2xl border shadow-xs" {...spekit(SPEKIT.gamifBadgeGallery)}>
      <CardHeader className="border-b bg-muted/20 px-5 py-4">
        <CardTitle className="text-base font-bold">قاعة المكافآت</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {status.badges.map((badge) => (
            <li
              key={badge.tierId}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center",
                badge.unlocked
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-border bg-muted/30 opacity-70"
              )}
            >
              {!badge.unlocked ? (
                <Lock
                  className="absolute start-2 top-2 size-3.5 text-muted-foreground"
                  aria-hidden
                />
              ) : null}
              <span className="text-3xl" aria-hidden>
                {gamificationIconEmoji(badge.iconType)}
              </span>
              <span className="text-sm font-semibold leading-tight">
                {badge.levelName}
              </span>
              <span className="text-xs text-muted-foreground">
                {badge.unlocked ? "مفتوح" : "مقفل"}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
