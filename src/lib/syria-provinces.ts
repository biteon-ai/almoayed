/** Syrian provinces (Arabic labels) for PROFILE-002 province select */
export const SYRIA_PROVINCES = [
  "دمشق",
  "ريف دمشق",
  "حلب",
  "حمص",
  "حماة",
  "اللاذقية",
  "طرطوس",
  "إدلب",
  "دير الزور",
  "الرقة",
  "الحسكة",
  "السويداء",
  "درعا",
  "القنيطرة",
] as const;

export type SyriaProvince = (typeof SYRIA_PROVINCES)[number];

export function isSyriaProvince(value: string): value is SyriaProvince {
  return (SYRIA_PROVINCES as readonly string[]).includes(value);
}
