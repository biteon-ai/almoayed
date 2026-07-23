import { redirect } from "next/navigation";
import { LandingPageView } from "@/components/landing/LandingPageView";
import { getSession } from "@/lib/auth";
import { APP_DESCRIPTION, APP_NAME, APP_SLOGAN } from "@/lib/constants";

export const metadata = {
  title: `${APP_NAME} — ${APP_SLOGAN}`,
  description: APP_DESCRIPTION,
};

export default async function HomePage() {
  const session = await getSession();

  if (session.isLoggedIn) {
    redirect(
      session.role === "TEACHER" ? "/teacher/dashboard" : "/dashboard"
    );
  }

  return <LandingPageView />;
}
