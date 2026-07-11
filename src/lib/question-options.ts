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
