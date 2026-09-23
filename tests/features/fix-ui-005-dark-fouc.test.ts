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
  it("blocking script sets dark class, inline page bg, and theme-color", () => {
    expect(APPEARANCE_FOUC_SCRIPT).toContain(APPEARANCE_STORAGE_KEY);
    expect(APPEARANCE_FOUC_SCRIPT).toContain('classList.toggle("dark"');
    expect(APPEARANCE_FOUC_SCRIPT).toContain(APPEARANCE_PAGE_BG.dark);
    expect(APPEARANCE_FOUC_SCRIPT).toContain(APPEARANCE_PAGE_BG.light);
    expect(APPEARANCE_FOUC_SCRIPT).toContain("colorScheme");
    expect(APPEARANCE_FOUC_SCRIPT).toContain(APPEARANCE_THEME_COLORS.dark);
  });

  it("critical CSS paints dark html before stylesheet load", () => {
    expect(APPEARANCE_FOUC_STYLE).toContain(`html.dark{background-color:${APPEARANCE_PAGE_BG.dark}`);
    expect(APPEARANCE_FOUC_STYLE).toContain(`html{background-color:${APPEARANCE_PAGE_BG.light}`);
    expect(APPEARANCE_FOUC_STYLE).toContain("color-scheme:dark");
  });
});
