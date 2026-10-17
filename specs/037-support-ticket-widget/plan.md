# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md` or `.speckit/tasks/[feature]/spec.md`

**Note**: Filled by `/speckit-plan`. Project stack defaults below are **Al-Moayed (المؤيد)** — override only what differs for this feature.

## Summary

[Primary requirement + technical approach from spec and clarifications]

## Technical Context

**Project**: Al-Moayed (المؤيد) — RTL Arabic PWA for Syrian Baccalaureate math

| Area | Default (this repo) |
|------|---------------------|
| **Language** | TypeScript (strict) |
| **Framework** | **Next.js 14** App Router — RSC, Server Actions, `src/app/` routes |
| **Database** | **Supabase** PostgreSQL — schema in `supabase/migrations/`, RLS enabled |
| **Data access** | Server Actions + `createAdminClient()` — **no** client Supabase for privileged reads |
| **Session / auth** | iron-session (`requireStudent` / `requireTeacher`), WhatsApp login |
| **UI** | Tailwind CSS, Shadcn/Base UI, RTL (`dir="rtl"`, `text-start`), touch targets `h-10`–`h-12` |
| **Testing** | Vitest (`tests/features/`, `tests/integration/`), Playwright (`e2e/`) |
| **Target platform** | Mobile-first PWA (Vercel or Node hosting) |
| **Spec registry** | `.speckit/spec.yaml` (feature IDs: AUTH-*, QUIZ-*, TEACH-*, etc.) |

**Feature-specific overrides** (fill if different):

- **Primary Dependencies**: [e.g. mammoth for DOCX — or "none beyond stack defaults"]
- **Storage / tables touched**: [e.g. `quizzes`, `questions` — or N/A]
- **Performance Goals**: [e.g. import <5s for 50 MCQs — or "standard web"]
- **Constraints**: [e.g. multi-tenant filter by `currentTeacherId` — reference constitution]
- **Scale/Scope**: [e.g. single teacher quiz edit screen]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.speckit/constitution.md` (also `.specify/memory/constitution.md`)

| Gate | Requirement |
|------|-------------|
| MT-002 | Teacher-scoped queries filter by `currentTeacherId` / session `profileId` |
| QUIZ-001 | No `correct_answer` / explanations to students before `exam_submissions` |
| Server layer | Privileged data via Server Actions + admin Supabase client only |
| RTL UX | Arabic RTL, Tajawal, accessible touch targets |
| Minimal diff | Match existing patterns in `src/components/`, `src/actions/` |

**Feature compliance**: [PASS / FAIL — list any justified exceptions in Complexity Tracking]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/          # Spec Kit branch workflow (optional)
├── plan.md                     # This file
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md

# Or monorepo-style (main branch):
.speckit/tasks/[feature-slug]/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (Al-Moayed — Next.js + Supabase)

```text
src/
├── app/                        # App Router pages (RSC)
│   ├── login/
│   ├── dashboard/              # Student
│   ├── quiz/[id]/
│   └── teacher/                # Teacher admin
├── actions/                    # Server Actions ("use server")
│   ├── auth.ts
│   ├── quiz.ts
│   ├── student.ts
│   └── teacher.ts
├── components/
│   ├── teacher/
│   ├── quiz/
│   └── ui/
├── lib/                        # Pure helpers, gatekeeper, import parsers
└── types/database.ts

supabase/
└── migrations/                 # Schema source of truth

tests/
├── features/                   # Vitest — [FEATURE-ID] in describe names
├── integration/
e2e/                            # Playwright smoke / RTL
.speckit/
├── spec.yaml                   # Feature registry + acceptance
├── constitution.md
└── spekit-targets.yaml         # data-spekit hooks
```

**Structure decision**: Single Next.js 14 app; Supabase for persistence; no separate API server. New work goes in `src/app/`, `src/actions/`, `src/components/` per feature ID in `spec.yaml`.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [none] | — | — |
