"use client";

import { useState, useTransition } from "react";
import { requestProUpgrade } from "@/actions/student";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SettingsCard,
  SettingsCardBody,
  SettingsCardHeader,
  SettingsCodeBlock,
  SettingsEmptyState,
  SettingsMessage,
} from "@/components/settings/settings-ui";
import { canRequestProUpgrade } from "@/lib/tier-upgrade";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import type { StudentTier } from "@/types/database";
import { Crown, GraduationCap, KeyRound, Lock, Sparkles } from "lucide-react";

function TierBadge({ tier }: { tier: StudentTier }) {
  const isPro = tier === "pro";
  return (
    <Badge
      variant={isPro ? "default" : "secondary"}
      className={
        isPro
          ? "h-8 gap-1 rounded-full border-0 bg-amber-600 px-3 text-xs font-bold text-white hover:bg-amber-600"
          : "h-8 rounded-full border border-amber-200/80 bg-amber-50 px-3 text-xs font-bold text-amber-900"
      }
      {...spekit(SPEKIT.profileTierInfo)}
    >
      {isPro ? (
        <>
          <Sparkles className="size-3.5" aria-hidden />
          Pro
        </>
      ) : (
        "مجاني"
      )}
    </Badge>
  );
}

interface StudentSubscriptionCardProps {
  tier: StudentTier | null;
  upgradeRequested: boolean;
}

export function StudentSubscriptionCard({
  tier,
  upgradeRequested,
}: StudentSubscriptionCardProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canRequest =
    tier === "free" &&
    canRequestProUpgrade({ tier: "free", upgrade_requested: upgradeRequested });

  const handleUpgrade = () => {
    startTransition(async () => {
      const result = await requestProUpgrade();
      setMessage(result.message);
    });
  };

  return (
    <SettingsCard>
      <SettingsCardHeader
        icon={GraduationCap}
        title="اشتراكك"
        description="مستوى حسابك مع الأستاذ النشط"
        action={tier ? <TierBadge tier={tier} /> : null}
      />
      <SettingsCardBody>
        {!tier && (
          <SettingsEmptyState>
            اختار أستاذك من لوحة الطالب حتى تظهر معلومات الاشتراك.
          </SettingsEmptyState>
        )}

        {tier === "free" && !upgradeRequested && canRequest && (
          <Button
            className="h-12 w-full gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 md:max-w-md"
            onClick={handleUpgrade}
            disabled={pending}
          >
            <Crown className="size-4" />
            {pending ? "عم يُرسل الطلب..." : "طلب الترقية إلى Pro"}
          </Button>
        )}

        {tier === "free" && upgradeRequested && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3.5 text-start md:max-w-lg">
            <Lock className="mt-0.5 size-4 shrink-0 text-amber-700" />
            <span className="text-sm leading-relaxed text-amber-950">
              طلب الترقية مرسل — الأستاذ رح يتواصل معك قريباً.
            </span>
          </div>
        )}

        {message ? <SettingsMessage message={message} /> : null}
      </SettingsCardBody>
    </SettingsCard>
  );
}

interface StudentTeacherCodeCardProps {
  activeTeacherCode: string | null;
}

export function StudentTeacherCodeCard({
  activeTeacherCode,
}: StudentTeacherCodeCardProps) {
  return (
    <SettingsCard {...spekit(SPEKIT.profileTeacherCode)}>
      <SettingsCardHeader
        icon={KeyRound}
        title="رمز الأستاذ النشط"
        description="الأستاذ المرتبط بحسابك حالياً"
      />
      <SettingsCardBody>
        {activeTeacherCode ? (
          <div className="md:max-w-md">
            <SettingsCodeBlock code={activeTeacherCode} />
          </div>
        ) : (
          <SettingsEmptyState>
            ما في أستاذ نشط — سجّل أو اختار أستاذ من لوحة الطالب.
          </SettingsEmptyState>
        )}
      </SettingsCardBody>
    </SettingsCard>
  );
}

/** @deprecated Use StudentSubscriptionCard + StudentTeacherCodeCard in layout */
export function StudentProfileExtras(props: {
  activeTeacherCode: string | null;
  tier: StudentTier | null;
  upgradeRequested: boolean;
}) {
  return (
    <>
      <StudentSubscriptionCard
        tier={props.tier}
        upgradeRequested={props.upgradeRequested}
      />
      <StudentTeacherCodeCard activeTeacherCode={props.activeTeacherCode} />
    </>
  );
}
