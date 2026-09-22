"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { isDigitToken, splitTextWithDigits } from "@/lib/math-text-digits";

interface MathTextProps {
  text: string;
  className?: string;
  isBlock?: boolean;
}

/** High-contrast digits for quiz stems/options (bold white in dark mode). */
const DIGIT_EMPHASIS_CLASS =
  "inline font-sans font-bold tabular-nums text-foreground dark:text-white";

function renderWithDigitEmphasis(
  text: string,
  keyPrefix: string,
  digitClassName = DIGIT_EMPHASIS_CLASS
): ReactNode[] {
  return splitTextWithDigits(text).map((part, idx) => {
    if (isDigitToken(part)) {
      return (
        <span key={`${keyPrefix}-d-${idx}`} className={digitClassName}>
          {part}
        </span>
      );
    }
    return <span key={`${keyPrefix}-t-${idx}`}>{part}</span>;
  });
}

export function MathText({ text, className, isBlock = false }: MathTextProps) {
  if (!text) return null;

  const formatMathSegment = (mathStr: string, idx: number) => {
    const tokens = mathStr.split(
      /([a-zA-Zθπφ]+|[0-9٠-٩]+(?:[.,٫٬][0-9٠-٩]+)*|[\+\-\*\/=⟹²³√∠△\(\),]+)/g
    );

    return (
      <span
        key={idx}
        className="math-formula mx-0.5 font-serif font-medium tracking-wide text-brand-900 dark:text-brand-300"
      >
        {tokens.map((token, tIdx) => {
          if (!token) return null;

          if (isDigitToken(token)) {
            return (
              <span
                key={tIdx}
                className={cn(DIGIT_EMPHASIS_CLASS, "not-italic text-[0.95em]")}
              >
                {token}
              </span>
            );
          }

          const isVariable =
            /^[a-zA-Zθπφ]+$/.test(token) &&
            !["sin", "cos", "tan", "log", "ln"].includes(token.toLowerCase());

          if (isVariable) {
            return (
              <span
                key={tIdx}
                className="text-[1.05em] font-semibold italic dark:text-brand-200"
              >
                {token}
              </span>
            );
          }

          return (
            <span
              key={tIdx}
              className="inline-block font-sans text-[0.95em] font-medium not-italic dark:text-slate-100"
            >
              {token}
            </span>
          );
        })}
      </span>
    );
  };

  const wrapperClass = cn(
    isBlock ? "my-3 block text-center" : "inline",
    className
  );

  if (text.includes("`")) {
    const parts = text.split(/`([^`]+)`/g);
    return (
      <span className={wrapperClass}>
        {parts.map((part, idx) => {
          if (idx % 2 === 1) {
            return formatMathSegment(part, idx);
          }
          return (
            <span key={idx}>{renderWithDigitEmphasis(part, `plain-${idx}`)}</span>
          );
        })}
      </span>
    );
  }

  const parts = text.split(
    /([a-zA-Z0-9٠-٩\+\-\*\/=⟹θπ√∠△²³\(\),]{2,}(?:\s*[\+\-\*\/=⟹]\s*[a-zA-Z0-9٠-٩\+\-\*\/=⟹θπ√∠△²³\(\),]*)*|\b[a-zA-Zθπφ]\b)/g
  );

  return (
    <span className={wrapperClass}>
      {parts.map((part, idx) => {
        if (!part) return null;

        const isMath =
          /([a-zA-Zθπφ0-9٠-٩\+\-\*\/=⟹²³√∠△\(\),])/.test(part) &&
          !/^[\u0600-\u06FF\s]+$/.test(part);

        if (isMath) {
          return formatMathSegment(part, idx);
        }

        return (
          <span key={idx}>{renderWithDigitEmphasis(part, `body-${idx}`)}</span>
        );
      })}
    </span>
  );
}
