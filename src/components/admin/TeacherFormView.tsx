"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import type {
  AdminTeacherRow,
  SubjectCatalogItem,
  TeacherAccountStatus,
} from "@/types/database";
import { Button, buttonVariants } from "@/components/ui/button";
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
    <Label htmlFor={htmlFor} className="text-sm font-bold text-foreground">
      {children}
    </Label>
  );
}

function IconInput({
  icon: Icon,
  inputDir,
  className,
  ...props
}: ComponentProps<typeof Input> & {
  icon: typeof Mail;
  inputDir?: "rtl" | "ltr";
}) {
  const isLtr = inputDir === "ltr";

  return (
    <div className="relative">
      <Icon
        className={cn(
          "pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-emerald-600 dark:text-emerald-400",
          isLtr ? "left-3.5" : "right-3.5"
        )}
        aria-hidden
      />
      <Input
        {...props}
        dir={inputDir}
        className={cn(
          "h-12 rounded-xl border-emerald-100/80 bg-background focus:bg-background dark:border-emerald-900/40",
          isLtr ? "pl-10 text-start" : "pr-10",
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
    <Card className="overflow-visible rounded-2xl border-emerald-100/80 shadow-sm ring-emerald-500/10 dark:border-emerald-900/40">
      <CardHeader className="border-b border-emerald-50 bg-gradient-to-l from-emerald-50/80 to-transparent dark:border-emerald-950/50 dark:from-emerald-950/30">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Icon className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base font-extrabold">{title}</CardTitle>
            <CardDescription className="mt-1 text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">{children}</CardContent>
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
    <div dir="rtl" className="pb-28" {...spekit(SPEKIT.adminTeacherFormPage)}>
      <header className="mb-8 space-y-4">
        <Link
          href="/admin/teachers"
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/60 px-3.5 py-2 text-xs font-bold text-emerald-800 transition-colors hover:border-emerald-300 hover:bg-emerald-100/80 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
        >
          <ArrowRight className="size-4 shrink-0" aria-hidden />
          العودة إلى قائمة المدرسين
        </Link>

        <div className="flex items-start gap-4">
          {isEdit && teacher ? <TeacherAvatar fullName={teacher.fullName} /> : null}
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {isEdit
                ? "حدّث معلومات المدرس، المواد، وإعدادات الأمان في أقسام واضحة."
                : "أنشئ حساب مدرس جديد بكل الحقول المطلوبة — بدون تمرير داخل نافذة منبثقة."}
            </p>
          </div>
        </div>
      </header>

      <form id={formId} onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-5">
        <SectionCard
          title="المعلومات الأساسية"
          description="الاسم وبيانات التواصل المستخدمة في الحساب."
          icon={User}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <FieldLabel htmlFor="full_name">الاسم الكامل</FieldLabel>
              <IconInput
                id="full_name"
                icon={User}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="email">البريد الإلكتروني</FieldLabel>
              <IconInput
                id="email"
                icon={Mail}
                type="email"
                inputDir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
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
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-all duration-200",
                    active
                      ? "border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/35"
                      : "border-border/80 bg-muted/40 text-muted-foreground hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 hover:shadow-sm dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200"
                  )}
                >
                  {active ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-white/20">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  ) : null}
                  {subject.nameAr}
                </button>
              );
            })}
          </div>
          {subjectIds.length === 0 ? (
            <p className="text-xs font-semibold text-muted-foreground">
              لم يتم اختيار أي مادة بعد.
            </p>
          ) : null}
        </SectionCard>

        <SectionCard
          title="إعدادات الحساب والأمان"
          description="الحالة، حدود الاختبارات، وكلمة المرور."
          icon={Shield}
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <FieldLabel>حالة الحساب</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {(["active", "inactive"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(value)}
                    className={cn(
                      "rounded-xl px-5 py-2.5 text-sm font-bold transition",
                      status === value
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {value === "active" ? "نشط" : "معطّل"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
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
                className="max-w-xs"
              />
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <FieldLabel>
                {isEdit ? "إعادة تعيين كلمة المرور" : "كلمة المرور الأولية"}
              </FieldLabel>

              {isEdit ? (
                <div className="mt-3 space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={resetPassword}
                      onChange={(e) => setResetPassword(e.target.checked)}
                      className="size-4 rounded border-emerald-300"
                    />
                    تفعيل إعادة تعيين كلمة المرور
                  </label>
                  {resetPassword ? (
                    <>
                      <label className="flex items-center gap-2 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={resetGeneratePassword}
                          onChange={(e) => setResetGeneratePassword(e.target.checked)}
                          className="size-4 rounded border-emerald-300"
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
                <div className="mt-3 space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={generatePassword}
                      onChange={(e) => setGeneratePassword(e.target.checked)}
                      className="size-4 rounded border-emerald-300"
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
            className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive"
          >
            {error}
          </div>
        ) : null}
      </form>

      <footer className="sticky bottom-0 z-20 mt-10 border-t border-emerald-100/90 bg-background/95 shadow-[0_-8px_30px_-12px_rgba(5,150,105,0.18)] backdrop-blur-md dark:border-emerald-900/50 supports-[backdrop-filter]:bg-background/90">
        <div className="mx-auto flex max-w-3xl flex-col-reverse gap-3 px-1 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
          <Link
            href="/admin/teachers"
            className={cn(
              buttonVariants({ variant: "outline", size: "touch" }),
              "rounded-xl border-emerald-200/80 bg-background text-center shadow-sm hover:bg-emerald-50/50 dark:border-emerald-800/60"
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
            className="rounded-xl shadow-lg shadow-emerald-600/25"
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
