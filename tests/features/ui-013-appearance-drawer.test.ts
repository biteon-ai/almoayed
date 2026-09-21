import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  APPEARANCE_STORAGE_KEY,
  parseAppearance,
  readAppearance,
  writeAppearance,
} from "@/lib/appearance";
import { filterQuizPackagesForTeacher } from "@/lib/offline/quiz-cache";
import { APP_SHARE_PUBLIC_URL, buildAppSharePayload } from "@/lib/native-share";
import type { QuizPackageRecord } from "@/lib/offline/types";

const FEATURE = "[UI-013]";

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

describe(`${FEATURE} appearance persistence and share payload`, () => {
  const original = globalThis.localStorage;

  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: memoryStorage(),
      configurable: true,
    });
  });

  afterEach(() => {
    if (original) {
      Object.defineProperty(globalThis, "localStorage", {
        value: original,
        configurable: true,
      });
    }
  });

  it("writeAppearance persists the storage key", () => {
    writeAppearance("dark");
    expect(readAppearance()).toBe("dark");
    expect(parseAppearance(localStorage.getItem(APPEARANCE_STORAGE_KEY))).toBe(
      "dark"
    );
  });

  it("buildAppSharePayload uses the public almoayed.app URL", () => {
    expect(buildAppSharePayload("http://localhost:3000").url).toBe(
      APP_SHARE_PUBLIC_URL
    );
    expect(buildAppSharePayload("https://almoayed.app").url).toBe(
      "https://almoayed.app"
    );
  });
});

describe(`${FEATURE} offline saved list tenant filter`, () => {
  const packageFor = (
    quizId: string,
    teacherId: string,
    openedAt: string
  ): QuizPackageRecord =>
    ({
      quizId,
      teacherId,
      quiz: { id: quizId, title: quizId },
      questions: [],
      questionIds: [],
      cachedAt: openedAt,
      openedAt,
    }) as unknown as QuizPackageRecord;

  it("returns empty when teacherId is null", () => {
    expect(
      filterQuizPackagesForTeacher(
        [packageFor("a", "t1", "2026-01-01T00:00:00.000Z")],
        null
      )
    ).toEqual([]);
  });

  it("excludes another teacher's packages and sorts by openedAt desc", () => {
    const rows = filterQuizPackagesForTeacher(
      [
        packageFor("old", "t1", "2026-01-01T00:00:00.000Z"),
        packageFor("other", "t2", "2026-06-01T00:00:00.000Z"),
        packageFor("new", "t1", "2026-03-01T00:00:00.000Z"),
      ],
      "t1"
    );
    expect(rows.map((row) => row.quizId)).toEqual(["new", "old"]);
  });
});
