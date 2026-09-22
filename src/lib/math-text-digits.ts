/**
 * Split plain / math text so Western & Eastern Arabic digits can be emphasised.
 * Keeps decimal separators attached to number tokens.
 */
const DIGIT_CHUNK =
  /([0-9٠-٩]+(?:[.,٫٬][0-9٠-٩]+)*)/g;

export function isDigitToken(token: string): boolean {
  return /^[0-9٠-٩]+(?:[.,٫٬][0-9٠-٩]+)*$/.test(token);
}

/** Split a string into alternating text / digit chunks (digit chunks match `isDigitToken`). */
export function splitTextWithDigits(text: string): string[] {
  if (!text) return [];
  return text.split(DIGIT_CHUNK).filter((part) => part.length > 0);
}
