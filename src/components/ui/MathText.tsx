"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MathTextProps {
  text: string;
  className?: string;
  isBlock?: boolean;
}

export function MathText({ text, className, isBlock = false }: MathTextProps) {
  if (!text) return null;

  // Render a math segment: format variables in italic and numbers in regular font
  const formatMathSegment = (mathStr: string, idx: number) => {
    // We want to wrap individual characters that are variables (a-z, A-Z) in italic spans,
    // while keeping numbers and operators regular.
    const tokens = mathStr.split(/([a-zA-Zθπφ]+|[0-9]+|[\+\-\*\/=⟹²³√∠△\(\),]+)/g);

    return (
      <span
        key={idx}
        className="math-formula font-serif font-medium tracking-wide text-brand-900 dark:text-brand-400 mx-0.5"
      >
        {tokens.map((token, tIdx) => {
          if (!token) return null;

          // Check if token is a Latin variable or Greek math symbol (excluding standard math words/functions)
          const isVariable = /^[a-zA-Zθπφ]+$/.test(token) && !["sin", "cos", "tan", "log", "ln"].includes(token.toLowerCase());
          
          if (isVariable) {
            return (
              <span key={tIdx} className="italic text-[1.05em] font-semibold">
                {token}
              </span>
            );
          }

          // Non-variable math characters (digits, symbols, brackets)
          return (
            <span key={tIdx} className="not-italic inline-block font-sans font-medium text-[0.95em]">
              {token}
            </span>
          );
        })}
      </span>
    );
  };

  // If text contains backticks, use backticks to explicitly separate math from Arabic
  if (text.includes("`")) {
    const parts = text.split(/`([^`]+)`/g);
    return (
      <span className={cn(isBlock ? "block text-center my-3" : "inline", className)}>
        {parts.map((part, idx) => {
          // Odd indices are inside backticks: render as math
          if (idx % 2 === 1) {
            return formatMathSegment(part, idx);
          }
          // Even indices are standard text
          return <span key={idx}>{part}</span>;
        })}
      </span>
    );
  }

  // Fallback: auto-parse math characters
  // Math regex: matches segments of Latin variables, digits, math operators, coordinates
  // Example: "y = 2x + 1" or "r²" or "(1,2)"
  const parts = text.split(/([a-zA-Z0-9\+\-\*\/=⟹θπ√∠△²³\(\),]{2,}(?:\s*[\+\-\*\/=⟹]\s*[a-zA-Z0-9\+\-\*\/=⟹θπ√∠△²³\(\),]*)*|\b[a-zA-Zθπφ]\b)/g);

  return (
    <span className={cn(isBlock ? "block text-center my-3" : "inline", className)}>
      {parts.map((part, idx) => {
        if (!part) return null;

        // Check if the part consists of math characters (contains variables, operators, or numbers)
        const isMath = /([a-zA-Zθπφ0-9\+\-\*\/=⟹²³√∠△\(\),])/.test(part) && 
                       !/^[\u0600-\u06FF\s]+$/.test(part); // Ensure it's not Arabic text

        if (isMath) {
          return formatMathSegment(part, idx);
        }

        // Standard text
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}
