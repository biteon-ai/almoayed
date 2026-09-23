/**
 * Detect and suppress errors injected by browser extensions so we can
 * ignore them without swallowing real application failures (FIX-UI-006).
 */

const EXTENSION_URL_MARKERS = [
  "chrome-extension://",
  "moz-extension://",
  "safari-extension://",
  "safari-web-extension://",
  "webkit-masked-url://",
  "chrome://extensions",
] as const;

const EXTENSION_MESSAGE_MARKERS = [
  "redux-devtools",
  "react-devtools",
  "react devtools",
  "background-redux-new",
  "background-redux",
  "__firefox__",
  "extensioncontext",
  "extension context invalidated",
  "contentscript",
  "content_script",
  "inpage.js",
  "nkbihfbeogaeaoehlefnkodbefgpgknn", // MetaMask
  "translator",
  "grammarly",
  "[vault]",
  "syncvaultifoutdated",
  "no tab with id",
] as const;

declare global {
  interface Window {
    __almoayedExtensionNoiseGuard?: boolean;
  }
}

function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (value instanceof Error) {
    return `${value.name}\n${value.message}\n${value.stack ?? ""}`;
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/** True when the error/stack clearly originates from a browser extension. */
export function isBrowserExtensionNoise(
  error: unknown,
  sourceOrFilename?: string | null
): boolean {
  const hay = `${asText(error)}\n${sourceOrFilename ?? ""}`.toLowerCase();
  if (!hay.trim()) return false;

  return (
    EXTENSION_URL_MARKERS.some((m) => hay.includes(m)) ||
    EXTENSION_MESSAGE_MARKERS.some((m) => hay.includes(m))
  );
}

export function isBrowserExtensionErrorEvent(event: ErrorEvent): boolean {
  return isBrowserExtensionNoise(
    event.error ?? event.message,
    event.filename ?? event.target?.toString?.() ?? null
  );
}

export function isBrowserExtensionRejection(
  event: PromiseRejectionEvent
): boolean {
  const reason = event.reason;
  const stack =
    reason instanceof Error
      ? reason.stack
      : typeof reason === "object" && reason && "stack" in reason
        ? String((reason as { stack?: unknown }).stack ?? "")
        : "";
  return isBrowserExtensionNoise(reason, stack);
}

function consoleArgsLookLikeExtensionNoise(args: unknown[]): boolean {
  const hay = args.map(asText).join("\n");
  return isBrowserExtensionNoise(hay);
}

/**
 * Client-side install: capture-phase window listeners + console filter.
 * Idempotent. Real app errors stay fully visible.
 */
export function installBrowserExtensionNoiseFilter(): () => void {
  if (typeof window === "undefined") return () => {};
  if (window.__almoayedExtensionNoiseGuard) return () => {};
  window.__almoayedExtensionNoiseGuard = true;

  const onError = (event: ErrorEvent) => {
    if (!isBrowserExtensionErrorEvent(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    if (!isBrowserExtensionRejection(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  const prevOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (isBrowserExtensionNoise(error ?? message, source)) {
      return true; // suppress browser default / Next overlay for extension noise
    }
    if (typeof prevOnError === "function") {
      return prevOnError.call(window, message, source, lineno, colno, error);
    }
    return false;
  };

  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);
  console.error = (...args: unknown[]) => {
    if (consoleArgsLookLikeExtensionNoise(args)) return;
    originalError(...args);
  };
  console.warn = (...args: unknown[]) => {
    if (consoleArgsLookLikeExtensionNoise(args)) return;
    originalWarn(...args);
  };

  window.addEventListener("error", onError, true);
  window.addEventListener("unhandledrejection", onRejection, true);

  return () => {
    window.removeEventListener("error", onError, true);
    window.removeEventListener("unhandledrejection", onRejection, true);
    window.onerror = prevOnError;
    console.error = originalError;
    console.warn = originalWarn;
    window.__almoayedExtensionNoiseGuard = false;
  };
}

/**
 * Early &lt;head&gt; inline script — same markers as TypeScript helpers.
 * Runs before React / Next.js overlay so extension noise never looks like an app crash.
 */
export const EXTENSION_NOISE_GUARD_SCRIPT = `(function(){try{if(window.__almoayedExtensionNoiseGuard)return;window.__almoayedExtensionNoiseGuard=true;function noisy(t){t=String(t||"").toLowerCase();return /chrome-extension:\\/\\/|moz-extension:\\/\\/|safari-extension:\\/\\/|safari-web-extension:\\/\\/|webkit-masked-url|background-redux|redux-devtools|react-devtools|extension context invalidated|\\[vault\\]|syncvault|no tab with id|grammarly|contentscript|content_script|inpage\\.js/.test(t)}function argsNoisy(a){try{for(var i=0;i<a.length;i++){var v=a[i];var t=v&&typeof v==="object"?(v.stack||v.message||"")+"":String(v||"");if(noisy(t))return true}return false}catch(e){return false}}window.addEventListener("error",function(e){var t=(e.filename||"")+" "+(e.message||"")+" "+((e.error&&e.error.stack)||"");if(noisy(t)){e.preventDefault();e.stopImmediatePropagation()}},true);window.addEventListener("unhandledrejection",function(e){var r=e.reason;var t=typeof r==="string"?r:(r&&(r.stack||r.message)||r||"");if(noisy(t)){e.preventDefault();e.stopImmediatePropagation()}},true);var _oe=window.onerror;window.onerror=function(m,s,l,c,err){if(noisy((s||"")+" "+(m||"")+" "+((err&&err.stack)||"")))return true;return typeof _oe==="function"?_oe.apply(this,arguments):false};var _ce=console.error,_cw=console.warn;console.error=function(){if(argsNoisy(arguments))return;return _ce.apply(console,arguments)};console.warn=function(){if(argsNoisy(arguments))return;return _cw.apply(console,arguments)}}catch(e){}})();`;
