"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminStudentDetail } from "@/types/database";
import { Button } from "@/components/ui/button";
import { DeleteStudentPurgeDialog } from "@/components/admin/DeleteStudentPurgeDialog";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { ArrowRight, Trash2 } from "lucide-react";

const EDUCATION_LABELS: Record<string, string> = {
  primary: "ابتدائي",
  preparatory: "إعدادي",
  secondary: "ثانوي",
  baccalaureate: "بكالوريا",
  university: "جامعي",
  other: "أخرى",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  active: "نشط",
  deactivated: "معطّل",
};

const TIER_LABELS: Record<string, string> = {
  free: "مجاني",
  pro: "Pro",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-SY", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-bold text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold text-foreground">{value || "—"}</dd>
    </div>
  );
}

interface AdminStudentDetailViewProps {
  student: AdminStudentDetail;
}

export function AdminStudentDetailView({
  student,
}: AdminStudentDetailViewProps) {
  const router = useRouter();
  const [purgeOpen, setPurgeOpen] = useState(false);
  const phone = student.whatsappNumber || student.phoneNumber || "—";

  return (
    <div
      className="space-y-6"
      dir="rtl"
      {...spekit(SPEKIT.adminStudentDetailPage)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/admin/students"
            className="inline-flex h-10 items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="size-4" />
            العودة إلى قائمة الطلاب
          </Link>
          <h1 className="text-2xl font-extrabold">{student.fullName}</h1>
          <p className="text-sm text-muted-foreground">
            ملف الطالب على المنصة — للعرض فقط
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          className="h-11 shrink-0 gap-2"
          onClick={() => setPurgeOpen(true)}
        >
          <Trash2 className="size-4" />
          حذف نهائي
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-native p-4">
          <p className="text-xs font-bold text-muted-foreground">
            روابط المدرسين
          </p>
          <p className="mt-1 text-2xl font-extrabold">
            {student.teacherLinkCount}
          </p>
        </div>
        <div className="card-native p-4">
          <p className="text-xs font-bold text-muted-foreground">
            محاولات الاختبار
          </p>
          <p className="mt-1 text-2xl font-extrabold">
            {student.submissionCount}
          </p>
        </div>
        <div className="card-native p-4">
          <p className="text-xs font-bold text-muted-foreground">
            تاريخ الإنشاء
          </p>
          <p className="mt-1 text-base font-extrabold">
            {formatDate(student.createdAt)}
          </p>
        </div>
      </div>

      <section className="card-native space-y-4 p-5">
        <h2 className="text-base font-extrabold">بيانات الحساب</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="الاسم الكامل" value={student.fullName} />
          <Field label="واتساب" value={phone} />
          <Field label="البريد" value={student.email ?? "—"} />
          <Field label="المدرسة" value={student.schoolName || "—"} />
          <Field label="تاريخ الميلاد" value={formatDate(student.birthDate)} />
          <Field
            label="المرحلة الدراسية"
            value={
              student.educationStage
                ? (EDUCATION_LABELS[student.educationStage] ??
                  student.educationStage)
                : "—"
            }
          />
          <Field label="المحافظة" value={student.province ?? "—"} />
          <Field label="المدينة" value={student.city ?? "—"} />
          <Field label="العنوان" value={student.address || "—"} />
          <Field
            label="اكتمال الملف"
            value={student.profileCompleted ? "مكتمل" : "غير مكتمل"}
          />
          <Field
            label="التهيئة الأولى"
            value={student.onboardingCompleted ? "تمت" : "لم تتم"}
          />
        </dl>
      </section>

      <section className="card-native space-y-4 p-5">
        <h2 className="text-base font-extrabold">المدرسون المرتبطون</h2>
        {student.teacherLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            لا يوجد روابط حالية — طالب غير مرتبط (يتيم).
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead className="border-b bg-muted/40 text-xs font-bold text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-start">المدرس</th>
                  <th className="px-3 py-2 text-start">الحالة</th>
                  <th className="px-3 py-2 text-start">الباقة</th>
                  <th className="px-3 py-2 text-start">تاريخ الربط</th>
                </tr>
              </thead>
              <tbody>
                {student.teacherLinks.map((link) => (
                  <tr key={link.linkId} className="border-b last:border-0">
                    <td className="px-3 py-2.5 font-semibold">
                      {link.teacherName}
                    </td>
                    <td className="px-3 py-2.5">
                      {STATUS_LABELS[link.status] ?? link.status}
                    </td>
                    <td className="px-3 py-2.5">
                      {TIER_LABELS[link.tier] ?? link.tier}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {formatDate(link.linkedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DeleteStudentPurgeDialog
        open={purgeOpen}
        student={student}
        onOpenChange={setPurgeOpen}
        onDeleted={() => {
          router.push("/admin/students");
          router.refresh();
        }}
      />
    </div>
  );
}
