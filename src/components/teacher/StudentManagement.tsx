"use client";

import { useState, useTransition } from "react";
import {
  approveProUpgrade,
  createTeacherGroup,
  updateStudentStatus,
  updateStudentTier,
} from "@/actions/teacher";
import type { TeacherGroup, TeacherStudentRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Crown, UserCheck, UserX } from "lucide-react";
import { StudentGroupSelect } from "@/components/teacher/StudentGroupSelect";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

interface StudentManagementProps {
  students: TeacherStudentRow[];
  groups: TeacherGroup[];
}

export function StudentManagement({
  students: initial,
  groups: initialGroups,
}: StudentManagementProps) {
  const [students, setStudents] = useState(initial);
  const [groups] = useState(initialGroups);
  const [filterTier, setFilterTier] = useState<"all" | "free" | "pro">("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "active" | "deactivated"
  >("all");
  const [newGroupName, setNewGroupName] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = students.filter((s) => {
    if (filterTier !== "all" && s.tier !== filterTier) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  const refreshStudent = (linkId: string, patch: Partial<TeacherStudentRow>) => {
    setStudents((prev) =>
      prev.map((s) => (s.linkId === linkId ? { ...s, ...patch } : s))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" {...spekit(SPEKIT.studentFilters)}>
        {(["all", "free", "pro"] as const).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={filterTier === t ? "default" : "outline"}
            onClick={() => setFilterTier(t)}
          >
            {t === "all" ? "كل المستويات" : t === "free" ? "مجاني" : "Pro"}
          </Button>
        ))}
        {(["all", "active", "pending", "deactivated"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filterStatus === s ? "default" : "outline"}
            onClick={() => setFilterStatus(s)}
          >
            {s === "all"
              ? "كل الحالات"
              : s === "active"
                ? "نشط"
                : s === "pending"
                  ? "معلق"
                  : "معطّل"}
          </Button>
        ))}
      </div>

      <Card
        className="overflow-hidden border-border/70 shadow-sm"
        {...spekit(SPEKIT.createGroupForm)}
      >
        <CardHeader className="p-6 pb-4 text-start">
          <CardTitle className="text-base font-semibold">
            إنشاء مجموعة دراسية
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="اسم المجموعة — مثال: شعبة أ"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="h-11 min-h-[44px] flex-1 bg-muted/40 px-4 py-2 text-start text-sm shadow-none"
            />
            <Button
              variant="brand"
              disabled={pending || !newGroupName.trim()}
              className="h-11 shrink-0 px-5 active:scale-[0.98]"
              onClick={() =>
                startTransition(async () => {
                  await createTeacherGroup(newGroupName.trim());
                  setNewGroupName("");
                })
              }
            >
              إضافة
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filtered.map((student) => (
          <Card
            key={student.linkId}
            className="overflow-hidden border-border/70 shadow-sm"
            {...spekit(SPEKIT.studentCard)}
          >
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1 space-y-3 text-start">
                <div className="space-y-1.5">
                  <p className="text-base font-semibold leading-snug">
                    {student.fullName}
                  </p>
                  <p
                    className="text-xs text-muted-foreground"
                    dir="ltr"
                  >
                    {student.whatsappNumber}
                  </p>
                  <div
                    className="flex flex-wrap gap-2 pt-0.5"
                    {...(student.upgradeRequested
                      ? spekit(SPEKIT.proApprovalPanel)
                      : {})}
                  >
                    <StatusBadge tone={student.tier === "pro" ? "pro" : "free"}>
                      {student.tier === "pro" ? "Pro" : "مجاني"}
                    </StatusBadge>
                    <StatusBadge
                      tone={
                        student.status === "active"
                          ? "active"
                          : student.status === "pending"
                            ? "pending"
                            : "deactivated"
                      }
                    >
                      {student.status === "active"
                        ? "نشط"
                        : student.status === "pending"
                          ? "معلق"
                          : "معطّل"}
                    </StatusBadge>
                    {student.upgradeRequested && (
                      <StatusBadge tone="upgrade">طلب ترقية Pro</StatusBadge>
                    )}
                  </div>
                </div>

                {groups.length > 0 && (
                  <div className="flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-center">
                    <span className="shrink-0 text-sm font-medium text-muted-foreground">
                      المجموعة
                    </span>
                    <StudentGroupSelect
                      studentId={student.studentId}
                      groups={groups}
                      disabled={pending}
                    />
                    {student.groupNames.length > 0 && (
                      <span className="text-xs font-medium text-brand-700">
                        {student.groupNames.join("، ")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 md:ps-4">
                {student.status !== "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3"
                    disabled={pending}
                    {...spekit(SPEKIT.studentActivateButton)}
                    onClick={() =>
                      startTransition(async () => {
                        await updateStudentStatus(student.linkId, "active");
                        refreshStudent(student.linkId, { status: "active" });
                      })
                    }
                  >
                    <UserCheck className="size-3.5" /> تفعيل
                  </Button>
                )}
                {student.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3"
                    disabled={pending}
                    {...spekit(SPEKIT.studentDeactivateButton)}
                    onClick={() =>
                      startTransition(async () => {
                        await updateStudentStatus(
                          student.linkId,
                          "deactivated"
                        );
                        refreshStudent(student.linkId, {
                          status: "deactivated",
                        });
                      })
                    }
                  >
                    <UserX className="size-3.5" /> تعطيل
                  </Button>
                )}
                {student.upgradeRequested && (
                  <Button
                    size="sm"
                    className="h-9 bg-amber-600 px-3 hover:bg-amber-700"
                    disabled={pending}
                    {...spekit(SPEKIT.proApproveButton)}
                    onClick={() =>
                      startTransition(async () => {
                        await approveProUpgrade(student.linkId);
                        refreshStudent(student.linkId, {
                          tier: "pro",
                          upgradeRequested: false,
                        });
                      })
                    }
                  >
                    <Crown className="size-3.5" /> قبول Pro
                  </Button>
                )}
                {student.tier === "free" && !student.upgradeRequested && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9 px-3"
                    disabled={pending}
                    {...spekit(SPEKIT.studentManualProUpgrade)}
                    onClick={() =>
                      startTransition(async () => {
                        await updateStudentTier(student.linkId, "pro");
                        refreshStudent(student.linkId, { tier: "pro" });
                      })
                    }
                  >
                    ترقية Pro
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            ما في طلاب بهالفلتر.
          </p>
        )}
      </div>
    </div>
  );
}
