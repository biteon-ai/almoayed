/** Canonical public origins — keep in sync with `next.config.mjs` redirects. */

export const PRODUCTION_CANONICAL_HOST = "almoayed.app";
export const PRODUCTION_WWW_HOST = "www.almoayed.app";
export const DEVELOPMENT_HOST = "dev.almoayed.app";

export const PRODUCTION_CANONICAL_ORIGIN = "https://almoayed.app";
export const PRODUCTION_WWW_ORIGIN = "https://www.almoayed.app";
export const DEVELOPMENT_ORIGIN = "https://dev.almoayed.app";
export const LOCAL_ORIGIN = "http://localhost:3000";

export function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function hostnameOf(urlOrHost: string): string {
  const trimmed = urlOrHost.trim().toLowerCase();
  if (!trimmed) return "";
  try {
    const withProtocol = trimmed.includes("://")
      ? trimmed
      : `https://${trimmed}`;
    return new URL(withProtocol).hostname;
  } catch {
    return trimmed.split("/")[0] ?? "";
  }
}

export function isLocalOrigin(urlOrHost: string): boolean {
  const host = hostnameOf(urlOrHost);
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host.endsWith(".localhost")
  );
}

/**
 * Configured public origin from env (no trailing slash).
 * Prefers `NEXT_PUBLIC_SITE_URL`, then `NEXT_PUBLIC_APP_URL`.
 * Falls back to local origin when unset (dev default).
 */
export function getAppUrl(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const app = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const fromEnv = site || app;
  if (fromEnv) return stripTrailingSlash(fromEnv);
  return LOCAL_ORIGIN;
}

/**
 * Origin safe for share / invite / WhatsApp links.
 * Never returns localhost in production builds; prefers a live
 * `window.location.origin` when the configured env still points at local.
 */
export function resolvePublicOrigin(clientOrigin?: string): string {
  const configured = getAppUrl();

  if (!isLocalOrigin(configured)) {
    return configured;
  }

  if (clientOrigin && !isLocalOrigin(clientOrigin)) {
    return stripTrailingSlash(clientOrigin);
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_CANONICAL_ORIGIN;
  }

  return configured;
}

/**
 * Origin for outbound share text (WhatsApp / Web Share).
 * Never emits localhost — recipients cannot open local URLs.
 */
export function resolveShareOrigin(clientOrigin?: string): string {
  const resolved = resolvePublicOrigin(clientOrigin);
  return isLocalOrigin(resolved) ? PRODUCTION_CANONICAL_ORIGIN : resolved;
}

export function isProductionWwwHost(host: string): boolean {
  return hostnameOf(host) === PRODUCTION_WWW_HOST;
}

export function isProductionCanonicalHost(host: string): boolean {
  return hostnameOf(host) === PRODUCTION_CANONICAL_HOST;
}

export function isDevelopmentHost(host: string): boolean {
  return hostnameOf(host) === DEVELOPMENT_HOST;
}

/** Apex host is canonical; www is an alias that should 301 there. */
export function canonicalOriginForHost(host: string): string {
  const hostname = hostnameOf(host);
  if (hostname === PRODUCTION_WWW_HOST || hostname === PRODUCTION_CANONICAL_HOST) {
    return PRODUCTION_CANONICAL_ORIGIN;
  }
  if (hostname === DEVELOPMENT_HOST) return DEVELOPMENT_ORIGIN;
  return getAppUrl();
}
