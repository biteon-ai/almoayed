"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface AlertDialogContextValue {
  close: () => void;
}

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const close = useCallback(() => {
    dialogRef.current?.close();
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  return (
    <AlertDialogContext.Provider value={{ close }}>
      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-50 m-auto w-[min(100%-2rem,24rem)] rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/60 open:animate-in dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
        onClose={() => onOpenChange(false)}
      >
        {children}
      </dialog>
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogContent({
  className,
  children,
  dir,
  "data-spekit": dataSpekit,
}: {
  className?: string;
  children: ReactNode;
  dir?: "rtl" | "ltr";
  "data-spekit"?: string;
}) {
  return (
    <div
      className={cn("p-6 text-start", className)}
      dir={dir}
      data-spekit={dataSpekit}
    >
      {children}
    </div>
  );
}

export function AlertDialogHeader({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

export function AlertDialogTitle({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <h2
      className={cn(
        "text-lg font-bold text-foreground dark:text-slate-50",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function AlertDialogDescription({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-sm leading-relaxed text-muted-foreground dark:text-slate-300",
        className
      )}
    >
      {children}
    </p>
  );
}

export function AlertDialogFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AlertDialogCancel({
  className,
  children,
  onClick,
  disabled,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const ctx = useContext(AlertDialogContext);
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-xl border border-border bg-muted/40 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
        className
      )}
      onClick={() => {
        onClick?.();
        ctx?.close();
      }}
    >
      {children}
    </button>
  );
}

export function AlertDialogAction({
  className,
  children,
  onClick,
  type = "button",
  disabled,
  closeOnClick = true,
}: {
  className?: string;
  children: ReactNode;
  onClick?: (event?: MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit";
  disabled?: boolean;
  /** When false, keeps the dialog open after click (multi-step flows). */
  closeOnClick?: boolean;
}) {
  const ctx = useContext(AlertDialogContext);
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={(event) => {
        onClick?.(event);
        if (type === "button" && closeOnClick) {
          ctx?.close();
        }
      }}
    >
      {children}
    </button>
  );
}
