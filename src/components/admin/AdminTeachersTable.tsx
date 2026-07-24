"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { AdminTeacherRow } from "@/types/database";
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteTeacherDialog } from "@/components/admin/DeleteTeacherDialog";
import { AdminTeacherActionConfirmModal } from "@/components/admin/AdminTeacherActionConfirmModal";
import {
  AdminTeachersStats,
  TeacherAvatar,
  type AdminTeachersStatsSummary,
} from "@/components/admin/AdminTeachersStats";
import { TEACHER_FLASH_KEY } from "@/components/admin/TeacherFormView";
import { PaginationControls } from "@/components/ui/pagination-controls";
import type { PagedResult } from "@/lib/pagination-server";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import {
  Filter,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  UserCog,
} from "lucide-react";

interface AdminTeachersTableProps {
  stats: AdminTeachersStatsSummary;
}

const STATUS_ITEMS: Record<string, string> = {
  all: "كل الحالات",
  active: "نشط",
  inactive: "معطّل",
};

function TooltipAction({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("group relative", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1 text-[10px] font-bold text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </div>
  );
}

export function AdminTeachersTable({ stats }: AdminTeachersTableProps) {
  const [teachers, setTeachers] = useState<AdminTeacherRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [deleteTeacher, setDeleteTeacher] = useState<AdminTeacherRow | null>(null);
  const [confirmAction, setConfirmAction] = useState<"delete" | "toggle" | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<AdminTeacherRow | null>(null);
  const [statusTogglePending, setStatusTogglePending] = useState(false);

  function openConfirm(action: "delete" | "toggle", teacher: AdminTeacherRow) {
    setSelectedTeacher(teacher);
    setConfirmAction(action);
  }

  function closeConfirm() {
    setConfirmAction(null);
    setSelectedTeacher(null);
  }

  function handleConfirmDelete() {
    if (!selectedTeacher) return;
    setDeleteTeacher(selectedTeacher);
    closeConfirm();
  }

  async function handleConfirmToggle() {
    if (!selectedTeacher) return;
    setStatusTogglePending(true);
    try {
      await toggleStatus(selectedTeacher);
      closeConfirm();
    } finally {
      setStatusTogglePending(false);
    }
  }

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(TEACHER_FLASH_KEY);
      if (!raw) return;
      sessionStorage.removeItem(TEACHER_FLASH_KEY);
      const flash = JSON.parse(raw) as {
        message?: string;
        generatedPassword?: string;
      };
      if (flash.message) {
        setMessage(
          flash.generatedPassword
            ? `${flash.message} كلمة المرور: ${flash.generatedPassword}`
            : flash.message
        );
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (status !== "all") params.set("status", status);
      params.set("page", String(page));
      const res = await fetch(`/api/admin/teachers?${params.toString()}`);
      const data = (await res.json()) as PagedResult<AdminTeacherRow>;
      setTeachers(data.items ?? []);
      setTotal(data.total ?? 0);
      setPageSize(data.pageSize ?? 20);
      if (data.page) setPage(data.page);
    } finally {
      setLoading(false);
    }
  }, [q, status, page]);

  useEffect(() => {
    setPage(1);
  }, [q, status]);

  useEffect(() => {
    const t = setTimeout(() => void loadTeachers(), 200);
    return () => clearTimeout(t);
  }, [loadTeachers]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  async function toggleStatus(teacher: AdminTeacherRow) {
    const next = teacher.status === "active" ? "inactive" : "active";
    const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setMessage(next === "active" ? "تم تفعيل الحساب." : "تم تعطيل الحساب.");
      void loadTeachers();
    }
  }

  async function impersonate(teacher: AdminTeacherRow) {
    const res = await fetch(`/api/admin/impersonate/${teacher.id}`, { method: "POST" });
    const data = (await res.json()) as { error?: string; redirectTo?: string };
    if (!res.ok) {
      setMessage(data.error ?? "تعذر بدء انتحال الشخصية.");
      return;
    }
    window.location.assign(data.redirectTo ?? "/teacher/dashboard");
  }

  return (
    <div className="space-y-5">
      <AdminTeachersStats stats={stats} />

      <div className="card-native p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث بالاسم أو البريد..."
              className="h-11 ps-10"
              {...spekit(SPEKIT.adminTeacherSearch)}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-[10rem]">
              <Filter className="pointer-events-none absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus((value ?? "all") as typeof status);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  className="h-11 ps-10"
                  {...spekit(SPEKIT.adminTeacherStatusFilter)}
                >
                  <SelectValue>
                    {(value) =>
                      STATUS_ITEMS[String(value ?? "all")] ?? "كل الحالات"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_ITEMS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Link
              href="/admin/teachers/new"
              className={cn(buttonVariants({ variant: "brand", size: "touch" }), "shrink-0 gap-2")}
              {...spekit(SPEKIT.adminAddTeacherBtn)}
            >
              <Plus className="size-4" />
              إضافة مدرس جديد
            </Link>
          </div>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-xs font-semibold text-brand-800 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200">
          {message}
        </div>
      ) : null}

      <div className="card-native overflow-hidden" {...spekit(SPEKIT.adminTeachersTable)}>
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="size-7 animate-spin text-brand-600" />
          </div>
        ) : teachers.length === 0 ? (
          <p className="p-10 text-center text-sm font-semibold text-muted-foreground">
            لا يوجد مدرسون يطابقون البحث
          </p>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-start text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">المدرس</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">المواد</th>
                  <th className="px-4 py-3">الاختبارات</th>
                  <th className="px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="border-b transition-colors last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <TeacherAvatar fullName={teacher.fullName} />
                        <div className="min-w-0 space-y-1.5">
                          <p className="truncate font-bold">{teacher.fullName}</p>
                          <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/80 bg-muted/50 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            <Mail className="size-3 shrink-0" />
                            <span className="truncate" dir="ltr">
                              {teacher.email}
                            </span>
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
                          teacher.status === "active"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {teacher.status === "active" ? "نشط" : "معطّل"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex max-w-[14rem] flex-wrap gap-1.5">
                        {teacher.subjects.length > 0 ? (
                          teacher.subjects.map((subject) => (
                            <span
                              key={subject.id}
                              className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-800 dark:bg-brand-950/50 dark:text-brand-200"
                            >
                              {subject.nameAr}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="inline-flex min-w-8 items-center justify-center rounded-xl bg-muted/60 px-2.5 py-1 text-xs font-extrabold tabular-nums">
                        {teacher.quizCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <TooltipAction label="تعديل">
                          <Link
                            href={`/admin/teachers/${teacher.id}/edit`}
                            aria-label="تعديل"
                            className={cn(
                              buttonVariants({ variant: "outline", size: "icon" }),
                              "size-9 rounded-xl"
                            )}
                          >
                            <Pencil className="size-4" />
                          </Link>
                        </TooltipAction>

                        <TooltipAction
                          label={teacher.status === "active" ? "تعطيل الحساب" : "تفعيل الحساب"}
                        >
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="size-9 rounded-xl"
                            aria-label={
                              teacher.status === "active" ? "تعطيل الحساب" : "تفعيل الحساب"
                            }
                            onClick={() => openConfirm("toggle", teacher)}
                          >
                            <Power
                              className={cn(
                                "size-4",
                                teacher.status === "active"
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                              )}
                            />
                          </Button>
                        </TooltipAction>

                        <TooltipAction label="دخول كـ مدرس">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={teacher.status !== "active"}
                            aria-label="دخول كـ مدرس"
                            className="h-9 gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50 px-2.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-40 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/70"
                            onClick={() => void impersonate(teacher)}
                          >
                            <UserCog className="size-4 shrink-0" />
                            <span className="hidden xl:inline">دخول كـ مدرس</span>
                          </Button>
                        </TooltipAction>

                        <TooltipAction label="حذف الحساب">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="size-9 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10"
                            aria-label="حذف الحساب"
                            onClick={() => openConfirm("delete", teacher)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TooltipAction>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 0 ? (
            <div className="border-t px-4 py-3">
              <PaginationControls
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
                itemLabel="مدرس"
                variant="compact"
                showRangeSummary
                showQuickJump
              />
            </div>
          ) : null}
          </>
        )}
      </div>

      {confirmAction && selectedTeacher ? (
        <AdminTeacherActionConfirmModal
          action={confirmAction}
          teacher={selectedTeacher}
          pending={statusTogglePending}
          onCancel={closeConfirm}
          onConfirm={() => {
            if (confirmAction === "delete") {
              handleConfirmDelete();
              return;
            }
            void handleConfirmToggle();
          }}
        />
      ) : null}

      {deleteTeacher ? (
        <DeleteTeacherDialog
          open
          teacher={deleteTeacher}
          otherTeachers={teachers}
          onOpenChange={(open) => !open && setDeleteTeacher(null)}
          onDeleted={() => {
            setMessage("تم حذف حساب المدرس.");
            void loadTeachers();
          }}
        />
      ) : null}
    </div>
  );
}
