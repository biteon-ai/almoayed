import { PageLoadingView } from "@/components/ui/page-loading-view";

interface TeacherRouteLoadingProps {
  message?: string;
  subMessage?: string;
}

/** Teacher portal route loading — same in-shell pattern as student hubs. */
export function TeacherRouteLoading({
  message = "جاري التحميل…",
  subMessage = "يرجى الانتظار",
}: TeacherRouteLoadingProps) {
  return <PageLoadingView message={message} subMessage={subMessage} />;
}
