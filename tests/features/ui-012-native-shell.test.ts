import { describe, expect, it } from "vitest";
import { parseAppearance, resolveScheme } from "@/lib/appearance";

const FEATURE = "[UI-012]";

describe(`${FEATURE} appearance helpers`, () => {
  it("parseAppearance maps unknown values to system", () => {
    expect(parseAppearance(null)).toBe("system");
    expect(parseAppearance("")).toBe("system");
    expect(parseAppearance("sepia")).toBe("system");
    expect(parseAppearance("dark")).toBe("dark");
    expect(parseAppearance("light")).toBe("light");
    expect(parseAppearance("system")).toBe("system");
  });

  it("resolveScheme follows explicit light/dark and system + prefersDark", () => {
    expect(resolveScheme("light", true)).toBe("light");
    expect(resolveScheme("dark", false)).toBe("dark");
    expect(resolveScheme("system", true)).toBe("dark");
    expect(resolveScheme("system", false)).toBe("light");
  });
});
