import { describe, expect, it, vi, afterEach } from "vitest";
import {
  DEVELOPMENT_ORIGIN,
  LOCAL_ORIGIN,
  PRODUCTION_CANONICAL_ORIGIN,
  canonicalOriginForHost,
  getAppUrl,
  isDevelopmentHost,
  isProductionCanonicalHost,
  isProductionWwwHost,
  resolvePublicOrigin,
  resolveShareOrigin,
  stripTrailingSlash,
} from "@/lib/app-origin";

describe("[APP-ORIGIN] public domains", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("strips trailing slashes from origins", () => {
    expect(stripTrailingSlash("https://almoayed.app/")).toBe(
      "https://almoayed.app"
    );
    expect(stripTrailingSlash("https://dev.almoayed.app")).toBe(
      "https://dev.almoayed.app"
    );
  });

  it("treats www as an alias of the production apex", () => {
    expect(isProductionWwwHost("www.almoayed.app")).toBe(true);
    expect(isProductionCanonicalHost("https://almoayed.app/")).toBe(true);
    expect(canonicalOriginForHost("https://www.almoayed.app/")).toBe(
      PRODUCTION_CANONICAL_ORIGIN
    );
    expect(canonicalOriginForHost("almoayed.app")).toBe(
      PRODUCTION_CANONICAL_ORIGIN
    );
  });

  it("keeps the dedicated development host separate from production", () => {
    expect(isDevelopmentHost("https://dev.almoayed.app/")).toBe(true);
    expect(isProductionCanonicalHost("dev.almoayed.app")).toBe(false);
    expect(canonicalOriginForHost("dev.almoayed.app")).toBe(DEVELOPMENT_ORIGIN);
  });

  it("getAppUrl reads NEXT_PUBLIC_APP_URL and falls back to localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://almoayed.app/");
    expect(getAppUrl()).toBe(PRODUCTION_CANONICAL_ORIGIN);

    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://dev.almoayed.app");
    expect(getAppUrl()).toBe(DEVELOPMENT_ORIGIN);

    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(getAppUrl()).toBe(LOCAL_ORIGIN);
  });

  it("getAppUrl prefers NEXT_PUBLIC_SITE_URL over APP_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://almoayed.app/");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(getAppUrl()).toBe(PRODUCTION_CANONICAL_ORIGIN);
  });

  it("resolvePublicOrigin never ships localhost in production", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", "production");
    expect(resolvePublicOrigin()).toBe(PRODUCTION_CANONICAL_ORIGIN);
    expect(resolvePublicOrigin("https://dev.almoayed.app")).toBe(
      DEVELOPMENT_ORIGIN
    );
  });

  it("resolveShareOrigin never returns localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", "development");
    expect(resolveShareOrigin()).toBe(PRODUCTION_CANONICAL_ORIGIN);
    expect(resolveShareOrigin("http://localhost:3000")).toBe(
      PRODUCTION_CANONICAL_ORIGIN
    );
    expect(resolveShareOrigin("https://dev.almoayed.app")).toBe(
      DEVELOPMENT_ORIGIN
    );
  });
});
