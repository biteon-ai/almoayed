"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { submitQuiz } from "@/actions/quiz";
import type { ExamQuestion, Quiz, QuizSubmitResult } from "@/types/database";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { WhatsAppShare } from "@/components/quiz/WhatsAppShare";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Lock, Unlock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface QuizRunnerProps {
  quiz: Quiz;
  questions: ExamQuestion[];
  initialResults?: QuizSubmitResult | null;
}

export function QuizRunner({
  quiz,
  questions,
  initialResults,
}: QuizRunnerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<QuizSubmitResult | null>(
    initialResults ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSubmitted = results !== null;
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length
    ? (answeredCount / questions.length) * 100
    : 0;

  const handleAnswer = (questionId: string, value: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (answeredCount < questions.length) {
      setError("لازم تجاوب على كل الأسئلة قبل ما تسلّم.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const result = await submitQuiz(quiz.id, answers);
        setResults(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "صار خطأ بالتسليم.");
      }
    });
  };

  const wrongAnswers = results?.answers.filter((a) => !a.isCorrect) ?? [];

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6 pb-24">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold leading-tight">{quiz.title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isSubmitted ? (
            <>
              <Unlock className="size-4 text-green-600" />
              <span>الحلول مفتوحة — راجع إجاباتك</span>
            </>
          ) : (
            <>
              <Lock className="size-4 text-amber-600" />
              <span>الحلول مقفولة لحد ما تسلّم إجاباتك</span>
            </>
          )}
        </div>
        {!isSubmitted && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {answeredCount} / {questions.length} أسئلة
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const resultAnswer = results?.answers.find(
            (a) => a.questionId === q.id
          );
          return (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              value={
                isSubmitted
                  ? resultAnswer?.studentAnswer
                  : answers[q.id]
              }
              onChange={(v) => handleAnswer(q.id, v)}
              disabled={isSubmitted}
              showResult={isSubmitted}
              correctAnswer={resultAnswer?.correctAnswer}
              categoryTag={resultAnswer?.categoryTag}
            />
          );
        })}
      </div>

      {/* Submit or Results */}
      {!isSubmitted ? (
        <div className="sticky bottom-4 z-10">
          {error && (
            <p className="mb-2 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </p>
          )}
          <Button
            size="lg"
            className="w-full bg-brand-600 shadow-lg shadow-brand-900/20 hover:bg-brand-700"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? "عم يحسب النتيجة..." : "سلّم الإجابات"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <WhatsAppShare
            score={results.score}
            quizId={quiz.id}
            quizTitle={quiz.title}
            correctCount={results.correctCount}
            totalQuestions={results.totalQuestions}
          />

          {wrongAnswers.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Unlock className="size-5 text-brand-600" />
                <h2 className="text-lg font-bold">شرح الأسئلة اللي غلطت فيها</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                هلّق صار مسموح تشوف الحل — راجع بإيدك قبل ما تقرأ الشرح!
              </p>

              {wrongAnswers.map((a, idx) => (
                <Card
                  key={a.questionId}
                  className="border-red-200/60 dark:border-red-900/40"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        سؤال غلط #{idx + 1}
                      </CardTitle>
                      <Badge variant="outline">{a.categoryTag}</Badge>
                    </div>
                    <CardDescription className="text-start leading-relaxed text-foreground">
                      {a.questionText}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {a.questionImageUrl && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={a.questionImageUrl}
                          alt="صورة السؤال"
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="size-4" />
                        <span>إجابتك: {a.studentAnswer || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="size-4" />
                        <span>الإجابة الصح: {a.correctAnswer}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-brand-700 dark:text-brand-400">
                        الشرح:
                      </p>
                      <p className="text-sm leading-relaxed">
                        {a.explanationText}
                      </p>
                      {a.explanationMediaUrl && (
                        <div className="mt-2 overflow-hidden rounded-lg">
                          {/\.(mp4|webm|ogg)$/i.test(a.explanationMediaUrl) ? (
                            <video
                              src={a.explanationMediaUrl}
                              controls
                              preload="metadata"
                              className="w-full"
                              playsInline
                            />
                          ) : (
                            <div className="relative aspect-video w-full bg-muted">
                              <Image
                                src={a.explanationMediaUrl}
                                alt="شرح السؤال"
                                fill
                                className="object-contain"
                                sizes="(max-width: 640px) 100vw"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {wrongAnswers.length === 0 && (
            <Card className="border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30">
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle2 className="size-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-200">
                    ممتاز! كل الإجابات صح
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    استمر هيك — حل بيدك وما حدا بفيدك!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
