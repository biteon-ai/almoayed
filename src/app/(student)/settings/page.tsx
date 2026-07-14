import { SettingsPage } from "@/components/settings/SettingsPage";
import { requireStudent } from "@/lib/auth";

export const metadata = { title: "الإعدادات | المؤيد" };

export default async function StudentSettingsPage() {
  await requireStudent();

  return (
    <SettingsPage
      backHref="/dashboard"
      backLabel="لوحة الطالب"
      hideBackLink
    />
  );
}
