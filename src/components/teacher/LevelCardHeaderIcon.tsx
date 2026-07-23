import { resolveGamificationIconParts } from "@/lib/teacher-gamification";
import { cn } from "@/lib/utils";
import type { GamificationIconType } from "@/types/database";

interface LevelCardHeaderIconProps {
  iconType: GamificationIconType;
  className?: string;
}

/**
 * [GAMIF-003] Header reward badge: single main glyph + optional metal corner chip.
 * Avoids stacked emoji overflow (e.g. 🥉🏆).
 */
export function LevelCardHeaderIcon({
  iconType,
  className,
}: LevelCardHeaderIconProps) {
  const { mainIcon, subBadgeIcon } = resolveGamificationIconParts(iconType);

  return (
    <div
      className={cn(
        "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-visible rounded-xl border border-emerald-100 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/30",
        className
      )}
      aria-hidden
    >
      <span className="flex items-center justify-center text-2xl leading-none">
        {mainIcon}
      </span>
      {subBadgeIcon ? (
        <span className="absolute -end-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] leading-none shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {subBadgeIcon}
        </span>
      ) : null}
    </div>
  );
}
