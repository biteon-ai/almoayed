"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { HubToast } from "@/components/teacher/HubToast";
import {
  buildTrialInviteShareUrl,
  buildTrialJoinAbsoluteUrl,
} from "@/lib/trial-join";
import { TRIAL_JOIN_MESSAGES } from "@/lib/trial-join-messages";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { Copy, MessageCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrialInviteCardProps {
  teacherCode: string;
  teacherName: string;
  compact?: boolean;
  /** Wrap with teacher-code-card spekit on dashboard */
  spekitRoot?: boolean;
}

export function TrialInviteCard({
  teacherCode,
  teacherName,
  compact = false,
  spekitRoot = false,
}: TrialInviteCardProps) {
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const joinUrl = buildTrialJoinAbsoluteUrl(teacherCode);
  const { whatsappHref } = buildTrialInviteShareUrl({
    teacherName,
    joinUrl,
    textPrefix: TRIAL_JOIN_MESSAGES.inviteSharePrefix(teacherName),
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setToast(TRIAL_JOIN_MESSAGES.copySuccess);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setToast("تعذّر النسخ. انسخ الرابط يدوياً.");
    }
  };

  return (
    <>
      <Card
        className={cn(
          "border-brand-200/80 bg-brand-50/40 shadow-sm",
          compact && "shadow-none"
        )}
        {...(spekitRoot ? spekit(SPEKIT.teacherCodeCard) : {})}
      >
        <CardContent
          className={cn(
            "space-y-4 text-start",
            compact ? "p-4" : "p-6"
          )}
        >
          <div className="flex items-start gap-3">
            <Share2 className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-bold text-foreground">
                {compact ? "رابط تجربة الطلاب" : "رابط التجربة السريعة للطلاب"}
              </p>
              {!compact ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  شارك الرابط مع طلابك لينضموا مباشرة بدون رمز تحقق في أول مرة.
                </p>
              ) : null}
              <p
                className="break-all font-mono text-xs font-semibold text-brand-800 sm:text-sm"
                dir="ltr"
              >
                {joinUrl}
              </p>
              <p className="text-xs text-muted-foreground">
                رمز الأستاذ:{" "}
                <span className="font-mono font-bold" dir="ltr">
                  {teacherCode}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full gap-2 sm:flex-1"
              onClick={() => void handleCopy()}
              {...spekit(SPEKIT.trialInviteCopy)}
            >
              <Copy className="size-4" aria-hidden />
              {copied ? "تم النسخ" : "نسخ الرابط"}
            </Button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white shadow-md transition hover:bg-[#20BD5A] sm:flex-1"
              {...spekit(SPEKIT.trialInviteWhatsapp)}
            >
              <MessageCircle className="size-4" aria-hidden />
              مشاركة عبر واتساب
            </a>
          </div>
        </CardContent>
      </Card>
      <HubToast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

/** Guidance when a teacher opens a student join link. */
export function JoinLinkTeacherNotice() {
  return (
    <Card className="mx-auto max-w-md border-amber-200/80 bg-amber-50/50">
      <CardContent className="space-y-4 p-6 text-start">
        <p className="text-sm font-bold">{TRIAL_JOIN_MESSAGES.studentsOnly}</p>
        <Link
          href="/teacher/dashboard"
          className={buttonVariants({ variant: "brand", className: "h-12 w-full" })}
        >
          العودة للوحة الأستاذ
        </Link>
      </CardContent>
    </Card>
  );
}
