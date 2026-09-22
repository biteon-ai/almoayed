"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  close: () => void;
  /** Native `<dialog>` node — use as Select/Popover portal container (top layer). */
  portalContainer: HTMLElement | null;
  portalContainerRef: RefObject<HTMLDialogElement | null>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

/** Portal floating UI (Select, etc.) into the open modal dialog top layer. */
export function useDialogPortalContainer(): HTMLElement | null {
  return useContext(DialogContext)?.portalContainer ?? null;
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, children, className }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );

  const close = useCallback(() => {
    dialogRef.current?.close();
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    setPortalContainer(el);
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  return (
    <DialogContext.Provider
      value={{ close, portalContainer, portalContainerRef: dialogRef }}
    >
      <dialog
        ref={dialogRef}
        // `open:flex` only — bare `flex` overrides UA `dialog:not([open]){display:none}`
        // and stacks every closed Dialog on screen (modal collision / focus freeze).
        className={cn(
          "fixed inset-0 z-50 m-auto max-h-[90vh] w-[95vw] max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/60 open:flex dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50",
          className
        )}
        onClose={() => onOpenChange(false)}
      >
        {children}
      </dialog>
    </DialogContext.Provider>
  );
}

export function DialogContent({
  className,
  children,
  ...props
}: {
  className?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex max-h-[90vh] flex-col overflow-hidden p-4 text-start sm:p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("shrink-0 space-y-2", className)}>{children}</div>
  );
}

export function DialogTitle({
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

export function DialogDescription({
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

export function DialogFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-4 flex shrink-0 flex-col-reverse gap-2 border-t border-border/60 bg-card pt-4 sm:mt-6 sm:flex-row sm:justify-end dark:border-slate-700 dark:bg-slate-950",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DialogClose({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const ctx = useContext(DialogContext);
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-xl border border-border bg-muted/40 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
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
