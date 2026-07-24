import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockSupabaseClient,
  getMockTable,
  resolveTableQuery,
} from "../helpers/supabase-mock";
import { createTeacherSession } from "../helpers/session-factory";
import { QUIZ_LIST_SELECT } from "@/lib/perf-selects";

const FEATURE = "[TEACH-011]";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireTeacher: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe(`${FEATURE} Quiz soft delete / Trash`, () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("QUIZ_LIST_SELECT includes deleted_at for Trash filtering", () => {
    expect(QUIZ_LIST_SELECT).toContain("deleted_at");
  });

  it("softDeleteQuiz sets deleted_at for owner quiz", async () => {
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");
    vi.mocked(auth.requireTeacher).mockResolvedValue(createTeacherSession());

    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const quizzesTable = getMockTable(mockClient, "quizzes");
    resolveTableQuery(quizzesTable, {
      data: { id: "quiz-001", deleted_at: null },
      error: null,
    });

    let updated: Record<string, unknown> | undefined;
    quizzesTable.update.mockImplementation((payload: Record<string, unknown>) => {
      updated = payload;
      return quizzesTable;
    });

    const { softDeleteQuiz } = await import("@/actions/teacher");
    const result = await softDeleteQuiz("quiz-001");

    expect(result).toEqual({ ok: true });
    expect(updated?.deleted_at).toEqual(expect.any(String));
    expect(quizzesTable.eq).toHaveBeenCalledWith(
      "created_by",
      "teacher-profile-001"
    );
  });

  it("softDeleteQuiz rejects already soft-deleted quiz", async () => {
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");
    vi.mocked(auth.requireTeacher).mockResolvedValue(createTeacherSession());

    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const quizzesTable = getMockTable(mockClient, "quizzes");
    resolveTableQuery(quizzesTable, {
      data: { id: "quiz-001", deleted_at: "2026-07-24T00:00:00Z" },
      error: null,
    });

    const { softDeleteQuiz } = await import("@/actions/teacher");
    const result = await softDeleteQuiz("quiz-001");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/سلة المهملات/);
    }
    expect(quizzesTable.update).not.toHaveBeenCalled();
  });

  it("softDeleteQuiz rejects missing / non-owned quiz", async () => {
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");
    vi.mocked(auth.requireTeacher).mockResolvedValue(createTeacherSession());

    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const quizzesTable = getMockTable(mockClient, "quizzes");
    resolveTableQuery(quizzesTable, { data: null, error: null });

    const { softDeleteQuiz } = await import("@/actions/teacher");
    const result = await softDeleteQuiz("quiz-other");

    expect(result.ok).toBe(false);
    expect(quizzesTable.update).not.toHaveBeenCalled();
  });

  it("restoreQuiz clears deleted_at for trashed quiz", async () => {
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");
    vi.mocked(auth.requireTeacher).mockResolvedValue(createTeacherSession());

    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const quizzesTable = getMockTable(mockClient, "quizzes");
    resolveTableQuery(quizzesTable, {
      data: { id: "quiz-001", deleted_at: "2026-07-24T00:00:00Z" },
      error: null,
    });

    let updated: Record<string, unknown> | undefined;
    quizzesTable.update.mockImplementation((payload: Record<string, unknown>) => {
      updated = payload;
      return quizzesTable;
    });

    const { restoreQuiz } = await import("@/actions/teacher");
    const result = await restoreQuiz("quiz-001");

    expect(result).toEqual({ ok: true });
    expect(updated).toEqual({ deleted_at: null });
  });

  it("restoreQuiz rejects quiz not in Trash", async () => {
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");
    vi.mocked(auth.requireTeacher).mockResolvedValue(createTeacherSession());

    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const quizzesTable = getMockTable(mockClient, "quizzes");
    resolveTableQuery(quizzesTable, {
      data: { id: "quiz-001", deleted_at: null },
      error: null,
    });

    const { restoreQuiz } = await import("@/actions/teacher");
    const result = await restoreQuiz("quiz-001");

    expect(result.ok).toBe(false);
    expect(quizzesTable.update).not.toHaveBeenCalled();
  });

  it("permanentlyDeleteQuiz refuses active (non-trashed) quiz", async () => {
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");
    vi.mocked(auth.requireTeacher).mockResolvedValue(createTeacherSession());

    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const quizzesTable = getMockTable(mockClient, "quizzes");
    resolveTableQuery(quizzesTable, {
      data: { id: "quiz-001", deleted_at: null },
      error: null,
    });

    const { permanentlyDeleteQuiz } = await import("@/actions/teacher");
    const result = await permanentlyDeleteQuiz("quiz-001");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/سلة المهملات/);
    }
    expect(quizzesTable.delete).not.toHaveBeenCalled();
  });

  it("permanentlyDeleteQuiz deletes trashed quiz for owner", async () => {
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");
    vi.mocked(auth.requireTeacher).mockResolvedValue(createTeacherSession());

    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const quizzesTable = getMockTable(mockClient, "quizzes");
    resolveTableQuery(quizzesTable, {
      data: { id: "quiz-001", deleted_at: "2026-07-24T00:00:00Z" },
      error: null,
    });

    const { permanentlyDeleteQuiz } = await import("@/actions/teacher");
    const result = await permanentlyDeleteQuiz("quiz-001");

    expect(result).toEqual({ ok: true });
    expect(quizzesTable.delete).toHaveBeenCalled();
    expect(quizzesTable.eq).toHaveBeenCalledWith(
      "created_by",
      "teacher-profile-001"
    );
  });
});
