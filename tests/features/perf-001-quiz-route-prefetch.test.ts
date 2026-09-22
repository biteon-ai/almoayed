import { describe, expect, it, vi } from "vitest";
import {
  prefetchQuizRoute,
  quizPlayerHref,
} from "@/lib/quiz-route-prefetch";

const FEATURE = "[PERF-001]";

describe(`${FEATURE} quiz route prefetch helpers`, () => {
  it("builds taking and review hrefs", () => {
    expect(quizPlayerHref("q1")).toBe("/quiz/q1");
    expect(
      quizPlayerHref("q1", { reviewSubmissionId: "sub-1" })
    ).toBe("/quiz/q1?review=sub-1");
  });

  it("encodes review submission ids", () => {
    expect(
      quizPlayerHref("q1", { reviewSubmissionId: "a b/c" })
    ).toBe("/quiz/q1?review=a%20b%2Fc");
  });

  it("prefetches the route and ignores prefetch failures", () => {
    const prefetch = vi.fn();
    prefetchQuizRoute({ prefetch }, "/quiz/q1");
    expect(prefetch).toHaveBeenCalledWith("/quiz/q1");

    prefetchQuizRoute(
      {
        prefetch: () => {
          throw new Error("offline");
        },
      },
      "/quiz/q2"
    );
  });
});
