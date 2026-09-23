import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EXTENSION_NOISE_GUARD_SCRIPT,
  installBrowserExtensionNoiseFilter,
  isBrowserExtensionNoise,
  isBrowserExtensionErrorEvent,
  isBrowserExtensionRejection,
} from "@/lib/extension-noise";

const FEATURE = "[FIX-UI-006]";

function withFakeWindow() {
  const listeners = new Map<string, Set<EventListener>>();
  const fakeWindow = {
    __almoayedExtensionNoiseGuard: undefined as boolean | undefined,
    onerror: null as OnErrorEventHandler,
    addEventListener(type: string, listener: EventListener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener(type: string, listener: EventListener) {
      listeners.get(type)?.delete(listener);
    },
  };
  vi.stubGlobal("window", fakeWindow);
  return fakeWindow;
}

describe(`${FEATURE} browser extension noise filter`, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("flags chrome / firefox / safari extension URLs", () => {
    expect(
      isBrowserExtensionNoise(
        new Error("boom"),
        "chrome-extension://abc/content.js"
      )
    ).toBe(true);
    expect(
      isBrowserExtensionNoise("x", "moz-extension://xyz/inject.js")
    ).toBe(true);
    expect(
      isBrowserExtensionNoise("x", "safari-web-extension://bundle")
    ).toBe(true);
  });

  it("flags vault / background-redux extension failures from the console", () => {
    expect(
      isBrowserExtensionNoise(
        new Error("OperationError"),
        "background-redux-new.js"
      )
    ).toBe(true);
    expect(
      isBrowserExtensionNoise(new Error("No tab with id: 321443900."))
    ).toBe(true);
    expect(
      isBrowserExtensionNoise("[VAULT] syncVaultIfOutdated CALLED")
    ).toBe(true);
  });

  it("flags known extension message markers", () => {
    expect(isBrowserExtensionNoise("Redux-DevTools disconnected")).toBe(true);
    expect(
      isBrowserExtensionNoise(new Error("Extension context invalidated."))
    ).toBe(true);
  });

  it("does not flag ordinary application errors", () => {
    expect(
      isBrowserExtensionNoise(
        new Error("Hydration failed because the initial UI")
      )
    ).toBe(false);
    expect(isBrowserExtensionNoise("QUIZ_SUBMIT_SAVE_FAILED")).toBe(false);
    expect(isBrowserExtensionNoise(new Error("OperationError"))).toBe(false);
  });

  it("classifies ErrorEvent / PromiseRejectionEvent helpers", () => {
    const errorEvent = {
      error: new Error("fail"),
      message: "fail",
      filename: "chrome-extension://id/page.js",
    } as ErrorEvent;
    expect(isBrowserExtensionErrorEvent(errorEvent)).toBe(true);

    const rejection = {
      reason: new Error("Extension context invalidated"),
    } as PromiseRejectionEvent;
    expect(isBrowserExtensionRejection(rejection)).toBe(true);
  });

  it("ships an early head guard with onerror, rejection, and console filters", () => {
    expect(EXTENSION_NOISE_GUARD_SCRIPT).toContain("background-redux");
    expect(EXTENSION_NOISE_GUARD_SCRIPT).toContain("no tab with id");
    expect(EXTENSION_NOISE_GUARD_SCRIPT).toContain("unhandledrejection");
    expect(EXTENSION_NOISE_GUARD_SCRIPT).toContain("stopImmediatePropagation");
    expect(EXTENSION_NOISE_GUARD_SCRIPT).toContain("window.onerror");
    expect(EXTENSION_NOISE_GUARD_SCRIPT).toContain("console.error");
    expect(EXTENSION_NOISE_GUARD_SCRIPT).toContain("console.warn");
  });

  it("installBrowserExtensionNoiseFilter suppresses extension console.error only", () => {
    withFakeWindow();
    const originalError = console.error;
    const spy = vi.fn();
    console.error = spy;

    const uninstall = installBrowserExtensionNoiseFilter();

    console.error(new Error("OperationError"), "background-redux-new.js:2");
    console.error("QUIZ_SUBMIT_SAVE_FAILED");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toBe("QUIZ_SUBMIT_SAVE_FAILED");

    uninstall();
    console.error = originalError;
  });
});
