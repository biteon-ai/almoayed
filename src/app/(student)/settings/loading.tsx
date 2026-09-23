import { PageLoadingView } from "@/components/ui/page-loading-view";

export default function SettingsLoading() {
  return (
    <PageLoadingView
      message="جاري فتح الإعدادات…"
      subMessage="نحضّر حسابك وتفضيلاتك"
    />
  );
}
