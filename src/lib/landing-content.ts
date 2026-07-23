import { APP_FOOTER_COPYRIGHT, APP_TAGLINE, APP_DESCRIPTION } from "@/lib/constants";

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
  badge: APP_TAGLINE,
  title: "اختبر مهاراتك، تتبع إنجازاتك، وحقق التميّز الدراسي",
  subtitle: APP_DESCRIPTION,
  primaryCta: {
    label: "تجربة المنصة مجاناً",
    href: "/login",
  },
  secondaryCta: {
    label: "تصفح الاختبارات",
    href: "/login?from=/quizzes",
  },
} as const satisfies {
  badge: string;
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
      "اختبارات شاملة لكافة المواد والمراحل التعليمية",
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
      "إنشاء واختبار جميع الصفوف والمناهج الدراسية بكل سهولة",
      "لوحة تحكم وإحصائيات فورية",
    ],
    ctaLabel: "ابدأ كمدرس",
    ctaHref: "/login",
  },
];

export const LANDING_FOOTER = {
  copyright: APP_FOOTER_COPYRIGHT,
  links: [
    { label: "تسجيل الدخول", href: "/login" },
    { label: "المميزات", href: "#features" },
  ],
} as const;
