# Quickstart: Teacher Gamification (GAMIF-001)

## Prerequisites

- Branch `011-teacher-gamification`
- Local `.env` (Supabase + `SESSION_SECRET`)
- Demo accounts from `AGENTS.md` (teacher `963912345678` / student `963987654321`)

```bash
npm install
npx supabase db push    # applies 007_gamification_tiers.sql
npm run dev
```

---

## Manual QA path

### 1. Teacher configures tiers

1. Login as teacher → `/teacher/settings` → open «إعداد المستويات» → `/teacher/settings/gamification`.
2. Add 3 levels, e.g.:
   - مبتدئ — 0 quizzes — 0% — وسام  
   - مكافح — 2 quizzes — 50% — كأس  
   - أسطورة — 5 quizzes — 80% — ألماس  
3. Save → reload → same order and values.
4. Attempt inverted ladder (level 2 easier than level 1) → Arabic validation, no save.
5. Attempt 21st level → blocked at 20.

### 2. Multi-tenant isolation

1. As Teacher A, save tiers.  
2. As Teacher B (second account if available), open gamification settings → empty / not A’s tiers.

### 3. Student dashboard

1. Login as linked student with `currentTeacherId` = Teacher A.  
2. With submissions under A matching «مكافح», dashboard shows level name + icon, bottleneck bar, gallery unlocks for tiers met.  
3. Switch active teacher to one with **no** tiers → level card and gallery **disappear**.

### 4. Counting rules

1. Complete the same quiz once → count +1.  
2. (If retake blocked by unique constraint) confirm no double-count path.  
3. Incomplete quiz (no submission) does not affect totals.

### 5. Results

1. Open `/results` under Teacher A with tiers → compact summary matches dashboard level.  
2. Under teacher with no tiers → no summary block.

### 6. Free teacher (no Pro)

1. Free teacher account can open and save gamification settings without upgrade wall.

---

## Automated checks

```bash
npx vitest run tests/features/gamif-001-teacher-gamification.test.ts
npm run build
```

Cover pure lib: ladder validation, bottleneck progress, current/next tier, hide-when-empty contract (null status).

---

## Spekit / registry

After UI lands:

- `.speckit/spec.yaml` → `GAMIF-001`
- `src/lib/spekit-targets.ts` + `.speckit/spekit-targets.yaml`
