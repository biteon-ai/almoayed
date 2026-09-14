import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthErrorCode } from "@/lib/auth-error-codes";
import { hashRecoverySecret } from "@/lib/teacher-login-recovery";

const FEATURE = "[AUTH-009]";

vi.mock("@/lib/auth-session", () => ({
  getAuthSupabaseClient: vi.fn(),
  establishSession: vi.fn(),
}));

vi.mock("@/lib/account-access", () => ({
  assertCanEstablishSession: vi.fn(),
}));

vi.mock("@/lib/admin/passwords", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/admin/passwords")>();
  return {
    ...actual,
    hashPassword: vi.fn(async () => "hashed-password"),
  };
});

import { getAuthSupabaseClient, establishSession } from "@/lib/auth-session";
import { assertCanEstablishSession } from "@/lib/account-access";
import { hashPassword } from "@/lib/admin/passwords";
import {
  completeTeacherPasswordReset,
  consumeTeacherMagicLink,
} from "@/actions/teacher-login-recovery";

const getClient = vi.mocked(getAuthSupabaseClient);
const mintSession = vi.mocked(establishSession);
const assertAccess = vi.mocked(assertCanEstablishSession);
const hashPw = vi.mocked(hashPassword);

function futureIso(ms = 60_000) {
  return new Date(Date.now() + ms).toISOString();
}

function magicClient(opts: {
  token?: Record<string, unknown> | null;
  profile?: Record<string, unknown> | null;
  consumeId?: string | null;
}) {
  return {
    from: (table: string) => {
      const chain: Record<string, unknown> = {};
      let op = "select";
      const self = () => chain;
      chain.select = self;
      chain.eq = self;
      chain.is = self;
      chain.update = () => {
        op = "update";
        return chain;
      };
      chain.maybeSingle = async () => {
        if (table === "teacher_login_tokens" && op === "update") {
          return { data: opts.consumeId ? { id: opts.consumeId } : null };
        }
        if (table === "teacher_login_tokens") {
          return { data: opts.token ?? null, error: null };
        }
        return { data: opts.profile ?? null, error: null };
      };
      return chain;
    },
  };
}

describe(`${FEATURE} completeTeacherPasswordReset`, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not consume a token when the new password is too short", async () => {
    const result = await completeTeacherPasswordReset({
      token: "secret",
      password: "short",
      confirm: "short",
    });
    expect(result).toEqual({
      status: "error",
      code: AuthErrorCode.PASSWORD_TOO_SHORT,
    });
    expect(getClient).not.toHaveBeenCalled();
    expect(hashPw).not.toHaveBeenCalled();
  });
});

describe(`${FEATURE} consumeTeacherMagicLink`, () => {
  const secret = "b".repeat(64);
  const token = {
    id: "tok-1",
    profile_id: "teacher-1",
    purpose: "magic_link",
    token_hash: hashRecoverySecret(secret),
    expires_at: futureIso(),
    consumed_at: null,
    created_at: new Date().toISOString(),
  };
  const profile = {
    id: "teacher-1",
    email: "t@example.com",
    full_name: "أستاذ",
    role: "TEACHER",
    teacher_account_status: "active",
    whatsapp_number: "963912345678",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an already-consumed token without minting a session", async () => {
    getClient.mockReturnValue(
      magicClient({
        token: { ...token, consumed_at: new Date().toISOString() },
        profile,
      }) as never
    );
    const result = await consumeTeacherMagicLink(secret);
    expect(result).toEqual({
      status: "error",
      code: AuthErrorCode.MAGIC_INVALID,
    });
    expect(mintSession).not.toHaveBeenCalled();
  });

  it("returns ACCOUNT_INACTIVE after consuming when the teacher is inactive", async () => {
    getClient.mockReturnValue(
      magicClient({ token, profile, consumeId: "tok-1" }) as never
    );
    assertAccess.mockResolvedValue({
      ok: false,
      code: AuthErrorCode.ACCOUNT_INACTIVE,
    });
    const result = await consumeTeacherMagicLink(secret);
    expect(result).toEqual({
      status: "error",
      code: AuthErrorCode.ACCOUNT_INACTIVE,
    });
    expect(mintSession).not.toHaveBeenCalled();
  });

  it("calls establishSession on a valid unused magic token", async () => {
    getClient.mockReturnValue(
      magicClient({ token, profile, consumeId: "tok-1" }) as never
    );
    assertAccess.mockResolvedValue({ ok: true, teacherId: null });
    mintSession.mockResolvedValue({ role: "TEACHER" });
    const result = await consumeTeacherMagicLink(secret);
    expect(result).toEqual({ status: "success", role: "TEACHER" });
    expect(mintSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: "teacher-1", role: "TEACHER" }),
      null,
      expect.anything()
    );
  });
});
