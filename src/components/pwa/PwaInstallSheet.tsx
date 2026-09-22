"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Smartphone, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { isLikelyIosDevice, isPwaStandalone } from "@/lib/pwa-install";
import {
  markA2hsDismissed,
  readA2hsDismissedAt,
  shouldShowA2hsSheet,
} from "@/lib/a2hs-prompt";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

export function PwaInstallSheet() {
  const pathname = usePathname();
  const { canPrompt, installed, promptInstall } = usePwaInstall();
  const [open, setOpen] = useState(false);
  const [sessionHidden, setSessionHidden] = useState(false);
  const [isPhoneViewport, setIsPhoneViewport] = useState(false);
  // Defer UA detection until after mount — navigator differs on SSR vs client
  // and Dialog keeps children in the DOM even when closed (hydration mismatch).
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsIos(isLikelyIosDevice());
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsPhoneViewport(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const eligible = shouldShowA2hsSheet({
      standalone: installed || isPwaStandalone(),
      isStudent: true,
      pathname,
      isPhoneViewport,
      sessionHidden,
      dismissedAt: readA2hsDismissedAt(),
    });
    setOpen(eligible);
  }, [installed, pathname, isPhoneViewport, sessionHidden]);

  const dismiss = () => {
    setSessionHidden(true);
    markA2hsDismissed();
    setOpen(false);
  };

  const onAndroid = async () => {
    if (canPrompt) {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        setOpen(false);
        return;
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
      className={cn(
        "inset-x-0 bottom-16 top-auto m-0 max-h-[min(80vh,28rem)] w-full max-w-none",
        "rounded-t-3xl rounded-b-none md:hidden"
      )}
    >
      <DialogContent
        {...spekit(SPEKIT.pwaInstallSheet)}
        className="space-y-4 p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-700">
              <Smartphone className="size-5" aria-hidden />
            </span>
            <div className="space-y-1 text-start">
              <h2 className="text-base font-black">
                أضف المؤيد إلى الشاشة الرئيسية
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                ثبّت التطبيق ليبدو كتطبيق هاتف بدون شريط المتصفح.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
            aria-label="إغلاق"
          >
            <X className="size-5" />
          </button>
        </div>

        {canPrompt ? (
          <button
            type="button"
            {...spekit(SPEKIT.pwaInstallSheetAndroid)}
            onClick={() => void onAndroid()}
            className="h-12 w-full rounded-xl bg-brand-600 text-sm font-black text-white hover:bg-brand-700"
          >
            تثبيت التطبيق
          </button>
        ) : (
          <ol
            {...spekit(SPEKIT.pwaInstallSheetGuide)}
            className="list-decimal space-y-2 pe-4 text-start text-xs leading-relaxed text-foreground"
          >
            {isIos ? (
              <>
                <li>اضغط زر المشاركة في شريط Safari.</li>
                <li>اختر «إضافة إلى الشاشة الرئيسية» ثم إضافة.</li>
              </>
            ) : (
              <>
                <li>افتح قائمة Chrome (النقاط الثلاث).</li>
                <li>اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</li>
              </>
            )}
          </ol>
        )}

        <button
          type="button"
          {...spekit(SPEKIT.pwaInstallSheetDismiss)}
          onClick={dismiss}
          className="h-11 w-full rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted"
        >
          لاحقاً
        </button>
      </DialogContent>
    </Dialog>
  );
}
