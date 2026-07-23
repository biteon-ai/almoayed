"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveGamificationTiers } from "@/actions/gamification";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDefaultGamificationTierPayload } from "@/lib/gamification-presets";
import {
  GAMIFICATION_ICON_OPTIONS,
  GAMIFICATION_MAX_TIERS,
  gamificationIconEmoji,
  resolveGamificationIconParts,
  toLadderInputs,
  validateGamificationLadder,
} from "@/lib/teacher-gamification";
import { LevelCardHeaderIcon } from "@/components/teacher/LevelCardHeaderIcon";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import type {
  GamificationIconType,
  GamificationTier,
  GamificationTierSaveInput,
} from "@/types/database";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";

interface DraftTier {
  key: string;
  levelName: string;
  minCompletedQuizzes: number;
  minAvgScore: number;
  iconType: GamificationIconType;
}

function toDraft(tiers: GamificationTier[]): DraftTier[] {
  return tiers.map((t) => ({
    key: t.id,
    levelName: t.level_name,
    minCompletedQuizzes: t.min_completed_quizzes,
    minAvgScore: Number(t.min_avg_score),
    iconType: t.icon_type,
  }));
}

function emptyDraft(): DraftTier {
  return {
    key: `new-${crypto.randomUUID()}`,
    levelName: "",
    minCompletedQuizzes: 0,
    minAvgScore: 0,
    iconType: "badge",
  };
}

function presetsToDrafts(): DraftTier[] {
  return getDefaultGamificationTierPayload().map((tier) => ({
    key: `preset-${crypto.randomUUID()}`,
    levelName: tier.levelName,
    minCompletedQuizzes: tier.minCompletedQuizzes,
    minAvgScore: tier.minAvgScore,
    iconType: tier.iconType,
  }));
}

interface GamificationSettingsProps {
  initialTiers: GamificationTier[];
}

export function GamificationSettings({ initialTiers }: GamificationSettingsProps) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftTier[]>(() =>
    initialTiers.length > 0 ? toDraft(initialTiers) : []
  );
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();
  const [presetConfirmOpen, setPresetConfirmOpen] = useState(false);

  const canAdd = drafts.length < GAMIFICATION_MAX_TIERS;

  const previewValidation = useMemo(
    () =>
      validateGamificationLadder(
        toLadderInputs(
          drafts.map((d) => ({
            levelName: d.levelName,
            minCompletedQuizzes: d.minCompletedQuizzes,
            minAvgScore: d.minAvgScore,
            iconType: d.iconType,
          }))
        )
      ),
    [drafts]
  );

  function updateDraft(key: string, patch: Partial<DraftTier>) {
    setDrafts((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
    setMessage(null);
  }

  function moveDraft(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= drafts.length) return;
    setDrafts((prev) => {
      const copy = [...prev];
      const tmp = copy[index];
      copy[index] = copy[next];
      copy[next] = tmp;
      return copy;
    });
    setMessage(null);
  }

  function applyDefaultPresets() {
    setDrafts(presetsToDrafts());
    setMessage({
      type: "ok",
      text: "تم تطبيق المقترح الافتراضي — اضغط حفظ التغييرات لتثبيته",
    });
    setPresetConfirmOpen(false);
  }

  function handleLoadPresetsClick() {
    if (drafts.length > 0) {
      setPresetConfirmOpen(true);
      return;
    }
    applyDefaultPresets();
  }

  function handleAddLevel() {
    setDrafts((prev) => [...prev, emptyDraft()]);
    setMessage(null);
  }

  function handleSave() {
    const payload: GamificationTierSaveInput[] = drafts.map((d) => ({
      levelName: d.levelName,
      minCompletedQuizzes: d.minCompletedQuizzes,
      minAvgScore: d.minAvgScore,
      iconType: d.iconType,
    }));

    const validation = validateGamificationLadder(toLadderInputs(payload));
    if (!validation.ok) {
      setMessage({ type: "err", text: validation.error });
      return;
    }

    startTransition(async () => {
      const result = await saveGamificationTiers(payload);
      if (!result.ok) {
        setMessage({ type: "err", text: result.error });
        return;
      }
      setMessage({ type: "ok", text: "تم حفظ التغييرات بنجاح" });
      router.refresh();
    });
  }

  const presetButton = (
    <Button
      type="button"
      variant="outline"
      className="h-11 border-emerald-200 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
      disabled={pending}
      onClick={handleLoadPresetsClick}
            {...spekit(SPEKIT.gamificationPresetBtn)}
    >
      <Sparkles className="size-4" />
      تطبيق المقترح الافتراضي
    </Button>
  );

  return (
    <div className="space-y-5" {...spekit(SPEKIT.gamifSettingsPage)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            نظام المستويات والمكافآت
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            حدّد سلم تقدّم طلابك حسب الاختبارات المكتملة والمعدل. يمكنك البناء
            يدوياً أو تطبيق المقترح الجاهز (حتى {GAMIFICATION_MAX_TIERS} مستوى).
          </p>
        </div>

        <div
          className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end"
          {...spekit(SPEKIT.gamificationHeaderActions)}
        >
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={!canAdd || pending}
            onClick={handleAddLevel}
            {...spekit(SPEKIT.gamifTierAdd)}
          >
            <Plus className="size-4" />
            إضافة مستوى
          </Button>
          {presetButton}
          <Button
            type="button"
            className="h-11 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            disabled={pending || (!previewValidation.ok && drafts.length > 0)}
            onClick={handleSave}
            {...spekit(SPEKIT.gamifTiersSave)}
          >
            <Save className="size-4" />
            {pending ? "جارٍ الحفظ…" : "حفظ التغييرات"}
          </Button>
        </div>
      </div>

      {message ? (
        <p
          role="status"
          className={cn(
            "rounded-xl border px-3.5 py-2.5 text-sm",
            message.type === "ok"
              ? "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          {message.text}
        </p>
      ) : null}

      {!previewValidation.ok && drafts.length > 0 ? (
        <p className="text-sm text-destructive" role="alert">
          {previewValidation.error}
        </p>
      ) : null}

      <div className="space-y-3" {...spekit(SPEKIT.gamifTierList)}>
        {drafts.length === 0 ? (
          <Card
            className="rounded-2xl border border-dashed border-emerald-200/70 bg-card shadow-sm dark:border-emerald-900/50"
            {...spekit(SPEKIT.gamificationEmptyState)}
          >
            <CardContent className="flex flex-col items-center gap-5 px-6 py-10 text-center sm:px-10">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 p-4 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Trophy className="size-8" aria-hidden />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">
                  لم تقم بضبط نظام المستويات بعد
                </h2>
                <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                  يمكنك إضافة المستويات يدوياً أو استخدام المقترح الافتراضي
                  الجاهز بنقرة واحدة.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-center">
                <Button
                  type="button"
                  className="h-11 bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={pending}
                  onClick={handleLoadPresetsClick}
                  {...spekit(SPEKIT.gamificationPresetBtn)}
                >
                  <Sparkles className="size-4" />
                  تطبيق المقترح الافتراضي
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
                  disabled={!canAdd || pending}
                  onClick={handleAddLevel}
                >
                  <Plus className="size-4" />
                  إضافة مستوى يدوي
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          drafts.map((draft, index) => (
            <Card
              key={draft.key}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b bg-muted/25 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="hidden text-muted-foreground/70 sm:inline"
                    aria-hidden
                  >
                    <GripVertical className="size-4" />
                  </span>
                  <LevelCardHeaderIcon iconType={draft.iconType} />
                  <CardTitle className="truncate text-base font-bold">
                    المستوى {index + 1}
                    {draft.levelName.trim()
                      ? ` — ${draft.levelName.trim()}`
                      : ""}
                  </CardTitle>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-10 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    disabled={index === 0 || pending}
                    onClick={() => moveDraft(index, -1)}
                    aria-label="تحريك للأعلى"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-10 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    disabled={index === drafts.length - 1 || pending}
                    onClick={() => moveDraft(index, 1)}
                    aria-label="تحريك للأسفل"
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={pending}
                    onClick={() =>
                      setDrafts((prev) =>
                        prev.filter((r) => r.key !== draft.key)
                      )
                    }
                    aria-label="حذف المستوى"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent
                className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3"
                {...spekit(SPEKIT.gamifTierForm)}
              >
                <div className="space-y-1.5 md:col-span-3 lg:col-span-1">
                  <Label htmlFor={`name-${draft.key}`}>اسم المستوى</Label>
                  <Input
                    id={`name-${draft.key}`}
                    className="h-11 text-start shadow-none"
                    value={draft.levelName}
                    onChange={(e) =>
                      updateDraft(draft.key, { levelName: e.target.value })
                    }
                    placeholder="مثال: مبتدئ شغوف"
                    maxLength={40}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`quizzes-${draft.key}`}>
                    عدد الاختبارات المكتملة
                  </Label>
                  <Input
                    id={`quizzes-${draft.key}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="h-11 text-start shadow-none"
                    value={draft.minCompletedQuizzes}
                    onChange={(e) =>
                      updateDraft(draft.key, {
                        minCompletedQuizzes: Number(e.target.value || 0),
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`avg-${draft.key}`}>المعدل المطلوب (%)</Label>
                  <Input
                    id={`avg-${draft.key}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step={0.01}
                    className="h-11 text-start shadow-none"
                    value={draft.minAvgScore}
                    onChange={(e) =>
                      updateDraft(draft.key, {
                        minAvgScore: Number(e.target.value || 0),
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label>نوع الأيقونة / المكافأة</Label>
                  <Select
                    value={draft.iconType}
                    onValueChange={(value) => {
                      if (!value || typeof value !== "string") return;
                      updateDraft(draft.key, {
                        iconType: value as GamificationIconType,
                      });
                    }}
                  >
                    <SelectTrigger
                      className="h-11 w-full rounded-lg text-start shadow-none"
                      {...spekit(SPEKIT.gamifIconSelect)}
                    >
                      <SelectValue>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-base leading-none">
                            {gamificationIconEmoji(draft.iconType)}
                          </span>
                          <span>
                            {
                              GAMIFICATION_ICON_OPTIONS.find(
                                (o) => o.value === draft.iconType
                              )?.label
                            }
                          </span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      {GAMIFICATION_ICON_OPTIONS.map((opt) => {
                        const parts = resolveGamificationIconParts(opt.value);
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="inline-flex items-center gap-1.5">
                              <span className="text-base leading-none">
                                {parts.mainIcon}
                              </span>
                              {parts.subBadgeIcon ? (
                                <span className="text-xs leading-none opacity-80">
                                  {parts.subBadgeIcon}
                                </span>
                              ) : null}
                              <span>{opt.label}</span>
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={presetConfirmOpen} onOpenChange={setPresetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>استبدال المستويات الحالية؟</AlertDialogTitle>
            <AlertDialogDescription>
              تطبيق المقترح الافتراضي سيستبدل المستويات في النموذج (11 مستوى).
              لن يُحفظ التغيير حتى تضغط «حفظ التغييرات».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={applyDefaultPresets}>
              تطبيق المقترح
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
