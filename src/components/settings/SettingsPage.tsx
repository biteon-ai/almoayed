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

interface SettingsPageProps {
  backHref: string;
  backLabel?: string;
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
  { id: "sessions", label: "الجلسات النشطة" },
  { id: "logout", label: "تسجيل الخروج" },
];

export async function SettingsPage({
  backHref,
  backLabel = "رجوع",
}: SettingsPageProps) {
  await requireAuthenticated();
  const profile = await getSettingsProfile();
  const navItems = profile.role === "STUDENT" ? STUDENT_NAV : TEACHER_NAV;

  return (
    <SettingsPageShell
      backHref={backHref}
      backLabel={backLabel}
      navItems={navItems}
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
        <SettingsSection id="teacher-code">
          <TeacherCodeSection teacherCode={profile.teacherCode} />
        </SettingsSection>
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
