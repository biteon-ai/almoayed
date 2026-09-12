import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  getMockTable,
  resolveTableQuery,
} from "../helpers/supabase-mock";
import { createTeacherSession } from "../helpers/session-factory";

const FEATURE = "[TEACH-003]";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireTeacher: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe(`${FEATURE} Quiz activation flags`, () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("createQuiz forces is_active false even when form sends active intent", async () => {
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");
    vi.mocked(auth.requireTeacher).mockResolvedValue(createTeacherSession());

    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const quizzesTable = getMockTable(mockClient, "quizzes");
    let inserted: Record<string, unknown> | undefined;
    quizzesTable.insert.mockImplementation(
      (payload: Record<string, unknown>) => {
        inserted = payload;
        return quizzesTable;
      }
    );
    resolveTableQuery(quizzesTable, {
      data: { id: "quiz-new-001" },
      error: null,
    });

    const { createQuiz } = await import("@/actions/teacher");
    const formData = new FormData();
    formData.set("title", "اختبار تجريبي");
    formData.set("is_active", "on");
    formData.set("is_free", "on");

    const id = await createQuiz(formData);
    expect(id).toBe("quiz-new-001");
    expect(inserted?.is_active).toBe(false);
  });

  it("updateQuizFlags blocks activation when quiz has zero questions", async () => {
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");
    vi.mocked(auth.requireTeacher).mockResolvedValue(createTeacherSession());

    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const questionsTable = getMockTable(mockClient, "questions");
    resolveTableQuery(questionsTable, {
      data: null,
      error: null,
      count: 0,
    } as { data: null; error: null; count: number });

    const { updateQuizFlags } = await import("@/actions/teacher");

    await expect(
      updateQuizFlags("quiz-empty", { is_active: true })
    ).rejects.toThrow("أضف سؤالاً واحداً على الأقل قبل التفعيل.");
  });

  it("updateQuizFlags allows activation when quiz has at least one question", async () => {
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");
    vi.mocked(auth.requireTeacher).mockResolvedValue(createTeacherSession());

    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const questionsTable = getMockTable(mockClient, "questions");
    resolveTableQuery(questionsTable, {
      data: null,
      error: null,
      count: 2,
    } as { data: null; error: null; count: number });

    const quizzesTable = getMockTable(mockClient, "quizzes");
    resolveTableQuery(quizzesTable, { data: null, error: null });

    const { updateQuizFlags } = await import("@/actions/teacher");

    await expect(
      updateQuizFlags("quiz-ready", { is_active: true })
    ).resolves.toBeUndefined();
  });
});
