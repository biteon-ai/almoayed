import { getAdminPlatformSettings } from "@/actions/platform-settings";
import { PlatformSettingsForm } from "@/components/admin/PlatformSettingsForm";
import { PLATFORM_SETTINGS_MESSAGES } from "@/lib/platform-settings-messages";

export const metadata = { title: "إعدادات المنصة" };
export const dynamic = "force-dynamic";

export default async function AdminPlatformSettingsPage() {
  const loaded = await getAdminPlatformSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">
          {PLATFORM_SETTINGS_MESSAGES.pageTitle}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {PLATFORM_SETTINGS_MESSAGES.pageSubtitle}
        </p>
      </div>
      {loaded.status === "error" ? (
        <div className="card-native p-5 text-sm font-medium text-destructive">
          {loaded.message}
        </div>
      ) : (
        <PlatformSettingsForm initial={loaded.settings} />
      )}
    </div>
  );
}
