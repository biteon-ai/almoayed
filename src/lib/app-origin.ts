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

export function getAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return stripTrailingSlash(fromEnv);
  return LOCAL_ORIGIN;
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
