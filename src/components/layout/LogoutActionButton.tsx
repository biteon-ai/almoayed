"use client";

import type { ComponentProps } from "react";
import { logout } from "@/actions/auth";
import { startTopNavLoader } from "@/components/ui/top-loader";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { SPEKIT } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
  label?: string;
  iconOnly?: boolean;
  spekitId?: string;
  "aria-label"?: string;
};

/**
 * [UI-006] Logout form that starts the top nav loader before the Server Action + redirect.
 */
export function LogoutActionButton({
  variant = "ghost",
  size = "icon",
  className,
  label,
  iconOnly = true,
  spekitId,
  "aria-label": ariaLabel = "تسجيل الخروج",
}: LogoutButtonProps) {
  return (
    <form
      action={logout}
      onSubmit={() => {
        startTopNavLoader();
      }}
    >
      <Button
        type="submit"
        variant={variant}
        size={size}
        className={cn(className)}
        aria-label={ariaLabel}
        data-spekit={spekitId}
      >
        <LogOut className="size-5" />
        {!iconOnly && label ? <span>{label}</span> : null}
      </Button>
    </form>
  );
}

export function StudentLogoutButton() {
  return (
    <LogoutActionButton
      className="rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      spekitId={SPEKIT.studentLogout}
    />
  );
}
