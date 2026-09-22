"use client";

import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";
import { useRouter } from "next/navigation";
import { prefetchQuizRoute } from "@/lib/quiz-route-prefetch";

/**
 * Prefetch a quiz/review route when the host enters the viewport or the user
 * hovers / focuses / touches it — caches RSC + warms the QuizRunner chunk.
 */
export function usePrefetchOnIntent(href: string | null | undefined): {
  ref: RefCallback<HTMLElement | null>;
  onIntent: () => void;
  intentProps: {
    onMouseEnter: () => void;
    onFocusCapture: () => void;
    onTouchStart: () => void;
  };
} {
  const router = useRouter();
  const [node, setNode] = useState<HTMLElement | null>(null);
  const doneRef = useRef(false);

  const runPrefetch = useCallback(() => {
    if (!href || doneRef.current) return;
    doneRef.current = true;
    prefetchQuizRoute(router, href);
  }, [href, router]);

  const ref = useCallback<RefCallback<HTMLElement | null>>((next) => {
    setNode(next);
  }, []);

  useEffect(() => {
    doneRef.current = false;
  }, [href]);

  useEffect(() => {
    if (!node || !href) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          runPrefetch();
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, href, runPrefetch]);

  return {
    ref,
    onIntent: runPrefetch,
    intentProps: {
      onMouseEnter: runPrefetch,
      onFocusCapture: runPrefetch,
      onTouchStart: runPrefetch,
    },
  };
}
