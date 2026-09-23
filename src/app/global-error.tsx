"use client";

import { useEffect } from "react";
import { Tajawal } from "next/font/google";
import { APPEARANCE_PAGE_BG } from "@/lib/appearance";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "700", "800"],
  variable: "--font-arabic",
  display: "swap",
});

/**
 * Root layout failure boundary — must render its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[app/global-error]", error);
    }
  }, [error]);

  return (
    <html lang="ar" dir="rtl" className={tajawal.variable} suppressHydrationWarning>
      <body
        className="min-h-dvh antialiased"
        data-app-error-boundary="global"
        style={{
          fontFamily: "var(--font-arabic), system-ui, sans-serif",
          backgroundColor: APPEARANCE_PAGE_BG.dark,
          color: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "22rem" }}>
          <p style={{ fontWeight: 800, fontSize: "0.95rem", marginBottom: 8 }}>
            حصل خلل في التطبيق
          </p>
          <p
            style={{
              fontSize: "0.8rem",
              opacity: 0.8,
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            حدّث الصفحة للمتابعة. إن استمر الخطأ، جرّب نافذة خاصة بدون إضافات.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              height: 44,
              borderRadius: 12,
              paddingInline: 18,
              fontWeight: 700,
              fontSize: 14,
              background: "#0d9488",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
