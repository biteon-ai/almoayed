import { getAppUrl, LOCAL_ORIGIN } from "@/lib/app-origin";
import { getBiteonSwitchConfig } from "@/lib/biteonswitch/config";

const LOCAL_HOSTED_LOGIN_FALLBACK = `${LOCAL_ORIGIN}/almoayed-edu`;

/**
 * AUTH-001: Hosted BiteonSwitch login URL for «تسجيل الدخول عبر واتساب».
 *
 * Reads from `.env` / Vercel env (server-only):
 * - `BITEONSWITCH_HOSTED_LOGIN_URL`
 * - `NEXT_PUBLIC_APP_URL` (return target)
 *
 * Client components cannot access `BITEONSWITCH_*` without `NEXT_PUBLIC_` —
 * login/page.tsx resolves the href here and passes it into LoginForm.
 */
export function getBiteonHostedLoginHref(): string {
  const { hostedLoginUrl } = getBiteonSwitchConfig();
  const hosted = hostedLoginUrl || LOCAL_HOSTED_LOGIN_FALLBACK;
  const returnUrl = `${getAppUrl()}/login`;
  return `${hosted}?return=${encodeURIComponent(returnUrl)}`;
}
