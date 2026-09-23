import { describe, expect, it } from "vitest";
import {
  selectContentSurfaceClass,
  selectItemClass,
} from "@/components/ui/select";

const FEATURE = "[FIX-UI-004]";

describe(`${FEATURE} select dropdown dark-mode surface`, () => {
  it("uses opaque dark slate panel (not light bg-popover alone)", () => {
    expect(selectContentSurfaceClass).toContain("dark:bg-slate-900");
    expect(selectContentSurfaceClass).toContain("dark:text-white");
    expect(selectContentSurfaceClass).toContain("dark:border-slate-800");
    expect(selectContentSurfaceClass).toContain("bg-white");
  });

  it("styles option hover/focus for dark menus", () => {
    expect(selectItemClass).toContain("dark:focus:bg-slate-800");
    expect(selectItemClass).toContain("dark:focus:text-white");
  });
});
