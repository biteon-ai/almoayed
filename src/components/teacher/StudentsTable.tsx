"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Ban,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Eye,
  Loader2,
  MessageCircle,
  MoreVertical,
  Pencil,
  Sparkles,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import type { TeacherGroup, TeacherStudentRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StudentGroupSelect } from "@/components/teacher/StudentGroupSelect";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

function studentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0]!.slice(0, 2);
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`;
}

function whatsappHref(number: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

function formatJoinDate(iso: string): string {
  if (!iso) return "مؤخراً";
  try {
    return new Date(iso).toLocaleDateString("ar-SY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "مؤخراً";
  }
}

interface StudentsTableProps {
  students: TeacherStudentRow[];
  groups: TeacherGroup[];
  pending?: boolean;
  pendingActionKey?: string | null;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onGroupChanged: (
    linkId: string,
    groupId: string | null,
    groupName: string | null
  ) => void;
  onActivate: (student: TeacherStudentRow) => void;
  onDeactivate: (student: TeacherStudentRow) => void;
  onApprovePro: (student: TeacherStudentRow) => void;
  onUpgradePro: (student: TeacherStudentRow) => void;
  onRevokePro: (student: TeacherStudentRow) => void;
  onEdit: (student: TeacherStudentRow) => void;
  onDelete: (student: TeacherStudentRow) => void;
}

function TierBadge({ tier }: { tier: TeacherStudentRow["tier"] }) {
  if (tier === "pro") {
    return (
      <Badge className="gap-1 rounded-full border border-amber-300 bg-gradient-to-r from-amber-500/15 to-yellow-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-700 shadow-sm hover:from-amber-500/20 dark:border-amber-700/50 dark:text-amber-400">
        <Crown className="size-3.5 fill-amber-500 text-amber-500" />
        Pro
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="rounded-full border-transparent bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
    >
      مجاني
    </Badge>
  );
}

function StatusPill({ status }: { status: TeacherStudentRow["status"] }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
        <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
        نشط
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300">
        <Clock className="size-3 shrink-0" />
        معلق
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
      <Ban className="size-3 shrink-0" />
      معطل
    </span>
  );
}

export function StudentsTable({
  students,
  groups,
  pending,
  pendingActionKey = null,
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onGroupChanged,
  onActivate,
  onDeactivate,
  onApprovePro,
  onUpgradePro,
  onRevokePro,
  onEdit,
  onDelete,
}: StudentsTableProps) {
  const router = useRouter();
  const [, startNavTransition] = useTransition();
  const [navigatingStudentId, setNavigatingStudentId] = useState<string | null>(
    null
  );
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const navigateToStudent = (studentId: string) => {
    setNavigatingStudentId(studentId);
    startNavTransition(() => {
      router.push(`/teacher/students/${studentId}`);
    });
  };

  const isActionPending = (key: string) =>
    Boolean(pending && pendingActionKey === key);

  const isRowNavigating = (studentId: string) =>
    navigatingStudentId === studentId;

  return (
    <div
      className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm"
      dir="rtl"
      {...spekit(SPEKIT.studentPagination)}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="border-b bg-muted/40">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="py-4 text-right text-sm font-bold text-foreground">
                الطالب
              </TableHead>
              <TableHead className="py-4 text-right text-sm font-bold text-foreground">
                واتساب
              </TableHead>
              <TableHead className="min-w-[10rem] py-4 text-right text-sm font-bold text-foreground">
                المجموعة
              </TableHead>
              <TableHead className="py-4 text-center text-sm font-bold text-foreground">
                المستوى
              </TableHead>
              <TableHead className="py-4 text-center text-sm font-bold text-foreground">
                الحالة
              </TableHead>
              <TableHead className="w-[60px] py-4">
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow
                key={student.linkId}
                role="link"
                tabIndex={0}
                onClick={() => navigateToStudent(student.studentId)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigateToStudent(student.studentId);
                  }
                }}
                className={cn(
                  "relative cursor-pointer border-b transition-colors last:border-0 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10",
                  isRowNavigating(student.studentId) &&
                    "pointer-events-none bg-emerald-50/60 opacity-80 dark:bg-emerald-950/20"
                )}
                {...spekit(SPEKIT.studentCard)}
              >
                <TableCell className="py-3.5 align-middle">
                  <div className="flex min-w-0 items-center gap-3">
                    {isRowNavigating(student.studentId) ? (
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40"
                      >
                        <Loader2 className="size-5 animate-spin text-emerald-600 dark:text-emerald-400" />
                      </span>
                    ) : (
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-emerald-100 bg-emerald-500/10 text-xs font-bold text-emerald-700 dark:border-emerald-900 dark:text-emerald-300"
                      >
                        {studentInitials(student.fullName)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-sm font-bold text-foreground transition-colors hover:text-emerald-600">
                        {student.fullName}
                        {isRowNavigating(student.studentId) ? (
                          <span className="animate-pulse text-xs font-normal text-emerald-600 dark:text-emerald-400">
                            جاري التحميل...
                          </span>
                        ) : null}
                      </p>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="size-3 text-muted-foreground/70" />
                        انضم {formatJoinDate(student.createdAt)}
                      </span>
                      {student.upgradeRequested ? (
                        <span
                          className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800"
                          {...spekit(SPEKIT.proApprovalPanel)}
                        >
                          <Sparkles className="size-3 shrink-0" />
                          طلب ترقية Pro
                        </span>
                      ) : null}
                    </div>
                  </div>
                </TableCell>

                <TableCell
                  className="py-3.5 align-middle"
                  onClick={(event) => event.stopPropagation()}
                >
                  <a
                    href={whatsappHref(student.whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex w-auto min-w-[140px] items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50/80 px-3 py-1.5",
                      "font-mono text-xs font-semibold text-emerald-800 shadow-sm transition-all",
                      "hover:bg-emerald-100 hover:shadow-md dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                    )}
                    title="مراسلة عبر واتساب"
                  >
                    <MessageCircle className="size-3.5 shrink-0 fill-emerald-600/20 text-emerald-600 transition-transform hover:scale-110" />
                    <span dir="ltr" className="whitespace-nowrap">
                      {student.whatsappNumber}
                    </span>
                  </a>
                </TableCell>

                <TableCell
                  className="py-3.5 align-middle"
                  onClick={(event) => event.stopPropagation()}
                >
                  {groups.length > 0 ? (
                    <StudentGroupSelect
                      studentId={student.studentId}
                      groups={groups}
                      groupId={student.groupId}
                      disabled={pending}
                      compact
                      onChanged={(gid, gname) =>
                        onGroupChanged(student.linkId, gid, gname)
                      }
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="py-3.5 text-center align-middle">
                  <TierBadge tier={student.tier} />
                </TableCell>

                <TableCell className="py-3.5 text-center align-middle">
                  <StatusPill status={student.status} />
                </TableCell>

                <TableCell
                  className="py-3.5 text-center align-middle"
                  onClick={(event) => event.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={pending || isRowNavigating(student.studentId)}
                      aria-label={`إجراءات ${student.fullName}`}
                      className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                    >
                      {isRowNavigating(student.studentId) ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <MoreVertical className="size-4" />
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl">
                      <DropdownMenuItem
                        disabled={pending}
                        onClick={() => navigateToStudent(student.studentId)}
                        className="cursor-pointer text-xs"
                      >
                        {isRowNavigating(student.studentId) ? (
                          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                        ) : (
                          <Eye className="size-3.5 text-muted-foreground" />
                        )}
                        عرض التفاصيل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={pending}
                        onClick={() => onEdit(student)}
                        className="cursor-pointer text-xs"
                      >
                        <Pencil className="size-3.5 text-muted-foreground" />
                        تعديل
                      </DropdownMenuItem>
                      {student.status !== "active" ? (
                        <DropdownMenuItem
                          disabled={pending}
                          onClick={() => onActivate(student)}
                          className="cursor-pointer text-xs"
                          {...spekit(SPEKIT.studentActivateButton)}
                        >
                          {isActionPending(`activate:${student.linkId}`) ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="size-3.5 text-muted-foreground" />
                          )}
                          تفعيل
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          disabled={pending}
                          onClick={() => onDeactivate(student)}
                          className="cursor-pointer text-xs"
                          {...spekit(SPEKIT.studentDeactivateButton)}
                        >
                          <UserX className="size-3.5 text-muted-foreground" />
                          تعطيل
                        </DropdownMenuItem>
                      )}
                      {student.upgradeRequested ? (
                        <DropdownMenuItem
                          disabled={pending}
                          onClick={() => onApprovePro(student)}
                          className="cursor-pointer text-xs text-amber-600 dark:text-amber-400"
                          {...spekit(SPEKIT.proApproveButton)}
                        >
                          {isActionPending(`approve-pro:${student.linkId}`) ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Crown className="size-3.5" />
                          )}
                          قبول Pro
                        </DropdownMenuItem>
                      ) : student.tier === "free" ? (
                        <DropdownMenuItem
                          disabled={pending}
                          onClick={() => onUpgradePro(student)}
                          className="cursor-pointer text-xs text-amber-600 dark:text-amber-400"
                          {...spekit(SPEKIT.studentManualProUpgrade)}
                        >
                          {isActionPending(`upgrade-pro:${student.linkId}`) ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Crown className="size-3.5" />
                          )}
                          ترقية Pro
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          disabled={pending}
                          onClick={() => onRevokePro(student)}
                          className="cursor-pointer text-xs text-amber-600 dark:text-amber-400"
                        >
                          {isActionPending(`revoke-pro:${student.linkId}`) ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Crown className="size-3.5" />
                          )}
                          سحب Pro
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        destructive
                        disabled={pending}
                        onClick={() => onDelete(student)}
                        className="cursor-pointer text-xs"
                      >
                        <Trash2 className="size-3.5" />
                        حذف الطالب
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/20 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">
          عرض{" "}
          <span className="tabular-nums text-foreground">
            {rangeStart}–{rangeEnd}
          </span>{" "}
          من أصل{" "}
          <span className="tabular-nums text-foreground">{total}</span> طلاب
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-lg px-3 text-xs"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            aria-label="الصفحة السابقة"
          >
            <ChevronRight className="size-3.5" />
            السابق
          </Button>
          <span className="min-w-[3.5rem] rounded-md bg-background px-2 py-1 text-center text-[11px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border/60">
            {page}/{totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-lg px-3 text-xs"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            aria-label="الصفحة التالية"
          >
            التالي
            <ChevronLeft className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
