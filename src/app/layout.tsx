import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_SLOGAN } from "@/lib/constants";
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
    { media: "(prefers-color-scheme: light)", color: "#0d6e6e" },
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
        {children}
      </body>
    </html>
  );
}
