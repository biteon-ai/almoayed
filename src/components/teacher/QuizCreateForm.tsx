"use client";

import { useState } from "react";
import type { Category, TeacherGroup } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

const fieldInputClass =
  "h-11 min-h-[44px] bg-muted/40 px-4 text-start text-sm shadow-none";

const fieldSelectTriggerClass =
  "h-11 w-full bg-muted/40 px-4 text-start shadow-none";

interface QuizCreateFormProps {
  categories: Category[];
  groups: TeacherGroup[];
  action?: (formData: FormData) => void | Promise<void>;
  onSubmit?: (formData: FormData) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function QuizCreateForm({
  categories,
  groups,
  action,
  onSubmit,
  isSubmitting = false,
}: QuizCreateFormProps) {
  const [categoryId, setCategoryId] = useState<string>("");
  const [quizType, setQuizType] = useState<string>("regular");
  const [targetGroupId, setTargetGroupId] = useState<string>("");
  const [isFree, setIsFree] = useState(true);

  const categoryLabel =
    categoryId === ""
      ? "— بدون قسم —"
      : (categories.find((category) => category.id === categoryId)?.name ??
        "— بدون قسم —");

  const quizTypeLabel =
    quizType === "session_group" ? "مجموعة خاصة" : "عادي — لكل الطلاب";

  const targetGroupLabel =
    targetGroupId === ""
      ? "— الكل —"
      : (groups.find((group) => group.id === targetGroupId)?.group_name ??
        "— الكل —");

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!onSubmit) return;
    event.preventDefault();
    onSubmit(new FormData(event.currentTarget));
  };

  return (
    <form
      action={onSubmit ? undefined : action}
      onSubmit={onSubmit ? handleFormSubmit : undefined}
      className="space-y-6"
      {...spekit(SPEKIT.teacherQuizCreateForm)}
    >
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="title"
          className="mb-1 text-sm font-medium text-muted-foreground"
        >
          عنوان الاختبار
        </Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="مثال: اختبار الأشعة"
          className={fieldInputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="category_id"
          className="mb-1 text-sm font-medium text-muted-foreground"
        >
          القسم
        </Label>
        <input type="hidden" name="category_id" value={categoryId} />
        <Select
          value={categoryId}
          onValueChange={(value) => setCategoryId(value ?? "")}
        >
          <SelectTrigger id="category_id" className={fieldSelectTriggerClass}>
            <SelectValue className="text-start">{categoryLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="">— بدون قسم —</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="quiz_type"
          className="mb-1 text-sm font-medium text-muted-foreground"
        >
          نوع الاختبار
        </Label>
        <input type="hidden" name="quiz_type" value={quizType} />
        <Select
          value={quizType}
          onValueChange={(value) => setQuizType(value ?? "regular")}
        >
          <SelectTrigger id="quiz_type" className={fieldSelectTriggerClass}>
            <SelectValue className="text-start">{quizTypeLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="regular">عادي — لكل الطلاب</SelectItem>
            <SelectItem value="session_group">مجموعة خاصة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="target_group_id"
          className="mb-1 text-sm font-medium text-muted-foreground"
        >
          المجموعة المستهدفة (اختياري)
        </Label>
        <input type="hidden" name="target_group_id" value={targetGroupId} />
        <Select
          value={targetGroupId}
          onValueChange={(value) => setTargetGroupId(value ?? "")}
        >
          <SelectTrigger
            id="target_group_id"
            className={fieldSelectTriggerClass}
          >
            <SelectValue className="text-start">{targetGroupLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="">— الكل —</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.group_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4"
        {...spekit(SPEKIT.teacherQuizCreateFlags)}
      >
        <p className="text-xs text-muted-foreground">
          الاختبار يبدأ مخفياً. فعّله من قائمة الاختبارات بعد إضافة سؤال واحد
          على الأقل.
        </p>
        <div className="flex items-center gap-2.5 py-1">
          <Checkbox
            id="is_free"
            checked={isFree}
            onCheckedChange={(checked) => setIsFree(checked === true)}
          />
          <input type="hidden" name="is_free" value={isFree ? "on" : "off"} />
          <Label
            htmlFor="is_free"
            className="cursor-pointer text-sm font-normal text-foreground"
          >
            مجاني (متاح لطلاب Free)
          </Label>
        </div>
      </div>

      <Button
        type="submit"
        variant="brand"
        size="lg"
        className="h-12 w-full active:scale-[0.98]"
        disabled={isSubmitting}
      >
        {isSubmitting ? "جاري الإنشاء..." : "إنشاء والمتابعة لإضافة الأسئلة"}
      </Button>
    </form>
  );
}
