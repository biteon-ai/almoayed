import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { LANDING_FOOTER } from "@/lib/landing-content";

export function LandingFooter() {
  return (
    <footer className="border-t border-emerald-500/10 bg-muted/20 px-4 py-8 sm:px-6">
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-center text-xs text-muted-foreground sm:text-start">
          {LANDING_FOOTER.copyright}
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-4">
          {LANDING_FOOTER.links.map((link) =>
            link.href.startsWith("#") ? (
              <a
                key={link.href}
                href={link.href}
                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-emerald-600"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-emerald-600"
              >
                {link.label}
              </Link>
            )
          )}
          <span className="text-xs text-muted-foreground">{APP_NAME}</span>
        </nav>
      </div>
    </footer>
  );
}
