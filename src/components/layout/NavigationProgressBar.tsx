"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { APP_THEME_COLOR } from "@/lib/constants";

export function NavigationProgressBar({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ProgressBar
        height="3px"
        color={APP_THEME_COLOR}
        shallowRouting
        options={{ showSpinner: false }}
      />
    </>
  );
}
