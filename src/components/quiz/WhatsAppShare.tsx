"use client";

import { APP_NAME, APP_SLOGAN, APP_URL, buildResultShareUrl } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/brand/Logo";
import { MessageCircle, Share2, Trophy } from "lucide-react";

interface WhatsAppShareProps {
  score: number;
  quizId: string;
  quizTitle: string;
  correctCount: number;
  totalQuestions: number;
}

export function WhatsAppShare({
  score,
  quizId,
  quizTitle,
  correctCount,
  totalQuestions,
}: WhatsAppShareProps) {
  const quizUrl = `${APP_URL}/quiz/${quizId}`;
  const shareUrl = buildResultShareUrl(score, quizUrl);

  return (
    <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-50 via-white to-amber-50 dark:from-brand-950/40 dark:via-card dark:to-amber-950/20">
      <CardContent className="p-6 text-center">
        <Logo size="md" className="mx-auto mb-2" />
        <p className="mb-4 text-sm text-muted-foreground">{APP_SLOGAN}</p>

        <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/50">
          <Trophy className="size-10 text-brand-600" />
        </div>

        <h3 className="mb-1 text-2xl font-bold text-brand-800 dark:text-brand-300">
          {score}%
        </h3>
        <p className="mb-1 text-sm text-muted-foreground">
          {correctCount} من {totalQuestions} إجابة صحيحة
        </p>
        <p className="mb-4 text-xs text-muted-foreground">{quizTitle}</p>

        <Progress value={score} className="mb-6 h-2" />

        <div className="space-y-2">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              size: "lg",
              className: "w-full bg-green-600 text-base text-white hover:bg-green-700",
            })}
          >
            <MessageCircle className="size-5" />
            شارك نتيجتك على واتساب
          </a>
          <p className="text-xs text-muted-foreground">
            تحدَّ رفقاتك على {APP_NAME}!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function WhatsAppShareCompact({
  score,
  quizId,
}: {
  score: number;
  quizId: string;
}) {
  const shareUrl = buildResultShareUrl(score, `${APP_URL}/quiz/${quizId}`);

  return (
    <a
      href={shareUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant: "outline", className: "gap-2" })}
    >
      <Share2 className="size-4" />
      شارك
    </a>
  );
}
