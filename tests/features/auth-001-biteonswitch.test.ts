import { describe, expect, it } from "vitest";
import {
  buildHostedLoginUrl,
  isOtpStateExpired,
  roleHomePath,
  verifyCallbackToken,
} from "@/lib/biteonswitch/client";

const FEATURE = "[AUTH-001]";

describe(`${FEATURE} BiteonSwitch helpers`, () => {
  it("roleHomePath maps teacher and student", () => {
    expect(roleHomePath("TEACHER")).toBe("/teacher/dashboard");
    expect(roleHomePath("STUDENT")).toBe("/dashboard");
  });

  it("isOtpStateExpired rejects old timestamps", () => {
    const fresh = new Date().toISOString();
    const stale = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    expect(isOtpStateExpired(fresh)).toBe(false);
    expect(isOtpStateExpired(stale)).toBe(true);
  });

  it("mock verify accepts mock:<whatsapp> tokens", async () => {
    const prev = process.env.BITEONSWITCH_MOCK;
    process.env.BITEONSWITCH_MOCK = "true";
    try {
      const ok = await verifyCallbackToken({
        token: "mock:963987654321",
        state: "00000000-0000-0000-0000-000000000001",
      });
      expect(ok.ok).toBe(true);
      if (ok.ok) {
        expect(ok.whatsappNumber).toBe("963987654321");
      }

      const bad = await verifyCallbackToken({
        token: "not-a-mock",
        state: "x",
      });
      expect(bad.ok).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.BITEONSWITCH_MOCK;
      else process.env.BITEONSWITCH_MOCK = prev;
    }
  });

  it("buildHostedLoginUrl in mock mode bounces to callback with state", () => {
    const prevMock = process.env.BITEONSWITCH_MOCK;
    const prevCb = process.env.BITEONSWITCH_CALLBACK_URL;
    process.env.BITEONSWITCH_MOCK = "true";
    process.env.BITEONSWITCH_CALLBACK_URL =
      "http://localhost:3000/api/auth/biteonswitch/callback";
    try {
      const url = buildHostedLoginUrl({
        state: "state-123",
        whatsappHint: "963912345678",
      });
      expect(url).toContain("/api/auth/biteonswitch/callback");
      expect(url).toContain("state=state-123");
      expect(url).toContain("token=mock%3A963912345678");
    } finally {
      if (prevMock === undefined) delete process.env.BITEONSWITCH_MOCK;
      else process.env.BITEONSWITCH_MOCK = prevMock;
      if (prevCb === undefined) delete process.env.BITEONSWITCH_CALLBACK_URL;
      else process.env.BITEONSWITCH_CALLBACK_URL = prevCb;
    }
  });

  it("buildHostedLoginUrl mock without hint returns null", () => {
    const prev = process.env.BITEONSWITCH_MOCK;
    process.env.BITEONSWITCH_MOCK = "true";
    try {
      expect(buildHostedLoginUrl({ state: "s" })).toBeNull();
    } finally {
      if (prev === undefined) delete process.env.BITEONSWITCH_MOCK;
      else process.env.BITEONSWITCH_MOCK = prev;
    }
  });
});
