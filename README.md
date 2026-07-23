# المؤيد (Al-Moayed)

منصة **تعليمية متكاملة** — PWA عربية (RTL) لجميع المراحل الدراسية والمواد، تربط المعلّمين بالطلاب عبر اختبارات تفاعلية، تصحيح فوري، تحليل الأداء، وإدارة الاشتراكات.

**الشعار:** حل بيدك ما حدا بفيدك

---

## نظرة عامة

| الجمهور | الوظائف الرئيسية |
|---------|------------------|
| **الطلاب** | لوحة تحكم، اختبارات MCQ، نتائج، نقاط ضعف، تبديل المعلّم |
| **المعلّمون** | إدارة الطلاب والمجموعات، إنشاء الاختبارات، استيراد الأسئلة، لوحة تحليلات |
| **المشرف** | تسجيل دخول احتياطي `/admin/login` (AUTH-005) |

سجل الميزات المنفّذة: **[`.speckit/spec.yaml`](.speckit/spec.yaml)** · [AGENTS.md](AGENTS.md)

---

## Tech Stack

| الطبقة | التقنيات |
|--------|----------|
| Framework | [Next.js 14](https://nextjs.org/) App Router |
| UI | [React 18](https://react.dev/), [Tailwind CSS 3](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Backend | [Supabase](https://supabase.com/) (Postgres + service role) |
| Session | [iron-session](https://github.com/vvo/iron-session) |
| Auth OTP | BiteonSwitch (WhatsApp) + demo bypass |
| Charts | [Recharts](https://recharts.org/) |
| Tests | [Vitest](https://vitest.dev/) (unit/integration) · [Playwright](https://playwright.dev/) (e2e) |

---

## التثبيت والتشغيل

### 1. تثبيت الاعتماديات

```bash
npm install
# أو
pnpm install
```

### 2. متغيرات البيئة

```bash
cp .env.example .env
```

املأ على الأقل:

- `NEXT_PUBLIC_SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET` (32+ حرف)
- `NEXT_PUBLIC_APP_URL` (مثال: `http://localhost:3000`)

راجع [`.env.example`](.env.example) لخيارات BiteonSwitch و Admin fallback.

### 3. قاعدة البيانات

```bash
npx supabase db push
```

### 4. خادم التطوير

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

### 5. الاختبارات

```bash
# Unit / integration (Vitest)
npm test

# Watch mode
npm run test:watch

# End-to-end (Playwright — يتطلب Chromium)
npm run test:e2e
```

### 6. البناء للإنتاج

```bash
npm run build
npm start
```

أوامر إضافية: `npm run lint` · `npm run typecheck` · `npm run test:ci`

---

## حسابات تجريبية

| الدور | WhatsApp | ملاحظات |
|------|----------|---------|
| معلّم | `963912345678` | رمز المعلّم: `AlMoayed-DEMO` |
| طالب | `963987654321` | مرتبط بالمعلّم التجريبي |

---

## هيكل المشروع

```
src/
├── app/                    # Next.js App Router
│   ├── (student)/          # بوابة الطالب (مجموعة مسارات)
│   │   ├── dashboard/      # /dashboard — لوحة الطالب
│   │   ├── quizzes/        # /quizzes — قائمة الاختبارات
│   │   ├── quiz/[id]/      # /quiz/:id — حل الاختبار
│   │   ├── results/        # /results — النتائج
│   │   └── settings/       # /settings — الإعدادات
│   ├── teacher/            # بوابة المعلّم
│   │   ├── dashboard/      # /teacher/dashboard
│   │   ├── students/       # /teacher/students — مركز إدارة الطلاب
│   │   │   └── [id]/       # /teacher/students/:id — تفاصيل الطالب
│   │   ├── quizzes/        # /teacher/quizzes
│   │   │   ├── new/        # إنشاء اختبار
│   │   │   └── [id]/       # تحرير أسئلة الاختبار
│   │   └── settings/
│   ├── login/              # تسجيل الدخول (WhatsApp OTP)
│   ├── register/           # التسجيل
│   └── admin/login/        # دخول المشرف
├── actions/                # Server Actions (كتابة DB)
├── components/             # مكوّنات UI حسب المجال
│   ├── dashboard/          # لوحة الطالب
│   ├── teacher/            # بوابة المعلّم
│   ├── quiz/               # واجهة الاختبار
│   └── ui/                 # Shadcn primitives + PaginationControls
├── hooks/                  # React hooks (usePagination, …)
├── lib/                    # منطق أعمال، auth، gatekeeper
└── types/                  # واجهات TypeScript (Student, Quiz, KPI, …)
tests/                      # Vitest — features + integration
e2e/                        # Playwright specs
.speckit/                   # Spec Kit — registry + constitution
```

---

## المعمارية والجودة

- **صفحات رفيعة، مكوّنات غنية:** `page.tsx` يجلب البيانات؛ العرض في `components/`.
- **QUIZ-001 Gatekeeper:** لا تُرسل إجابات/شروح قبل التسليم.
- **Multi-tenant:** استعلامات المعلّم scoped بـ `currentTeacherId`.
- **RTL + touch-first:** واجهة عربية بالكامل، بدون `<select>` native في UI جديد.
- **Spekit hooks:** `data-spekit` عبر [`src/lib/spekit-targets.ts`](src/lib/spekit-targets.ts).

### استيراد الأسئلة بالجملة (TEACH-004) — Append-Only

استيراد CSV / Excel / Word / TXT يتم عبر **Server Actions** (`importQuestions`، `importQuestionRows` في [`src/actions/teacher.ts`](src/actions/teacher.ts)) وليس عبر `/api/import/*`.

| القرار | التفاصيل |
|--------|----------|
| **الاستراتيجية** | Append-only — كل صف صالح يُدرَج كسؤال جديد بمعرّف فريد |
| **كشف التكرار** | **خارج النطاق** — لا مقارنة بنص السؤال أو العنوان |
| **إعادة الرفع** | رفع نفس الملف مرتين يُنشئ أسئلة مكررة (الوضع الافتراضي) |
| **الاستبدال** | وضع «replace» يحذف كل أسئلة الاختبار ثم يستورد — لا dedup داخل الملف |

المنطق في [`src/lib/import-questions.ts`](src/lib/import-questions.ts) و [`src/lib/parse-docx-questions.ts`](src/lib/parse-docx-questions.ts). راجع [CONTRIBUTING.md](CONTRIBUTING.md) قبل إضافة تحقق من التكرار.

---

## Spec Kit للوكلاء

راجع [AGENTS.md](AGENTS.md) و [`.speckit/constitution.md`](.speckit/constitution.md) قبل أي تعديل.

```bash
npm run build   # تحقق إلزامي بعد تغيير السلوك
```

---

## الترخيص

Private — All rights reserved.
