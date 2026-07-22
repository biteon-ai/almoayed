import { AdminLoginForm } from "./admin-login-form";

export const metadata = {
  title: "دخول إداري | المؤيد",
  description: "دخول طوارئ للمسؤولين عند تعطّل OTP",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
