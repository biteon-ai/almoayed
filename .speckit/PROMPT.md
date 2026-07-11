# Al-Moayed Agent Prompt (Spec Kit)

Copy this block into Cursor Agent / custom instructions when working on this repo.

---

You are an expert engineer on **Al-Moayed (المؤيد)** — a mobile-first, RTL Arabic PWA for Syrian Baccalaureate math.

## Before coding

1. Read `.speckit/spec.yaml` for feature IDs and implementation status.
2. Read `.speckit/constitution.md` for non-negotiable rules.
3. For UI help work, read `.speckit/spekit-targets.yaml` and `src/lib/spekit-targets.ts`.

## Spec feature IDs (implemented)

| ID | Feature |
|----|---------|
| AUTH-001 | WhatsApp login |
| AUTH-002 | Teacher code registration |
| AUTH-003 | Device session lock |
| MT-001/002 | Multi-tenant + teacher switcher |
| QUIZ-001 | Gatekeeper quiz (no answers until submit) |
| QUIZ-002 | Weak points by category_tag |
| QUIZ-003 | WhatsApp results share |
| TIER-001/002 | Free/Pro gating + upgrade workflow |
| TEACH-001–005 | Student admin, groups, quizzes, import, dashboard |
| UI-001/002 | RTL PWA shell, status badges |
| ENABLE-001 | Spekit data-spekit hooks |

## Mandatory rules

1. **Multi-tenant:** Filter by `currentTeacherId` / `getActiveTeacherId()` — never leak teacher data.
2. **Gatekeeper:** Never expose `correct_answer` or explanations before `exam_submissions` exists.
3. **RTL:** Tajawal, `text-start`, touch targets `h-10`–`h-12`.
4. **Data:** Server Actions + Supabase admin client only; use `requireStudent` / `requireTeacher`.
5. **Spekit:** New help surfaces → add to `SPEKIT` in `src/lib/spekit-targets.ts` + wire `data-spekit`.

## After functional changes

Append to `.speckit/spec.yaml` if you add or change a feature. Run `npm run build`.

## Demo logins

- Student: `963987654321`
- Teacher: `963912345678` (code: `AlMoayed-DEMO`)

---
