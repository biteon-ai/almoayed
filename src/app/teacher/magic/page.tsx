import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthErrorCode } from "@/lib/auth-error-codes";
import { loginMessageForCode } from "@/lib/login-ui-messages";
import { TEACHER_LOGIN_MESSAGES } from "@/lib/teacher-login-messages";
import { MobileShell } from "@/components/layout/MobileShell";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

export const dynamic = "force-dynamic";

function errorCode(raw: string | undefined): AuthErrorCode {
  if (raw && raw in AuthErrorCode) return raw as AuthErrorCode;
  return AuthErrorCode.MAGIC_INVALID;
}

export default function TeacherMagicPage({
  searchParams,
}: {
  searchParams: { token?: string; code?: string };
}) {
  const token = searchParams.token?.trim() ?? "";
  if (token) {
    redirect(
      `/teacher/magic/consume?token=${encodeURIComponent(token)}`
    );
  }

  const code = errorCode(searchParams.code);

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
          {loginMessageForCode(code)}
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
