import { describe, expect, it } from "vitest";
import {
  APPEARANCE_FOUC_SCRIPT,
  APPEARANCE_FOUC_STYLE,
  APPEARANCE_PAGE_BG,
  APPEARANCE_STORAGE_KEY,
  APPEARANCE_THEME_COLORS,
} from "@/lib/appearance";

const FEATURE = "[FIX-UI-005]";

describe(`${FEATURE} dark-mode FOUC prevention`, () => {
  it("blocking script sets dark/light class, inline page bg, and theme-color", () => {
    expect(APPEARANCE_FOUC_SCRIPT).toContain(APPEARANCE_STORAGE_KEY);
    expect(APPEARANCE_FOUC_SCRIPT).toContain('classList.toggle("dark"');
    expect(APPEARANCE_FOUC_SCRIPT).toContain('classList.toggle("light"');
    expect(APPEARANCE_FOUC_SCRIPT).toContain(APPEARANCE_PAGE_BG.dark);
    expect(APPEARANCE_FOUC_SCRIPT).toContain(APPEARANCE_PAGE_BG.light);
    expect(APPEARANCE_FOUC_SCRIPT).toContain("colorScheme");
    expect(APPEARANCE_FOUC_SCRIPT).toContain(APPEARANCE_THEME_COLORS.dark);
    expect(APPEARANCE_PAGE_BG.dark).toBe("#020617");
  });

  it("critical CSS prefers system dark and honors html.dark / html.light", () => {
    expect(APPEARANCE_FOUC_STYLE).toContain("prefers-color-scheme: dark");
    expect(APPEARANCE_FOUC_STYLE).toContain(
      `html.dark{background-color:${APPEARANCE_PAGE_BG.dark}`
    );
    expect(APPEARANCE_FOUC_STYLE).toContain(
      `html.light{background-color:${APPEARANCE_PAGE_BG.light}`
    );
    expect(APPEARANCE_FOUC_STYLE).toContain("html:not(.light)");
  });
});
