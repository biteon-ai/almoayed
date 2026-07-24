# AGENTS.md — Al-Moayed (المؤيد)

Guidance for AI coding agents working in this repository.

## Spec Kit location

| File | Purpose |
|------|---------|
| [.speckit/spec.yaml](.speckit/spec.yaml) | **Feature registry** — all implemented tasks with IDs, routes, files |
| [.speckit/constitution.md](.speckit/constitution.md) | Architecture principles (RTL, gatekeeper, multi-tenant) |
| [.speckit/PROMPT.md](.speckit/PROMPT.md) | Copy-paste agent system prompt |
| [.speckit/spekit-targets.yaml](.speckit/spekit-targets.yaml) | Spekit DAP DOM selectors (58 hooks) |
| [src/lib/spekit-targets.ts](src/lib/spekit-targets.ts) | Spekit hooks in code |

## Quick start

```bash
npm install
cp .env.example .env   # Supabase + SESSION_SECRET
npx supabase db push
npm run dev
```

## Implemented feature IDs

`AUTH-001` · `AUTH-002` · `AUTH-003` · `AUTH-004` · `AUTH-005` · `AUTH-006` · `FIX-AUTH-001` · `FIX-UI-001` · `FIX-UI-002` · `FIX-UI-003` · `MT-001` · `MT-002` · `MT-003` · `QUIZ-001` · `QUIZ-002` · `QUIZ-003` · `QUIZ-004` · `GAMIF-001` · `GAMIF-002` · `GAMIF-004` · `PROFILE-001` · `PROFILE-002` · `TIER-001` · `TIER-002` · `TEACH-001` · `TEACH-002` · `TEACH-003` · `TEACH-004` · `TEACH-005` · `TEACH-011` · `UI-001` · `UI-002` · `UI-006` · `UI-007` · `UI-009` · `ENABLE-001`

See `.speckit/spec.yaml` for acceptance criteria, file paths, and partial features.

## Demo accounts

| Role | WhatsApp | Notes |
|------|----------|-------|
| Teacher | 963912345678 | Code: `AlMoayed-DEMO` |
| Student | 963987654321 | Linked to demo teacher |

## Cursor rule

Project rule `.cursor/rules/almoayed-speckit.mdc` is **always applied** — agents load Spec Kit constraints automatically.
