import { SuperAdminLoginForm } from "@/components/admin/SuperAdminLoginForm";

export const metadata = {
  title: "دخول Super Admin | المؤيد",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <SuperAdminLoginForm />;
}
