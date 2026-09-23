import { redirect } from "next/navigation";

export const metadata = {
  title: "تسجيل طالب",
  description: "تسجيل طالب جديد — المؤيد",
};

/** Alias for /login registration experience (FR-014). */
export default function RegisterPage() {
  redirect("/login");
}
