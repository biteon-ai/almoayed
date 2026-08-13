# Quickstart: TEACH-013 Quick Text Paste Import

## Prerequisites

- Branch `022-quick-text-import`
- `npm install` / `npm run dev`
- Demo teacher: WhatsApp `963912345678` / code `AlMoayed-DEMO`
- Open an owned quiz at `/teacher/quizzes/[id]` (questions management / list view)

## Manual QA — Happy path (P1)

1. Click **«لصق نصي سريع»** next to manual add.
2. Paste (or copy example then paste):

```text
س: ما ناتج 2 + 2؟
أ) 3
*ب) 4
ج) 5
د) 6
الشرح: جمع بسيط
التصنيف: حساب

س: عاصمة سوريا؟
أ) حلب
ب) دمشق
الجواب: ب
ج) حمص
د) اللاذقية
```

3. Preview shows both as valid.
4. Confirm save → dialog closes; toast shows imported **2**; questions appear with correct **option text** (e.g. `4`, `دمشق`), not bare letters only.
5. Options count matches paste (2–4; no empty padded slots).

## Manual QA — Mixed valid/invalid (P1)

1. Paste one complete block and one missing `الجواب` / asterisk.
2. Preview marks invalid with Arabic reason.
3. Save → only valid imported; toast includes skip count; dialog closed.

## Manual QA — Cap (SC-001a, spot-check)

1. Paste &gt;50 valid blank-line blocks (scripted or repeated).
2. Save → exactly 50 added; Arabic cap messaging in toast/message.

## Regression

1. File bulk import (Excel/Word/TXT) still works from import tab.
2. Manual **إضافة سؤال** unchanged.

## Automated

```bash
npx vitest run tests/features/teach-013-quick-paste-parse.test.ts tests/features/teach-013-quick-paste-save.test.ts
npx vitest run tests/features/teach-004-import.test.ts
npm run build
```

## Registry / Spekit (on implement)

- `.speckit/spec.yaml` → `TEACH-013`
- Spekit: `quick-text-paste-open`, `quick-text-paste-dialog`, `quick-text-paste-submit`
