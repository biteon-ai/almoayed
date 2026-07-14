const MAX_DISPLAY_NAME_LENGTH = 100;

export function validateDisplayName(
  raw: string
): { ok: true; value: string } | { ok: false; message: string } {
  const value = raw.trim();
  if (!value) {
    return { ok: false, message: "الاسم مطلوب" };
  }
  if (value.length > MAX_DISPLAY_NAME_LENGTH) {
    return { ok: false, message: "الاسم طويل جداً" };
  }
  return { ok: true, value };
}
