"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  SettingsCard,
  SettingsCardBody,
  SettingsCardHeader,
  SettingsCodeBlock,
  SettingsEmptyState,
} from "@/components/settings/settings-ui";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { Check, Copy, Share2 } from "lucide-react";

interface TeacherCodeSectionProps {
  teacherCode: string | null;
}

export function TeacherCodeSection({ teacherCode }: TeacherCodeSectionProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopy = async () => {
    if (!teacherCode) return;
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(teacherCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <SettingsCard {...spekit(SPEKIT.profileTeacherCode)}>
      <SettingsCardHeader
        icon={Share2}
        title="رمز الأستاذ"
        description="شارك هالرمز مع طلابك عند التسجيل"
      />
      <SettingsCardBody>
        {teacherCode ? (
          <>
            <SettingsCodeBlock code={teacherCode} />
            <Button
              type="button"
              variant="secondary"
              className="h-12 w-full gap-2 rounded-xl"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="size-4" />
                  تم النسخ
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  نسخ الرمز
                </>
              )}
            </Button>
            {copyError ? (
              <p className="text-start text-xs leading-relaxed text-slate-500">
                ما قدرنا ننسخ تلقائياً — انسخ الرمز يدوياً من الأعلى.
              </p>
            ) : null}
          </>
        ) : (
          <SettingsEmptyState>
            ما في رمز أستاذ مرتبط بحسابك.
          </SettingsEmptyState>
        )}
      </SettingsCardBody>
    </SettingsCard>
  );
}
