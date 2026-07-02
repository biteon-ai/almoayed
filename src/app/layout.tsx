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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0d6e6e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cn(tajawal.variable)}>
      <body
        className="min-h-dvh font-[family-name:var(--font-arabic)] antialiased"
        style={{ fontFamily: "var(--font-arabic), system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
