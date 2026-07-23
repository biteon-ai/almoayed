import Link from "next/link";
import { requireTeacher } from "@/lib/auth";
import { getGamificationTiers } from "@/actions/gamification";
import { GamificationSettings } from "@/components/teacher/GamificationSettings";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "المستويات والمكافآت | المؤيد" };

export default async function TeacherGamificationSettingsPage() {
  await requireTeacher();
  const tiers = await getGamificationTiers();

  return (
    <div className="container mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
      <Link
        href="/teacher/settings"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "inline-flex h-10 items-center gap-2 px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        )}
      >
        <ArrowRight className="size-4 shrink-0" aria-hidden />
        العودة للإعدادات
      </Link>
      <GamificationSettings initialTiers={tiers} />
    </div>
  );
}
