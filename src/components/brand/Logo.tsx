import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl",
};

export function Logo({ size = "md", className }: LogoProps) {
  return (
    <div className={cn("inline-flex flex-col items-center gap-1.5", className)}>
      <span
        className={cn(
          "font-extrabold tracking-tight text-brand-700",
          sizes[size]
        )}
      >
        {APP_NAME}
      </span>
      <span
        className="h-1 w-10 rounded-full bg-gradient-to-l from-brand-400 to-brand-600"
        aria-hidden
      />
    </div>
  );
}
