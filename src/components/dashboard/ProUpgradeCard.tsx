"use client";

import { useState, useTransition } from "react";
import { requestProUpgrade } from "@/actions/student";
import { useStudentLoadingBarSync } from "@/components/layout/StudentPortalShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Crown, Lock } from "lucide-react";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

interface ProUpgradeCardProps {
  quizTitle: string;
}

export function ProUpgradeCard({ quizTitle }: ProUpgradeCardProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  useStudentLoadingBarSync(pending);

  const handleUpgrade = () => {
    startTransition(async () => {
      const result = await requestProUpgrade();
      setMessage(result.message);
    });
  };

  return (
    <Card
      className="border-amber-200 bg-gradient-to-br from-amber-50 to-white"
      {...spekit(SPEKIT.proUpgradeCard)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Lock className="size-5 text-amber-600" />
          <CardTitle className="text-base">{quizTitle}</CardTitle>
        </div>
        <CardDescription>اختبار متقدم — للحساب Pro فقط</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          هاد الاختبار مقفول على حسابك المجاني. اطلب الترقية من أستاذك حتى
          تفتح كل المحتوى المتقدم.
        </p>
        <Button
          className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
          onClick={handleUpgrade}
          disabled={pending}
          {...spekit(SPEKIT.proUpgradeRequestButton)}
        >
          <Crown className="size-4" />
          {pending ? "عم يُرسل الطلب..." : "طلب الترقية إلى الحساب المتقدم"}
        </Button>
        {message && (
          <p className="text-center text-xs text-brand-700">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
