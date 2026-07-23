import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStudent } from "@/lib/auth";

/**
 * Redirect incomplete-onboarding students to /onboarding.
 * Safe paths (settings, onboarding, profile complete) skip this.
 */
export async function enforceStudentOnboardingComplete(
  pathname?: string
): Promise<void> {
  const session = await requireStudent();
  if (
    pathname?.startsWith("/onboarding") ||
    pathname?.startsWith("/profile/complete") ||
    pathname?.startsWith("/settings")
  ) {
    return;
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", session.profileId)
    .single();

  if (data && data.onboarding_completed === false) {
    redirect("/onboarding");
  }
}
