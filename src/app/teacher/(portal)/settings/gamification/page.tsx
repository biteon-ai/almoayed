import { requireTeacher } from "@/lib/auth";
import { getGamificationTiers } from "@/actions/gamification";
import { GamificationSettings } from "@/components/teacher/GamificationSettings";

export const metadata = { title: "المستويات والمكافآت" };

export default async function TeacherGamificationSettingsPage() {
  await requireTeacher();
  const tiers = await getGamificationTiers();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <GamificationSettings initialTiers={tiers} />
    </div>
  );
}
