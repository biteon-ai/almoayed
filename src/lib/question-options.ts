const ARABIC_LETTERS = ["أ", "ب", "ج", "د"] as const;
export type ArabicOptionLetter = (typeof ARABIC_LETTERS)[number];

export function optionsArrayToFields(options: string[]) {
  return {
    option_a: options[0] ?? "",
    option_b: options[1] ?? "",
    option_c: options[2] ?? "",
    option_d: options[3] ?? "",
  };
}

export function fieldsToOptionsArray(fields: {
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}): string[] {
  return [
    fields.option_a,
    fields.option_b,
    fields.option_c,
    fields.option_d,
  ]
    .map((value) => value.trim())
    .filter(Boolean);
}

export function inferCorrectLetter(
  correctAnswer: string,
  options: string[]
): ArabicOptionLetter {
  const trimmed = correctAnswer.trim();
  if (ARABIC_LETTERS.includes(trimmed as ArabicOptionLetter)) {
    return trimmed as ArabicOptionLetter;
  }

  const lower = trimmed.toLowerCase();
  const latinMap: Record<string, ArabicOptionLetter> = {
    a: "أ",
    b: "ب",
    c: "ج",
    d: "د",
  };
  if (latinMap[lower]) {
    return latinMap[lower];
  }

  for (let i = 0; i < options.length && i < 4; i++) {
    if (options[i]?.trim() === trimmed) {
      return ARABIC_LETTERS[i];
    }
  }

  return "أ";
}

export function letterToCorrectAnswer(letter: ArabicOptionLetter): string {
  return letter;
}

/**
 * Normalize stored `correct_answer` (letter أ–د or option text) to the option
 * text students select in the quiz runner — required for grading + review UI.
 */
export function resolveCorrectOptionText(
  correctAnswer: string,
  options: string[]
): string {
  const trimmed = correctAnswer.trim();
  if (!trimmed) return "";

  const exact = options.find((option) => option.trim() === trimmed);
  if (exact) return exact.trim();

  const letter = inferCorrectLetter(trimmed, options);
  const index = ARABIC_LETTERS.indexOf(letter);
  const fromLetter = options[index]?.trim();
  return fromLetter || trimmed;
}

