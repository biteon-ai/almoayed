/**
 * Post-login / in-app route warming for student & teacher hubs (PERF-001).
 * Prefetch caches App Router JS + RSC payloads so the next push feels instant.
 */

export const STUDENT_CORE_PREFETCH_ROUTES = [
  "/dashboard",
  "/quizzes",
  "/results",
] as const;

export const TEACHER_CORE_PREFETCH_ROUTES = [
  "/teacher/dashboard",
  "/teacher/quizzes",
  "/teacher/students",
] as const;

type PrefetchRouter = {
  prefetch: (href: string) => void;
};

type NavigateRouter = PrefetchRouter & {
  push: (href: string) => void;
  refresh: () => void;
};

export function prefetchAppRoutes(
  router: PrefetchRouter,
  routes: readonly string[]
): void {
  for (const href of routes) {
    try {
      router.prefetch(href);
    } catch {
      // Prefetch is best-effort; never block navigation.
    }
  }
}

export function prefetchStudentCoreRoutes(router: PrefetchRouter): void {
  prefetchAppRoutes(router, STUDENT_CORE_PREFETCH_ROUTES);
}

export function prefetchTeacherCoreRoutes(router: PrefetchRouter): void {
  prefetchAppRoutes(router, TEACHER_CORE_PREFETCH_ROUTES);
}

/**
 * Soft-navigate after a successful session mint.
 * Prefetch hubs first, then push + refresh so RSC sees the new cookie.
 */
export function navigateAfterLogin(
  router: NavigateRouter,
  role: "STUDENT" | "TEACHER"
): void {
  if (role === "TEACHER") {
    prefetchTeacherCoreRoutes(router);
    router.push("/teacher/dashboard");
  } else {
    prefetchStudentCoreRoutes(router);
    router.push("/dashboard");
  }
  router.refresh();
}
