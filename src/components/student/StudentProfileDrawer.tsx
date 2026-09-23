"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  Mail,
  MessageCircle,
  Monitor,
  Moon,
  Settings,
  Share2,
  Sun,
  X,
} from "lucide-react";
import { useAppearance } from "@/components/providers/appearance-provider";
import { HubToast } from "@/components/teacher/HubToast";
import { OfflineSavedQuizzesList } from "@/components/student/OfflineSavedQuizzesList";
import type { Appearance } from "@/lib/appearance";
import {
  buildAppSharePayload,
  buildSupportWhatsAppUrl,
  EMAIL_SUPPORT_EMAIL,
  supportMailtoHref,
} from "@/lib/native-share";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

const APPEARANCE_OPTIONS: { value: Appearance; label: string; icon: typeof Sun }[] =
  [
    { value: "light", label: "فاتح", icon: Sun },
    { value: "dark", label: "داكن", icon: Moon },
    { value: "system", label: "تلقائي", icon: Monitor },
  ];

export function StudentProfileDrawer({
  open,
  onOpenChange,
  currentTeacherId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTeacherId: string | null;
}) {
  const { appearance, setAppearance } = useAppearance();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open, close]);

  const shareApp = async () => {
    const payload = buildAppSharePayload(
      typeof window !== "undefined" ? window.location.origin : undefined
    );
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(payload);
        return;
      }
    } catch {
      // User cancelled or share failed — fall through to copy.
    }
    try {
      await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
      setToast("تم نسخ الرابط");
    } catch {
      setToast(payload.url);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:z-[70]">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="إغلاق القائمة"
        onClick={close}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        {...spekit(SPEKIT.nativeProfileDrawer)}
        className={cn(
          "absolute inset-y-0 start-0 flex w-[min(100%,20.5rem)] flex-col",
          "bottom-16 md:bottom-0",
          "border-e border-border bg-card text-card-foreground shadow-2xl",
          "animate-native-drawer-in"
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
          <h2 id={titleId} className="text-base font-black">
            القائمة
          </h2>
          <button
            ref={closeRef}
            type="button"
            {...spekit(SPEKIT.nativeDrawerClose)}
            onClick={close}
            className="inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
            aria-label="إغلاق"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4">
          <section className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground">المظهر</p>
            <div
              {...spekit(SPEKIT.nativeThemeSwitcher)}
              className="grid grid-cols-3 gap-1 rounded-2xl border border-border/80 bg-muted/40 p-1"
              role="radiogroup"
              aria-label="المظهر"
            >
              {APPEARANCE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = appearance === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setAppearance(option.value)}
                    className={cn(
                      "inline-flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold",
                      selected
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground">
              العناصر المحفوظة
            </p>
            <OfflineSavedQuizzesList
              teacherId={currentTeacherId}
              onOpenQuiz={close}
            />
          </section>

          <nav className="space-y-1">
            <Link
              href="/settings"
              {...spekit(SPEKIT.nativeDrawerSettings)}
              onClick={close}
              className={drawerRowClass}
            >
              <Settings className="size-4" aria-hidden />
              ترقية الحساب / إعدادات الملف
            </Link>
            <button
              type="button"
              {...spekit(SPEKIT.nativeShareApp)}
              onClick={() => void shareApp()}
              className={drawerRowClass}
            >
              <Share2 className="size-4" aria-hidden />
              مشاركة التطبيق
            </button>
            <a
              href={buildSupportWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              {...spekit(SPEKIT.nativeContactUs)}
              className={drawerRowClass}
            >
              <MessageCircle className="size-4" aria-hidden />
              تواصل معنا
            </a>
            <a
              href={supportMailtoHref()}
              className="flex min-h-10 items-center gap-2 px-3 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Mail className="size-3.5" aria-hidden />
              {EMAIL_SUPPORT_EMAIL}
            </a>
          </nav>
        </div>

        <footer className="border-t border-border/70 px-4 py-3 text-center">
          <Link
            href="/settings#about"
            {...spekit(SPEKIT.nativeAppVersion)}
            className="text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            حول التطبيق
          </Link>
        </footer>
      </aside>
      <HubToast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

const drawerRowClass = cn(
  "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold",
  "text-foreground hover:bg-muted/70"
);
