# Quickstart: TEACH-016 Plain Unicode Math Paste

**Date**: 2026-09-09  
**Branch**: `026-plain-math-paste`

## Prerequisites

- App running locally (`npm run dev`) with a teacher session that owns a quiz
- Feature branch checked out after implementation tasks land

## Manual QA

### 1. Official LMS sample is LaTeX-free

1. Open a quiz → «لصق نصي سريع».
2. Click «نسخ نموذج LMS» → paste into the textarea.
3. **Expect**: Preview shows ≥1 valid question; sample text has no `$`, `\frac`, `\vec`, or `\widehat`.
4. Save → questions appear with plain characters.

### 2. Plain Unicode STEM paste

Paste:

```text
Q1: إن cos(AB, AC) يساوي:
A) 1/3
B) 7/9
C) √2/2
D) 0
Answer: B
Explanation: منتصف [AB] يعطي 1/2 .
```

**Expect**: Valid LMS draft; preview readable; no LaTeX strings.

### 3. LaTeX auto-normalize

Paste:

```text
Q1: عند البحث عن نقطة $M$ تحقق $\vec{BM}-\vec{MA}=\vec{0}$:
A) غير موجودة
B) $(1, 0, \frac{1}{2})$
C) $(-1, -\frac{1}{2}, -1)$
D) $(\frac{1}{2}, 0, 1)$
Answer: D
Explanation: تكافئ $\vec{BM}=\vec{MA}$ .
```

**Expect**:
- Preview options look like `(1, 0, 1/2)` style plain text (not raw `\frac`)
- Arabic notice appears if anything residual remains
- Question still **valid**; Save stores normalized text

### 4. Residual / unknown LaTeX still imports

Paste a valid LMS block containing an obscure command e.g. `$\\operatorname{foo}{x}$` inside the stem.

**Expect**: Remains valid if A–D + Answer present; notice warns; fragment may remain as text; Save still works.

### 5. Regression — Arabic TEACH-013 + settings

1. Paste existing Arabic sample → still validates.
2. Paste LMS settings header + questions → settings card still applies on save.
3. Mixed Arabic + LMS in one paste → both paths work.

### 6. Gatekeeper / tenant smoke

- Student exam still hides answers until submit (unchanged).
- Another teacher cannot import into this quiz (unchanged ownership).

## Automated checks

```bash
npx vitest run tests/features/teach-016-plain-math.test.ts \
  tests/features/teach-016-paste-normalize.test.ts \
  tests/features/teach-014-lms-parse.test.ts \
  tests/features/teach-014-lms-settings.test.ts \
  tests/features/teach-013-quick-paste-parse.test.ts \
  tests/features/teach-013-quick-paste-save.test.ts
npm run build
```

## Done when

- [ ] SC-001 sample path works without manual LaTeX cleanup  
- [ ] SC-003 no `$`/`\frac`/`\vec`/`\widehat` from sample or covered normalizations  
- [ ] TEACH-013/014 regressions green  
- [ ] `.speckit/spec.yaml` lists `TEACH-016`
