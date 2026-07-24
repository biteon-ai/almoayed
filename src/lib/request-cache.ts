import { cache as reactCache } from "react";

type AnyFn = (...args: never[]) => unknown;

/**
 * React `cache()` for request memoization in RSC.
 * Falls back to identity outside Next's React (e.g. Vitest on react@18).
 */
export function requestCache<T extends AnyFn>(fn: T): T {
  if (typeof reactCache === "function") {
    return reactCache(fn as never) as T;
  }
  return fn;
}
