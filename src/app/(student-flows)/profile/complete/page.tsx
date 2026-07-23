import { redirect } from "next/navigation";
import { getStudentProfileState } from "@/actions/profile";
import { ProfileCompletionForm } from "@/components/student/ProfileCompletionForm";
import { sanitizeReturnPath } from "@/lib/student-profile";

interface PageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function ProfileCompletePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const state = await getStudentProfileState();
  const fromPath = sanitizeReturnPath(params.from);

  if (state.profileCompleted) {
    redirect(fromPath);
  }

  return (
    <ProfileCompletionForm
      fullName={state.fullName}
      demographics={state.demographics}
      fromPath={fromPath}
    />
  );
}
