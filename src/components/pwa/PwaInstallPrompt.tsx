"use client";

import { useState, type ElementType, type ReactNode } from "react";
import { Apple, EllipsisVertical, Share, Smartphone } from "lucide-react";
import {
  AppleLogo,
  GooglePlayLogo,
} from "@/components/pwa/StoreBadgeLogos";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import type { PwaInstallPlatform } from "@/lib/pwa-install";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SPEKIT } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

export type PwaInstallVariant = "student" | "teacher";

function StepList({
  steps,
  accentClassName,
}: {
  steps: { icon: ElementType; text: ReactNode }[];
  accentClassName: string;
}) {
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <li
            key={index}
            className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3"
          >
            <span
              className={cn(
                "digit-box h-8 w-8 shrink-0 rounded-lg text-sm font-black text-white",
                accentClassName
              )}
              aria-hidden
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
              <p className="text-sm font-semibold leading-relaxed text-foreground">
                {step.text}
              </p>
              <Icon className="size-4 text-muted-foreground" aria-hidden />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const IOS_STEPS = [
  {
    icon: Share,
    text: (
      <>
        اضغط زر <strong className="font-bold">المشاركة</strong> في شريط Safari
        (أيقونة المربع والسهم).
      </>
    ),
  },
  {
    icon: Smartphone,
    text: (
      <>
        مرّر للأسفل واضغط{" "}
        <strong className="font-bold">«إضافة إلى الشاشة الرئيسية»</strong>.
      </>
    ),
  },
  {
    icon: Apple,
    text: (
      <>
        اضغط <strong className="font-bold">إضافة</strong> في الزاوية العلوية.
      </>
    ),
  },
] as const;

const ANDROID_STEPS = [
  {
    icon: EllipsisVertical,
    text: (
      <>
        اضغط قائمة <strong className="font-bold">النقاط الثلاث</strong> في
        Chrome.
      </>
    ),
  },
  {
    icon: Smartphone,
    text: (
      <>
        اختر <strong className="font-bold">«تثبيت التطبيق»</strong> أو{" "}
        <strong className="font-bold">«إضافة إلى الشاشة الرئيسية»</strong>.
      </>
    ),
  },
] as const;

function InstallBadge({
  logo,
  platformLabel,
  spekitId,
  onClick,
  buttonClassName,
}: {
  logo: ReactNode;
  platformLabel: string;
  spekitId: string;
  onClick: () => void;
  buttonClassName: string;
}) {
  return (
    <button
      type="button"
      dir="rtl"
      data-spekit={spekitId}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 w-full flex-1 items-center justify-center gap-2 rounded-xl",
        "px-3 text-white shadow-md",
        "transition active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-[3px]",
        "[@media(max-height:700px)]:h-10 sm:h-11",
        buttonClassName
      )}
      aria-label={`تثبيت التطبيق على ${platformLabel}`}
    >
      <span className="flex size-5 shrink-0 items-center justify-center text-white">
        {logo}
      </span>
      <span className="flex min-w-0 flex-col items-start leading-none">
        <span className="text-[9px] font-medium text-white/80">تثبيت التطبيق</span>
        <span className="mt-0.5 text-sm font-bold tracking-tight">
          على {platformLabel}
        </span>
      </span>
    </button>
  );
}

/**
 * Login/signup PWA install CTAs.
 * Student: brand-green (UI-010). Teacher: indigo (UI-021).
 * Hidden entirely when the app is already running as an installed PWA.
 */
export function PwaInstallPrompt({
  className,
  variant = "student",
}: {
  className?: string;
  variant?: PwaInstallVariant;
}) {
  const { canPrompt, installed, ready, promptInstall } = usePwaInstall();
  const [modalOpen, setModalOpen] = useState(false);
  const [platform, setPlatform] = useState<PwaInstallPlatform>("ios");
  const isTeacher = variant === "teacher";

  const openGuide = (next: PwaInstallPlatform) => {
    setPlatform(next);
    setModalOpen(true);
  };

  const onAndroidClick = async () => {
    const outcome = await promptInstall();
    if (outcome === "unavailable") {
      openGuide("android");
    }
  };

  if (!ready || installed) {
    return null;
  }

  const appLabel = isTeacher ? "المؤيد للمدرسين" : "المؤيد";
  const title =
    platform === "ios"
      ? `تثبيت ${appLabel} على iPhone / iPad`
      : `تثبيت ${appLabel} على Android`;

  const description =
    platform === "ios"
      ? "Safari لا يدعم التثبيت المباشر — اتبع الخطوات التالية:"
      : "التثبيت المباشر غير متاح في هذا المتصفح. اتبع الخطوات التالية:";

  const buttonsSpekit = isTeacher
    ? SPEKIT.teacherPwaInstallButtons
    : SPEKIT.pwaInstallButtons;
  const androidSpekit = isTeacher
    ? SPEKIT.teacherPwaInstallAndroid
    : SPEKIT.pwaInstallAndroid;
  const iosSpekit = isTeacher
    ? SPEKIT.teacherPwaInstallIos
    : SPEKIT.pwaInstallIos;
  const modalSpekit = isTeacher
    ? SPEKIT.teacherPwaInstallModal
    : SPEKIT.pwaInstallModal;

  const badgeClass = isTeacher
    ? "bg-indigo-600 shadow-indigo-900/12 hover:bg-indigo-700 focus-visible:ring-indigo-500/25"
    : "bg-brand-600 shadow-brand-900/12 hover:bg-brand-700 focus-visible:ring-brand-500/25";
  const stepAccent = isTeacher ? "bg-indigo-600" : "bg-emerald-600";

  return (
    <div className={cn("space-y-2", className)} data-spekit={buttonsSpekit}>
      <p className="text-center text-[11px] text-muted-foreground">
        ثبّت التطبيق على هاتفك (بدون متجر)
      </p>
      <div className="flex gap-2">
        <InstallBadge
          spekitId={androidSpekit}
          platformLabel="Android"
          onClick={() => void onAndroidClick()}
          logo={<GooglePlayLogo className="size-[18px]" />}
          buttonClassName={badgeClass}
        />
        <InstallBadge
          spekitId={iosSpekit}
          platformLabel="iOS"
          onClick={() => openGuide("ios")}
          logo={<AppleLogo className="size-[18px]" />}
          buttonClassName={badgeClass}
        />
      </div>

      {!canPrompt ? (
        <p className="text-center text-[10px] leading-snug text-muted-foreground/80">
          على Android يظهر التثبيت المباشر عندما يدعمه Chrome
        </p>
      ) : null}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent data-spekit={modalSpekit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
            <StepList
              accentClassName={stepAccent}
              steps={[...(platform === "ios" ? IOS_STEPS : ANDROID_STEPS)]}
            />
          </div>

          <DialogFooter>
            <DialogClose className="w-full sm:w-auto">حسناً، فهمت</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
