import { describe, expect, it } from "vitest";
import {
  buildQuizAbsoluteUrl,
  buildResultSharePayload,
  buildResultShareUrl,
} from "@/lib/constants";

const FEATURE = "[QUIZ-003]";

describe(`${FEATURE} result share payload`, () => {
  const quizUrl =
    "https://app.almoayed.edu/quiz/dd000001-0000-4000-8000-000000000001";

  it("keeps Arabic text and URL as separate fields", () => {
    const payload = buildResultSharePayload(85, quizUrl);
    expect(payload.text).toContain("85%");
    expect(payload.text).not.toContain("http");
    expect(payload.url).toBe(quizUrl);
  });

  it("places URL on its own line with LTR isolation for WhatsApp", () => {
    const { whatsappText } = buildResultSharePayload(70, quizUrl);
    expect(whatsappText).toContain("\n\n");
    expect(whatsappText).toContain(`\u2068${quizUrl}\u2069`);
    expect(whatsappText.indexOf("\n\n")).toBeLessThan(
      whatsappText.indexOf(quizUrl)
    );
  });

  it("builds a WhatsApp deep link without embedding localhost by default when given absolute url", () => {
    const href = buildResultShareUrl(90, quizUrl);
    expect(href.startsWith("https://api.whatsapp.com/send?text=")).toBe(true);
    const decoded = decodeURIComponent(href.split("text=")[1] ?? "");
    expect(decoded).toContain(quizUrl);
    expect(decoded).not.toContain("localhost");
  });

  it("builds quiz absolute urls from an explicit origin", () => {
    expect(
      buildQuizAbsoluteUrl("abc", "https://example.com/")
    ).toBe("https://example.com/quiz/abc");
  });
});
