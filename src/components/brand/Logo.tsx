import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
};

/** Compact wordmark for nav bars and inline headers */
export function Logo({ size = "md", className }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-block font-bold tracking-tight text-brand-700",
        sizes[size],
        className
      )}
    >
      {APP_NAME}
    </span>
  );
}
