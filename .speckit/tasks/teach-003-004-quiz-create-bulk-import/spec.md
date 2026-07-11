# Feature Specification: TEACH-003/004 Quiz Create + Bulk Import Flow

**Feature ID**: TEACH-003 + TEACH-004 (wizard integration)  
**Created**: 2026-07-12  
**Status**: Implemented (verification & test tasks remain)  
**Branch note**: Generated on `main`; run `/speckit-specify` on a feature branch for Spec Kit branch workflow.

## User Stories

### User Story 1 — Create quiz and durable setup URL (Priority: P1)

As a teacher, after submitting the new-quiz form I am redirected to `/teacher/quizzes/[id]?setup=import` so refresh/back does not lose my place or create duplicate quizzes.

**Independent Test**: Create quiz from `/teacher/quizzes/new` → lands on edit page with setup banner and bulk upload visible; refresh keeps same URL and banner.

**Acceptance Scenarios**:

1. **Given** teacher on `/teacher/quizzes/new`, **When** form submits successfully, **Then** browser navigates to `/teacher/quizzes/[id]?setup=import`.
2. **Given** teacher on setup URL, **When** page refreshes, **Then** setup banner and bulk upload remain visible.

---

### User Story 2 — Bulk import with feedback (Priority: P1)

As a teacher, I can import CSV/XLSX/TXT on the edit page during setup or later; successful import shows a toast with the imported count and appends rows on re-import.

**Independent Test**: Upload valid CSV on setup page → redirects to `?imported=N` with toast; second upload adds more questions without blocking.

**Acceptance Scenarios**:

1. **Given** teacher on setup import panel, **When** valid file imports, **Then** URL becomes `?imported=N` and toast shows count.
2. **Given** quiz with existing questions, **When** second file imports, **Then** new rows append (no duplicate blocking).
3. **Given** teacher on setup panel, **When** skip is clicked, **Then** `?setup=import` is cleared for manual entry.

---

### User Story 3 — Inactive until questions exist (Priority: P2)

As a teacher, new quizzes start inactive and cannot be activated until at least one question exists; no post-import activation nudge is shown.

**Independent Test**: New quiz is inactive; activate button disabled on list when `question_count=0`; after import, activate works from quiz list only.

**Acceptance Scenarios**:

1. **Given** newly created quiz, **When** saved, **Then** `is_active=false` regardless of prior UI intent.
2. **Given** quiz with zero questions, **When** teacher clicks activate, **Then** action is blocked with Arabic error.
3. **Given** successful import, **When** toast shows, **Then** no inline “activate now” CTA appears.

## Clarifications (2026-07-12)

See `.speckit/spec.yaml` → `clarifications` for full Q&A log.

## Out of Scope

- Duplicate question detection on re-import
- File size / rate limits
- Auto-activate after first question
