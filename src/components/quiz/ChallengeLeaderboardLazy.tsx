"use client";

import dynamic from "next/dynamic";
import type { ChallengeLeaderboardEntry } from "@/actions/quiz";

const LazyLeaderboard = dynamic(
  () =>
    import("@/components/quiz/ChallengeLeaderboard").then(
      (mod) => mod.ChallengeLeaderboard
    ),
  {
    loading: () => (
      <div
        className="h-24 animate-pulse rounded-2xl border border-amber-100 bg-amber-50/40"
        aria-hidden
      />
    ),
  }
);

export function ChallengeLeaderboardLazy({
  entries,
  viewerEntry,
}: {
  entries: ChallengeLeaderboardEntry[];
  viewerEntry: ChallengeLeaderboardEntry | null;
}) {
  return <LazyLeaderboard entries={entries} viewerEntry={viewerEntry} />;
}
