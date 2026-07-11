import { describe, expect, it } from "vitest";
import {
  AppError,
  ErrorCode,
  toUserMessage,
  uiMessage,
} from "@/lib/app-errors";

describe("app-errors", () => {
  it("maps English network codes to Arabic UI messages", () => {
    expect(toUserMessage(new AppError(ErrorCode.PRO_REQUIRED, uiMessage(ErrorCode.PRO_REQUIRED)))).toBe(
      "هذا الاختبار متاح لمشتركي Pro فقط. اطلب ترقية من الأستاذ."
    );
    expect(toUserMessage(new Error(ErrorCode.NETWORK_ERROR))).toContain("الاتصال");
  });

  it("preserves existing Arabic validation messages", () => {
    expect(toUserMessage(new Error("رمز الأستاذ غير صحيح."))).toBe(
      "رمز الأستاذ غير صحيح."
    );
  });

  it("never exposes raw English fetch failures to UI", () => {
    expect(toUserMessage(new Error("Failed to fetch"))).toBe(
      uiMessage(ErrorCode.NETWORK_ERROR)
    );
  });
});
