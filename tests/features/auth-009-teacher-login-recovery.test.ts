import { describe, expect, it, vi } from "vitest";
import { AuthErrorCode } from "@/lib/auth-error-codes";
import {
  RATE_LIMIT_MAX,
  buildMagicUrl,
  buildResetUrl,
  countRecentTokens,
  generateRecoverySecret,
  hashRecoverySecret,
  isRateLimited,
  issueAndSendRecovery,
  lookupTeacherByEmail,
  magicExpiresAt,
  resetExpiresAt,
  validateNewPassword,
} from "@/lib/teacher-login-recovery";

const FEATURE = "[AUTH-009]";

function lookupClient(row: Record<string, unknown> | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: row, error: null }),
          }),
        }),
      }),
    }),
  } as never;
}

describe(`${FEATURE} token helpers`, () => {
  it("hashes secrets to stable 64-char hex", () => {
    const secret = "a".repeat(64);
    const hash = hashRecoverySecret(secret);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashRecoverySecret(secret)).toBe(hash);
    expect(hashRecoverySecret("other")).not.toBe(hash);
  });

  it("generateRecoverySecret returns unique 64-char hex", () => {
    const a = generateRecoverySecret();
    const b = generateRecoverySecret();
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(b).toMatch(/^[a-f0-9]{64}$/);
    expect(a).not.toBe(b);
  });

  it("reset TTL is 60 minutes and magic TTL is 15 minutes", () => {
    const now = new Date("2026-09-14T12:00:00.000Z");
    expect(resetExpiresAt(now).toISOString()).toBe("2026-09-14T13:00:00.000Z");
    expect(magicExpiresAt(now).toISOString()).toBe("2026-09-14T12:15:00.000Z");
  });

  it("isRateLimited is true at 3 recent sends", () => {
    expect(isRateLimited(2)).toBe(false);
    expect(isRateLimited(RATE_LIMIT_MAX)).toBe(true);
    expect(isRateLimited(4)).toBe(true);
  });

  it("builds origin-aware reset and magic URLs", () => {
    expect(buildResetUrl("https://almoayed.app/", "abc")).toBe(
      "https://almoayed.app/teacher/reset?token=abc"
    );
    expect(buildMagicUrl("https://dev.almoayed.app", "xy z")).toBe(
      "https://dev.almoayed.app/teacher/magic?token=xy%20z"
    );
  });

  it("validateNewPassword enforces length and confirm match", () => {
    expect(validateNewPassword("short", "short")).toBe(
      AuthErrorCode.PASSWORD_TOO_SHORT
    );
    expect(validateNewPassword("longenough", "different1")).toBe(
      AuthErrorCode.PASSWORD_MISMATCH
    );
    expect(validateNewPassword("longenough", "longenough")).toBeNull();
  });
});

describe(`${FEATURE} teacher lookup`, () => {
  it("treats student, admin, and unknown emails as not_found", async () => {
    expect(await lookupTeacherByEmail("not-an-email", lookupClient(null))).toEqual({
      status: "not_found",
    });
    expect(
      await lookupTeacherByEmail("student@example.com", lookupClient(null))
    ).toEqual({ status: "not_found" });
  });

  it("returns inactive for inactive teachers", async () => {
    const result = await lookupTeacherByEmail(
      "t@example.com",
      lookupClient({
        id: "teacher-1",
        email: "t@example.com",
        full_name: "أستاذ",
        role: "TEACHER",
        teacher_account_status: "inactive",
        whatsapp_number: null,
      })
    );
    expect(result).toEqual({ status: "inactive", profileId: "teacher-1" });
  });

  it("returns ok for active teachers", async () => {
    const result = await lookupTeacherByEmail(
      "T@Example.com",
      lookupClient({
        id: "teacher-1",
        email: "t@example.com",
        full_name: "أستاذ المؤيد",
        role: "TEACHER",
        teacher_account_status: "active",
        whatsapp_number: "963912345678",
      })
    );
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.profileId).toBe("teacher-1");
      expect(result.email).toBe("t@example.com");
    }
  });
});

describe(`${FEATURE} issueAndSendRecovery`, () => {
  it("does not send mail when the email is not a teacher", async () => {
    const send = vi.fn();
    const result = await issueAndSendRecovery(
      "nobody@example.com",
      "password_reset",
      lookupClient(null),
      send,
      "https://almoayed.app"
    );
    expect(result).toEqual({
      status: "error",
      code: AuthErrorCode.TEACHER_NOT_FOUND,
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("does not send mail for inactive teachers", async () => {
    const send = vi.fn();
    const result = await issueAndSendRecovery(
      "t@example.com",
      "magic_link",
      lookupClient({
        id: "teacher-1",
        email: "t@example.com",
        full_name: "أستاذ",
        role: "TEACHER",
        teacher_account_status: "inactive",
        whatsapp_number: null,
      }),
      send,
      "https://almoayed.app"
    );
    expect(result).toEqual({
      status: "error",
      code: AuthErrorCode.ACCOUNT_INACTIVE,
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("rate-limits after 3 recent tokens", async () => {
    const send = vi.fn();
    const client = {
      from: (table: string) => {
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: {
                      id: "teacher-1",
                      email: "t@example.com",
                      full_name: "أستاذ",
                      role: "TEACHER",
                      teacher_account_status: "active",
                      whatsapp_number: null,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              gt: async () => ({ count: 3, error: null }),
            }),
          }),
        };
      },
    };
    const result = await issueAndSendRecovery(
      "t@example.com",
      "password_reset",
      client as never,
      send,
      "https://almoayed.app"
    );
    expect(result).toEqual({
      status: "error",
      code: AuthErrorCode.RECOVERY_RATE_LIMITED,
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("countRecentTokens reads the count field", async () => {
    const n = await countRecentTokens("teacher-1", new Date(), {
      from: () => ({
        select: () => ({
          eq: () => ({
            gt: async () => ({ count: 2, error: null }),
          }),
        }),
      }),
    } as never);
    expect(n).toBe(2);
  });
});

describe(`${FEATURE} issueAndSendRecovery mail failure`, () => {
  it("deletes the inserted token when sendEmail fails", async () => {
    const deleted: string[] = [];
    const send = vi.fn(async () => ({ ok: false as const, message: "boom" }));
    const client = {
      from: (table: string) => {
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: {
                      id: "teacher-1",
                      email: "t@example.com",
                      full_name: "أستاذ",
                      role: "TEACHER",
                      teacher_account_status: "active",
                      whatsapp_number: null,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              gt: async () => ({ count: 0, error: null }),
            }),
          }),
          insert: () => ({
            select: () => ({
              maybeSingle: async () => ({ data: { id: "tok-new" }, error: null }),
            }),
          }),
          delete: () => ({
            eq: async (_col: string, id: string) => {
              deleted.push(id);
              return { error: null };
            },
          }),
        };
      },
    };

    const result = await issueAndSendRecovery(
      "t@example.com",
      "password_reset",
      client as never,
      send,
      "https://almoayed.app"
    );
    expect(result).toEqual({
      status: "error",
      code: AuthErrorCode.MAIL_SEND_FAILED,
    });
    expect(send).toHaveBeenCalledOnce();
    expect(deleted).toEqual(["tok-new"]);
  });
});

describe(`${FEATURE} consume CAS`, () => {
  it("consumeTokenRow succeeds only when consumed_at is still null", async () => {
    const { consumeTokenRow } = await import("@/lib/teacher-login-recovery");
    const ok = await consumeTokenRow("tok-1", {
      from: () => ({
        update: () => ({
          eq: () => ({
            is: () => ({
              select: () => ({
                maybeSingle: async () => ({ data: { id: "tok-1" } }),
              }),
            }),
          }),
        }),
      }),
    } as never);
    expect(ok).toBe(true);

    const raced = await consumeTokenRow("tok-1", {
      from: () => ({
        update: () => ({
          eq: () => ({
            is: () => ({
              select: () => ({
                maybeSingle: async () => ({ data: null }),
              }),
            }),
          }),
        }),
      }),
    } as never);
    expect(raced).toBe(false);
  });
});
