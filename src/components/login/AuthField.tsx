import { Label } from "@/components/ui/label";
import type { SpekitTarget } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

type AuthFieldProps = {
  id: string;
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
  spekitProps?: { "data-spekit"?: SpekitTarget };
};

export function AuthField({
  id,
  label,
  icon: Icon,
  children,
  className,
  spekitProps,
}: AuthFieldProps) {
  return (
    <div className={cn("space-y-2", className)} {...spekitProps}>
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
      >
        <Icon className="size-4 shrink-0 text-emerald-600" />
        {label}
      </Label>
      {children}
    </div>
  );
}

type AuthInputShellProps = React.ComponentProps<"div">;

export function AuthInputShell({
  children,
  className,
  ...props
}: AuthInputShellProps) {
  return (
    <div
      {...props}
      className={cn(
        "flex h-12 w-full items-stretch overflow-hidden rounded-xl border border-input bg-muted/40 transition-all duration-200",
        "hover:border-emerald-300/70 focus-within:border-emerald-500 focus-within:bg-background focus-within:ring-[3px] focus-within:ring-emerald-500/15",
        className
      )}
    >
      {children}
    </div>
  );
}
