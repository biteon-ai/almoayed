import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

/** Horizontal padding shared across card sections */
export const settingsCardPx = "px-4 sm:px-5 md:px-8";

/** Shared field shell — RTL-safe, breathable padding, modern border */
const settingsFieldShellClass = cn(
  "min-h-12 w-full rounded-xl border px-4 py-3",
  "transition-colors duration-200 md:min-h-[52px] md:px-5 md:py-3.5"
);

/** Editable settings input */
export const settingsEditableInputClass = cn(
  settingsFieldShellClass,
  "border-slate-200 bg-white text-start text-base font-medium leading-relaxed text-foreground",
  "shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)]",
  "placeholder:text-slate-400",
  "hover:border-slate-300",
  "focus:border-brand-500 focus:bg-white focus-visible:ring-[3px] focus-visible:ring-brand-500/10"
);

/** Read-only / locked field surface */
export const settingsReadonlySurfaceClass = cn(
  settingsFieldShellClass,
  "flex items-center justify-between gap-4",
  "border-slate-100 bg-slate-50 shadow-none"
);

export function SettingsCard({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden border-slate-200/80 bg-card py-0 shadow-sm",
        "ring-1 ring-slate-900/[0.04]",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

export function SettingsCardHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <CardHeader
      dir="rtl"
      className={cn(
        settingsCardPx,
        "gap-0 border-b border-slate-100 bg-slate-50/50",
        "pb-4 pt-5 md:pb-5 md:pt-6"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3.5 text-start">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-100/80 text-brand-700 ring-1 ring-brand-200/60"
            aria-hidden
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base font-bold leading-snug text-foreground">
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="text-xs leading-relaxed text-slate-500">
                {description}
              </CardDescription>
            ) : null}
          </div>
        </div>
        {action ? (
          <div className="flex shrink-0 items-center self-center">{action}</div>
        ) : null}
      </div>
    </CardHeader>
  );
}

export function SettingsFormPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      dir="rtl"
      className={cn(
        "space-y-6 rounded-xl border border-slate-200/90 bg-white p-4",
        "md:p-6 lg:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SettingsField({
  label,
  htmlFor,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div dir="rtl" className="flex flex-col gap-y-3 pt-1 text-start md:pt-2">
      <Label
        htmlFor={htmlFor}
        className="flex items-center justify-start gap-2.5 text-sm font-semibold text-foreground"
      >
        {Icon ? (
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100/80"
            aria-hidden
          >
            <Icon className="size-3.5" />
          </span>
        ) : null}
        <span>{label}</span>
      </Label>
      {children}
      {hint ? (
        <p className="text-start text-xs leading-relaxed text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SettingsEditableInput({
  className,
  dir = "rtl",
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      dir={dir}
      className={cn(
        settingsEditableInputClass,
        "h-auto !bg-white",
        className
      )}
      {...props}
    />
  );
}

/**
 * RTL shell with LTR value (e.g. phone numbers).
 * Value anchored toward the label side; lock on the opposite edge.
 */
export function SettingsReadonlyField({
  id,
  value,
  dir = "ltr",
}: {
  id?: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  const isLtrValue = dir === "ltr";

  return (
    <div
      id={id}
      dir="rtl"
      className={settingsReadonlySurfaceClass}
      aria-readonly="true"
    >
      <span
        dir={dir}
        className={cn(
          "min-w-0 shrink-0 leading-none",
          isLtrValue
            ? "font-mono text-sm tracking-wide text-slate-400"
            : "text-base text-slate-400"
        )}
      >
        {value}
      </span>
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-slate-400 ring-1 ring-slate-200/80"
        aria-hidden
        title="حقل مقفول"
      >
        <Lock className="size-3.5 stroke-[1.75]" />
      </span>
    </div>
  );
}

export function SettingsCodeBlock({ code }: { code: string }) {
  return (
    <div
      dir="rtl"
      className={cn(
        settingsFieldShellClass,
        "flex items-center justify-between gap-4 bg-slate-50"
      )}
    >
      <span
        dir="ltr"
        className="min-w-0 shrink-0 font-mono text-sm font-bold tracking-wide text-brand-800/90 sm:text-base"
      >
        {code}
      </span>
    </div>
  );
}

export function SettingsEmptyState({ children }: { children: ReactNode }) {
  return (
    <p
      dir="rtl"
      className={cn(
        settingsFieldShellClass,
        "min-h-0 bg-slate-50 text-sm leading-relaxed text-slate-500"
      )}
    >
      {children}
    </p>
  );
}

export function SettingsCardBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <CardContent
      dir="rtl"
      className={cn(settingsCardPx, "space-y-4 pb-5 pt-5 md:pb-8 md:pt-6", className)}
    >
      {children}
    </CardContent>
  );
}

export function SettingsCardFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      dir="rtl"
      className={cn(
        settingsCardPx,
        "space-y-3 border-t border-slate-100 bg-slate-50/30 pb-5 pt-4 md:pb-6 md:pt-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SettingsMessage({
  message,
  isError,
}: {
  message: string;
  isError?: boolean;
}) {
  return (
    <p
      role={isError ? "alert" : "status"}
      dir="rtl"
      className={cn(
        "rounded-xl px-4 py-2.5 text-center text-xs font-medium",
        isError
          ? "border border-destructive/20 bg-destructive/5 text-destructive"
          : "border border-brand-200/50 bg-brand-50/70 text-brand-800"
      )}
    >
      {message}
    </p>
  );
}
