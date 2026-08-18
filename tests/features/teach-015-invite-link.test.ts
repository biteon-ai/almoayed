import { describe, expect, it } from "vitest";
import {
  buildTrialJoinAbsoluteUrl,
  buildTrialInviteShareUrl,
} from "@/lib/trial-join";

const FEATURE = "[TEACH-015]";

describe(`${FEATURE} teacher invite URLs`, () => {
  it("distinct teacher codes produce distinct join URLs", () => {
    const a = buildTrialJoinAbsoluteUrl("TEACHER-A", "https://moayed.app");
    const b = buildTrialJoinAbsoluteUrl("TEACHER-B", "https://moayed.app");
    expect(a).not.toBe(b);
    expect(a).toContain("/join/TEACHER-A");
    expect(b).toContain("/join/TEACHER-B");
  });

  it("WhatsApp share href encodes Arabic invite text", () => {
    const joinUrl = buildTrialJoinAbsoluteUrl(
      "AlMoayed-DEMO",
      "https://moayed.app"
    );
    const { whatsappHref } = buildTrialInviteShareUrl({
      teacherName: "أستاذ المؤيد",
      joinUrl,
    });
    expect(decodeURIComponent(whatsappHref)).toContain("أستاذ المؤيد");
    expect(decodeURIComponent(whatsappHref)).toContain(joinUrl);
  });
});
