import { describe, expect, it } from "vitest";
import {
  DEMO_STUDENT_ID,
  DEMO_TEACHER_ID,
} from "@/lib/demo-accounts";
import { DEMO_STUDENT, DEMO_TEACHER } from "@/lib/constants";
import {
  createAdminClient,
  isPlaceholderSupabaseUrl,
} from "@/lib/supabase/admin";

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

describe(`${FEATURE} placeholder Supabase host`, () => {
  it("treats CI example.supabase.co as unusable so login RSC does not hang", () => {
    expect(isPlaceholderSupabaseUrl("https://example.supabase.co")).toBe(true);
    expect(isPlaceholderSupabaseUrl("https://example.supabase.co/")).toBe(true);
    expect(
      isPlaceholderSupabaseUrl("https://abc123.supabase.co")
    ).toBe(false);
    expect(isPlaceholderSupabaseUrl("")).toBe(false);
    expect(isPlaceholderSupabaseUrl(undefined)).toBe(false);
  });

  it("createAdminClient throws for the CI placeholder host instead of hanging DNS", () => {
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "ci-service-role-key";
    try {
      expect(() => createAdminClient()).toThrow(/Missing Supabase/);
    } finally {
      process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
      process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
    }
  });
});
