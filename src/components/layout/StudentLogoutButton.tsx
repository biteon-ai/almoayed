import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { SPEKIT } from "@/lib/spekit-targets";

export function StudentLogoutButton() {
  return (
    <form action={logout}>
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        aria-label="تسجيل الخروج"
        data-spekit={SPEKIT.studentLogout}
      >
        <LogOut className="size-5" />
      </Button>
    </form>
  );
}
