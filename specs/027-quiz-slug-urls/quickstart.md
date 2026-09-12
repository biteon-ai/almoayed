# Quickstart: TEACH-017 Friendly Teacher Quiz URLs

**Date**: 2026-09-12  
**Branch**: `027-quiz-slug-urls`

## Prerequisites

- `npx supabase db push` (or equivalent) so migration `019_quiz_friendly_slug.sql` is applied
- Teacher session that owns at least one quiz (demo teacher is fine)
- `npm run dev`

## Manual QA

### 1. List opens a readable address

1. Open «اختباراتي» (`/teacher/quizzes`).
2. Tap a quiz whose title you know.
3. **Expect**: Address is `/teacher/quizzes/{readable-title}-{8 hex}` — not a 36-char UUID. Editor loads.

### 2. Arabic + duplicate titles

1. Create two quizzes with the same Arabic title (e.g. `اختبار الوحدة`).
2. Open each from the list.
3. **Expect**: Distinct paths that both still contain the Arabic title; each editor is the matching quiz.

### 3. Create → setup import

1. `/teacher/quizzes/new` → submit a title.
2. **Expect**: Land on `/teacher/quizzes/{slug}?setup=import` (import tab / banner). Refresh keeps the same friendly URL.

### 4. Legacy UUID bookmark

1. Copy a quiz UUID from the database (or an old bookmark `/teacher/quizzes/{uuid}`).
2. Open it while logged in as the owner.
3. **Expect**: Same editor; address bar becomes the friendly slug. Add `?setup=import` to the UUID URL — query survives the hop.

### 5. Isolation + reserved path

1. As Teacher B, open Teacher A’s slug or UUID teacher URL.
2. **Expect**: Not found — not A’s quiz.
3. `/teacher/quizzes/new` still opens create, not a quiz.

### 6. Trash + title edit

1. Soft-delete a quiz → open it from Trash via the list link (slug).
2. **Expect**: Trash banner; restore works.
3. Rename the quiz title in settings (if available) or leave title as-is after a settings save.
4. **Expect**: Previous slug still opens the same quiz.

### 7. Student path unchanged

Open `/quiz/{uuid}` as a linked student — still UUID; gatekeeper unchanged.

## Automated checks

```bash
npx vitest run tests/features/teach-017-quiz-slug.test.ts \
  tests/features/teach-003-quiz-flags.test.ts
node scripts/verify-migrations.mjs
npm run build
```

## Done when

- [ ] SC-001 create lands on a name-based address in under 1 minute  
- [ ] SC-002 in-app teacher quiz hrefs use slug (list, post-create, import return, Trash)  
- [ ] SC-004 UUID bookmarks redirect to slug  
- [ ] SC-005 Teacher B cannot open Teacher A’s slug/UUID  
- [ ] `.speckit/spec.yaml` lists `TEACH-017`; TEACH-003 routes note `[slug]`
