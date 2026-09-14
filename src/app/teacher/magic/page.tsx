import Link from "next/link";
import { redirect } from "next/navigation";
import { consumeTeacherMagicLink } from "@/actions/teacher-login-recovery";
import { loginMessageForCode } from "@/lib/login-ui-messages";
import { TEACHER_LOGIN_MESSAGES } from "@/lib/teacher-login-messages";
import { MobileShell } from "@/components/layout/MobileShell";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

export const dynamic = "force-dynamic";

export default async function TeacherMagicPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token?.trim() ?? "";
  const result = token
    ? await consumeTeacherMagicLink(token)
    : { status: "error" as const, code: "MAGIC_INVALID" as const };

  if (result.status === "success") {
    redirect("/teacher/dashboard");
  }

  return (
    <MobileShell className="min-h-dvh bg-gradient-to-b from-brand-50/40 via-background to-background">
      <div className="px-2 pb-6 pt-2">
        <BrandHeader />
      </div>
      <div
        className="card-native mx-auto max-w-md p-5"
        {...spekit(SPEKIT.teacherMagicConsume)}
      >
        <p className="text-sm font-medium text-destructive">
          {loginMessageForCode(result.code)}
        </p>
        <Link
          href="/teacher/login"
          className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-brand-700"
        >
          {TEACHER_LOGIN_MESSAGES.goTeacherLogin}
        </Link>
      </div>
    </MobileShell>
  );
}
