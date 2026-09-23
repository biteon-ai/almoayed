import { AdminLoginForm } from "@/app/admin/(auth)/login/admin-login-form";

export const metadata = {
  title: "دخول إداري للطوارئ",
  description: "دخول طوارئ للمسؤولين عند تعطّل OTP",
  robots: { index: false, follow: false },
};

export default function AdminEmergencyLoginPage() {
  return <AdminLoginForm />;
}
