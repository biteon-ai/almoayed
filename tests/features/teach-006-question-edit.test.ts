import { describe, expect, it } from "vitest";
import {
  fieldsToOptionsArray,
  inferCorrectLetter,
  optionsArrayToFields,
} from "@/lib/question-options";

const FEATURE = "[TEACH-006]";

describe(`${FEATURE} Question option helpers`, () => {
  it("maps options array to A-D fields", () => {
    expect(optionsArrayToFields(["1", "2", "3", "4"])).toEqual({
      option_a: "1",
      option_b: "2",
      option_c: "3",
      option_d: "4",
    });
  });

  it("builds options array from fields omitting empty slots", () => {
    expect(
      fieldsToOptionsArray({
        option_a: "x",
        option_b: "y",
        option_c: "",
        option_d: "",
      })
    ).toEqual(["x", "y"]);
  });

  it("infers Arabic letter from stored correct_answer", () => {
    expect(inferCorrectLetter("ب", ["a", "b", "c", "d"])).toBe("ب");
    expect(inferCorrectLetter("b", ["a", "b", "c", "d"])).toBe("ب");
  });

  it("infers letter when correct_answer matches option text", () => {
    expect(inferCorrectLetter("[-2, 2]", ["[-2, 2]", "1", "2", "3"])).toBe(
      "أ"
    );
  });
});
