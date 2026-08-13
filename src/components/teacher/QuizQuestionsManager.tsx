"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addQuestion,
  deleteQuestion,
  duplicateQuestion,
  updateQuestion,
} from "@/actions/teacher";
import type { Question } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MathText } from "@/components/ui/MathText";
import { Textarea } from "@/components/ui/textarea";
import { CorrectAnswerPicker } from "@/components/teacher/CorrectAnswerPicker";
import { QuickTextPasteDialog } from "@/components/teacher/QuickTextPasteDialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  inferCorrectLetter,
  optionsArrayToFields,
  type ArabicOptionLetter,
} from "@/lib/question-options";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import {
  Check,
  CheckCircle2,
  ClipboardPaste,
  Copy,
  FileQuestion,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  PlusCircle,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";

const LETTERS = ["أ", "ب", "ج", "د"] as const;

const optionFields = [
  { key: "option_a" as const, letter: "أ" },
  { key: "option_b" as const, letter: "ب" },
  { key: "option_c" as const, letter: "ج" },
  { key: "option_d" as const, letter: "د" },
];

interface QuizQuestionsManagerProps {
  quizId: string;
  questions: Question[];
  /** When this counter increments, open the create form dialog. */
  openCreateSignal?: number;
  /** Switch parent dashboard to the bulk-import tab. */
  onRequestImport?: () => void;
  className?: string;
}

interface FormState {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: ArabicOptionLetter;
  explanationText: string;
  categoryTag: string;
}

const EMPTY_FORM: FormState = {
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "أ",
  explanationText: "",
  categoryTag: "عام",
};

function formFromQuestion(question: Question): FormState {
  const fields = optionsArrayToFields(question.options);
  return {
    questionText: question.question_text,
    optionA: fields.option_a,
    optionB: fields.option_b,
    optionC: fields.option_c,
    optionD: fields.option_d,
    correctAnswer: inferCorrectLetter(
      question.correct_answer,
      question.options
    ),
    explanationText: question.explanation_text ?? "",
    categoryTag: question.category_tag || "عام",
  };
}

function toFormData(state: FormState): FormData {
  const formData = new FormData();
  formData.set("question_text", state.questionText);
  formData.set("option_a", state.optionA);
  formData.set("option_b", state.optionB);
  formData.set("option_c", state.optionC);
  formData.set("option_d", state.optionD);
  formData.set("correct_answer", state.correctAnswer);
  formData.set("explanation_text", state.explanationText);
  formData.set("category_tag", state.categoryTag);
  return formData;
}

export function QuizQuestionsManager({
  quizId,
  questions,
  openCreateSignal = 0,
  onRequestImport,
  className,
}: QuizQuestionsManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (openCreateSignal > 0) {
      openCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signal-driven open only
  }, [openCreateSignal]);

  useEffect(() => {
    if (editing && formOpen) {
      setForm(formFromQuestion(editing));
    }
  }, [editing, formOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter((question) => {
      const haystack = [
        question.question_text,
        question.correct_answer,
        question.explanation_text,
        question.category_tag,
        ...question.options,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [questions, search]);

  const refresh = () => router.refresh();

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (question: Question) => {
    setEditing(question);
    setForm(formFromQuestion(question));
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const saveQuestion = (mode: "save" | "save-and-add") => {
    setFormError(null);
    const formData = toFormData(form);

    startTransition(async () => {
      try {
        if (editing) {
          await updateQuestion(quizId, editing.id, formData);
          closeForm();
        } else {
          await addQuestion(quizId, formData);
          if (mode === "save-and-add") {
            setForm(EMPTY_FORM);
            setFormError(null);
            setFormOpen(true);
          } else {
            closeForm();
          }
        }
        refresh();
      } catch (cause) {
        setFormError(
          cause instanceof Error
            ? cause.message
            : "فشل حفظ السؤال. جرّب مرة تانية."
        );
      }
    });
  };

  const handleDuplicate = (question: Question) => {
    setListError(null);
    startTransition(async () => {
      try {
        await duplicateQuestion(quizId, question.id);
        refresh();
      } catch (cause) {
        setListError(
          cause instanceof Error
            ? cause.message
            : "فشل تكرار السؤال. جرّب مرة تانية."
        );
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setListError(null);
    startTransition(async () => {
      try {
        await deleteQuestion(quizId, target.id);
        if (editing?.id === target.id) closeForm();
        refresh();
      } catch (cause) {
        setListError(
          cause instanceof Error
            ? cause.message
            : "فشل حذف السؤال. جرّب مرة تانية."
        );
      }
    });
  };

  const setOption = (
    key: "optionA" | "optionB" | "optionC" | "optionD",
    value: string
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const editIndex = editing
    ? questions.findIndex((q) => q.id === editing.id)
    : -1;

  const handleAddClick = () => {
    openCreate();
  };

  return (
    <div className={cn("space-y-5", className)} dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في الأسئلة..."
            className="h-11 pe-3 ps-9 text-sm"
            aria-label="بحث في الأسئلة"
          />
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 gap-2"
            onClick={() => setPasteOpen(true)}
            data-spekit={SPEKIT.quickTextPasteOpen}
          >
            <ClipboardPaste className="size-4" />
            لصق نصي سريع
          </Button>
          <Button
            type="button"
            variant="brand"
            className="h-11 shrink-0 gap-2"
            onClick={handleAddClick}
          >
            <Plus className="size-4" />
            إضافة سؤال يدوياً
          </Button>
        </div>
      </div>

      {listError ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-xs font-semibold text-destructive"
        >
          {listError}
        </p>
      ) : null}

      <div className="space-y-3" data-spekit={SPEKIT.teacherQuestionsList}>
        {questions.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/80 bg-muted/10 px-6 py-14 text-center">
            <span className="rounded-full bg-emerald-50 p-4 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <FileQuestion className="size-8" aria-hidden />
            </span>
            <div className="max-w-md space-y-2">
              <p className="text-base font-bold text-foreground">
                لا توجد أسئلة مضافة لهذا الاختبار حتى الآن
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                ابدأ بإضافة سؤال يدوياً أو قم برفع ملف أسئلة عبر تبويب
                الاستيراد.
              </p>
            </div>
            <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="brand"
                className="h-11 flex-1 gap-2"
                onClick={handleAddClick}
              >
                <Plus className="size-4" />
                إضافة أول سؤال
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 gap-2"
                onClick={() => setPasteOpen(true)}
                data-spekit={SPEKIT.quickTextPasteOpen}
              >
                <ClipboardPaste className="size-4" />
                لصق نصي سريع
              </Button>
              {onRequestImport ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 gap-2"
                  onClick={onRequestImport}
                >
                  <UploadCloud className="size-4" />
                  استيراد من ملف
                </Button>
              ) : null}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            لا توجد أسئلة تطابق البحث.
          </p>
        ) : (
          filtered.map((question) => {
            const index = questions.findIndex((q) => q.id === question.id);
            return (
              <QuestionOverviewCard
                key={question.id}
                question={question}
                index={index >= 0 ? index : 0}
                pending={pending}
                onEdit={() => openEdit(question)}
                onDuplicate={() => handleDuplicate(question)}
                onDelete={() => setDeleteTarget(question)}
              />
            );
          })
        )}
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
          else setFormOpen(true);
        }}
        className="max-w-2xl shadow-2xl"
      >
        <DialogContent
          className="flex min-h-0 w-full max-h-[90vh] flex-col overflow-hidden p-0"
          dir="rtl"
        >
          <DialogHeader className="shrink-0 border-b border-border/60 bg-muted/10 px-5 pb-4 pt-5 text-start sm:px-6 sm:pt-6">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              {editing ? (
                <Pencil className="size-5 shrink-0 text-emerald-600" />
              ) : (
                <PlusCircle className="size-5 shrink-0 text-emerald-600" />
              )}
              <span>
                {editing
                  ? `تعديل السؤال ${editIndex >= 0 ? editIndex + 1 : ""}`
                  : "إضافة سؤال جديد"}
              </span>
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-muted-foreground">
              {editing
                ? "حدّث نص السؤال والخيارات ثم احفظ."
                : "أدخل نص السؤال والخيارات الأربعة وحدد الإجابة الصحيحة."}
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex min-h-0 flex-1 flex-col"
            {...spekit(SPEKIT.manualQuestionForm)}
            onSubmit={(e) => {
              e.preventDefault();
              saveQuestion("save");
            }}
          >
            <div
              className={cn(
                "min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6",
                "[scrollbar-width:thin]",
                "[scrollbar-color:hsl(var(--muted-foreground)/0.25)_transparent]"
              )}
            >
              {formError ? (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-xs font-semibold text-destructive"
                >
                  {formError}
                </p>
              ) : null}

              <div className="space-y-2 text-start">
                <Label
                  htmlFor="manager-question-text"
                  className="text-sm font-semibold text-foreground"
                >
                  نص السؤال *
                </Label>
                <Textarea
                  id="manager-question-text"
                  value={form.questionText}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      questionText: e.target.value,
                    }))
                  }
                  required
                  placeholder="اكتب نص السؤال هنا..."
                  className="min-h-[90px] resize-none rounded-xl text-sm focus-visible:ring-emerald-500/30"
                />
              </div>

              <div className="space-y-3 text-start">
                <Label className="text-sm font-semibold text-foreground">
                  خيارات الإجابة *
                </Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {optionFields.map(({ key, letter }) => {
                    const valueKey =
                      key === "option_a"
                        ? "optionA"
                        : key === "option_b"
                          ? "optionB"
                          : key === "option_c"
                            ? "optionC"
                            : "optionD";
                    return (
                      <div
                        key={key}
                        className="space-y-1.5 rounded-xl border border-border/70 bg-card p-3 shadow-sm"
                      >
                        <Label
                          htmlFor={`manager-${key}`}
                          className="text-xs font-medium text-muted-foreground"
                        >
                          الخيار {letter}
                        </Label>
                        <Input
                          id={`manager-${key}`}
                          value={form[valueKey]}
                          onChange={(e) => setOption(valueKey, e.target.value)}
                          required={key === "option_a" || key === "option_b"}
                          placeholder={`نص الخيار ${letter}`}
                          className="h-10 rounded-xl text-sm focus-visible:ring-emerald-500/30"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <CorrectAnswerPicker
                value={form.correctAnswer}
                onChange={(correctAnswer) =>
                  setForm((prev) => ({ ...prev, correctAnswer }))
                }
                disabled={pending}
              />

              <div className="space-y-2 text-start">
                <Label
                  htmlFor="manager-explanation"
                  className="text-xs font-medium text-muted-foreground"
                >
                  الشرح / التفسير (اختياري)
                </Label>
                <Textarea
                  id="manager-explanation"
                  value={form.explanationText}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      explanationText: e.target.value,
                    }))
                  }
                  placeholder="يظهر للطالب بعد تسليم الاختبار..."
                  className="min-h-[70px] resize-none rounded-xl text-sm focus-visible:ring-emerald-500/30"
                />
              </div>

              <div className="space-y-2 text-start">
                <Label
                  htmlFor="manager-category"
                  className="text-xs font-medium text-muted-foreground"
                >
                  القسم / التصنيف (اختياري)
                </Label>
                <Input
                  id="manager-category"
                  value={form.categoryTag}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      categoryTag: e.target.value,
                    }))
                  }
                  placeholder="مثال: أشعة"
                  className="h-10 rounded-xl text-sm focus-visible:ring-emerald-500/30"
                />
              </div>
            </div>

            <DialogFooter className="mt-0 flex-row flex-wrap justify-end gap-2 border-t border-border/60 bg-muted/20 p-4 sm:mt-0 sm:p-5">
              <DialogClose className="h-10 rounded-xl text-sm">إلغاء</DialogClose>
              {!editing ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 gap-2 rounded-xl text-sm"
                  disabled={pending}
                  onClick={() => saveQuestion("save-and-add")}
                >
                  <Plus className="size-4" />
                  حفظ وإضافة آخر
                </Button>
              ) : null}
              <Button
                type="submit"
                variant="brand"
                className="h-10 gap-2 rounded-xl bg-emerald-600 text-sm text-white hover:bg-emerald-700"
                disabled={pending}
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                {editing ? "حفظ التعديلات" : "حفظ السؤال"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف السؤال</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              حذف السؤال
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QuickTextPasteDialog
        quizId={quizId}
        open={pasteOpen}
        onOpenChange={setPasteOpen}
      />
    </div>
  );
}

function QuestionOverviewCard({
  question,
  index,
  pending,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  question: Question;
  index: number;
  pending: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <Card
      className="border-border/70 shadow-sm"
      data-spekit={SPEKIT.questionListItem}
    >
      <CardContent className="space-y-3 p-4 sm:p-5 text-start">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-bold text-brand-700">سؤال {index + 1}</p>
            <p className="text-sm font-semibold leading-relaxed text-foreground">
              <MathText text={question.question_text} />
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {question.category_tag ? (
              <Badge
                variant="secondary"
                className="rounded-full text-[10px]"
              >
                {question.category_tag}
              </Badge>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={pending}
                className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="إجراءات السؤال"
                data-spekit={SPEKIT.questionEditButton}
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="size-3.5" />
                  تعديل
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="size-3.5" />
                  تكرار
                </DropdownMenuItem>
                <DropdownMenuItem destructive onClick={onDelete}>
                  <Trash2 className="size-3.5" />
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {question.options.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {question.options.map((option, optionIndex) => {
              const letter = LETTERS[optionIndex] ?? "?";
              const isCorrect =
                question.correct_answer === letter ||
                question.correct_answer === option;
              return (
                <li
                  key={`${question.id}-opt-${optionIndex}`}
                  className={cn(
                    "inline-flex max-w-full items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px]",
                    isCorrect
                      ? "border border-emerald-200/80 bg-emerald-50/70 font-semibold text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100"
                      : "bg-muted/40 text-foreground/90"
                  )}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
                  ) : null}
                  <span className="font-bold text-brand-700">{letter}</span>
                  <MathText text={option} className="truncate font-mono" />
                </li>
              );
            })}
          </ul>
        ) : null}

        {question.explanation_text ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            الشرح: {question.explanation_text}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
