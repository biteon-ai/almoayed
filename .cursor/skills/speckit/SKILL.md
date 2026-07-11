---
name: speckit
description: >-
  Al-Moayed Spec Kit workflow — read feature registry, enforce constitution
  rules (RTL, multi-tenant, QUIZ-001 gatekeeper), wire Spekit hooks, write
  Spekit-ID-mapped tests, and update spec.yaml. Use when the user invokes
  /speckit, mentions Spekit, Spec Kit, feature IDs (AUTH-*, QUIZ-*, MT-*,
  TIER-*, TEACH-*), spekit-targets, or asks to implement/verify/test a
  spec feature.
---

# Speckit — Al-Moayed Spec Kit

Project: **Al-Moayed (المؤيد)** — RTL Arabic PWA for Syrian Baccalaureate math.

## On invoke

1. Read `.speckit/spec.yaml` — find the feature ID(s) in scope.
2. Read `.speckit/constitution.md` — non-negotiable rules.
3. If UI/help work: read `.speckit/spekit-targets.yaml` + `src/lib/spekit-targets.ts`.

Do not guess feature behavior; use `spec.yaml` acceptance criteria as the contract.

## Constitution (never break)

| Rule | Enforcement |
|------|-------------|
| **MT-002** Multi-tenant | Filter by `currentTeacherId` / `getActiveTeacherId()` |
| **QUIZ-001** Gatekeeper | No `correct_answer` / explanations until `exam_submissions` exists |
| **AUTH-003** Device lock | `sessionToken` must match `profiles.last_session_id` |
| **TIER-001** Gating | Free tier only sees `is_free` quizzes |
| RTL UX | Tajawal, `dir="rtl"`, touch targets `h-10`–`h-12` |
| Data layer | Server Actions + admin Supabase; `requireStudent` / `requireTeacher` |

Pure logic lives in `src/lib/quiz-gatekeeper.ts`, `quiz-access.ts`, `weak-points.ts`, `device-session.ts`, `tier-upgrade.ts`.

## Workflows

### Implement or change a feature

```
- [ ] Locate feature in spec.yaml (id, files, acceptance)
- [ ] Implement minimal diff in listed files
- [ ] Add/update Spekit hook if new UI surface (ENABLE-001)
- [ ] Add/update Vitest test with [FEATURE-ID] in describe name
- [ ] Run npm run lint && npm run typecheck && npm run build
- [ ] Run npm run test:unit (and test:e2e if UI/RTL)
- [ ] Update spec.yaml status/acceptance if behavior changed
```

### Add Spekit DOM hook (ENABLE-001)

1. Add key to `SPEKIT` in `src/lib/spekit-targets.ts`.
2. Mirror entry in `.speckit/spekit-targets.yaml`.
3. Wire `data-spekit={SPEKIT.yourKey}` on the component (avoid spread on client components).

### Write tests (Spekit-mapped)

- **Vitest** (`tests/features/`, `tests/integration/`): server actions, parsers, pure lib.
- **Playwright** (`e2e/`): RTL layout, touch targets, public/login flows.
- Every `describe` MUST prefix the Spekit ID: `` `[QUIZ-001] Gatekeeper` ``.
- Failure messages MUST include the ID: `` `[QUIZ-001] Solution leaked prior to submission` ``.
- Zero `any` in mocks, factories, or test helpers.

| ID | Test file |
|----|-----------|
| AUTH-001/003 | `tests/features/auth-001-003.test.ts` |
| MT-001/002 | `tests/features/mt-002-tenant.test.ts` |
| QUIZ-001 | `tests/features/quiz-001-gatekeeper.test.ts`, `tests/integration/quiz-gatekeeper-action.test.ts` |
| QUIZ-002 | `tests/features/quiz-002-weak-points.test.ts` |
| TIER-001/002 | `tests/features/tier-001-gating.test.ts` |
| TEACH-004 | `tests/features/teach-004-import.test.ts` |
| AUTH-001 E2E | `e2e/auth-001-login.spec.ts` |

Extract testable logic to `src/lib/*` rather than testing implementation details.

### Verify before done

```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
# npm run test:e2e   # if UI changed
node scripts/verify-migrations.mjs   # if schema changed
```

CI mirrors this in `.github/workflows/ci.yml`.

## spec.yaml update template

When shipping or changing behavior, update the feature block:

```yaml
- id: QUIZ-001
  status: implemented   # or partial | pending
  acceptance:
    - [existing criteria…]
    - [new criterion if added]
  files:
    - [new file if added]
```

## Demo accounts (seeded)

| Role | WhatsApp | Notes |
|------|----------|-------|
| Student | `963987654321` | One-click demo |
| Teacher | `963912345678` | Code: `AlMoayed-DEMO` |

## Output format

When reporting Speckit work, structure the response:

```markdown
## Feature: [ID] Name
**Status:** implemented | partial | pending
**Changes:** …
**Tests:** [ID] — pass/fail
**Spekit hooks:** added/updated/none
**spec.yaml:** updated | no change needed
```

## Additional resources

- Feature registry details: [reference.md](reference.md)
- Agent prompt block: `.speckit/PROMPT.md`
- Cursor always-on rule: `.cursor/rules/almoayed-speckit.mdc`
