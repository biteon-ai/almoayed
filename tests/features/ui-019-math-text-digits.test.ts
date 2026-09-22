import { describe, expect, it } from "vitest";
import { isDigitToken, splitTextWithDigits } from "@/lib/math-text-digits";

describe("[UI-019] math-text digit emphasis", () => {
  it("detects Western and Eastern Arabic digit tokens", () => {
    expect(isDigitToken("30")).toBe(true);
    expect(isDigitToken("3.14")).toBe(true);
    expect(isDigitToken("١٢")).toBe(true);
    expect(isDigitToken("x")).toBe(false);
    expect(isDigitToken("٥×٥")).toBe(false);
  });

  it("splits prose so digits can be styled independently", () => {
    expect(splitTextWithDigits("ما ناتج 5 × 5؟")).toEqual([
      "ما ناتج ",
      "5",
      " × ",
      "5",
      "؟",
    ]);
    expect(splitTextWithDigits("النسبة 30%")).toEqual([
      "النسبة ",
      "30",
      "%",
    ]);
  });
});
