import { describe, expect, it } from "vitest";
import { formatCountOf, formatPercent } from "@/lib/ui-chrome";

const FEATURE = "[UI-019]";

describe(`${FEATURE} Arabic number labels`, () => {
  it("keeps the percent sign after the digits", () => {
    expect(formatPercent(100)).toBe("100%");
    expect(formatPercent(0)).toBe("0%");
    expect(formatPercent(87.4)).toBe("87%");
  });

  it("formats count-of as Arabic من between isolated numbers", () => {
    expect(formatCountOf(10, 11)).toBe("10 من 11");
    expect(formatCountOf(0, 3)).toBe("0 من 3");
  });
});
