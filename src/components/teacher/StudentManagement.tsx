"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveProUpgrade,
  deleteStudentLink,
  toggleStudentStatus,
  updateStudentTier,
} from "@/actions/teacher";
import type { TeacherGroup, TeacherStudentRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  Crown,
  Plus,
  RotateCcw,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentsTable } from "@/components/teacher/StudentsTable";
import { AddStudentDialog } from "@/components/teacher/AddStudentDialog";
import { CreateGroupDialog } from "@/components/teacher/CreateGroupDialog";
import { EditStudentDialog } from "@/components/teacher/EditStudentDialog";
import { DeleteStudentConfirmDialog } from "@/components/teacher/DeleteStudentConfirmDialog";
import { HubToast } from "@/components/teacher/HubToast";
import {
  filterStudentsByQuery,
  paginateStudents,
  STUDENT_PAGE_SIZE,
} from "@/lib/paginate-students";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

const FILTER_ALL = "all";

const TIER_LABELS: Record<string, string> = {
  all: "جميع المستويات",
  free: "مجاني",
  pro: "Pro",
};

const STATUS_LABELS: Record<string, string> = {
  all: "جميع الحالات",
  active: "نشط",
  pending: "معلق",
  deactivated: "معطل",
  inactive: "معطل",
};

/** Single active hub modal — prevents stacked Dialog portals / focus traps. */
type HubModalType =
  | "ADD_STUDENT"
  | "EDIT_STUDENT"
  | "CREATE_GROUP"
  | "DELETE_STUDENT"
  | "DEACTIVATE_STUDENT"
  | null;

interface StudentManagementProps {
  students: TeacherStudentRow[];
  groups: TeacherGroup[];
}

export function StudentManagement({
  students: initial,
  groups: initialGroups,
}: StudentManagementProps) {
  const router = useRouter();
  const [students, setStudents] = useState(initial);
  const [groups, setGroups] = useState(initialGroups);

  useEffect(() => {
    setStudents(initial);
  }, [initial]);

  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<"all" | "free" | "pro">("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "active" | "deactivated"
  >("all");
  const [filterGroupId, setFilterGroupId] = useState<"all" | string>("all");
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();

  const [activeModal, setActiveModal] = useState<HubModalType>(null);
  const [selectedStudent, setSelectedStudent] =
    useState<TeacherStudentRow | null>(null);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedStudent(null);
  }, []);

  const openModal = useCallback(
    (type: Exclude<HubModalType, null>, student: TeacherStudentRow | null = null) => {
      setSelectedStudent(student);
      setActiveModal(type);
    },
    []
  );

  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const dismissToast = useCallback(() => setToast(null), []);

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    setToastTone(tone);
    setToast(message);
  };

  const kpi = useMemo(() => {
    const totalStudents = students.length;
    const activePro = students.filter(
      (s) => s.tier === "pro" && s.status === "active"
    ).length;
    const pendingRequests = students.filter(
      (s) => s.status === "pending" || s.upgradeRequested
    ).length;
    return { totalStudents, activePro, pendingRequests };
  }, [students]);

  const filtered = useMemo(() => {
    let rows = filterStudentsByQuery(students, search);
    if (filterTier !== "all") {
      rows = rows.filter((s) => s.tier === filterTier);
    }
    if (filterStatus !== "all") {
      rows = rows.filter((s) => s.status === filterStatus);
    }
    if (filterGroupId !== "all") {
      rows = rows.filter((s) => s.groupId === filterGroupId);
    }
    return rows;
  }, [students, search, filterTier, filterStatus, filterGroupId]);

  const { items, page: safePage, totalPages, total } = paginateStudents(
    filtered,
    page,
    STUDENT_PAGE_SIZE
  );

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  const refreshStudent = (linkId: string, patch: Partial<TeacherStudentRow>) => {
    setStudents((prev) =>
      prev.map((s) => (s.linkId === linkId ? { ...s, ...patch } : s))
    );
  };

  const resetPage = () => setPage(1);

  const hasActiveFilters =
    search.trim() !== "" ||
    filterTier !== FILTER_ALL ||
    filterStatus !== FILTER_ALL ||
    filterGroupId !== FILTER_ALL;

  const resetFilters = () => {
    setSearch("");
    setFilterTier(FILTER_ALL);
    setFilterStatus(FILTER_ALL);
    setFilterGroupId(FILTER_ALL);
    resetPage();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" dir="rtl">
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
            <Users className="size-5" />
          </span>
          <div className="min-w-0 text-start">
            <p className="text-xs font-medium text-muted-foreground">
              إجمالي الطلاب
            </p>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {kpi.totalStudents}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-amber-200/70 bg-gradient-to-l from-amber-50/80 to-emerald-50/50 p-4 shadow-sm">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 ring-1 ring-amber-200">
            <Crown className="size-5" />
          </span>
          <div className="min-w-0 text-start">
            <p className="text-xs font-medium text-amber-800/80">
              المشتركين النشطين
            </p>
            <p className="text-2xl font-bold tabular-nums text-amber-950">
              {kpi.activePro}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-amber-200/80 bg-card p-4 shadow-sm">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
            <Clock className="size-5" />
          </span>
          <div className="min-w-0 text-start">
            <p className="text-xs font-medium text-muted-foreground">
              طلبيات معلقة
            </p>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {kpi.pendingRequests}
            </p>
          </div>
        </div>
      </div>

      <div
        className="space-y-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm"
        dir="rtl"
      >
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1" {...spekit(SPEKIT.studentSearch)}>
            <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              placeholder="بحث باسم الطالب أو رقم الواتساب..."
              className="h-10 rounded-lg border-input bg-background pe-3 ps-9 text-sm text-start placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="h-10"
              onClick={() => openModal("CREATE_GROUP")}
            >
              <Plus className="size-4" />
              مجموعة جديدة
            </Button>
            <Button
              variant="brand"
              className="h-10"
              {...spekit(SPEKIT.addStudentButton)}
              onClick={() => openModal("ADD_STUDENT")}
            >
              <UserPlus className="size-4" />
              إضافة طالب جديد
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "grid grid-cols-1 gap-2.5",
            groups.length > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"
          )}
          {...spekit(SPEKIT.studentFilters)}
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              المستوى
            </label>
            <Select
              value={filterTier}
              onValueChange={(value) => {
                if (!value || typeof value !== "string") return;
                setFilterTier(value as "all" | "free" | "pro");
                resetPage();
              }}
            >
              <SelectTrigger className="h-10 w-full min-w-0 rounded-lg bg-background text-start shadow-none">
                <SelectValue placeholder={TIER_LABELS.all}>
                  {TIER_LABELS[filterTier] ?? TIER_LABELS.all}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start" className="min-w-[var(--anchor-width)]">
                <SelectItem value="all">{TIER_LABELS.all}</SelectItem>
                <SelectItem value="free">{TIER_LABELS.free}</SelectItem>
                <SelectItem value="pro">{TIER_LABELS.pro}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              الحالة
            </label>
            <Select
              value={filterStatus}
              onValueChange={(value) => {
                if (!value || typeof value !== "string") return;
                setFilterStatus(
                  value as "all" | "pending" | "active" | "deactivated"
                );
                resetPage();
              }}
            >
              <SelectTrigger className="h-10 w-full min-w-0 rounded-lg bg-background text-start shadow-none">
                <SelectValue placeholder={STATUS_LABELS.all}>
                  {STATUS_LABELS[filterStatus] ?? STATUS_LABELS.all}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start" className="min-w-[var(--anchor-width)]">
                <SelectItem value="all">{STATUS_LABELS.all}</SelectItem>
                <SelectItem value="active">{STATUS_LABELS.active}</SelectItem>
                <SelectItem value="pending">{STATUS_LABELS.pending}</SelectItem>
                <SelectItem value="deactivated">
                  {STATUS_LABELS.deactivated}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {groups.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                المجموعة الدراسية
              </label>
              <Select
                value={filterGroupId}
                onValueChange={(value) => {
                  if (!value || typeof value !== "string") return;
                  setFilterGroupId(value);
                  resetPage();
                }}
              >
                <SelectTrigger className="h-10 w-full min-w-0 rounded-lg bg-background text-start shadow-none">
                  <SelectValue placeholder="جميع المجموعات">
                    {filterGroupId === FILTER_ALL
                      ? "جميع المجموعات"
                      : (groups.find((g) => g.id === filterGroupId)
                          ?.group_name ?? "جميع المجموعات")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  className="min-w-[var(--anchor-width)]"
                >
                  <SelectItem value="all">جميع المجموعات</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.group_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
            <span className="text-xs font-medium text-muted-foreground">
              التصفية النشطة:
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={resetFilters}
            >
              <RotateCcw className="size-3.5" />
              إعادة ضبط
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {items.length > 0 && (
          <StudentsTable
            students={items}
            groups={groups}
            pending={pending}
            page={safePage}
            totalPages={totalPages}
            total={total}
            pageSize={STUDENT_PAGE_SIZE}
            onPageChange={setPage}
            onGroupChanged={(linkId, gid, gname) =>
              refreshStudent(linkId, {
                groupId: gid,
                groupNames: gname ? [gname] : [],
              })
            }
            onActivate={(student) =>
              startTransition(async () => {
                const result = await toggleStudentStatus(
                  student.linkId,
                  "active"
                );
                if (!result.ok) {
                  showToast(result.error, "error");
                  return;
                }
                refreshStudent(student.linkId, { status: "active" });
                showToast("تم تفعيل الطالب.");
              })
            }
            onDeactivate={(student) =>
              openModal("DEACTIVATE_STUDENT", student)
            }
            onApprovePro={(student) =>
              startTransition(async () => {
                await approveProUpgrade(student.linkId);
                refreshStudent(student.linkId, {
                  tier: "pro",
                  upgradeRequested: false,
                });
                showToast("تمت الموافقة على Pro.");
              })
            }
            onUpgradePro={(student) =>
              startTransition(async () => {
                await updateStudentTier(student.linkId, "pro");
                refreshStudent(student.linkId, { tier: "pro" });
                showToast("تمت ترقية الطالب إلى Pro.");
              })
            }
            onRevokePro={(student) =>
              startTransition(async () => {
                await updateStudentTier(student.linkId, "free");
                refreshStudent(student.linkId, { tier: "free" });
                showToast("تم سحب صلاحية Pro.");
              })
            }
            onEdit={(student) => openModal("EDIT_STUDENT", student)}
            onDelete={(student) => openModal("DELETE_STUDENT", student)}
          />
        )}

        {students.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            ما في طلاب بعد — ابدأ بإضافة طالب جديد.
          </p>
        )}
        {students.length > 0 && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            لا يوجد طلاب يطابقون خيارات البحث
          </p>
        )}
      </div>

      <AddStudentDialog
        open={activeModal === "ADD_STUDENT"}
        groups={groups}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        onSuccess={(msg) => {
          closeModal();
          showToast(msg);
          router.refresh();
        }}
        onError={(msg) => showToast(msg, "error")}
      />

      <CreateGroupDialog
        open={activeModal === "CREATE_GROUP"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        onSuccess={(msg) => {
          closeModal();
          showToast(msg);
          router.refresh();
        }}
        onError={(msg) => showToast(msg, "error")}
      />

      <EditStudentDialog
        open={activeModal === "EDIT_STUDENT"}
        student={
          activeModal === "EDIT_STUDENT" ? selectedStudent : null
        }
        groups={groups}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        onSuccess={(linkId, patch, msg) => {
          refreshStudent(linkId, patch);
          closeModal();
          showToast(msg);
        }}
        onError={(msg) => showToast(msg, "error")}
      />

      <DeleteStudentConfirmDialog
        open={activeModal === "DELETE_STUDENT"}
        studentName={selectedStudent?.fullName ?? ""}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        onConfirm={() => {
          if (!selectedStudent) return;
          const target = selectedStudent;
          startTransition(async () => {
            const result = await deleteStudentLink(target.linkId);
            if (!result.ok) {
              showToast(result.error, "error");
              return;
            }
            setStudents((prev) =>
              prev.filter((s) => s.linkId !== target.linkId)
            );
            closeModal();
            showToast("تم حذف الطالب من قائمتك.");
          });
        }}
      />

      <AlertDialog
        open={activeModal === "DEACTIVATE_STUDENT"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تعطيل حساب الطالب</AlertDialogTitle>
            <AlertDialogDescription>
              تعطيل {selectedStudent?.fullName} سيوقف وصوله مؤقتاً للاختبارات
              حتى تعيد تفعيله.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!selectedStudent) return;
                const target = selectedStudent;
                startTransition(async () => {
                  const result = await toggleStudentStatus(
                    target.linkId,
                    "deactivated"
                  );
                  if (!result.ok) {
                    showToast(result.error, "error");
                    return;
                  }
                  refreshStudent(target.linkId, { status: "deactivated" });
                  closeModal();
                  showToast("تم تعطيل الطالب.");
                });
              }}
            >
              تأكيد التعطيل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <HubToast message={toast} tone={toastTone} onDismiss={dismissToast} />
    </div>
  );
}
