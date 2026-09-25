import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FEATURE = "[FIX-UI-007]";

describe(`${FEATURE} centered page loading`, () => {
  it("centers PageLoadingView with flex and viewport-filling min-height", () => {
    const src = readFileSync("src/components/ui/page-loading-view.tsx", "utf8");
    expect(src).toContain("items-center justify-center");
    expect(src).toContain("min-h-[max(60vh,calc(100dvh-10rem))]");
    expect(src).not.toContain("py-16");
    expect(src).not.toContain("min-h-[50vh]");
  });

  it("routes page loaders through PageLoadingView / TeacherRouteLoading", () => {
    for (const file of [
      "src/app/(student)/dashboard/loading.tsx",
      "src/app/(student)/quiz/[id]/loading.tsx",
      "src/app/(student)/results/loading.tsx",
      "src/components/ui/teacher-route-loading.tsx",
      "src/components/quiz/QuizRouteLoadingBody.tsx",
      "src/components/quiz/QuizRunnerContainer.tsx",
    ]) {
      const src = readFileSync(file, "utf8");
      expect(src, file).toContain("PageLoadingView");
    }
  });
});
