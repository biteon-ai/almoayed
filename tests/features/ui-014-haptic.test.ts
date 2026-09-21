import { describe, expect, it } from "vitest";
import { hapticPulse } from "@/lib/haptic";

const FEATURE = "[UI-014]";

describe(`${FEATURE} hapticPulse`, () => {
  it("does not throw when navigator.vibrate is missing", () => {
    const nav = globalThis.navigator;
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      configurable: true,
    });
    expect(() => hapticPulse(10)).not.toThrow();
    Object.defineProperty(globalThis, "navigator", {
      value: nav,
      configurable: true,
    });
  });

  it("does not throw when navigator is undefined", () => {
    const nav = globalThis.navigator;
    // @ts-expect-error test isolation
    delete globalThis.navigator;
    expect(() => hapticPulse([10, 30, 10])).not.toThrow();
    Object.defineProperty(globalThis, "navigator", {
      value: nav,
      configurable: true,
    });
  });
});
