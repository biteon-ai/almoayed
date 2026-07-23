import { APP_NAME } from "@/lib/constants";

export interface LandingCta {
  label: string;
  href: string;
}

export interface TrustMetric {
  id: string;
  value: string;
  label: string;
}

export interface FeatureCard {
  id: string;
  title: string;
  description: string;
}

export interface AudienceCard {
  role: "student" | "teacher";
  title: string;
  benefits: string[];
  ctaLabel: string;
  ctaHref: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export const LANDING_HERO = {
  title: "اختبر مهاراتك، تتبع إنجازاتك، وحقق التميّز الدراسي",
  subtitle:
    "منصة المؤيد تجمع الاختبارات التفاعلية، تحليل الأداء، وسلسلة المذاكرة في تجربة واحدة مصممة لطلاب البكالوريا.",
  primaryCta: {
    label: "تجربة المنصة مجاناً",
    href: "/login",
  },
  secondaryCta: {
    label: "تصفح الاختبارات",
    href: "/login?from=/quizzes",
  },
} as const satisfies {
  title: string;
  subtitle: string;
  primaryCta: LandingCta;
  secondaryCta: LandingCta;
};

export const LANDING_NAV_LINKS: NavLink[] = [
  { label: "المميزات", href: "#features" },
  { label: "للطلاب", href: "#students" },
  { label: "للمدرسين", href: "#teachers" },
];

export const LANDING_TRUST_METRICS: TrustMetric[] = [
  { id: "students", value: "+10,000", label: "طالب نشط" },
  { id: "tests", value: "+500", label: "اختبار متاح" },
  { id: "satisfaction", value: "98%", label: "نسبة الرضا" },
  { id: "grading", value: "فوري", label: "تصحيح تلقائي" },
];

export const LANDING_FEATURES: FeatureCard[] = [
  {
    id: "interactive-tests",
    title: "اختبارات تفاعلية",
    description:
      "اختبر نفسك بأسئلة متنوعة مع تجربة امتحان واقعية قبل يوم الاختبار الحقيقي.",
  },
  {
    id: "analytics",
    title: "تحليل الأداء",
    description:
      "تابع معدلك، اكتشف نقاط الضعف، واعرف أين تحتاج للتركيز في كل مادة.",
  },
  {
    id: "streak",
    title: "سلسلة المذاكرة",
    description:
      "حافظ على حماسك اليومي بسلسلة إنجازات تذكّرك بالاستمرار خطوة بخطوة.",
  },
];

export const LANDING_AUDIENCE: AudienceCard[] = [
  {
    role: "student",
    title: "للطلاب",
    benefits: [
      "اختبارات يومية جاهزة للبكالوريا",
      "متابعة التقدم ونقاط الضعف",
      "تجربة مجانية للبدء فوراً",
    ],
    ctaLabel: "ابدأ كطالب",
    ctaHref: "/login",
  },
  {
    role: "teacher",
    title: "للمدرسين",
    benefits: [
      "إدارة الطلاب والمجموعات بسهولة",
      "إنشاء واستيراد الاختبارات",
      "لوحة تحكم وإحصائيات فورية",
    ],
    ctaLabel: "ابدأ كمدرس",
    ctaHref: "/login",
  },
];

export const LANDING_FOOTER = {
  copyright: `© ${new Date().getFullYear()} ${APP_NAME}. جميع الحقوق محفوظة.`,
  links: [
    { label: "تسجيل الدخول", href: "/login" },
    { label: "المميزات", href: "#features" },
  ],
} as const;
