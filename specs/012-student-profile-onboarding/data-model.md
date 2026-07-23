# Data Model: PROFILE-002

## Entity: Profile (extended)

Existing `profiles` row for `role = STUDENT` gains:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `birth_date` | `date` NULL | Required for `profile_completed` | Age ≥ 6 years; not future |
| `education_stage` | `text` / enum | Required for onboarding + profile complete | See enum below |
| `province` | `text` NULL | Required for profile complete | Syria province Arabic label |
| `city` | `text` NULL | Required for profile complete | Free text |
| `address` | `text` (existing) | Optional | Detailed address |
| `email` | `text` NULL (existing) | Optional | Contact only; validate if set |
| `referral_source` | `text` NULL | Required for onboarding | See enum below |
| `primary_subject` | `text` NULL | Required for onboarding | Free text or preset |
| `onboarding_completed` | `boolean` NOT NULL DEFAULT `false` | — | First wizard done |
| `profile_completed` | `boolean` NOT NULL DEFAULT `false` | — | Required demographics valid |

### Education stage values

`primary` | `preparatory` | `secondary` | `baccalaureate` | `university` | `other`

### Referral source values

`class` | `whatsapp` | `friend` | `social` | `other`  
(UI: معهد/مدرسة، واتساب، صديق، وسائل تواصل، غير ذلك)

### Relationships

- Profile 1—N `exam_submissions` (gate count)
- Profile 1—N `student_teachers` (teacher demographic access)

---

## Derived: Gate predicate

```text
shouldBlockNewQuiz(student):
  NOT profile_completed
  AND uniqueCompletedQuizCount(student) >= 2
  AND quiz has no exam_submissions for this student
```

`uniqueCompletedQuizCount` = `COUNT(DISTINCT quiz_id)` from `exam_submissions` where `student_id = profile.id`.

---

## State transitions

### Onboarding

```text
onboarding_completed=false
  → complete 3 steps (stage, referral, subject)
  → onboarding_completed=true
     (profile_completed unchanged; usually still false)
```

### Profile completion

```text
profile_completed=false + count>=2 + open incomplete quiz
  → /profile/complete
  → valid required fields
  → profile_completed=true → redirect to intended quiz

profile_completed=true
  → settings clears required field
  → profile_completed=false (gate may apply again)
```

---

## Validation rules (lib)

| Rule | Constraint |
|------|------------|
| Full name | Non-empty; reuse `validateDisplayName` |
| Birth date | Not future; age ≥ 6 |
| Province | Must be in Syria provinces list |
| City | Trimmed non-empty for complete |
| Education stage | One of enum values |
| Email | Optional; if present must match email pattern |
| Referral / subject | Required on onboarding submit |

---

## Migration notes

- File: `supabase/migrations/009_student_profile_demographics.sql`
- Backfill: existing rows keep `onboarding_completed = false`, `profile_completed = false`
- Optional CHECK constraints for enums or validate in app layer (prefer app + typed unions for flexibility)
- Teachers’ `email`/`address` columns remain as today; new columns nullable for teachers (unused)
