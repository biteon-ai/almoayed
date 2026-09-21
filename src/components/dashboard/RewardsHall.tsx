"use client";

import { useMemo, useState } from "react";
import {
  gamificationIconEmoji,
  type TeacherGamificationBadge,
  type TeacherGamificationStatus,
} from "@/lib/teacher-gamification";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import { CountOfText } from "@/components/ui/rtl-num";
import { Button } from "@/components/ui/button";
import { ChevronDown, LayoutGrid, Lock, Rows3 } from "lucide-react";

interface RewardsHallProps {
  status: TeacherGamificationStatus;
}

const scrollbarHide =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

function BadgeCard({
  badge,
  expanded,
}: {
  badge: TeacherGamificationBadge;
  expanded: boolean;
}) {
  return (
    <li
      className={cn(
        "relative flex flex-col items-center justify-between gap-2 rounded-xl border p-3 text-center transition-all",
        expanded
          ? "w-full"
          : "min-w-[120px] max-w-[130px] shrink-0 snap-start",
        badge.unlocked
          ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/50 dark:bg-emerald-950/20"
          : "border-slate-200 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-900"
      )}
    >
      {!badge.unlocked ? (
        <Lock
          className="absolute start-2 top-2 size-3.5 text-muted-foreground"
          aria-hidden
        />
      ) : null}

      <span
        className={cn("text-3xl leading-none", !badge.unlocked && "grayscale")}
        aria-hidden
      >
        {gamificationIconEmoji(badge.iconType)}
      </span>

      <span className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
        {badge.levelName}
      </span>

      <span
        className={cn(
          "rounded-full px-3 py-1 text-[10px] font-medium",
          badge.unlocked
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            : "bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        )}
      >
        {badge.unlocked ? "مفتوح" : "مقفل"}
      </span>
    </li>
  );
}

/**
 * [GAMIF-004] Rewards hall — horizontal snap carousel with expand-to-grid.
 */
export function RewardsHall({ status }: RewardsHallProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { unlockedCount, totalCount } = useMemo(() => {
    const total = status.badges.length;
    const unlocked = status.badges.filter((badge) => badge.unlocked).length;
    return { unlockedCount: unlocked, totalCount: total };
  }, [status.badges]);

  return (
    <section
      className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm"
      {...spekit(SPEKIT.gamifBadgeGallery)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-base font-bold text-foreground">
            قاعة المكافآت
          </h3>
          <span
            className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium tabular-nums text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
            {...spekit(SPEKIT.gamifRewardsCount)}
          >
            <CountOfText current={unlockedCount} total={totalCount} />
          </span>
        </div>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          className="h-8 shrink-0 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          {...spekit(SPEKIT.gamifRewardsExpand)}
        >
          {isExpanded ? (
            <>
              <Rows3 className="size-3.5" aria-hidden />
              عرض شريطي
            </>
          ) : (
            <>
              <LayoutGrid className="size-3.5" aria-hidden />
              عرض الكل
            </>
          )}
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
            aria-hidden
          />
        </Button>
      </div>

      <ul
        className={cn(
          isExpanded
            ? "grid grid-cols-3 gap-3 pt-1 sm:grid-cols-4 md:grid-cols-6"
            : cn(
                "flex gap-3 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory px-1 py-2",
                scrollbarHide
              )
        )}
        {...spekit(SPEKIT.gamifRewardsTrack)}
      >
        {status.badges.map((badge) => (
          <BadgeCard
            key={badge.tierId}
            badge={badge}
            expanded={isExpanded}
          />
        ))}
      </ul>
    </section>
  );
}

/** @deprecated Prefer `RewardsHall` — kept for existing imports. */
export function BadgeGallery(props: RewardsHallProps) {
  return <RewardsHall {...props} />;
}
