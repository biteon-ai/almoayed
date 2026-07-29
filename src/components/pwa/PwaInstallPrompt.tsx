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

function StepList({
  steps,
}: {
  steps: { icon: ElementType; text: ReactNode }[];
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
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-black text-white"
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
}: {
  logo: ReactNode;
  platformLabel: string;
  spekitId: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      dir="rtl"
      data-spekit={spekitId}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 w-full flex-1 items-center justify-center gap-2 rounded-xl",
        "bg-brand-600 px-3 text-white shadow-md shadow-brand-900/12",
        "transition hover:bg-brand-700 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/25",
        "[@media(max-height:700px)]:h-10 sm:h-11"
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
 * Login/signup PWA install CTAs — brand-green buttons matching login
 * primary actions; white mono Apple / Play icons (UI-010).
 */
export function PwaInstallPrompt({ className }: { className?: string }) {
  const { canPrompt, installed, promptInstall } = usePwaInstall();
  const [modalOpen, setModalOpen] = useState(false);
  const [platform, setPlatform] = useState<PwaInstallPlatform>("ios");

  const openGuide = (next: PwaInstallPlatform) => {
    setPlatform(next);
    setModalOpen(true);
  };

  const onAndroidClick = async () => {
    if (installed) {
      openGuide("android");
      return;
    }
    const outcome = await promptInstall();
    if (outcome === "unavailable") {
      openGuide("android");
    }
  };

  const title =
    platform === "ios"
      ? "تثبيت المؤيد على iPhone / iPad"
      : "تثبيت المؤيد على Android";

  const description =
    platform === "ios"
      ? "Safari لا يدعم التثبيت المباشر — اتبع الخطوات التالية:"
      : installed
        ? "التطبيق مثبت أو التثبيت المباشر غير متاح. يمكنك أيضاً إضافته يدوياً:"
        : "التثبيت المباشر غير متاح في هذا المتصفح. اتبع الخطوات التالية:";

  return (
    <div
      className={cn("space-y-2", className)}
      data-spekit={SPEKIT.pwaInstallButtons}
    >
      <p className="text-center text-[11px] text-muted-foreground">
        ثبّت التطبيق على هاتفك (بدون متجر)
      </p>
      <div className="flex gap-2">
        <InstallBadge
          spekitId={SPEKIT.pwaInstallAndroid}
          platformLabel="Android"
          onClick={() => void onAndroidClick()}
          logo={<GooglePlayLogo className="size-[18px]" />}
        />
        <InstallBadge
          spekitId={SPEKIT.pwaInstallIos}
          platformLabel="iOS"
          onClick={() => openGuide("ios")}
          logo={<AppleLogo className="size-[18px]" />}
        />
      </div>

      {!canPrompt && !installed ? (
        <p className="text-center text-[10px] leading-snug text-muted-foreground/80">
          على Android يظهر التثبيت المباشر عندما يدعمه Chrome
        </p>
      ) : null}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent data-spekit={SPEKIT.pwaInstallModal}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
            <StepList
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
