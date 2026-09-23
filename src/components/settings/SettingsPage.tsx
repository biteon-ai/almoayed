import { getSettingsProfile } from "@/actions/profile";
import { requireAuthenticated } from "@/lib/auth";
import { ActiveSessionsCard } from "@/components/settings/ActiveSessionsCard";
import { LogoutConfirmButton } from "@/components/settings/LogoutConfirmButton";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { StudentDemographicsSettings } from "@/components/settings/StudentDemographicsSettings";
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
import { AppVersion } from "@/components/brand/AppVersion";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface SettingsPageProps {
  backHref: string;
  backLabel?: string;
  hideBackLink?: boolean;
  hideTitleOnMobile?: boolean;
}

const STUDENT_NAV: SettingsNavItem[] = [
  { id: "profile", label: "معلومات الحساب" },
  { id: "demographics", label: "البيانات الشخصية" },
  { id: "subscription", label: "اشتراكك" },
  { id: "teacher-code", label: "رمز الأستاذ" },
  { id: "sessions", label: "الجلسات النشطة" },
  { id: "logout", label: "تسجيل الخروج" },
  { id: "about", label: "حول التطبيق" },
];

const TEACHER_NAV: SettingsNavItem[] = [
  { id: "profile", label: "معلومات الحساب" },
  { id: "teacher-code", label: "رمز الأستاذ" },
  { id: "gamification", label: "المستويات" },
  { id: "sessions", label: "الجلسات النشطة" },
  { id: "logout", label: "تسجيل الخروج" },
  { id: "about", label: "حول التطبيق" },
];

export async function SettingsPage({
  backHref,
  backLabel = "رجوع",
  hideBackLink = false,
  hideTitleOnMobile = false,
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
      hideTitleOnMobile={hideTitleOnMobile}
    >
      <SettingsSection id="profile">
        <ProfileForm
          initialFullName={profile.fullName}
          whatsappNumber={profile.whatsappNumber}
        />
      </SettingsSection>

      {profile.role === "STUDENT" ? (
        <>
          {profile.demographics ? (
            <SettingsSection id="demographics">
              <StudentDemographicsSettings
                fullName={profile.fullName}
                demographics={profile.demographics}
              />
            </SettingsSection>
          ) : null}
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

      <SettingsSection id="about">
        <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-xs">
          <h2 id="about-heading" className="text-base font-bold">
            حول التطبيق
          </h2>
          <dl className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-sm text-muted-foreground">التطبيق</dt>
              <dd className="text-sm font-semibold">{APP_NAME}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-sm text-muted-foreground">الإصدار</dt>
              <dd>
                <AppVersion className="text-sm font-medium text-slate-500 dark:text-slate-400" />
              </dd>
            </div>
          </dl>
        </div>
      </SettingsSection>
    </SettingsPageShell>
  );
}
