import { FileText } from "lucide-react";

const TXT_FORMAT = `س: [text]
أ) [option]
ب) [option]
ج) [option]
د) [option]
الجواب: [أ/ب/ج/د]
الشرح: [text]
التصنيف: [text]`;

export function ImportWordGuide() {
  return (
    <div className="space-y-4">
      <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-start font-mono text-xs leading-relaxed text-slate-700">
        {TXT_FORMAT}
      </pre>

      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-start">
        <FileText className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
        <div className="space-y-1 text-xs leading-relaxed text-amber-900/90">
          <p className="font-bold">ملفات Word (.docx)</p>
          <p>
            استخدم أسئلة مرقّمة بين قوسين مثل <span className="font-mono">(1)</span>{" "}
            مع جدول خيارات a–d. بعد الرفع ستظهر معاينة للمراجعة قبل الحفظ.
          </p>
        </div>
      </div>
    </div>
  );
}
