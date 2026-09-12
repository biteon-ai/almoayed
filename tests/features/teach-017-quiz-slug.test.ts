import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  getMockTable,
  resolveTableQuery,
} from "../helpers/supabase-mock";
import { createTeacherSession } from "../helpers/session-factory";
import {
  buildQuizSlug,
  isQuizUuidParam,
  teacherQuizHref,
} from "@/lib/teacher-quiz-path";

const FEATURE = "[TEACH-017]";
const SAMPLE_ID = "dd000018-aaaa-4bbb-8ccc-ddddeeeeffff";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireTeacher: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe(`${FEATURE} slug builder`, () => {
  it("builds Latin title + id8", () => {
    expect(buildQuizSlug("Arabic Quiz", SAMPLE_ID)).toBe(
      "arabic-quiz-dd000018"
    );
  });

  it("keeps Arabic letters in the title slug", () => {
    expect(buildQuizSlug("اختبار الوحدة 1", SAMPLE_ID)).toBe(
      "اختبار-الوحدة-1-dd000018"
    );
  });

  it("uses id8 alone when the title strips to empty", () => {
    expect(buildQuizSlug("!!!", SAMPLE_ID)).toBe("dd000018");
    expect(buildQuizSlug("   ", SAMPLE_ID)).toBe("dd000018");
  });

  it("truncates the title part to 48 chars on a hyphen boundary", () => {
    const long = "alpha-bravo-charlie-delta-echo-foxtrot-golf-hotel-india";
    const slug = buildQuizSlug(long, SAMPLE_ID);
    const titlePart = slug.slice(0, slug.lastIndexOf("-dd000018"));
    expect(titlePart.length).toBeLessThanOrEqual(48);
    expect(slug.endsWith("-dd000018")).toBe(true);
    expect(titlePart.includes(" ")).toBe(false);
  });

  it("prefixes reserved exact slug `new`", () => {
    expect(buildQuizSlug("", "new")).toBe("quiz-new");
  });

  it("is deterministic for the same title and id", () => {
    const a = buildQuizSlug("اختبار الوحدة", SAMPLE_ID);
    const b = buildQuizSlug("اختبار الوحدة", SAMPLE_ID);
    expect(a).toBe(b);
  });

  it("gives distinct slugs for the same title and different ids", () => {
    const other = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const a = buildQuizSlug("اختبار الوحدة", SAMPLE_ID);
    const b = buildQuizSlug("اختبار الوحدة", other);
    expect(a).not.toBe(b);
    expect(a.startsWith("اختبار-الوحدة-")).toBe(true);
    expect(b.startsWith("اختبار-الوحدة-")).toBe(true);
  });
});

describe(`${FEATURE} UUID detect and href`, () => {
  it("detects RFC-4122 UUIDs and rejects slugs", () => {
    expect(isQuizUuidParam(SAMPLE_ID)).toBe(true);
    expect(isQuizUuidParam(SAMPLE_ID.toUpperCase())).toBe(true);
    expect(isQuizUuidParam("arabic-quiz-dd000018")).toBe(false);
    expect(isQuizUuidParam("اختبار-الوحدة-1-dd000018")).toBe(false);
    expect(isQuizUuidParam("")).toBe(false);
  });

  it("builds teacher hrefs with query and hash extras", () => {
    expect(teacherQuizHref("arabic-quiz-dd000018")).toBe(
      "/teacher/quizzes/arabic-quiz-dd000018"
    );
    expect(
      teacherQuizHref("arabic-quiz-dd000018", {
        query: { setup: "import" },
      })
    ).toBe("/teacher/quizzes/arabic-quiz-dd000018?setup=import");
    expect(
      teacherQuizHref("arabic-quiz-dd000018", {
        query: { imported: "3" },
        hash: "quiz-questions",
      })
    ).toBe("/teacher/quizzes/arabic-quiz-dd000018?imported=3#quiz-questions");
  });
});

describe(`${FEATURE} resolveTeacherQuizParam`, () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns null for empty or whitespace params without querying", async () => {
    const admin = await import("@/lib/supabase/admin");
    const { resolveTeacherQuizParam } = await import("@/actions/teacher");
    await expect(resolveTeacherQuizParam("   ")).resolves.toBeNull();
    expect(admin.createAdminClient).not.toHaveBeenCalled();
  });

  it("looks up by slug for the active teacher", async () => {
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");
    vi.mocked(auth.requireTeacher).mockResolvedValue(createTeacherSession());

    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const quizzesTable = getMockTable(mockClient, "quizzes");
    resolveTableQuery(quizzesTable, {
      data: {
        id: SAMPLE_ID,
        title: "Arabic Quiz",
        slug: "arabic-quiz-dd000018",
        created_by: "teacher-profile-001",
        category_id: null,
        topic_id: null,
        is_active: false,
        is_free: true,
        is_archived: false,
        deleted_at: null,
        quiz_type: "regular",
        target_group_id: null,
        is_timed: false,
        duration_minutes: null,
        assessment_category: "evaluation",
        max_attempts: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        questions: [{ count: 0 }],
      },
      error: null,
    });

    const groupsTable = getMockTable(mockClient, "quiz_groups");
    resolveTableQuery(groupsTable, { data: [], error: null });

    const { resolveTeacherQuizParam } = await import("@/actions/teacher");
    const quiz = await resolveTeacherQuizParam("arabic-quiz-dd000018");
    expect(quiz?.slug).toBe("arabic-quiz-dd000018");
    expect(quiz?.id).toBe(SAMPLE_ID);
    expect(quizzesTable.eq).toHaveBeenCalledWith(
      "slug",
      "arabic-quiz-dd000018"
    );
  });

  it("decodes percent-encoded Arabic slugs before lookup", async () => {
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");
    vi.mocked(auth.requireTeacher).mockResolvedValue(createTeacherSession());

    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const quizzesTable = getMockTable(mockClient, "quizzes");
    resolveTableQuery(quizzesTable, { data: null, error: null });

    const { resolveTeacherQuizParam } = await import("@/actions/teacher");
    const slug = "رياضيات-الاحتمالات-والإحصاء-dd000018";
    await resolveTeacherQuizParam(encodeURIComponent(slug));
    expect(quizzesTable.eq).toHaveBeenCalledWith("slug", slug);
  });

  it("returns null when no owned quiz matches the slug", async () => {
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");
    vi.mocked(auth.requireTeacher).mockResolvedValue(createTeacherSession());

    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const quizzesTable = getMockTable(mockClient, "quizzes");
    resolveTableQuery(quizzesTable, { data: null, error: null });

    const { resolveTeacherQuizParam } = await import("@/actions/teacher");
    await expect(
      resolveTeacherQuizParam("someone-elses-quiz-aaaaaaaa")
    ).resolves.toBeNull();
  });

  it("uses id lookup when the param is a UUID", async () => {
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");
    vi.mocked(auth.requireTeacher).mockResolvedValue(createTeacherSession());

    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const quizzesTable = getMockTable(mockClient, "quizzes");
    resolveTableQuery(quizzesTable, {
      data: {
        id: SAMPLE_ID,
        title: "Arabic Quiz",
        slug: "arabic-quiz-dd000018",
        created_by: "teacher-profile-001",
        category_id: null,
        topic_id: null,
        is_active: false,
        is_free: true,
        is_archived: false,
        deleted_at: null,
        quiz_type: "regular",
        target_group_id: null,
        is_timed: false,
        duration_minutes: null,
        assessment_category: "evaluation",
        max_attempts: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        questions: [{ count: 0 }],
      },
      error: null,
    });
    resolveTableQuery(getMockTable(mockClient, "quiz_groups"), {
      data: [],
      error: null,
    });

    const { resolveTeacherQuizParam } = await import("@/actions/teacher");
    const quiz = await resolveTeacherQuizParam(SAMPLE_ID);
    expect(quiz?.id).toBe(SAMPLE_ID);
    expect(quizzesTable.eq).toHaveBeenCalledWith("id", SAMPLE_ID);
  });
});
