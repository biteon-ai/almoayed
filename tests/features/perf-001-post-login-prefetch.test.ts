import { describe, expect, it, vi } from "vitest";
import {
  STUDENT_CORE_PREFETCH_ROUTES,
  TEACHER_CORE_PREFETCH_ROUTES,
  navigateAfterLogin,
  prefetchAppRoutes,
  prefetchStudentCoreRoutes,
} from "@/lib/post-login-navigation";

const FEATURE = "[PERF-001]";

describe(`${FEATURE} post-login route prefetch`, () => {
  it("lists student hub routes for warm navigation", () => {
    expect(STUDENT_CORE_PREFETCH_ROUTES).toEqual([
      "/dashboard",
      "/quizzes",
      "/results",
    ]);
  });

  it("lists teacher hub routes for warm navigation", () => {
    expect(TEACHER_CORE_PREFETCH_ROUTES).toContain("/teacher/dashboard");
  });

  it("prefetches every route in the list", () => {
    const prefetch = vi.fn();
    prefetchAppRoutes({ prefetch }, ["/a", "/b"]);
    expect(prefetch).toHaveBeenCalledWith("/a");
    expect(prefetch).toHaveBeenCalledWith("/b");
    expect(prefetch).toHaveBeenCalledTimes(2);
  });

  it("navigates students via prefetch + push + refresh", () => {
    const router = {
      prefetch: vi.fn(),
      push: vi.fn(),
      refresh: vi.fn(),
    };
    navigateAfterLogin(router, "STUDENT");
    expect(router.prefetch).toHaveBeenCalledWith("/dashboard");
    expect(router.prefetch).toHaveBeenCalledWith("/quizzes");
    expect(router.prefetch).toHaveBeenCalledWith("/results");
    expect(router.push).toHaveBeenCalledWith("/dashboard");
    expect(router.refresh).toHaveBeenCalled();
  });

  it("navigates teachers to their dashboard hub", () => {
    const router = {
      prefetch: vi.fn(),
      push: vi.fn(),
      refresh: vi.fn(),
    };
    navigateAfterLogin(router, "TEACHER");
    expect(router.push).toHaveBeenCalledWith("/teacher/dashboard");
    expect(router.prefetch).toHaveBeenCalledWith("/teacher/dashboard");
  });

  it("prefetchStudentCoreRoutes is a thin wrapper", () => {
    const prefetch = vi.fn();
    prefetchStudentCoreRoutes({ prefetch });
    expect(prefetch).toHaveBeenCalledTimes(STUDENT_CORE_PREFETCH_ROUTES.length);
  });
});
