import { describe, expect, it } from "vitest";
import {
  isStudentDeactivatedForLogin,
  isTeacherAccountActive,
  resolveActiveTeacherId,
  type StudentLinkRow,
} from "@/lib/account-access";
import { AuthErrorCode } from "@/lib/auth-error-codes";
import {
  loginMessageForCode,
  loginMessageForQueryError,
} from "@/lib/login-ui-messages";

const FEATURE = "[AUTH-007]";
const CANONICAL_AR =
  "عذراً، هذا الحساب غير فعال. يرجى التواصل مع الإدارة";

describe(`${FEATURE} Teacher account status`, () => {
  it("allows active teachers", () => {
    expect(isTeacherAccountActive("active")).toBe(true);
  });

  it("blocks inactive teachers", () => {
    expect(isTeacherAccountActive("inactive")).toBe(false);
    expect(isTeacherAccountActive(null)).toBe(false);
    expect(isTeacherAccountActive(undefined)).toBe(false);
  });
});

describe(`${FEATURE} Student deactivated login rule`, () => {
  it.each([
    {
      name: "all deactivated",
      links: [{ status: "deactivated" }, { status: "deactivated" }],
      blocked: true,
    },
    {
      name: "mixed active + deactivated",
      links: [{ status: "active" }, { status: "deactivated" }],
      blocked: false,
    },
    {
      name: "pending-only",
      links: [{ status: "pending" }],
      blocked: false,
    },
    {
      name: "empty links",
      links: [],
      blocked: false,
    },
    {
      name: "pending + deactivated (no active)",
      links: [{ status: "pending" }, { status: "deactivated" }],
      blocked: true,
    },
  ])("$name → blocked=$blocked", ({ links, blocked }) => {
    expect(isStudentDeactivatedForLogin(links)).toBe(blocked);
  });
});

describe(`${FEATURE} resolveActiveTeacherId`, () => {
  const links: StudentLinkRow[] = [
    {
      teacher_id: "t-old",
      status: "active",
      created_at: "2026-01-01T00:00:00.000Z",
    },
    {
      teacher_id: "t-new",
      status: "active",
      created_at: "2026-06-01T00:00:00.000Z",
    },
    {
      teacher_id: "t-dead",
      status: "deactivated",
      created_at: "2026-03-01T00:00:00.000Z",
    },
  ];

  it("keeps preferred teacher when still active", () => {
    expect(resolveActiveTeacherId(links, "t-new")).toBe("t-new");
  });

  it("falls back to oldest active when preferred deactivated", () => {
    expect(resolveActiveTeacherId(links, "t-dead")).toBe("t-old");
  });

  it("returns null when no active links", () => {
    expect(
      resolveActiveTeacherId(
        [{ teacher_id: "t-dead", status: "deactivated", created_at: "2026-01-01T00:00:00.000Z" }],
        "t-dead"
      )
    ).toBeNull();
  });
});

describe(`${FEATURE} Arabic inactive messaging`, () => {
  it("loginMessageForCode(ACCOUNT_INACTIVE) returns canonical Arabic", () => {
    expect(loginMessageForCode(AuthErrorCode.ACCOUNT_INACTIVE)).toBe(
      CANONICAL_AR
    );
  });

  it('loginMessageForQueryError("account_inactive") returns canonical Arabic', () => {
    expect(loginMessageForQueryError("account_inactive")).toBe(CANONICAL_AR);
  });

  it("does not map unknown query errors to inactive copy", () => {
    expect(loginMessageForQueryError("not_a_real_error")).toBeNull();
  });
});
