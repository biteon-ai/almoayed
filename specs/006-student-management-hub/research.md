# Research: Teacher Student Management Hub

**Date**: 2026-07-22  
**Status**: Complete — all Technical Context items resolved

## 1. Pagination strategy (client vs server)

**Decision**: **Client-side** filter + pagination (page size **8**) over the full teacher-scoped list returned by `getTeacherStudents()`.

**Rationale**:
- Current page already loads the entire roster once; filters today are client-side.
- Spec success bar is ≥24 students (SC-001); client slice is trivial and keeps search (name + WhatsApp) simple without PostgREST `or`/`ilike` complexity.
- Constitution **minimal diff**: avoids new range APIs until roster scale demands it.
- Spec allowed either approach; planning picks client for v1.

**Alternatives considered**:
- Server `getPaginatedStudents({ page, pageSize: 8, q, tier, status, groupId })` — better for very large rosters; deferred; can swap later without changing UX contract.
- Hybrid (server filter, client page) — unnecessary complexity for v1.

## 2. Manual student create / link

**Decision**: New Server Action `createStudentManually({ fullName, whatsappNumber })`:

1. `requireTeacher()`; normalize WhatsApp via `normalizeWhatsAppNumber`.
2. Lookup `profiles` by WhatsApp.
3. If missing: insert `profiles` with `role: student`, given name, normalized WhatsApp.
4. If `student_teachers` already exists for `(student_id, teacher_id)` → return Arabic error (no duplicate).
5. Else insert link with `status: active`, `tier: free`, `upgrade_requested: false`.
6. `revalidatePath("/teacher/students")`.

**Rationale**: Matches login/register link patterns; clarification defaults (مجاني + نشط); multi-tenant OK if student already linked elsewhere.

**Alternatives considered**:
- Status `pending` on manual add — rejected (spec default نشط).
- Force WhatsApp to exist first — rejected (teachers onboard offline kids).

## 3. Edit WhatsApp (clarification)

**Decision**: `updateStudentInfo` updates **`profiles.full_name`** only (plus group assign/clear). WhatsApp displayed read-only. Wrong-number fix = unlink + re-add.

**Rationale**: Clarification Q1; avoids rewriting shared login identity across teachers.

## 4. Status transitions (clarification)

**Decision**: UI/actions only set `active` or `deactivated`. Reject attempts to set `pending`. Filter still supports `pending`. Deactivate uses **AlertDialog**; activate does not.

**Rationale**: Clarification Q2 + existing TEACH-001 controls.

**Alternatives considered**: Free-form status select including معلق — rejected by clarification.

## 5. Study group: single assignment UX over multi-membership table

**Decision**: Hub treats **one group per student per teacher**. On assign: remove student from all of **this teacher’s** `teacher_group_members`, then insert selected group (if not «بدون مجموعة»). Clear = delete memberships for this teacher’s groups only.

**Rationale**: Spec badges/filters speak singular “المجموعة”; DB uniquely allows multi-membership historically—normalize in actions for predictable UI.

**Alternatives considered**:
- Keep multi-group badges — conflicts with singular filter/badge UX.
- Add `group_id` column on `student_teachers` — migration churn; join table already exists.

## 6. Dialogs & toasts (UI primitives)

**Decision**:
- **Confirm**: reuse `src/components/ui/alert-dialog.tsx` (same pattern as `LogoutConfirmButton`) for deactivate + unlink.
- **Forms**: add `src/components/ui/dialog.tsx` modeled on AlertDialog (controlled `open` / `onOpenChange`) for Add/Edit — no new npm dependency unless shadcn CLI already used project-wide.
- **Success feedback**: ephemeral in-hub banner / `role="status"` toast state (Arabic), not Sonner — matches existing ad-hoc import toast style and minimal deps.

**Rationale**: Repo has AlertDialog but no Dialog/sonner; constitution prefers matching local patterns.

**Alternatives considered**:
- Custom overlay like `QuestionEditDialog` only — works but duplicates a11y focus trap patterns; prefer shared Dialog.
- Add `sonner` — rejected for minimal diff.

## 7. Pro revoke confirmation (clarification)

**Decision**: `updateStudentTier(linkId, "free")` / existing revoke path — **immediate**, success toast only. Approve Pro likewise no confirm.

**Rationale**: Clarification Q4.

## 8. Component architecture

**Decision**: Refactor `StudentManagement.tsx` into hub orchestrator; extract:

| Component | Role |
|-----------|------|
| `AddStudentDialog` | Create form |
| `EditStudentDialog` | Name + group (WhatsApp read-only) |
| `DeleteStudentConfirmDialog` | Unlink AlertDialog |
| Inline deactivate AlertDialog | Or small `DeactivateStudentConfirmDialog` |
| `StudentGroupSelect` | Extend with «بدون مجموعة» |

Keep Spekit IDs: `studentFilters`, `studentCard`, `studentActivateButton`, `studentDeactivateButton`, `studentManualProUpgrade`, `studentGroupSelect`, `createGroupForm`, page root.

**Optional new Spekit**: `addStudentButton`, `addStudentDialog`, `studentSearch`, `studentPagination` — register in `spekit-targets.ts` + `.speckit/spekit-targets.yaml` if enablement needs them.

**Rationale**: Spec deliverables + ENABLE-001 continuity.

## 9. Unlink semantics

**Decision**: `deleteStudentLink(linkId)` deletes `student_teachers` row where `id = linkId` AND `teacher_id = session.profileId`; also removes student from this teacher’s group memberships. Does **not** delete `profiles`.

**Rationale**: Clarification + Assumptions (unlink only).

## 10. Schema changes

**Decision**: **No migration** for v1.

**Rationale**: Existing tables cover create/link/status/tier/groups.

---

All NEEDS CLARIFICATION from planning are resolved. Ready for data-model + contracts.
