"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { updateStudentInfo } from "@/actions/teacher";
import type { TeacherGroup, TeacherStudentRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WHATSAPP_DIAL_CODES,
  composeWhatsAppNumber,
  isValidWhatsAppE164,
  splitWhatsAppDial,
  type WhatsAppDialCode,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Loader2, Phone, User, Users } from "lucide-react";

const NONE = "none";
const DEFAULT_DIAL: WhatsAppDialCode = "963";

interface EditStudentDialogProps {
  open: boolean;
  student: TeacherStudentRow | null;
  groups: TeacherGroup[];
  onOpenChange: (open: boolean) => void;
  onSuccess: (
    linkId: string,
    patch: Partial<TeacherStudentRow>,
    message: string
  ) => void;
  onError: (message: string) => void;
}

export function EditStudentDialog({
  open,
  student,
  groups,
  onOpenChange,
  onSuccess,
  onError,
}: EditStudentDialogProps) {
  const [fullName, setFullName] = useState("");
  const [dialCode, setDialCode] = useState<WhatsAppDialCode>(DEFAULT_DIAL);
  const [localWhatsapp, setLocalWhatsapp] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const groupItems = useMemo(() => {
    const map: Record<string, string> = { [NONE]: "بدون مجموعة" };
    for (const g of groups) map[g.id] = g.group_name;
    return map;
  }, [groups]);

  const resetFromStudent = (row: TeacherStudentRow | null) => {
    if (!row) return;
    setFullName(row.fullName);
    const split = splitWhatsAppDial(row.whatsappNumber);
    setDialCode(split.dialCode);
    setLocalWhatsapp(split.national);
    setGroupId(row.groupId);
    setNameError(null);
    setWhatsappError(null);
  };

  useEffect(() => {
    if (open) resetFromStudent(student);
  }, [student, open]);

  const onLocalWhatsappChange = (raw: string) => {
    const cleaned = raw.replace(/[^\d\s+-]/g, "").slice(0, 20);
    setLocalWhatsapp(cleaned);
    if (whatsappError) setWhatsappError(null);
  };

  const resolveWhatsapp = () =>
    composeWhatsAppNumber(dialCode, localWhatsapp);

  const validateClient = (): boolean => {
    let ok = true;
    if (!fullName.trim()) {
      setNameError("يرجى إدخال اسم الطالب.");
      ok = false;
    } else {
      setNameError(null);
    }
    if (!isValidWhatsAppE164(resolveWhatsapp())) {
      setWhatsappError("يرجى إدخال رقم واتساب صحيح");
      ok = false;
    } else {
      setWhatsappError(null);
    }
    return ok;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setNameError(null);
          setWhatsappError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل بيانات الطالب</DialogTitle>
          <DialogDescription>
            حدّث الاسم أو رقم الواتساب أو المجموعة الدراسية.
          </DialogDescription>
        </DialogHeader>

        {student && (
          <form
            className="mt-4 flex min-h-0 flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              if (!validateClient()) return;

              const whatsappNumber = resolveWhatsapp();

              startTransition(async () => {
                const result = await updateStudentInfo({
                  linkId: student.linkId,
                  fullName,
                  whatsappNumber,
                  groupId,
                });
                if (!result.ok) {
                  if (result.field === "fullName") {
                    setNameError(result.error);
                    return;
                  }
                  if (result.field === "whatsapp") {
                    setWhatsappError(result.error);
                    return;
                  }
                  onError(result.error);
                  return;
                }
                onOpenChange(false);
                onSuccess(
                  student.linkId,
                  {
                    fullName: fullName.trim(),
                    whatsappNumber,
                    groupId,
                    groupNames:
                      groupId == null
                        ? []
                        : [
                            groups.find((g) => g.id === groupId)?.group_name ??
                              "",
                          ].filter(Boolean),
                  },
                  "تم حفظ التعديلات"
                );
              });
            }}
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pe-1 [-webkit-overflow-scrolling:touch]">
            <div className="space-y-1.5">
              <label
                htmlFor="edit-student-name"
                className="flex items-center gap-1.5 text-sm font-medium"
              >
                <User className="size-3.5 text-brand-600" />
                اسم الطالب
              </label>
              <Input
                id="edit-student-name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                className={cn(
                  "h-11 text-start",
                  nameError &&
                    "border-destructive aria-invalid:ring-destructive/20"
                )}
                placeholder="مثال: أحمد الخطيب"
                required
                aria-invalid={Boolean(nameError)}
              />
              {nameError ? (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {nameError}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="edit-student-wa"
                className="flex items-center gap-1.5 text-sm font-medium"
              >
                <Phone className="size-3.5 text-brand-600" />
                رقم الواتساب
              </label>
              <div
                className={cn(
                  "input-touch-group h-11 items-stretch",
                  whatsappError &&
                    "border-destructive focus-within:border-destructive focus-within:ring-destructive/20"
                )}
              >
                <Select
                  value={dialCode}
                  onValueChange={(v) => {
                    if (v) setDialCode(String(v) as WhatsAppDialCode);
                  }}
                >
                  <SelectTrigger
                    className="input-touch-prefix !h-auto !w-auto shrink-0 !gap-1 !rounded-none !border-0 !bg-transparent !px-2.5 !py-0 !text-xs !font-semibold shadow-none focus-visible:ring-0"
                    dir="ltr"
                    aria-label="رمز الدولة"
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-[#25D366]" />
                    <SelectValue>
                      {(value: string | null) =>
                        value ? `+${value}` : `+${DEFAULT_DIAL}`
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="start" dir="ltr">
                    {WHATSAPP_DIAL_CODES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        +{c.code} · {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="edit-student-wa"
                  value={localWhatsapp}
                  onChange={(e) => onLocalWhatsappChange(e.target.value)}
                  className="min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 shadow-none focus-visible:ring-0"
                  dir="ltr"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="9xx xxx xxx"
                  aria-invalid={Boolean(whatsappError)}
                />
              </div>
              {whatsappError ? (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {whatsappError}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  اختر رمز الدولة أو الصق الرقم الدولي كاملاً (مثال: 31684183342)
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Users className="size-3.5 text-brand-600" />
                المجموعة الدراسية
              </span>
              <Select
                value={groupId ?? NONE}
                items={groupItems}
                onValueChange={(v) =>
                  setGroupId(!v || v === NONE ? null : String(v))
                }
              >
                <SelectTrigger className="h-11 w-full text-start">
                  <SelectValue placeholder="بدون مجموعة">
                    {(value: string | null) =>
                      value == null || value === NONE
                        ? "بدون مجموعة"
                        : (groupItems[value] ?? "بدون مجموعة")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>بدون مجموعة</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.group_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>

            <DialogFooter>
              <DialogClose
                onClick={() => {
                  setNameError(null);
                  setWhatsappError(null);
                }}
              >
                إلغاء
              </DialogClose>
              <Button
                type="submit"
                variant="brand"
                className="h-11 gap-2"
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  "حفظ"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
