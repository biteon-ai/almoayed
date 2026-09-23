import { describe, expect, it } from "vitest";
import { settingsEditableInputClass } from "@/components/settings/settings-ui";

const FEATURE = "[FIX-UI-004]";

describe(`${FEATURE} settings input dark-mode contrast`, () => {
  it("uses dark slate surface + white text (no forced !bg-white)", () => {
    expect(settingsEditableInputClass).toContain("dark:bg-slate-900");
    expect(settingsEditableInputClass).toContain("dark:text-white");
    expect(settingsEditableInputClass).toContain("dark:border-slate-700");
    expect(settingsEditableInputClass).not.toContain("!bg-white");
  });

  it("keeps a light-mode white surface for daytime readability", () => {
    expect(settingsEditableInputClass).toMatch(/(?:^|\s)bg-white(?:\s|$)/);
  });
});
