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
    expect(html).toContain("inline-flex");
    expect(html).toContain("text-[9px]");
    expect(html).toContain("font-bold");
    expect(html).toContain("fill-emerald-700");
    expect(html).toContain("bg-emerald-50");
    expect(html).toContain("inset-[4px]");
    expect(html).toContain("shadow-inner");
    expect(html).toContain("stroke-dashoffset");
    expect(html).toContain('text-anchor="middle"');
    expect(html).toContain('dominant-baseline="central"');
    expect(html).toContain('dy="0.8"');
    expect(html).toContain("85%");
    expect(html).toContain("<svg");
    expect(html).toContain("<text");
  });

  it("uses rose tint for low scores and a compact size variant", () => {
    const html = renderToStaticMarkup(
      createElement(ScoreRingBadge, { score: 40, size: "sm" })
    );

    expect(html).toContain("size-12");
    expect(html).toContain("bg-rose-50");
    expect(html).toContain("fill-rose-700");
    expect(html).toContain("text-[9px]");
  });

  it("uses amber tint for mid-band scores", () => {
    const html = renderToStaticMarkup(
      createElement(ScoreRingBadge, { score: 62 })
    );

    expect(html).toContain("bg-amber-50");
    expect(html).toContain("fill-amber-800");
  });
});
