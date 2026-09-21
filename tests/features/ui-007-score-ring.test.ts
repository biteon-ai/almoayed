import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScoreRingBadge } from "@/components/ui/score-ring-badge";
import { SPEKIT } from "@/lib/spekit-targets";

const FEATURE = "[UI-007]";

describe(`${FEATURE} ScoreRingBadge`, () => {
  it("renders a fixed-size ring with percent and SVG arc", () => {
    const html = renderToStaticMarkup(
      createElement(ScoreRingBadge, { score: 85 })
    );

    expect(html).toContain(`data-spekit="${SPEKIT.resultsScoreBadge}"`);
    expect(html).toContain("size-14");
    expect(html).toContain("text-sm");
    expect(html).toContain("font-bold");
    expect(html).toContain("bg-emerald-50");
    expect(html).toContain("stroke-dashoffset");
    expect(html).toContain("85");
    expect(html).toContain("%");
    expect(html).toContain("<svg");
  });

  it("uses rose tint for low scores and a compact size variant", () => {
    const html = renderToStaticMarkup(
      createElement(ScoreRingBadge, { score: 40, size: "sm" })
    );

    expect(html).toContain("size-12");
    expect(html).toContain("bg-rose-50");
    expect(html).toContain("text-rose-700");
  });

  it("uses amber tint for mid-band scores", () => {
    const html = renderToStaticMarkup(
      createElement(ScoreRingBadge, { score: 62 })
    );

    expect(html).toContain("bg-amber-50");
    expect(html).toContain("text-amber-800");
  });
});
