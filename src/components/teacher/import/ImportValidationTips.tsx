import { Info } from "lucide-react";
import { SPEKIT } from "@/lib/spekit-targets";

const TIPS = [
  "لا تُقيَّم صيغ Excel تلقائياً — اكتب القيم كنص عادي.",
  "الصور لا تُستورد — أضفها من محرر الأسئلة اليدوي بعد الاستيراد.",
  "معادلات Word قد تحتاج مراجعة في معاينة الاستيراد قبل الحفظ.",
] as const;

export function ImportValidationTips() {
  return (
    <div
      className="rounded-xl border border-sky-100 bg-sky-50/40 p-4 text-start"
      data-spekit={SPEKIT.importValidationTips}
    >
      <div className="mb-2 flex items-center gap-2">
        <Info className="size-4 shrink-0 text-sky-600" aria-hidden />
        <p className="text-xs font-bold text-sky-900">قبل الرفع</p>
      </div>
      <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-sky-900/90">
        {TIPS.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}
