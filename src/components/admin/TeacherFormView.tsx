"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import type {
  AdminTeacherRow,
  SubjectCatalogItem,
  TeacherAccountStatus,
} from "@/types/database";
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TeacherAvatar } from "@/components/admin/AdminTeachersStats";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BookOpen,
  Check,
  Hash,
  Loader2,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react";

const TEACHER_FLASH_KEY = "admin-teacher-flash";

export type TeacherFormMode = "create" | "edit";

interface TeacherFormViewProps {
  mode: TeacherFormMode;
  subjects: SubjectCatalogItem[];
  teacher?: AdminTeacherRow;
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-bold text-foreground"
    >
      {children}
    </Label>
  );
}

function IconInput({
  icon: Icon,
  inputDir = "rtl",
  className,
  ...props
}: ComponentProps<typeof Input> & {
  icon: typeof Mail;
  inputDir?: "rtl" | "ltr";
}) {
  const isLtr = inputDir === "ltr";

  return (
    <div className="relative">
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 flex w-14 items-center justify-center",
          isLtr ? "left-0" : "right-0"
        )}
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900/50">
          <Icon className="size-4" aria-hidden />
        </span>
      </span>
      <Input
        {...props}
        dir={inputDir}
        className={cn(
          "h-[52px] rounded-2xl border-emerald-100/90 bg-white px-4 shadow-sm transition-shadow",
          "hover:border-emerald-200 focus:border-emerald-400 focus:bg-white focus:shadow-md focus:shadow-emerald-500/10",
          "dark:border-emerald-900/50 dark:bg-background",
          isLtr ? "pl-[4.25rem] text-start" : "pr-[4.25rem]",
          className
        )}
      />
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: typeof User;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-emerald-100/80 shadow-sm ring-1 ring-emerald-500/5 dark:border-emerald-900/40">
      <CardHeader className="border-b border-emerald-50/90 bg-gradient-to-l from-emerald-50/70 via-white to-white px-6 py-5 dark:border-emerald-950/50 dark:from-emerald-950/25 dark:via-background dark:to-background">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25">
            <Icon className="size-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 pt-0.5">
            <CardTitle className="text-lg font-extrabold tracking-tight">
              {title}
            </CardTitle>
            <CardDescription className="mt-1.5 text-sm leading-relaxed">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-6 py-6">{children}</CardContent>
    </Card>
  );
}

export function TeacherFormView({ mode, subjects, teacher }: TeacherFormViewProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [fullName, setFullName] = useState(teacher?.fullName ?? "");
  const [email, setEmail] = useState(teacher?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(teacher?.phoneNumber ?? "");
  const [subjectIds, setSubjectIds] = useState<string[]>(
    teacher?.subjects.map((s) => s.id) ?? []
  );
  const [status, setStatus] = useState<TeacherAccountStatus>(
    teacher?.status ?? "active"
  );
  const [maxQuizLimit, setMaxQuizLimit] = useState(
    teacher?.maxQuizLimit?.toString() ?? ""
  );
  const [password, setPassword] = useState("");
  const [generatePassword, setGeneratePassword] = useState(!isEdit);
  const [resetPassword, setResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetGeneratePassword, setResetGeneratePassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!teacher) return;
    setFullName(teacher.fullName);
    setEmail(teacher.email);
    setPhoneNumber(teacher.phoneNumber ?? "");
    setSubjectIds(teacher.subjects.map((s) => s.id));
    setStatus(teacher.status);
    setMaxQuizLimit(teacher.maxQuizLimit?.toString() ?? "");
  }, [teacher]);

  function toggleSubject(id: string) {
    setSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function flashAndRedirect(message: string, generatedPassword?: string) {
    sessionStorage.setItem(
      TEACHER_FLASH_KEY,
      JSON.stringify({ message, generatedPassword })
    );
    router.push("/admin/teachers");
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      if (isEdit && teacher) {
        const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            email,
            phoneNumber: phoneNumber || null,
            subjectIds,
            status,
            maxQuizLimit: maxQuizLimit ? Number(maxQuizLimit) : null,
            newPassword:
              resetPassword && !resetGeneratePassword ? newPassword : undefined,
            generatePassword: resetPassword && resetGeneratePassword,
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          generatedPassword?: string;
        };
        if (!res.ok) {
          setError(data.error ?? "فشل تحديث المدرس.");
          return;
        }
        flashAndRedirect("تم حفظ التغييرات بنجاح.", data.generatedPassword);
        return;
      }

      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password: generatePassword ? undefined : password,
          generatePassword,
          phoneNumber: phoneNumber || null,
          subjectIds,
          status,
          maxQuizLimit: maxQuizLimit ? Number(maxQuizLimit) : null,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        generatedPassword?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "فشل إنشاء المدرس.");
        return;
      }
      flashAndRedirect("تم إنشاء المدرس بنجاح.", data.generatedPassword);
    } catch {
      setError("تعذر الاتصال بالخادم.");
    } finally {
      setPending(false);
    }
  }

  const formId = "admin-teacher-form";
  const title = isEdit ? "تعديل بيانات المدرس" : "إضافة مدرس جديد";
  const submitLabel = isEdit ? "حفظ التغييرات" : "إنشاء المدرس";

  return (
    <div
      dir="rtl"
      className="mx-auto w-full max-w-4xl pb-32"
      {...spekit(SPEKIT.adminTeacherFormPage)}
    >
      <header className="mb-8 overflow-hidden rounded-2xl border border-emerald-100/80 bg-gradient-to-bl from-emerald-50/80 via-white to-white p-6 shadow-sm ring-1 ring-emerald-500/5 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:via-background dark:to-background sm:p-8">
        <Link
          href="/admin/teachers"
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-white/80 px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:shadow dark:border-emerald-800/60 dark:bg-emerald-950/20 dark:text-emerald-200 dark:hover:bg-emerald-950/40"
        >
          <ArrowRight className="size-4 shrink-0" aria-hidden />
          العودة إلى قائمة المدرسين
        </Link>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
          {isEdit && teacher ? (
            <TeacherAvatar fullName={teacher.fullName} size="lg" />
          ) : (
            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/20 ring-4 ring-white dark:ring-background">
              <User className="size-7" strokeWidth={2.25} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {isEdit
                ? "حدّث معلومات المدرس، المواد، وإعدادات الأمان في أقسام واضحة."
                : "أنشئ حساب مدرس جديد بكل الحقول المطلوبة."}
            </p>
            {isEdit && teacher?.email ? (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                <Mail className="size-3.5 shrink-0" />
                <span dir="ltr">{teacher.email}</span>
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <form id={formId} onSubmit={onSubmit} className="space-y-6">
        <SectionCard
          title="المعلومات الأساسية"
          description="الاسم وبيانات التواصل المستخدمة في الحساب."
          icon={User}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <FieldLabel htmlFor="full_name">الاسم الكامل</FieldLabel>
              <IconInput
                id="full_name"
                icon={User}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="email">البريد الإلكتروني</FieldLabel>
              <IconInput
                id="email"
                icon={Mail}
                type="email"
                inputDir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
            <div>
              <FieldLabel htmlFor="phone">رقم الهاتف</FieldLabel>
              <IconInput
                id="phone"
                icon={Phone}
                inputDir="ltr"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="اختياري"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="التخصص والمواد"
          description="اختر المواد والفروع التي يدرّسها المدرس."
          icon={BookOpen}
        >
          <div className="rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/30 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/15 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-muted-foreground">
                {subjectIds.length > 0
                  ? `تم اختيار ${subjectIds.length.toLocaleString("en-US")} ${subjectIds.length === 1 ? "مادة" : "مواد"}`
                  : "لم يتم اختيار أي مادة بعد"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {subjects.map((subject) => {
                const active = subjectIds.includes(subject.id);
                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => toggleSubject(subject.id)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-all duration-200",
                      active
                        ? "border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/30"
                        : "border-emerald-100/90 bg-white text-muted-foreground shadow-sm hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 hover:shadow-md dark:border-emerald-900/50 dark:bg-background dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200"
                    )}
                  >
                    {active ? (
                      <span className="flex size-5 items-center justify-center rounded-full bg-white/25">
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="size-5 rounded-full border-2 border-emerald-200/80 dark:border-emerald-800/60" />
                    )}
                    {subject.nameAr}
                  </button>
                );
              })}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="إعدادات الحساب والأمان"
          description="الحالة، حدود الاختبارات، وكلمة المرور."
          icon={Shield}
        >
          <div className="space-y-6">
            <div>
              <FieldLabel>حالة الحساب</FieldLabel>
              <div className="flex flex-wrap gap-2.5">
                {(["active", "inactive"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(value)}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold transition-all",
                      status === value
                        ? "border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                        : "border-border/80 bg-muted/30 text-muted-foreground hover:border-emerald-200 hover:bg-emerald-50/80 hover:text-emerald-800 dark:hover:bg-emerald-950/30"
                    )}
                  >
                    {status === value ? (
                      <Check className="size-4" strokeWidth={3} />
                    ) : null}
                    {value === "active" ? "نشط" : "معطّل"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="max_quiz">حد الاختبارات المتاحة</FieldLabel>
              <IconInput
                id="max_quiz"
                icon={Hash}
                type="number"
                min={1}
                inputDir="ltr"
                value={maxQuizLimit}
                onChange={(e) => setMaxQuizLimit(e.target.value)}
                placeholder="اتركه فارغاً للافتراضي"
                className="max-w-sm"
              />
            </div>

            <div className="rounded-2xl border border-emerald-100/90 bg-emerald-50/40 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <FieldLabel>
                {isEdit ? "إعادة تعيين كلمة المرور" : "كلمة المرور الأولية"}
              </FieldLabel>

              {isEdit ? (
                <div className="mt-4 space-y-3">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={resetPassword}
                      onChange={(e) => setResetPassword(e.target.checked)}
                      className="size-4 rounded border-emerald-300 text-emerald-600"
                    />
                    تفعيل إعادة تعيين كلمة المرور
                  </label>
                  {resetPassword ? (
                    <>
                      <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={resetGeneratePassword}
                          onChange={(e) => setResetGeneratePassword(e.target.checked)}
                          className="size-4 rounded border-emerald-300 text-emerald-600"
                        />
                        توليد كلمة مرور جديدة تلقائياً
                      </label>
                      {!resetGeneratePassword ? (
                        <IconInput
                          icon={Lock}
                          type="password"
                          inputDir="ltr"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          minLength={8}
                          placeholder="كلمة المرور الجديدة"
                          className="max-w-md"
                        />
                      ) : null}
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={generatePassword}
                      onChange={(e) => setGeneratePassword(e.target.checked)}
                      className="size-4 rounded border-emerald-300 text-emerald-600"
                    />
                    توليد كلمة مرور تلقائياً
                  </label>
                  {!generatePassword ? (
                    <IconInput
                      id="password"
                      icon={Lock}
                      type="password"
                      inputDir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="8 أحرف على الأقل"
                      className="max-w-md"
                    />
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm font-semibold text-destructive"
          >
            {error}
          </div>
        ) : null}
      </form>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-emerald-100/90 bg-background/95 shadow-[0_-10px_40px_-12px_rgba(5,150,105,0.22)] backdrop-blur-lg dark:border-emerald-900/50 supports-[backdrop-filter]:bg-background/90">
        <div className="mx-auto flex w-full max-w-4xl flex-col-reverse gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-4 sm:px-6">
          <Link
            href="/admin/teachers"
            className={cn(
              buttonVariants({ variant: "outline", size: "touch" }),
              "w-full rounded-2xl border-emerald-200/80 bg-background text-center shadow-sm sm:w-auto",
              "hover:bg-emerald-50/60 dark:border-emerald-800/60"
            )}
          >
            إلغاء والعودة
          </Link>
          <Button
            type="submit"
            form={formId}
            variant="brand"
            size="touch"
            disabled={pending}
            className="w-full rounded-2xl shadow-lg shadow-emerald-600/30 sm:min-w-[11rem]"
            {...spekit(
              isEdit ? SPEKIT.adminEditTeacherSubmit : SPEKIT.adminCreateTeacherSubmit
            )}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}

export { TEACHER_FLASH_KEY };
