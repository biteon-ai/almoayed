"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createStudentManually } from "@/actions/teacher";
import type { StudentTier, TeacherGroup } from "@/types/database";
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
  type WhatsAppDialCode,
} from "@/lib/constants";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Loader2,
  Phone,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";

const NONE = "__none__";
const DEFAULT_DIAL: WhatsAppDialCode = "963";

interface AddStudentDialogProps {
  open: boolean;
  groups?: TeacherGroup[] | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function AddStudentDialog({
  open,
  groups: groupsProp,
  onOpenChange,
  onSuccess,
}: AddStudentDialogProps) {
  const groups = useMemo(() => groupsProp ?? [], [groupsProp]);
  const [fullName, setFullName] = useState("");
  const [dialCode, setDialCode] = useState<WhatsAppDialCode>(DEFAULT_DIAL);
  const [localWhatsapp, setLocalWhatsapp] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [tier, setTier] = useState<StudentTier>("free");
  const [nameError, setNameError] = useState<string | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const groupItems = useMemo(() => {
    const map: Record<string, string> = { [NONE]: "بدون مجموعة" };
    for (const g of groups) map[g.id] = g.group_name;
    return map;
  }, [groups]);

  useEffect(() => {
    if (!open) return;
    if (process.env.NODE_ENV === "development") {
      console.log("Available Groups in Dialog:", groups);
    }
  }, [open, groups]);

  const reset = () => {
    setFullName("");
    setDialCode(DEFAULT_DIAL);
    setLocalWhatsapp("");
    setGroupId(null);
    setTier("free");
    setNameError(null);
    setWhatsappError(null);
    setFormError(null);
  };

  const onLocalWhatsappChange = (raw: string) => {
    // Allow digits / spaces / dashes / + while typing; strip other junk
    const cleaned = raw.replace(/[^\d\s+-]/g, "").slice(0, 20);
    setLocalWhatsapp(cleaned);
    if (whatsappError) setWhatsappError(null);
  };

  /** Digits-only E.164 — never double-prefix selected dial over a full intl paste. */
  const resolveWhatsapp = () =>
    composeWhatsAppNumber(dialCode, localWhatsapp);

  const validateClient = (whatsappNumber: string): boolean => {
    let ok = true;
    const name = fullName.trim();
    if (!name) {
      setNameError("يرجى إدخال اسم الطالب.");
      ok = false;
    } else {
      setNameError(null);
    }

    if (!isValidWhatsAppE164(whatsappNumber)) {
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
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="w-full max-w-md rounded-2xl p-4 sm:p-6"
        {...spekit(SPEKIT.addStudentDialog)}
      >
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                <UserPlus className="size-5" />
              </span>
              <div className="min-w-0 space-y-1">
                <DialogTitle>إضافة طالب جديد</DialogTitle>
                <DialogDescription>
                  أدخل بيانات الطالب واربطه بقائمتك. المجموعة والمستوى اختياريان.
                </DialogDescription>
              </div>
            </div>
            <DialogClose
              className="size-9 shrink-0 rounded-lg border-0 px-0 hover:bg-muted"
              aria-label="إغلاق"
              onClick={reset}
            >
              <X className="size-4" />
            </DialogClose>
          </div>
        </DialogHeader>

        <form
          className="mt-4 flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();

            // Sanitize before create: strip non-digits / avoid dial+full-intl concat
            const whatsappNumber = resolveWhatsapp();
            if (!validateClient(whatsappNumber)) return;

            startTransition(async () => {
              setFormError(null);
              const result = await createStudentManually({
                fullName,
                whatsappNumber,
                groupId,
                tier,
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
                // Keep errors inside the dialog (HubToast sits under the backdrop)
                setFormError(result.error);
                return;
              }
              reset();
              onOpenChange(false);
              onSuccess("تمت إضافة الطالب بنجاح");
            });
          }}
        >
          {formError ? (
            <div
              role="alert"
              className="mb-3 flex animate-in fade-in-50 items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
            >
              <AlertCircle className="size-5 shrink-0" />
              <span>{formError}</span>
            </div>
          ) : null}

          <div
            className={cn(
              "min-h-0 max-h-[60vh] flex-1 space-y-4 overflow-y-auto overscroll-contain py-2",
              "[scrollbar-width:thin]",
              "[scrollbar-color:hsl(var(--muted-foreground)/0.2)_transparent]",
              "[&::-webkit-scrollbar]:w-1.5",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:rounded-full",
              "[&::-webkit-scrollbar-thumb]:bg-foreground/15"
            )}
          >
          <div className="space-y-1.5">
            <label
              htmlFor="add-student-name"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <User className="size-3.5 text-brand-600" />
              اسم الطالب
            </label>
            <Input
              id="add-student-name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (nameError) setNameError(null);
              }}
              className={cn(
                "h-11 text-start",
                nameError && "border-destructive aria-invalid:ring-destructive/20"
              )}
              placeholder="مثال: أحمد الخطيب"
              required
              autoComplete="name"
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "add-student-name-err" : undefined}
            />
            {nameError ? (
              <p
                id="add-student-name-err"
                role="alert"
                className="text-xs font-medium text-destructive"
              >
                {nameError}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="add-student-wa"
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
                id="add-student-wa"
                value={localWhatsapp}
                onChange={(e) => onLocalWhatsappChange(e.target.value)}
                className="min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 shadow-none focus-visible:ring-0"
                dir="ltr"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="9xx xxx xxx"
                aria-invalid={Boolean(whatsappError)}
                aria-describedby={
                  whatsappError ? "add-student-wa-err" : undefined
                }
              />
            </div>
            {whatsappError ? (
              <p
                id="add-student-wa-err"
                role="alert"
                className="text-xs font-medium text-destructive"
              >
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
              <span className="font-normal text-muted-foreground">(اختياري)</span>
            </span>
            <Select
              value={groupId ?? NONE}
              items={groupItems}
              onValueChange={(v) => {
                if (!v || typeof v !== "string" || v === NONE) {
                  setGroupId(null);
                  return;
                }
                setGroupId(v);
              }}
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
              <SelectContent align="start" className="min-w-[var(--anchor-width)]">
                <SelectItem value={NONE}>بدون مجموعة</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.group_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {groups.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                لا توجد مجموعات بعد — يمكنك إنشاء مجموعة من الصفحة ثم تعيينها
                لاحقاً.
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-medium">
              المستوى{" "}
              <span className="font-normal text-muted-foreground">(اختياري)</span>
            </span>
            <div
              className="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1"
              role="group"
              aria-label="مستوى الاشتراك"
            >
              <button
                type="button"
                className={cn(
                  "h-10 rounded-lg text-sm font-semibold transition-colors",
                  tier === "free"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setTier("free")}
                aria-pressed={tier === "free"}
              >
                مجاني
              </button>
              <button
                type="button"
                className={cn(
                  "h-10 rounded-lg text-sm font-semibold transition-colors",
                  tier === "pro"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setTier("pro")}
                aria-pressed={tier === "pro"}
              >
                Pro
              </button>
            </div>
          </div>

          </div>

          <DialogFooter>
            <DialogClose onClick={reset}>إلغاء</DialogClose>
            <Button
              type="submit"
              variant="brand"
              className="h-11 gap-2"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  جاري الإضافة...
                </>
              ) : (
                "إضافة الطالب"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
