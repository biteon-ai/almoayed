import type { Metadata, Viewport } from "next";
import {
  TEACHER_APP_NAME,
  TEACHER_APP_THEME_COLOR,
  TEACHER_APP_THEME_COLOR_DARK,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "دخول المدرس",
  description: `${TEACHER_APP_NAME} — تسجيل دخول المدرسين`,
  manifest: "/teacher-manifest.json",
  icons: {
    icon: [
      {
        url: "/teacher-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/teacher-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/teacher-apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: TEACHER_APP_NAME,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: TEACHER_APP_THEME_COLOR },
    { media: "(prefers-color-scheme: dark)", color: TEACHER_APP_THEME_COLOR_DARK },
  ],
};

export default function TeacherLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
