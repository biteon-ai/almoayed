# Feature Specification: Teacher Quiz Soft Delete & Trash

**Feature Branch**: `016-quiz-soft-delete`

**Created**: 2026-07-24

**Status**: Clarified

**Feature ID**: `TEACH-011` (extends `TEACH-003`)

**Input**: User description: "Implement a two-step quiz deletion workflow for teachers (Soft Delete to Trash + Permanent Delete with Arabic confirmation). Soft-delete marker on quizzes scoped to the active teacher; Delete action on quiz cards; Trash tab with Restore and Permanent Delete; RTL UX and discovery hooks. Do not break multi-tenant teacher scoping, RTL layout, server-side writes, or quiz exam gatekeeper."

## Clarifications

### Session 2026-07-24

- Q: When a teacher opens an old edit/detail link for a quiz already in Trash, what should happen? → A: Stay on quiz edit/detail with Arabic “in Trash” banner + Restore (and optional Permanent Delete).
- Q: When permanently deleting a quiz that has student submissions/scores, what happens to that history? → A: Allow purge — permanently remove the quiz and all related questions + attempt/answer history after confirmation.
- Q: If a student is mid-exam when the teacher soft-deletes that quiz, what should happen? → A: Allow the current in-progress attempt to finish and submit; block only new starts from the catalog.
- Q: How long should soft-deleted quizzes stay in Trash before anything automatic happens? → A: Keep forever until Restore or Permanent Delete (no auto-purge).
- Q: Should TEACH-011 include bulk Trash actions (empty all / multi-select)? → A: Out of scope — only single-quiz soft delete, restore, and permanent delete.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Move a quiz to Trash (Priority: P1)

As a teacher, I want to remove a quiz from my active list without destroying it immediately so I can undo mistakes and keep the list tidy.

**Why this priority**: Soft delete is the primary safety path and the minimum viable delete experience.

**Independent Test**: On «اختباراتي», tap حذف on an active quiz; the quiz leaves the active list, appears under سلة المهملات, and students no longer see it as available.

**Acceptance Scenarios**:

1. **Given** a logged-in teacher on `/teacher/quizzes` viewing active quizzes, **When** the page loads, **Then** each quiz card/row shows a touch-friendly «حذف» action with a trash-style icon.
2. **Given** an active quiz owned by this teacher, **When** they tap «حذف», **Then** the quiz is soft-deleted (moved to Trash) for this teacher only, the active list updates immediately without a full confusing blank state, and a clear loading state appears on the action while the request runs.
3. **Given** a soft-deleted quiz, **When** a linked student opens their available quizzes for this teacher, **Then** that quiz is not offered as a new exam (soft-deleted quizzes stay out of the student-facing active catalog).
4. **Given** a student already mid-exam on a quiz, **When** the teacher soft-deletes that quiz before the student submits, **Then** the student can still finish and submit that attempt; the quiz simply stops appearing as a new start option for others.
5. **Given** Teacher A soft-deletes a quiz, **When** Teacher B (or another active teacher context) views their quiz list, **Then** Teacher A’s quiz never appears and cannot be soft-deleted, restored, or purged by Teacher B (active-teacher scoping).

---

### User Story 2 - Inspect Trash and restore a quiz (Priority: P1)

As a teacher, I want a Trash view of soft-deleted quizzes and a one-tap restore so I can recover a quiz I removed by accident.

**Why this priority**: Without Trash + Restore, soft delete is a dead-end and teachers lose trust in the delete action.

**Independent Test**: Soft-delete a quiz, open سلة المهملات, confirm it is listed, tap استعادة, confirm it returns to the active list and is again eligible for student use per existing publish rules.

**Acceptance Scenarios**:

1. **Given** the teacher quiz list page, **When** they open the «سلة المهملات» tab/filter, **Then** they see only their soft-deleted quizzes (empty Arabic state if none).
2. **Given** a soft-deleted quiz in Trash, **When** they tap «استعادة», **Then** the quiz returns to the active list, leaves Trash, and again follows existing active/inactive and free/pro rules for student visibility.
3. **Given** Trash is open, **When** they switch back to the active quizzes view, **Then** restored quizzes appear in the active list and soft-deleted ones do not.
4. **Given** a soft-deleted quiz and a bookmarked teacher edit/detail URL, **When** the teacher opens that URL, **Then** they remain on the edit/detail page with an Arabic «في سلة المهملات» banner and can Restore without being redirected away.

---

### User Story 3 - Permanently delete with explicit confirmation (Priority: P2)

As a teacher, I want to permanently remove a quiz from Trash only after an Arabic confirmation so accidental irreversible loss is prevented.

**Why this priority**: Irreversible purge is less frequent than soft delete/restore but must be safe and clear.

**Independent Test**: In Trash, start حذف نهائي, cancel once (quiz remains), confirm once (quiz and its related exam content are gone and no longer listed anywhere for this teacher).

**Acceptance Scenarios**:

1. **Given** a soft-deleted quiz in Trash, **When** the teacher taps «حذف نهائي», **Then** an Arabic confirmation dialog appears before any permanent removal, stating the action is irreversible and that related results/history will be lost (example copy: «هل أنت متأكد من حذف هذا الاختبار بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء»).
2. **Given** the confirmation dialog is open, **When** the teacher cancels, **Then** the quiz remains in Trash unchanged.
3. **Given** the confirmation dialog is open, **When** the teacher confirms, **Then** the quiz is permanently purged for this teacher, disappears from Trash, cannot be restored, and related quiz content is removed with it — including questions and any student attempt/answer/score records for that quiz (even if submissions existed).
4. **Given** a permanent-delete request in progress, **When** the UI waits for completion, **Then** a loading state is shown on the destructive action and double-submit is prevented.
5. **Given** a trashed quiz that students have already taken, **When** the teacher confirms permanent delete, **Then** the purge still succeeds (submissions do not block deletion); confirmation copy makes the irreversible loss of history clear.

---

### User Story 4 - RTL, touch, and guided discovery (Priority: P3)

As a teacher using the Arabic RTL app on a phone, I want delete/trash/restore controls to feel native (Tajawal RTL, large targets, clear labels) and to be discoverable for product guidance.

**Why this priority**: Consistency with the rest of the teacher shell; does not block MVP delete but is required for ship quality.

**Independent Test**: Walk the soft-delete → Trash → restore → permanent-delete flows on a narrow viewport with `dir="rtl"`; all labels Arabic; delete action exposes the agreed discovery attribute for guided tours.

**Acceptance Scenarios**:

1. **Given** any delete/trash/restore UI on the quizzes page, **When** viewed on mobile, **Then** layout is RTL, typography matches the app’s Arabic shell, and primary actions are touch-friendly.
2. **Given** the soft-delete «حذف» control, **When** inspected for product guidance hooks, **Then** it exposes `data-spekit="quiz-delete-action"` (and related trash/restore/purge hooks as needed for the feature registry).

---

### Edge Cases

- Soft-deleting the last quiz on the active page → Arabic empty state for the active list; Trash count/tab still reachable.
- Soft-deleting while filters/pagination are active → list remains coherent (item removed from current view; no stale card left behind).
- Restoring a quiz that was inactive / free / group-scoped → prior flags are preserved; restore does not force activation.
- Teacher tries to permanently delete a quiz they do not own / not in their Trash → action fails safely with Arabic error; no cross-tenant mutation.
- Soft-deleted quiz opened via an old teacher edit/detail URL → teacher stays on that page with a clear Arabic «في سلة المهملات» banner, can Restore (and optionally Permanent Delete with the same confirmation rules as Trash); students still cannot start a new attempt.
- Student already mid-exam when teacher soft-deletes → current attempt may finish and submit; quiz disappears from catalog for new starts only.
- Soft delete does **not** require a confirmation dialog (only permanent delete does).
- Concurrent soft-delete of the same quiz (double tap) → at most one soft-delete; UI does not show duplicate Trash rows.
- Quiz already soft-deleted → «حذف» is not offered on the active list; only Trash actions apply.
- Permanent delete of a quiz with prior student submissions → still allowed after confirmation; submissions and answers for that quiz are purged with it (not blocked, not retained).
- Trash retention → items stay until Restore or Permanent Delete; no automatic purge after N days.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Teachers MUST be able to soft-delete a quiz they own under the active teacher context so it leaves the active quiz list and enters Trash.
- **FR-002**: Soft-deleted state MUST be persisted with a clear deletion timestamp (or equivalent soft-delete marker) on the quiz record and MUST be scoped so only the owning teacher’s active context can manage that quiz’s trash lifecycle.
- **FR-003**: The teacher quizzes page MUST provide a «حذف» action with a trash-style icon on each active quiz card/row.
- **FR-004**: Soft delete MUST update the visible list promptly after success and MUST show a loading state on the action while the request is in flight.
- **FR-005**: The teacher quizzes page MUST provide a «سلة المهملات» tab/filter that lists only soft-deleted quizzes for the active teacher.
- **FR-006**: Teachers MUST be able to restore a soft-deleted quiz from Trash back to the active list, clearing the soft-delete marker and preserving prior quiz settings (title, flags, group, free/pro, etc.).
- **FR-007**: Teachers MUST be able to permanently delete a quiz only from Trash, and ONLY after confirming an Arabic alert dialog that states the action is irreversible.
- **FR-008**: Permanent delete MUST remove the quiz and its dependent question and attempt/answer/score data (existing student submissions MUST NOT block purge) such that the quiz cannot be restored and no longer appears in active or Trash views; confirmation copy MUST make irreversible loss of that history clear.
- **FR-009**: Soft-deleted quizzes MUST NOT appear in the student-facing available-quiz catalog for new attempts under that teacher. If a student already has an in-progress attempt when the quiz is soft-deleted, that attempt MUST be allowed to finish and submit; soft delete MUST only prevent new starts.
- **FR-010**: All soft-delete, restore, and permanent-delete mutations MUST run only for quizzes owned by the teacher’s currently active teaching context; cross-teacher access MUST be denied.
- **FR-011**: Delete-related UI MUST be Arabic RTL, touch-friendly, and consistent with the existing teacher quizzes shell.
- **FR-012**: Soft-delete «حذف» MUST be marked for in-app product guidance with Spekit id `quiz-delete-action`; related trash/restore/permanent-delete controls SHOULD expose matching guidance targets for the feature registry.
- **FR-013**: Existing exam gatekeeper behavior (no answers/explanations before submit) MUST remain unchanged for any quiz that is still available to students.
- **FR-014**: Soft delete MUST NOT require a confirmation dialog; permanent delete MUST.
- **FR-015**: Opening a soft-deleted quiz via its teacher edit/detail URL MUST keep the teacher on that page, show an Arabic «في سلة المهملات» (or equivalent) banner, and offer Restore; Permanent Delete MAY be offered there under the same confirmation rules as Trash (no silent redirect away from the deep link).
- **FR-017**: Soft delete, restore, and permanent delete MUST operate on one quiz at a time; bulk empty-Trash or multi-select Trash actions are out of scope for this feature.

### Key Entities

- **Quiz (active)**: A teacher-owned quiz visible in the normal quizzes list; eligible for soft delete.
- **Quiz (in Trash)**: Soft-deleted quiz retained for restore or permanent purge; hidden from student catalog and from the active teacher list.
- **Soft-delete marker**: Timestamp (or equivalent) indicating when the quiz entered Trash; cleared on restore.
- **Trash view**: Teacher-only filtered list of soft-deleted quizzes with Restore and Permanent Delete actions.
- **Permanent purge**: Irreversible removal of a trashed quiz and its dependent content after confirmation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In usability checks, teachers can move a quiz to Trash in one tap from the active list and see it gone from that list within 2 seconds of action completion under normal conditions.
- **SC-002**: 100% of soft-deleted quizzes for a teacher are reachable only via سلة المهملات (not mixed into the active list).
- **SC-003**: Teachers can restore a trashed quiz in one action and find it again on the active list without recreating questions.
- **SC-004**: 100% of permanent-delete attempts show an Arabic confirmation step; cancel leaves the quiz in Trash; confirm removes it with no restore path.
- **SC-005**: In multi-teacher checks, a teacher cannot soft-delete, restore, or permanently delete another teacher’s quiz (0 cross-tenant successes).
- **SC-006**: Soft-deleted quizzes do not appear as startable exams for students of that teacher in catalog checks; a student already mid-exam can still complete and submit that attempt after soft delete.
- **SC-008**: Soft-deleted quizzes remain available in Trash across sessions with no automatic disappearance until the teacher restores or permanently deletes them.

## Out of Scope

- Timed auto-empty / scheduled purge of Trash.
- Bulk Trash actions («تفريغ السلة», multi-select restore/permanent delete); TEACH-011 is per-quiz only.
- Changes to exam gatekeeper (QUIZ-001) beyond keeping it intact for available quizzes.

## Assumptions

- Soft delete is reversible via Restore; only Permanent Delete is irreversible and therefore confirmation-gated.
- Soft-delete marker uses a deletion timestamp on the quiz (preferred over a bare boolean) so “when it was trashed” is available for future UX if needed; retention is indefinite (no scheduled auto-purge in TEACH-011).
- Teacher Trash soft-delete is distinct from any admin-level archive behavior already used when closing teacher accounts; both may hide a quiz from normal catalogs, but this feature’s Trash UI is teacher-facing and driven by the teacher soft-delete marker.
- Permanent delete always cascades related questions and attempt/answer/score records for that quiz after confirmation; existing submissions never block purge. Confirmation copy must warn that the action cannot be undone and that related results are lost.
- Soft-deleted quizzes keep their prior metadata (title, flags, group, free/pro, questions) until permanently purged or restored.
- Quiz create, edit, activate/deactivate, free/pro, and bulk import flows from TEACH-003/004 remain available for active (non-trashed) quizzes; this feature extends delete lifecycle only.
- Feature registry (`.speckit/spec.yaml`) and Spekit target maps are updated as part of delivery for TEACH-011; production build verification is part of the implementation gate (not a business outcome).
- In-progress student attempts when a quiz is soft-deleted mid-session: the current attempt may finish and submit; only new catalog starts are blocked. No special mid-exam “resume after restore” UI is required in this feature.
