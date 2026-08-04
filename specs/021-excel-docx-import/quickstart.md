# Quickstart: TEACH-012 Excel & Word Import Templates

## Prerequisites

- Branch `021-excel-docx-import`
- `npm install` (includes new `docx` after implement)
- Demo teacher: WhatsApp `963912345678` / code `AlMoayed-DEMO`
- Existing quiz on `/teacher/quizzes/[id]` with import panel visible

## Manual QA — Excel (P1)

1. Open quiz edit → import section → **Excel / CSV** tab.
2. Click **تحميل نموذج Excel** → save `almoayed-import-template.xlsx`.
3. Upload that file unchanged → submit import.
4. Expect ≥1 new question: «ما ناتج 5 × 5؟», options 20/25/30/35, correct **ب**, category ضرب.
5. Re-upload same file → questions **append** (count increases).

## Manual QA — Word (P1)

1. Switch to **Word / Text** tab.
2. Click **تحميل نموذج Word** → file must be **`.docx`**, not `.txt`.
3. Upload sample → staging preview lists sample question(s) with four options.
4. Confirm import → success count toast; questions appear on quiz.
5. Upload empty/garbage `.docx` → Arabic error; no new empty questions.

## Manual QA — TXT regression

1. Download or craft a `.txt` labeled block (`س:` / `الجواب:`).
2. Import still succeeds (TEACH-004).

## Automated

```bash
npx vitest run tests/features/teach-012-excel-template.test.ts tests/features/teach-012-docx-template.test.ts
npx vitest run tests/features/teach-004-import.test.ts tests/features/teach-004-docx-parse.test.ts
npm run build
```

## Registry / Spekit

- `.speckit/spec.yaml` → `TEACH-012`
- Spekit: `import-excel-template-download`, `import-docx-template-download`
