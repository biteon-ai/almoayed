/**
 * Al-Moayed (المؤيد) email design tokens — mirror of the PWA UI.
 * Keep hex values in sync with `tailwind.config.ts` brand scale + `globals.css`.
 */
export const EMAIL_BRAND = {
  /** Wrapper / login shell (`from-brand-50`) */
  canvas: "#f0fafa",
  /** Page background (`hsl(210 20% 98%)`) */
  page: "#f7f9fb",
  card: "#ffffff",
  /** `hsl(215 28% 12%)` */
  ink: "#161e2b",
  /** muted-foreground `hsl(215 12% 42%)` */
  muted: "#5e6b7a",
  /** border `hsl(210 16% 88%)` */
  border: "#dce3ea",
  /** card-native-header muted strip */
  headerWash: "#f4f6f8",
  /** brand-600 — primary CTA (`variant="brand"`) */
  teal: "#0d6e6e",
  /** brand-700 hover */
  tealDark: "#0a5858",
  /** brand-800 badge text */
  tealInk: "#0b4747",
  /** brand-100 / 200 badge fill + border */
  badgeFill: "#d9f2f2",
  badgeBorder: "#b3e5e5",
  white: "#ffffff",
  /** rounded-2xl cards */
  cardRadius: "16px",
  /** rounded-xl brand buttons */
  buttonRadius: "12px",
  font:
    "Tajawal, Tahoma, 'Segoe UI', Arial, 'Noto Sans Arabic', sans-serif",
} as const;

export const EMAIL_LOGO_PATH = "/icon-192.png";
export const EMAIL_SUPPORT_EMAIL = "almoayed@biteon.nl";
export const EMAIL_LEGAL_REGION = "The Netherlands";
export const EMAIL_OPERATOR = "BiteOn";
