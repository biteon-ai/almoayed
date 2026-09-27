"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AdminStudentRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { DeleteStudentPurgeDialog } from "@/components/admin/DeleteStudentPurgeDialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import type { PagedResult } from "@/lib/pagination-server";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import { Eye, Loader2, Search, Trash2 } from "lucide-react";

function formatJoinDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-SY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function displayPhone(student: AdminStudentRow): string {
  return student.whatsappNumber || student.phoneNumber || "—";
}

export function AdminStudentsTable() {
  const [students, setStudents] = useState<AdminStudentRow[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<AdminStudentRow | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      params.set("page", String(page));
      const res = await fetch(`/api/admin/students?${params.toString()}`);
      const data = (await res.json()) as PagedResult<AdminStudentRow>;
      setStudents(data.items ?? []);
      setTotal(data.total ?? 0);
      setPageSize(data.pageSize ?? 20);
      if (data.page) setPage(data.page);
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => void loadStudents(), 200);
    return () => clearTimeout(t);
  }, [loadStudents]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  return (
    <div className="space-y-5" dir="rtl" {...spekit(SPEKIT.adminStudentsTable)}>
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </p>
      ) : null}

      <div className="card-native p-4">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث بالاسم أو واتساب..."
            className="h-11 ps-10"
            {...spekit(SPEKIT.adminStudentSearch)}
          />
        </div>
      </div>

      <div className="card-native overflow-hidden">
        {loading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span>جاري التحميل...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-muted-foreground">
            لا يوجد طلاب مطابقون للبحث.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-start text-sm">
              <thead className="border-b bg-muted/40 text-xs font-bold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start">الاسم</th>
                  <th className="px-4 py-3 text-start">واتساب</th>
                  <th className="px-4 py-3 text-start">روابط المدرسين</th>
                  <th className="px-4 py-3 text-start">تاريخ الإنشاء</th>
                  <th className="px-4 py-3 text-start">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold">{student.fullName}</td>
                    <td className="px-4 py-3 font-mono text-xs dir-ltr text-start">
                      {displayPhone(student)}
                    </td>
                    <td className="px-4 py-3">{student.teacherLinkCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatJoinDate(student.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/students/${student.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "h-10 gap-1.5"
                          )}
                          {...spekit(SPEKIT.adminStudentViewAction)}
                        >
                          <Eye className="size-3.5" />
                          عرض
                        </Link>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-10 gap-1.5"
                          onClick={() => setPurgeTarget(student)}
                        >
                          <Trash2 className="size-3.5" />
                          حذف نهائي
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > 0 ? (
          <PaginationControls
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            itemLabel="طلاب"
            variant="compact"
            showRangeSummary
            className="border-t border-border/60 bg-muted/20 px-4 py-3.5"
          />
        ) : null}
      </div>

      <DeleteStudentPurgeDialog
        open={purgeTarget !== null}
        student={purgeTarget}
        onOpenChange={(open) => {
          if (!open) setPurgeTarget(null);
        }}
        onDeleted={() => {
          setMessage("تم حذف حساب الطالب نهائياً.");
          setPurgeTarget(null);
          void loadStudents();
        }}
      />
    </div>
  );
}
