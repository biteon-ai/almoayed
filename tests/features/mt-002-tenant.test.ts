import { describe, expect, it } from "vitest";
import { filterQuizzesByTeacher } from "@/lib/quiz-access";
import { createQuiz } from "../helpers/quiz-factory";

const FEATURE = "[MT-001 / MT-002]";

describe(`${FEATURE} Multi-tenant workspace isolation`, () => {
  it("filterQuizzesByTeacher returns only quizzes for active teacher", () => {
    const teacherA = "teacher-a";
    const teacherB = "teacher-b";

    const quizzes = [
      createQuiz({ id: "q1", created_by: teacherA }),
      createQuiz({ id: "q2", created_by: teacherB }),
      createQuiz({ id: "q3", created_by: teacherA }),
    ];

    const isolated = filterQuizzesByTeacher(quizzes, teacherA);
    expect(isolated.map((q) => q.id)).toEqual(["q1", "q3"]);
    expect(isolated.every((q) => q.created_by === teacherA)).toBe(true);
  });

  it("cross-tenant quiz IDs never appear in filtered set", () => {
    const foreign = createQuiz({
      id: "foreign-quiz",
      created_by: "other-teacher",
    });
    const own = createQuiz({ id: "own-quiz", created_by: "my-teacher" });

    const result = filterQuizzesByTeacher([foreign, own], "my-teacher");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("own-quiz");
  });
});
