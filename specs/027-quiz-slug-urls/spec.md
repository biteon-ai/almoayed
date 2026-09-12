# Feature Specification: Friendly Teacher Quiz URLs

**Feature ID**: TEACH-017  
**Feature Branch**: `027-quiz-slug-urls`  
**Created**: 2026-09-12  
**Status**: Draft  

**Input**: User description: "Change teacher quiz URLs from raw database IDs like /teacher/quizzes/[id] to friendly URLs containing the quiz name/slug, such as /teacher/quizzes/arabic-quiz-abc123xyz or a name-plus-unique-fragment combination. Persist a readable identifier, resolve quizzes by that identifier instead of the raw ID, and update in-app links to the new address."

**Related**: Extends TEACH-003 (quiz create/edit), TEACH-011 (trash still reachable by the same quiz address), and teacher import/setup flows that land on a durable quiz URL after create (`?setup=import`, `?imported=…`, `#quiz-questions`). Does not change student exam taking addresses.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Open a quiz from a readable address (Priority: P1)

As a teacher, I open one of my quizzes from an address that includes a readable form of the quiz name (plus a short unique fragment), not a long opaque identifier. The quiz editor/detail screen I already use still loads with the same content, settings, and questions.

**Why this priority**: Readable addresses are the core user-facing change; without them the feature has no value.

**Independent Test**: Create or pick an owned quiz with a known title → from «اختباراتي» tap the quiz → the address bar shows a name-based path (not a raw long ID) → the same quiz editor loads.

**Acceptance Scenarios**:

1. **Given** a logged-in teacher with at least one owned quiz that has a title, **When** they open that quiz from the quizzes list, **Then** the address contains a human-readable slug derived from the quiz name and a short unique fragment, and the correct quiz editor/detail view loads.
2. **Given** that quiz is owned by the active teacher, **When** they refresh the friendly address, **Then** the same quiz still loads (the address is durable, not a one-time redirect away from the quiz).
3. **Given** query extras used today after create or import (for example a setup/import hint or an imported-count notice) or an in-page jump to the questions section, **When** the teacher is sent to the quiz after those flows, **Then** those extras still work on the friendly address.
4. **Given** Teacher A’s quiz friendly address, **When** Teacher B (or another active teacher context) opens it while logged in as themselves, **Then** they do not see Teacher A’s quiz (active-teacher scoping is unchanged).

---

### User Story 2 — Every teacher quiz link uses the friendly address (Priority: P1)

As a teacher, every in-product way I open a quiz (list rows, create-and-continue, import return, trash restore/edit, dashboard shortcuts) takes me to the friendly address—not a leftover raw-ID address.

**Why this priority**: Mixed old and new addresses confuse bookmarks and make the change look incomplete.

**Independent Test**: After creating a quiz, follow the post-create path; also open the same quiz from the list and from any other teacher control that currently deep-links to a quiz. All land on the friendly path.

**Acceptance Scenarios**:

1. **Given** a teacher finishes creating a quiz, **When** they are taken to the new quiz, **Then** the destination uses the friendly address (including any setup/import hint that exists today).
2. **Given** the quizzes list (active and Trash, per TEACH-011), **When** the teacher opens a quiz for editing, **Then** the link uses that quiz’s friendly address.
3. **Given** any other teacher screen that currently points at a specific quiz (import “back to quiz”, questions dashboard, toasts that deep-link, etc.), **When** the teacher follows that link, **Then** it uses the friendly address of the same quiz.
4. **Given** reserved teacher paths that are not a quiz (especially the create-quiz path «اختبار جديد»), **When** the teacher opens them, **Then** they still mean create/list—not a quiz whose name collided with those words.

---

### User Story 3 — Old raw-ID bookmarks still open the quiz (Priority: P2)

As a teacher who already bookmarked or shared a raw-ID quiz address, I still reach the same quiz. The product then shows the friendly address so I can copy the new form going forward.

**Why this priority**: Existing teacher bookmarks and open tabs must not become dead ends; this is compatibility, not the primary daily path.

**Independent Test**: Open a previously valid raw-ID teacher quiz address for a quiz the active teacher owns → the same quiz editor appears → the address shown afterward is the friendly form (or clearly equivalent so the teacher can copy it).

**Acceptance Scenarios**:

1. **Given** a previously valid raw-ID teacher quiz address for a quiz owned by the active teacher, **When** they open it, **Then** they reach that quiz’s editor/detail (not a not-found dead end).
2. **Given** that successful open, **When** the teacher looks at the address they can copy, **Then** it is the friendly form for that quiz (so they are not encouraged to keep circulating the raw ID).
3. **Given** a raw-ID or friendly address that does not match any quiz owned by the active teacher, **When** they open it, **Then** they see a clear not-found/unauthorized outcome—not another teacher’s quiz.

---

### User Story 4 — Duplicate and Arabic titles still get unique, readable addresses (Priority: P2)

As a teacher who names many quizzes similarly (or uses Arabic titles), I still get a distinct, readable address per quiz. Two quizzes with the same title never share one address.

**Why this priority**: Duplicate titles are common in a real class bank; Arabic is the default naming language.

**Independent Test**: Create two quizzes with the same Arabic title → each has a distinct address that still reflects the title → opening each address loads the matching quiz.

**Acceptance Scenarios**:

1. **Given** two quizzes owned by the same teacher with identical titles, **When** both exist, **Then** each has a distinct friendly address and opening either loads only that quiz.
2. **Given** a quiz whose title is Arabic (or mixed Arabic/Latin), **When** the teacher opens it from the list, **Then** the address still contains a recognizable form of that title (not only a random token with the name stripped out).
3. **Given** the teacher later changes the quiz title, **When** they use an already-copied friendly address, **Then** that address still opens the same quiz (title edits do not break existing teacher links).
4. **Given** existing quizzes created before this feature, **When** a teacher opens them from the list, **Then** each has a friendly address without the teacher performing a manual rename.

---

### Edge Cases

- Create-quiz reserved path (`/teacher/quizzes/new`) must never be interpreted as a quiz slug named `new`.
- Soft-deleted quizzes (TEACH-011) remain openable by their friendly address, with the existing Trash banner and restore behavior—no silent redirect away from the quiz.
- Permanently deleted quizzes: old friendly and raw-ID addresses become not-found.
- Empty or punctuation-only titles: the address still unique-identifies the quiz (unique fragment is enough if nothing readable remains).
- Very long titles: the readable portion of the address is truncated to a practical length; uniqueness is preserved via the unique fragment.
- Two teachers independently using the same title: each still only sees their own quiz; guessing the other’s address does not leak data.
- Student exam addresses (`/quiz/…` with a raw ID) are unchanged by this feature.
- Copy-paste of a friendly address with extra spaces or trailing slashes should still resolve when it is otherwise the same quiz address.
- Query extras (`setup`, `imported`, in-page questions jump) must survive the compatibility hop from a raw-ID bookmark to the friendly address.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each teacher quiz MUST have a stable, unique **friendly URL key** used in the teacher quiz address instead of exposing the raw internal identifier as the primary path.
- **FR-002**: The friendly URL key MUST include a readable slug derived from the quiz title plus a short unique fragment so duplicate titles never collide (pattern in the spirit of `arabic-quiz-abc123xyz`).
- **FR-003**: Arabic and mixed Arabic/Latin titles MUST produce a recognizable readable portion (Arabic letters are allowed in the address). The product MUST NOT require the teacher to invent a Latin slug.
- **FR-004**: The teacher quiz list, create-and-continue, import-return, Trash/edit, and any other in-product teacher deep link to a specific quiz MUST use the friendly address.
- **FR-005**: Opening a quiz by its friendly URL key MUST load that quiz for the active teacher only (multi-tenant isolation unchanged).
- **FR-006**: A previously valid raw-ID teacher quiz address for an owned quiz MUST still open that quiz and then present the friendly address as the canonical address to copy.
- **FR-007**: Changing a quiz title MUST NOT invalidate an already issued friendly URL key.
- **FR-008**: Quizzes that already exist when the feature ships MUST receive a friendly URL key automatically; teachers MUST NOT need a bulk manual step.
- **FR-009**: Reserved teacher quiz paths that are not a specific quiz (at minimum the create-quiz path) MUST remain those screens and MUST NOT be claimed as a quiz slug.
- **FR-010**: Soft-deleted quizzes MUST remain reachable by friendly URL with existing Trash UX; permanently deleted quizzes MUST not resolve.
- **FR-011**: Student exam taking, WhatsApp student share, and other student-facing quiz addresses MUST stay on their current identifier scheme.
- **FR-012**: Quiz exam gatekeeper rules (no answers/explanations before submit) MUST remain unchanged.
- **FR-013**: Query extras and in-page jumps used on teacher quiz screens today MUST keep working on friendly addresses, including after a raw-ID compatibility hop.

### Key Entities

- **Quiz**: Teacher-owned assessment already identified internally; additionally has a **friendly URL key** used in teacher addresses.
- **Friendly URL key**: Durable public-facing path segment for one quiz: readable title slug + short unique fragment; unique among that teacher’s quizzes; stable after title edits.
- **Canonical teacher quiz address**: `/teacher/quizzes/{friendly-url-key}` plus any existing query extras or in-page jumps.
- **Legacy teacher quiz address**: `/teacher/quizzes/{raw-internal-id}` still accepted as a compatibility entry that leads to the same quiz.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a timed walkthrough, a teacher creates a named quiz and lands on its editor with a recognizable name-based address in under 1 minute, without copying or typing a raw internal ID.
- **SC-002**: 100% of in-product teacher controls that open a specific quiz (list, post-create, import return, Trash/edit, related shortcuts) use the friendly address—not the raw-ID form—as the href the teacher can copy.
- **SC-003**: 100% of a sample of at least 10 existing quizzes (including Arabic titles and at least two that share a title) open from the list on distinct friendly addresses, each loading the matching quiz.
- **SC-004**: 100% of previously valid raw-ID teacher quiz bookmarks in a sample of at least 5 owned quizzes still open the same quiz and then show the friendly address.
- **SC-005**: Cross-teacher isolation holds: 0 cases in QA where Teacher B can view Teacher A’s quiz by opening A’s friendly or raw-ID teacher address while acting as B.
- **SC-006**: At least 9 of 10 teachers in an internal review can name which quiz an address refers to from the path alone when the title is distinctive (binary yes/no), vs. 0 of 10 for raw-ID paths.

## Assumptions

- Scope is **teacher quiz management addresses only** (`/teacher/quizzes/…`). Student taking (`/quiz/…`), results, WhatsApp student share, and admin tools keep current identifiers.
- The unique fragment is short and opaque enough to distinguish duplicates; it is not the full raw internal ID as the entire path (a combined name+fragment is the intended shape).
- Friendly URL keys are generated for all existing quizzes at ship time (backfill), not only for newly created ones.
- Title changes do not rewrite the friendly URL key (stability over “always matching latest title”).
- Uniqueness is required at least per teacher; lookup is always scoped to the active teacher.
- Reserved non-quiz segments under the teacher quizzes area (create, and any other non-id screens that already exist) stay reserved.
- Teachers do not get a separate “edit slug” control in this feature; the key is system-generated.
- Feature ID TEACH-017 is reserved in the product registry when implementation updates `.speckit/spec.yaml`.
- Exact storage vs. on-the-fly generation is a planning decision as long as FR-001–FR-008 hold (stable, unique, backfilled, readable).
