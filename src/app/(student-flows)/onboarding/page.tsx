import { redirect } from "next/navigation";
import { getStudentProfileState } from "@/actions/profile";
import { OnboardingWizard } from "@/components/student/OnboardingWizard";

export default async function OnboardingPage() {
  const state = await getStudentProfileState();
  if (state.onboardingCompleted) {
    redirect("/dashboard");
  }

  return <OnboardingWizard />;
}
