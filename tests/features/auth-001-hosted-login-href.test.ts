import { afterEach, describe, expect, it, vi } from "vitest";
import { getBiteonHostedLoginHref } from "@/lib/biteonswitch/hosted-login-href";

describe("[AUTH-001] getBiteonHostedLoginHref", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("[AUTH-001] builds href from BITEONSWITCH_HOSTED_LOGIN_URL in env", () => {
    vi.stubEnv("BITEONSWITCH_HOSTED_LOGIN_URL", "https://auth.example.com/almoayed-edu");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://almoayed-edu.vercel.app");

    const href = getBiteonHostedLoginHref();

    expect(href).toBe(
      "https://auth.example.com/almoayed-edu?return=https%3A%2F%2Falmoayed-edu.vercel.app%2Flogin"
    );
  });

  it("[AUTH-001] falls back to local hosted login when env is empty", () => {
    vi.stubEnv("BITEONSWITCH_HOSTED_LOGIN_URL", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3001");

    const href = getBiteonHostedLoginHref();

    expect(href).toBe(
      "http://localhost:3000/almoayed-edu?return=http%3A%2F%2Flocalhost%3A3001%2Flogin"
    );
  });
});
