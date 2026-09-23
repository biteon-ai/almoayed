import { SettingsPage } from "@/components/settings/SettingsPage";

export const metadata = { title: "الإعدادات" };

export default function TeacherSettingsPage() {
  return (
    <SettingsPage
      backHref="/teacher/dashboard"
      backLabel="لوحة الأستاذ"
    />
  );
}
