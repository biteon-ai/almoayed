"use client";

import type { ChallengeLeaderboardEntry } from "@/actions/quiz";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { Trophy } from "lucide-react";

interface ChallengeLeaderboardProps {
  entries: ChallengeLeaderboardEntry[];
  viewerEntry: ChallengeLeaderboardEntry | null;
}

export function ChallengeLeaderboard({
  entries,
  viewerEntry,
}: ChallengeLeaderboardProps) {
  return (
    <section
      className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/60 to-white p-4 shadow-sm"
      {...spekit(SPEKIT.challengeLeaderboard)}
    >
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="size-5 text-amber-600" aria-hidden />
        <h2 className="text-sm font-bold text-foreground">لوحة المتصدرين</h2>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">لا توجد نتائج بعد.</p>
      ) : (
        <ol className="space-y-2">
          {entries.map((entry) => {
            const isViewer = viewerEntry?.studentId === entry.studentId;
            return (
              <li
                key={entry.studentId}
                className={
                  isViewer
                    ? "flex items-center justify-between rounded-xl border border-emerald-300/60 bg-emerald-50/80 px-3 py-2 text-sm"
                    : "flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                }
              >
                <span className="font-bold tabular-nums text-muted-foreground">
                  #{entry.rank}
                </span>
                <span className="flex-1 px-2 font-medium">{entry.displayName}</span>
                <span className="font-bold tabular-nums text-emerald-700">
                  {entry.score}%
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {!viewerEntry && entries.length > 0 ? (
        <p className="mt-3 text-[11px] text-muted-foreground">
          لم تشارك بعد — أكمل الاختبار لتظهر في الترتيب.
        </p>
      ) : null}
    </section>
  );
}
