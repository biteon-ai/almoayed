import type { StudentTeacher } from "@/types/database";

export interface ProUpgradeRequestState {
  upgrade_requested: boolean;
  tier: StudentTeacher["tier"];
}

/** [TIER-002] Idempotent pro-upgrade request — only free tier can request. */
export function canRequestProUpgrade(link: ProUpgradeRequestState): boolean {
  return link.tier === "free" && !link.upgrade_requested;
}

/** [TIER-002] State after teacher approves pro upgrade. */
export function applyProApproval(): ProUpgradeRequestState {
  return { tier: "pro", upgrade_requested: false };
}
