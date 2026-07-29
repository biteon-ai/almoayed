import type { SVGProps } from "react";

/** Monochrome Play triangle — inherits `currentColor` (use text-white on brand buttons). */
export function GooglePlayLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M3.06 2.5c-.07.14-.1.3-.1.47v18.06c0 .17.03.33.1.47l.08.04 10.2-9.54L3.14 2.46l-.08.04zm11.66 10.54-2.55-2.55L3.2 20.4c.2.17.48.2.74.05l10.78-6.41zm4.6-2.17c-.46-.27-8.55-4.94-10.7-6.19-.25-.15-.54-.16-.8-.04l7.68 7.68 3.82-1.45zm0 2.34-3.82-1.45-7.68 7.68c.26.12.55.11.8-.04 2.15-1.25 10.24-5.92 10.7-6.19z" />
    </svg>
  );
}

/** Monochrome Apple mark — inherits `currentColor`. */
export function AppleLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}
