import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_SLOGAN, APP_THEME_COLOR } from "@/lib/constants";
import { TopLoaderProvider } from "@/components/providers/top-loader-provider";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_SLOGAN,
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
    <html lang="ar" dir="rtl" className={cn(tajawal.variable, "h-full")}>
      <body
        className={cn(
          "min-h-dvh font-sans antialiased overscroll-y-none",
          "bg-background text-foreground",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
        )}
        style={{ fontFamily: "var(--font-arabic), system-ui, sans-serif" }}
      >
        <TopLoaderProvider>{children}</TopLoaderProvider>
      </body>
    </html>
  );
}
