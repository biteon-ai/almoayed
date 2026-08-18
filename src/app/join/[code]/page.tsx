import { redirect } from "next/navigation";
import {
  linkSignedInStudentToJoinCode,
} from "@/actions/join";
import { resolveTeacherForJoinCode } from "@/lib/trial-join-server";
import { JoinForm } from "@/app/join/[code]/join-form";
import {
  JoinLinkTeacherNotice,
} from "@/components/teacher/TrialInviteCard";
import { getSession } from "@/lib/auth";
import { getAuthSupabaseClient } from "@/lib/auth-session";
import { TRIAL_JOIN_MESSAGES } from "@/lib/trial-join-messages";
import { isJoinTeacherActive, normalizeTeacherJoinCode } from "@/lib/trial-join";
import { Card, CardContent } from "@/components/ui/card";
import { APP_DESCRIPTION, APP_SLOGAN } from "@/lib/constants";

export const metadata = {
  title: "انضم للصف | المؤيد",
  description: `${APP_SLOGAN} — ${APP_DESCRIPTION}`,
};

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: PageProps) {
  const { code: rawCode } = await params;
  const code = normalizeTeacherJoinCode(rawCode);

  const supabase = getAuthSupabaseClient();
  const teacher = supabase
    ? await resolveTeacherForJoinCode(code, supabase)
    : null;

  const session = await getSession();

  if (session.isLoggedIn && session.role === "TEACHER") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6" dir="rtl">
        <JoinLinkTeacherNotice />
      </div>
    );
  }

  if (session.isLoggedIn && session.role === "STUDENT" && teacher) {
    if (session.currentTeacherId === teacher.id) {
      redirect("/dashboard");
    }
    await linkSignedInStudentToJoinCode(teacher.teacher_code);
  }

  if (!teacher) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6" dir="rtl">
        <Card className="max-w-md border-destructive/20">
          <CardContent className="p-6 text-center text-sm font-medium text-destructive">
            {TRIAL_JOIN_MESSAGES.invalidLink}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isJoinTeacherActive(teacher)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6" dir="rtl">
        <Card className="max-w-md border-destructive/20">
          <CardContent className="p-6 text-center text-sm font-medium text-destructive">
            {TRIAL_JOIN_MESSAGES.inactiveTeacher}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <JoinForm teacherCode={teacher.teacher_code} teacherName={teacher.full_name} />;
}
