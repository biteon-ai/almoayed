import Link from "next/link";
import { peekTeacherResetToken } from "@/actions/teacher-login-recovery";
import { loginMessageForCode } from "@/lib/login-ui-messages";
import { TEACHER_LOGIN_MESSAGES } from "@/lib/teacher-login-messages";
import { MobileShell } from "@/components/layout/MobileShell";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { TeacherResetForm } from "./reset-form";

export const dynamic = "force-dynamic";

export default async function TeacherResetPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token?.trim() ?? "";
  const peek = token
    ? await peekTeacherResetToken(token)
    : { status: "error" as const, code: "RESET_INVALID" as const };

  return (
    <MobileShell className="min-h-dvh bg-gradient-to-b from-brand-50/40 via-background to-background">
      <div className="px-2 pb-6 pt-2">
        <BrandHeader />
      </div>
      <div className="card-native mx-auto max-w-md" {...spekit(SPEKIT.teacherResetForm)}>
        <div className="card-native-header">
          <h1 className="text-lg font-extrabold">{TEACHER_LOGIN_MESSAGES.resetTitle}</h1>
        </div>
        {peek.status === "error" ? (
          <div className="space-y-4 p-5">
            <p className="text-sm font-medium text-destructive">
              {loginMessageForCode(peek.code)}
            </p>
            <Link
              href="/teacher/login"
              className="inline-flex min-h-10 items-center text-sm font-semibold text-brand-700"
            >
              {TEACHER_LOGIN_MESSAGES.goTeacherLogin}
            </Link>
          </div>
        ) : (
          <TeacherResetForm token={token} />
        )}
      </div>
    </MobileShell>
  );
}
