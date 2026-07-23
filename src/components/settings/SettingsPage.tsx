import { getSettingsProfile } from "@/actions/profile";
import { requireAuthenticated } from "@/lib/auth";
import { ActiveSessionsCard } from "@/components/settings/ActiveSessionsCard";
import { LogoutConfirmButton } from "@/components/settings/LogoutConfirmButton";
import { ProfileForm } from "@/components/settings/ProfileForm";
import {
  SettingsPageShell,
  type SettingsNavItem,
} from "@/components/settings/SettingsPageShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import {
  StudentSubscriptionCard,
  StudentTeacherCodeCard,
} from "@/components/settings/StudentProfileExtras";
import { TeacherCodeSection } from "@/components/settings/TeacherCodeSection";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface SettingsPageProps {
  backHref: string;
  backLabel?: string;
  hideBackLink?: boolean;
}

const STUDENT_NAV: SettingsNavItem[] = [
  { id: "profile", label: "معلومات الحساب" },
  { id: "subscription", label: "اشتراكك" },
  { id: "teacher-code", label: "رمز الأستاذ" },
  { id: "sessions", label: "الجلسات النشطة" },
  { id: "logout", label: "تسجيل الخروج" },
];

const TEACHER_NAV: SettingsNavItem[] = [
  { id: "profile", label: "معلومات الحساب" },
  { id: "teacher-code", label: "رمز الأستاذ" },
  { id: "gamification", label: "المستويات" },
  { id: "sessions", label: "الجلسات النشطة" },
  { id: "logout", label: "تسجيل الخروج" },
];

export async function SettingsPage({
  backHref,
  backLabel = "رجوع",
  hideBackLink = false,
}: SettingsPageProps) {
  await requireAuthenticated();
  const profile = await getSettingsProfile();
  const navItems = profile.role === "STUDENT" ? STUDENT_NAV : TEACHER_NAV;

  return (
    <SettingsPageShell
      backHref={backHref}
      backLabel={backLabel}
      navItems={navItems}
      hideBackLink={hideBackLink}
    >
      <SettingsSection id="profile">
        <ProfileForm
          initialFullName={profile.fullName}
          whatsappNumber={profile.whatsappNumber}
        />
      </SettingsSection>

      {profile.role === "STUDENT" ? (
        <>
          <SettingsSection id="subscription">
            <StudentSubscriptionCard
              tier={profile.tier}
              upgradeRequested={profile.upgradeRequested}
            />
          </SettingsSection>
          <SettingsSection id="teacher-code">
            <StudentTeacherCodeCard
              activeTeacherCode={profile.activeTeacherCode}
            />
          </SettingsSection>
        </>
      ) : (
        <>
          <SettingsSection id="teacher-code">
            <TeacherCodeSection teacherCode={profile.teacherCode} />
          </SettingsSection>
          <SettingsSection id="gamification">
            <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-xs">
              <div className="flex items-start gap-3">
                <Trophy className="mt-0.5 size-5 text-amber-500" />
                <div className="space-y-1">
                  <h2 className="text-base font-bold">إعداد المستويات</h2>
                  <p className="text-sm text-muted-foreground">
                    خصّص سلم المكافآت والأيقونات لطلابك حسب الاختبارات المكتملة
                    والمعدل.
                  </p>
                </div>
              </div>
              <Link
                href="/teacher/settings/gamification"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-11 w-full sm:w-auto"
                )}
              >
                إعداد المستويات
              </Link>
            </div>
          </SettingsSection>
        </>
      )}

      <SettingsSection id="sessions">
        <ActiveSessionsCard />
      </SettingsSection>

      <SettingsSection id="logout">
        <LogoutConfirmButton />
      </SettingsSection>
    </SettingsPageShell>
  );
}
