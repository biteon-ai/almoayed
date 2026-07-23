"use client";

import { useState, useTransition } from "react";
import { updateProfileName } from "@/actions/profile";
import { useStudentLoadingBarSync } from "@/components/layout/StudentPortalShell";
import { Button } from "@/components/ui/button";
import {
  SettingsCard,
  SettingsCardBody,
  SettingsCardFooter,
  SettingsCardHeader,
  SettingsEditableInput,
  SettingsField,
  SettingsFormPanel,
  SettingsMessage,
  SettingsReadonlyField,
} from "@/components/settings/settings-ui";
import { Loader2, MessageCircle, Save, User } from "lucide-react";

interface ProfileFormProps {
  initialFullName: string;
  whatsappNumber: string;
}

export function ProfileForm({
  initialFullName,
  whatsappNumber,
}: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [pending, startTransition] = useTransition();
  useStudentLoadingBarSync(pending);

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("full_name", fullName);
      const result = await updateProfileName(formData);
      setMessage(result.message);
      setIsError(!result.success);
      if (result.success) {
        setFullName(fullName.trim());
      }
    });
  };

  return (
    <SettingsCard>
      <SettingsCardHeader
        icon={User}
        title="معلومات الحساب"
        description="اسمك ورقم واتساب المرتبط بتسجيل الدخول"
      />
      <SettingsCardBody className="pb-0 md:pb-0">
        <SettingsFormPanel>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-8 md:gap-y-6">
            <SettingsField label="الاسم" htmlFor="settings-full-name" icon={User}>
              <SettingsEditableInput
                id="settings-full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                placeholder="اسمك الكامل"
                dir="rtl"
                className="text-start"
              />
            </SettingsField>

            <SettingsField
              label="رقم واتساب"
              htmlFor="settings-whatsapp"
              icon={MessageCircle}
              hint="رقم واتساب هو معرّف تسجيل الدخول ولا يمكن تغييره من هنا."
            >
              <SettingsReadonlyField
                id="settings-whatsapp"
                value={whatsappNumber}
                dir="ltr"
              />
            </SettingsField>
          </div>
        </SettingsFormPanel>
      </SettingsCardBody>

      <SettingsCardFooter className="space-y-3">
        <Button
          type="button"
          variant="brand"
          className="h-12 w-full rounded-xl shadow-md shadow-brand-900/10 md:max-w-xs"
          onClick={handleSave}
          disabled={pending}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              عم يُحفظ...
            </>
          ) : (
            <>
              <Save className="size-4" />
              حفظ الاسم
            </>
          )}
        </Button>
        {message ? (
          <SettingsMessage message={message} isError={isError} />
        ) : null}
      </SettingsCardFooter>
    </SettingsCard>
  );
}
