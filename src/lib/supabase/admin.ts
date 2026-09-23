import { createClient } from "@supabase/supabase-js";

/**
 * Cap hung Supabase requests so auth actions fail fast (FIX-AUTH-001).
 * E2E runs many parallel demo logins against one Next server — allow more
 * headroom so profile selects are not aborted mid-flight.
 */
const ADMIN_FETCH_TIMEOUT_MS =
  process.env.E2E_FORCE_DEMO_MODE === "true" ||
  process.env.AUTH_DEMO_BYPASS === "true"
    ? 20_000
    : 12_000;

/**
 * CI / docs placeholder hosts must not open a real client — Node `fetch` DNS
 * lookup is not aborted by AbortController, so `/login` RSC can hang past
 * Playwright's default 5s `toHaveURL` (LAND-001).
 */
export function isPlaceholderSupabaseUrl(
  url: string | undefined | null
): boolean {
  if (!url?.trim()) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === "example.supabase.co" || host.endsWith(".example.supabase.co")
    );
  } catch {
    return false;
  }
}

function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ADMIN_FETCH_TIMEOUT_MS);

  const upstream = init?.signal;
  if (upstream) {
    if (upstream.aborted) {
      controller.abort();
    } else {
      upstream.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  return fetch(input, {
    ...init,
    signal: controller.signal,
    cache: "no-store",
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || isPlaceholderSupabaseUrl(url)) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithTimeout },
  });
}
