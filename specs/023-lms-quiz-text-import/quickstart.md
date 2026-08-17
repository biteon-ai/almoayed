# Quickstart: TEACH-014 Structured LMS Quiz Text Import

## Prerequisites

- Branch `023-lms-quiz-text-import`
- `npm run dev`
- Demo teacher `963912345678` / `AlMoayed-DEMO`
- Open `/teacher/quizzes/[id]` → «لصق نصي سريع»

## Manual QA — LMS questions (P1)

Paste:

```text
=== Quiz Settings ===
Quiz Type: Practice / Homework
Number of Attempts: Unlimited
Enable Timer: No
Quiz Duration: 30

=== Quiz Questions ===

Q1: What is $2+2$?
A) 3
B) 4
C) 5
D) 6
Answer: B
Explanation: Basic arithmetic

Q2: Capital of Syria?
A) Aleppo
B) Damascus
C) Homs
D) Latakia
Answer: B
```

Expect: settings preview card; 2 valid; save → 2 questions with correct **option text**; quiz type practice; unlimited attempts; timer off.

## Manual QA — timer Yes without duration

Header: `Enable Timer: Yes` and blank/missing duration + ≥1 valid question.  
Expect: warning on timer; existing quiz timer unchanged; questions still import.

## Manual QA — mixed paste

One `Q1:` LMS block + one Arabic `(1) س:` block with `*ب)` in the same paste → both can validate/import under their rules.

## Manual QA — `Qn:` without blank lines

```text
Q1: One?
A) a
B) b
C) c
D) d
Answer: A
Q2: Two?
A) a
B) b
C) c
D) d
Answer: B
```

Expect: 2 preview items.

## Regression

- Arabic TEACH-013 paste still works  
- File import unchanged  

## Automated

```bash
npx vitest run tests/features/teach-014-lms-parse.test.ts tests/features/teach-014-lms-settings.test.ts
npx vitest run tests/features/teach-013-quick-paste-parse.test.ts tests/features/teach-013-quick-paste-save.test.ts
npm run build
```

## Registry / Spekit (on implement)

- `.speckit/spec.yaml` → `TEACH-014`
- Optional Spekit: `quick-text-paste-settings`
