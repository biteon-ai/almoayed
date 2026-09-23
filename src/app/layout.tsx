import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import { cn } from "@/lib/utils";
import { APP_DESCRIPTION, APP_NAME, APP_THEME_COLOR, APP_URL } from "@/lib/constants";
import {
  APPEARANCE_FOUC_SCRIPT,
  APPEARANCE_FOUC_STYLE,
} from "@/lib/appearance";
import { EXTENSION_NOISE_GUARD_SCRIPT } from "@/lib/extension-noise";
import { AppearanceProvider } from "@/components/providers/appearance-provider";
import { RuntimeGuard } from "@/components/providers/runtime-guard";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { TopLoaderProvider } from "@/components/providers/top-loader-provider";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  // PERF-003: drop unused 500 — medium synthesizes; keep 800 for font-extrabold / font-black
  weight: ["400", "700", "800"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: APP_THEME_COLOR },
    { media: "(prefers-color-scheme: dark)", color: "#042626" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={cn(tajawal.variable, "h-full bg-white dark:bg-slate-950")}
      suppressHydrationWarning
    >
      <head>
        {/* Theme FOUC: script then style — both must live in <head>, never under <html> */}
        <script
          id="almoayed-appearance"
          dangerouslySetInnerHTML={{ __html: APPEARANCE_FOUC_SCRIPT }}
        />
        <style
          id="almoayed-appearance-fouc"
          dangerouslySetInnerHTML={{ __html: APPEARANCE_FOUC_STYLE }}
        />
        {/* Mute extension runtime noise before React / Next overlay mounts */}
        <script
          id="almoayed-extension-noise-guard"
          dangerouslySetInnerHTML={{ __html: EXTENSION_NOISE_GUARD_SCRIPT }}
        />
      </head>
      <body
        className={cn(
          "min-h-dvh bg-white font-sans text-foreground antialiased overscroll-y-none",
          "dark:bg-slate-950 dark:text-white",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
        )}
        style={{ fontFamily: "var(--font-arabic), system-ui, sans-serif" }}
        suppressHydrationWarning
      >
        <RuntimeGuard>
          <AppearanceProvider>
            <ServiceWorkerRegister />
            <TopLoaderProvider>{children}</TopLoaderProvider>
          </AppearanceProvider>
        </RuntimeGuard>
      </body>
    </html>
  );
}
