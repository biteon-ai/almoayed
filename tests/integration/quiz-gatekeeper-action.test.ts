import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQuestion, createQuiz } from "../helpers/quiz-factory";
import { createStudentSession as sessionFactory } from "../helpers/session-factory";
import {
  createMockSupabaseClient,
  getMockTable,
  resolveTableQuery,
} from "../helpers/supabase-mock";
import { assertGatekeeperCompliance } from "@/lib/quiz-gatekeeper";

const FEATURE = "[QUIZ-001]";

vi.mock("@/lib/auth", () => ({
  requireStudent: vi.fn(),
  getActiveTeacherId: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe(`${FEATURE} getQuizForStudent integration (mocked RLS sandbox)`, () => {
  beforeEach(async () => {
    vi.resetModules();
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");

    vi.mocked(auth.requireStudent).mockResolvedValue(sessionFactory());
    vi.mocked(auth.getActiveTeacherId).mockResolvedValue("teacher-profile-001");

    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    const quiz = createQuiz();
    const question = createQuestion();

    resolveTableQuery(getMockTable(mockClient, "student_teachers"), {
      data: { tier: "pro", status: "active" },
      error: null,
    });
    resolveTableQuery(getMockTable(mockClient, "teacher_group_members"), {
      data: [],
      error: null,
    });
    resolveTableQuery(getMockTable(mockClient, "quizzes"), {
      data: quiz,
      error: null,
    });
    resolveTableQuery(getMockTable(mockClient, "questions"), {
      data: [
        {
          id: question.id,
          quiz_id: question.quiz_id,
          question_text: question.question_text,
          question_image_url: question.question_image_url,
          options: question.options,
          sort_order: question.sort_order,
        },
      ],
      error: null,
    });
    resolveTableQuery(getMockTable(mockClient, "exam_submissions"), {
      data: null,
      error: null,
    });
  });

  it("returns exam questions with ZERO solution fields before submission", async () => {
    const { getQuizForStudent } = await import("@/actions/quiz");
    const { questions } = await getQuizForStudent("quiz-001");

    expect(questions).toHaveLength(1);
    expect(() => assertGatekeeperCompliance(questions)).not.toThrow();

    for (const q of questions) {
      expect(q).not.toHaveProperty("correct_answer");
      expect(q).not.toHaveProperty("explanation_text");
    }
  });

  it("throws PRO_REQUIRED for free tier on paid quiz", async () => {
    vi.resetModules();
    const auth = await import("@/lib/auth");
    const admin = await import("@/lib/supabase/admin");
    const { getQuizForStudent } = await import("@/actions/quiz");

    vi.mocked(auth.requireStudent).mockResolvedValue(sessionFactory());
    const mockClient = createMockSupabaseClient();
    vi.mocked(admin.createAdminClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof admin.createAdminClient>
    );

    resolveTableQuery(getMockTable(mockClient, "student_teachers"), {
      data: { tier: "free", status: "active" },
      error: null,
    });
    resolveTableQuery(getMockTable(mockClient, "teacher_group_members"), {
      data: [],
      error: null,
    });
    resolveTableQuery(getMockTable(mockClient, "quizzes"), {
      data: createQuiz({ is_free: false }),
      error: null,
    });

    await expect(getQuizForStudent("quiz-001")).rejects.toThrow("PRO_REQUIRED");
  });
});
