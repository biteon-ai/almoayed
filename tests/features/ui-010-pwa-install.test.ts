import { describe, expect, it, vi, afterEach } from "vitest";
import {
  isLikelyIosDevice,
  isPwaStandalone,
} from "@/lib/pwa-install";

describe("[UI-010] PWA install helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("[UI-010] isPwaStandalone detects display-mode standalone", () => {
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({
        matches: query.includes("display-mode: standalone"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
    vi.stubGlobal("navigator", {});
    expect(isPwaStandalone()).toBe(true);
  });

  it("[UI-010] isPwaStandalone is false in normal browser tab", () => {
    vi.stubGlobal("window", {
      matchMedia: () => ({
        matches: false,
        media: "",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
    vi.stubGlobal("navigator", {});
    expect(isPwaStandalone()).toBe(false);
  });

  it("[UI-010] isLikelyIosDevice matches iPhone UA", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      platform: "iPhone",
      maxTouchPoints: 5,
    });
    expect(isLikelyIosDevice()).toBe(true);
  });

  it("[UI-010] isLikelyIosDevice rejects desktop Chrome", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0",
      platform: "Linux x86_64",
      maxTouchPoints: 0,
    });
    expect(isLikelyIosDevice()).toBe(false);
  });
});
