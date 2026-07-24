import { describe, expect, it } from "vitest";
import {
  DEMO_STUDENT_ID,
  DEMO_TEACHER_ID,
} from "@/lib/demo-accounts";
import { DEMO_STUDENT, DEMO_TEACHER } from "@/lib/constants";

const FEATURE = "[FIX-AUTH-001]";

describe(`${FEATURE} demo identity constants`, () => {
  it("matches seeded WhatsApp numbers and UUIDs from migration 002", () => {
    expect(DEMO_TEACHER.whatsapp_number).toBe("963912345678");
    expect(DEMO_STUDENT.whatsapp_number).toBe("963987654321");
    expect(DEMO_TEACHER_ID).toBe("11111111-1111-1111-1111-111111111111");
    expect(DEMO_STUDENT_ID).toBe("22222222-2222-2222-2222-222222222222");
    expect(DEMO_TEACHER.teacher_code).toBe("AlMoayed-DEMO");
  });
});
