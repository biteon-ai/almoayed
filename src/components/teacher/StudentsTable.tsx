"use client";

import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  MessageCircle,
  MoreVertical,
  Pencil,
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

interface StudentsTableProps {
  students: TeacherStudentRow[];
  groups: TeacherGroup[];
  pending?: boolean;
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

export function StudentsTable({
  students,
  groups,
  pending,
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
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div
      className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
      dir="rtl"
      {...spekit(SPEKIT.studentPagination)}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/50">
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className="h-11 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                الطالب
              </TableHead>
              <TableHead className="h-11 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                رقم الواتساب
              </TableHead>
              <TableHead className="h-11 min-w-[9rem] text-xs font-medium uppercase tracking-wider text-muted-foreground">
                المجموعة
              </TableHead>
              <TableHead className="h-11 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                المستوى
              </TableHead>
              <TableHead className="h-11 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                الحالة
              </TableHead>
              <TableHead className="h-11 w-12 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow
                key={student.linkId}
                className="h-14 hover:bg-muted/30"
                {...spekit(SPEKIT.studentCard)}
              >
                <TableCell className="py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-800 ring-1 ring-brand-100"
                    >
                      {studentInitials(student.fullName)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {student.fullName}
                      </p>
                      {student.upgradeRequested && (
                        <p
                          className="truncate text-[11px] font-medium text-amber-700"
                          {...spekit(SPEKIT.proApprovalPanel)}
                        >
                          طلب ترقية Pro
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-2.5">
                  <a
                    href={whatsappHref(student.whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-[#25D366]/10 hover:text-foreground"
                    dir="ltr"
                    title="فتح واتساب"
                  >
                    <MessageCircle className="size-3.5 shrink-0 text-[#25D366]" />
                    {student.whatsappNumber}
                  </a>
                </TableCell>

                <TableCell className="py-2.5">
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

                <TableCell className="py-2.5">
                  {student.tier === "pro" ? (
                    <Badge
                      variant="outline"
                      className="gap-1 border-amber-200 bg-gradient-to-l from-amber-50 to-emerald-50 font-semibold text-amber-800"
                    >
                      <Crown className="size-3" />
                      Pro
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      مجاني
                    </Badge>
                  )}
                </TableCell>

                <TableCell className="py-2.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1 font-semibold",
                      student.status === "active" &&
                        "border-emerald-200 bg-emerald-50 text-emerald-700",
                      student.status === "pending" &&
                        "border-amber-200 bg-amber-50 text-amber-700",
                      student.status === "deactivated" &&
                        "border-red-200 bg-red-50 text-red-700"
                    )}
                  >
                    {student.status === "active" && (
                      <CheckCircle2 className="size-3" />
                    )}
                    {student.status === "pending" && (
                      <Clock className="size-3" />
                    )}
                    {student.status === "deactivated" && (
                      <Ban className="size-3" />
                    )}
                    {student.status === "active"
                      ? "نشط"
                      : student.status === "pending"
                        ? "معلق"
                        : "معطل"}
                  </Badge>
                </TableCell>

                <TableCell className="py-2.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={pending}
                      aria-label={`إجراءات ${student.fullName}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                    >
                      <MoreVertical className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="bottom">
                      <DropdownMenuItem
                        disabled={pending}
                        onClick={() => onEdit(student)}
                      >
                        <Pencil className="size-3.5" />
                        تعديل
                      </DropdownMenuItem>
                      {student.status !== "active" ? (
                        <DropdownMenuItem
                          disabled={pending}
                          onClick={() => onActivate(student)}
                          {...spekit(SPEKIT.studentActivateButton)}
                        >
                          <UserCheck className="size-3.5" />
                          تفعيل
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          disabled={pending}
                          onClick={() => onDeactivate(student)}
                          {...spekit(SPEKIT.studentDeactivateButton)}
                        >
                          <UserX className="size-3.5" />
                          تعطيل
                        </DropdownMenuItem>
                      )}
                      {student.upgradeRequested ? (
                        <DropdownMenuItem
                          disabled={pending}
                          onClick={() => onApprovePro(student)}
                          {...spekit(SPEKIT.proApproveButton)}
                        >
                          <Crown className="size-3.5" />
                          قبول Pro
                        </DropdownMenuItem>
                      ) : student.tier === "free" ? (
                        <DropdownMenuItem
                          disabled={pending}
                          onClick={() => onUpgradePro(student)}
                          {...spekit(SPEKIT.studentManualProUpgrade)}
                        >
                          <Crown className="size-3.5" />
                          ترقية Pro
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          disabled={pending}
                          onClick={() => onRevokePro(student)}
                        >
                          <Crown className="size-3.5" />
                          سحب Pro
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        destructive
                        disabled={pending}
                        onClick={() => onDelete(student)}
                      >
                        <Trash2 className="size-3.5" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          عرض {rangeStart}-{rangeEnd} من أصل {total} طلاب
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            aria-label="الصفحة السابقة"
          >
            <ChevronRight className="size-4" />
            السابق
          </Button>
          <span className="min-w-[4.5rem] text-center text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            aria-label="الصفحة التالية"
          >
            التالي
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
