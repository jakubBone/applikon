# Applikon v2 — As-Built Documentation

> Living document. Describes the **actual implemented state** of Applikon v2
> (Screening Companion) as it is built, phase by phase. Source of truth: the code —
> this reflects what exists, not just what was planned.
>
> Plan: [`03-plan.md`](03-plan.md) · Stories: [`02-user-stories.md`](02-user-stories.md)
> · Brief: [`01-brief.md`](01-brief.md). Process: [`../PROCESS.md`](../PROCESS.md).
>
> **Update policy:** after each phase lands (tests green), tick its checklist in
> `03-plan.md` and record here what was actually built and any deviation from the plan.

---

## 1. Phase status

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Backend: "My answers" resource | ✅ Built (2026-06-30) |
| 2 | Frontend: "My answers" page | ✅ Built (2026-06-30) |
| 3 | Cheat sheet modal + per-application company note | ✅ Built (2026-06-30) |
| 4 | Frontend: Board cleanup | ✅ Built (2026-06-30) |
| 5 | UX consolidation (cheat-sheet hub, front-only) | ✅ Built (2026-07-02) |
| 6 | Per-application questions in "About the company" | ✅ Built (2026-07-02) — `V19` per-application screening answers (see §8); `companyResearch` removed in `V20` |

---

## 2. Phase 1 — Backend: "My answers" resource ✅

**Built (2026-06-30).** New per-user screening-answer resource (fixed template +
custom questions), exposed as a JWT-scoped REST resource, with replace-all save.

### Files

| File | What it is |
|------|------------|
| `entity/ScreeningAnswer.java` | Entity: `questionKey` (fixed) / `label` (custom) / `answer` (TEXT, `@Size(max=1000)`) / `custom` / `sortOrder` + `createdAt`/`updatedAt`; `@ManyToOne` user with `@OnDelete(CASCADE)` |
| `repository/ScreeningAnswerRepository.java` | `findByUserIdOrderBySortOrder`, `deleteByUserId` |
| `dto/ScreeningAnswerRequest.java` | Single answer in a save request (no client `sortOrder`) |
| `dto/ScreeningAnswersRequest.java` | Wrapper `{ answers: [...] }`; `@Valid` cascades to each item |
| `dto/ScreeningAnswerResponse.java` | Read model (incl. server-assigned `sortOrder`) |
| `service/ScreeningAnswerService.java` | `findByUser`; `save` = replace-all upsert, drops custom questions with blank label |
| `controller/ScreeningAnswerController.java` | `GET` / `PUT /api/screening-answers`, scoped to `AuthenticatedUser` |
| `db/migration/V17__screening_answers.sql` | Table + FK `user_id → users(id) ON DELETE CASCADE` + index |

### REST API

| Method | Path | Body | Returns |
|--------|------|------|---------|
| `GET` | `/api/screening-answers` | — | `ScreeningAnswerResponse[]` (current user, ordered) |
| `PUT` | `/api/screening-answers` | `{ "answers": ScreeningAnswerRequest[] }` | saved `ScreeningAnswerResponse[]` |

### Behaviour notes

- **Replace-all upsert:** `PUT` deletes the user's existing set and re-inserts the
  incoming one; `sortOrder` is reassigned from position (0-based). Simplest correct
  strategy for debounced autosave at this scale.
- **Custom-with-blank-label dropped** server-side (US-1 edge case).
- **RODO:** answers are included in `UserExportService` / `UserExportResponse`
  (`screeningAnswers[]`) and removed on account deletion in `UserService.deleteAccount`
  (explicit `deleteByUserId`, plus DB-level `ON DELETE CASCADE`).
- **i18n:** `validation.screeningAnswer.answer.tooLong` added (PL + EN).

### Tests

- `service/ScreeningAnswerServiceTest` (3) — replace-all + reindex, blank-label drop, mapping/order.
- `controller/ScreeningAnswerControllerTest` (7) — save→fetch + order, replace-all,
  per-user isolation, 1000-char → 400, blank-label custom dropped, export includes
  answers, account deletion removes them.
- Full backend suite green: **127/127** (`./mvnw test`).

### Deviations from plan

| Planned | Built | Why |
|---------|-------|-----|
| Migration `V16` | **`V17`** | `V16__add_salary_field.sql` already exists; plan updated |
| `ScreeningAnswerRequest` + `ScreeningAnswerResponse` only | Added wrapper `ScreeningAnswersRequest` | Lets `@Valid` cascade to list items → clean 400 on over-long answer (`$.errors['answers[0].answer']`); wire shape is `{ "answers": [...] }` |
| FK `ON DELETE CASCADE` (SQL only) | Also `@OnDelete(CASCADE)` on the entity | Mirrors the constraint in the Hibernate-generated H2 test schema (Flyway is off in tests); keeps cross-test user cleanup working |

### Test-infra note

Switching the authenticated user **mid-test after a `mockMvc.perform`** does not take
effect cleanly with the thread-local `SecurityContextHolder` pattern used across the
suite (not a production concern — each real request carries its own JWT). The isolation
test therefore seeds user A's data via the service and switches user **once** before the
request, mirroring `DataIsolationTest`.

---

## 3. Phase 2 — Frontend: "My answers" page ✅

**Built (2026-06-30).** New `answers` view (tab next to kanban/list/cv) where the user
fills a fixed **4-question global** screening template plus their own custom questions,
with debounced autosave to the Phase 1 resource.

> **Scope change (2026-06-30, agreed with user):** "What do you know about the company"
> was dropped from the global template — it is now a **per-application** field
> (`Application.companyResearch`), edited inline in the Phase 3 cheat sheet. Rationale:
> most prep is the same everywhere (global), but the company answer differs per
> application. Global template is therefore **4 questions**, not 5.

### Files

| File | What it is |
|------|------------|
| `types/domain.ts` | Added `ScreeningAnswer` (read model) + `ScreeningAnswerRequest` (wire shape, no `sortOrder`) |
| `services/api.ts` | `fetchScreeningAnswers` (`GET`), `saveScreeningAnswers` (`PUT`, body `{ answers }`) |
| `hooks/useScreeningAnswers.ts` | `useScreeningAnswers` query + `useSaveScreeningAnswers` mutation exposing `saveDebounced` (800 ms); `onSuccess` writes the saved set back into the cache |
| `components/answers/MyAnswers.tsx` | The view: fixed template merge, add/remove custom, empty state, 1000-char cap + counter, save status |
| `components/answers/MyAnswers.css` | Styling (cards, empty state, primary-gradient buttons — matches `CVManager.css`) |
| `AppContent.tsx` | `answers` added to `View`/`VIEWS`, a `tab-answers` button, render branch; add-application button + FAB hidden on this view |
| i18n `pl`/`en` `common.json` | `nav.answers` + `answers.*` block (strings + the 4 fixed `answers.questions.<key>` labels) |

### Behaviour notes

- **Fixed template keys** (`FIXED_QUESTION_KEYS`): `about-me`, `why-changing`,
  `project`, `expected-salary` (**4 global** questions). Labels via i18n; dynamic key
  cast with `as unknown as ParseKeys` (same pattern as `BadgeWidget`). "What do you
  know about the company" is intentionally absent — per-application, see Phase 3.
- **Local state vs cache:** the component keeps an editable `items` copy initialized
  **once** from the query, so an in-flight save never clobbers what the user is typing.
  Server data merges into the fixed template by `questionKey`; custom answers append.
- **Autosave** fires only from user actions (`applyChange`), never on initial load.
  Adding a blank custom row is sent but dropped server-side (Phase 1 rule).
- **Empty state:** when nothing is filled and the user hasn't started, shows a
  placeholder + **"Fill in your answers"** that reveals the template.
- **1000-char cap:** `maxLength` on the textarea **and** a `slice(0, 1000)` guard
  (covers programmatic/paste paths), with a per-field `length/1000` counter.

### Tests

- `test/hooks/useScreeningAnswers.test.tsx` (2) — query fetch; debounce collapses
  rapid calls into one save (fake timers).
- `test/components/MyAnswers.test.tsx` (5) — empty state → reveal template; renders
  directly when answers exist; typing triggers save; add/remove custom; 1000-char cap + counter.
- Full frontend suite green: **112/112** (`npm run test:run`); `npm run lint` and
  `npm run build` green.

### Deviations from plan

| Planned | Built | Why |
|---------|-------|-----|
| Debounce "on edit" (location unspecified) | `saveDebounced` lives in the hook; component owns local edit state | Keeps the timer with the mutation; component stays declarative. Local-state-once init avoids save/echo clobbering edits |
| — | Dynamic i18n key cast `as unknown as ParseKeys` | Required by the project's typed-i18next setup for `answers.questions.${key}` (mirrors `BadgeWidget`) |

## 4. Phase 3 — Cheat sheet modal + per-application company note ✅

**Built (2026-06-30).** A per-application "Cheat sheet" modal that composes the
proposed salary + an editable per-application company note + the global "My answers".
Adds the per-application `companyResearch` field (the agreed scope change).

> **Superseded in Phase 6:** `companyResearch` was later replaced by per-application
> `screening_answers` rows (`V19`). The V18 column + `PATCH .../company-research` are now
> **dormant**, scheduled for removal in `V20`. This section stays as the Phase 3 record —
> see §8 for the current mechanism.

### Backend

| File | What it is |
|------|------------|
| `entity/Application.java` | New `companyResearch` (`TEXT`, `@Size(max = 1000)`) |
| `db/migration/V18__application_company_research.sql` | `ALTER TABLE applications ADD COLUMN company_research TEXT` |
| `controller/ApplicationController.java` | `PATCH /api/applications/{id}/company-research` + `CompanyResearchRequest` record (≤1000 → 400) |
| `service/ApplicationService.java` | `updateCompanyResearch(id, value, userId)` (JWT-scoped via `findByIdAndUserId`) |
| `dto/ApplicationResponse.java` | Exposes `companyResearch` (read) |
| `dto/UserExportResponse.java` + `service/UserExportService.java` | RODO: `companyResearch` included in the per-application export |
| `i18n/messages*.properties` | `validation.companyResearch.tooLong` (PL + EN) |

- Editing is **inline + autosave** in the modal, hence a focused `PATCH` (mirrors
  `PATCH .../stage`) rather than the full `PUT` — `companyResearch` is intentionally
  **not** part of `ApplicationRequest`.
- Backend suite: **130/130** (`./mvnw test`); +3 tests (save+return, >1000 → 400,
  per-application isolation).

### Frontend

| File | What it is |
|------|------------|
| `types/domain.ts` | `Application.companyResearch: string \| null` |
| `services/api.ts` | `updateCompanyResearch(id, value)` (`PATCH`) |
| `hooks/useApplications.ts` | `useUpdateCompanyResearch` — mutation + `saveDebounced` (800 ms); `onSuccess` patches the app in the list cache |
| `components/applications/CheatSheetModal.tsx` + `.css` | The modal |
| `components/applications/ApplicationDetails.tsx` | "Cheat sheet" button in the details nav + modal mount; passes the already-formatted `salary` |
| i18n `pl`/`en` `common.json` | `cheatSheet.*` block (reuses `answers.*` for saving/empty states) |

- Composes: proposed salary (`—` when none) · editable company note (≤1000 +
  counter, autosave) · global "My answers" read view (only filled questions, in
  template order then custom) with an **edit link** that switches to the `answers`
  view (`useSearchParams`, clears `app`).
- Empty answers → placeholder + "Fill in your answers" link (reuses `answers.*`).
- Closes on the close button, outside click, and **Esc**. Available for **any**
  status (rendered from `ApplicationDetails`, incl. finished).
- Frontend suite: **117/117** (`npm run test:run`); +5 modal tests; `lint` + `build` green.

### Deviations from plan

| Planned | Built | Why |
|---------|-------|-----|
| Edit link "switches to the `answers` view" via threaded prop | Modal uses `useSearchParams` directly | Self-contained — avoids threading a callback `AppContent → ApplicationDetails → modal` |
| Company note edited "in application details" (earlier option) | Edited **inline in the cheat sheet** | The agreed UX: prepare + read in one place during the call |

## 5. Phase 4 — Board cleanup ✅

**Built (2026-06-30).** Front-only. Surfaces applications stuck in `SENT` >60 days and
offers a per-card one-click archive as `REJECTED` / `NO_RESPONSE` (v1 enums).

### Files

| File | What it is |
|------|------------|
| `utils/stale.ts` | `isStale(app)` (`SENT` && `daysSince(appliedAt) > 60`), `STALE_THRESHOLD_DAYS`, `daysSince`, `ARCHIVE_STALE_PAYLOAD` |
| `components/kanban/StaleBanner.tsx` | Top-of-board banner; renders nothing at zero |
| `components/kanban/KanbanBoard.tsx` | Computes `staleCount` from the live props and renders `<StaleBanner>` above the board |
| `components/kanban/ApplicationCard.tsx` | Per-card stale badge + "Archive" button → `onStageChange(id, ARCHIVE_STALE_PAYLOAD)` |
| `components/kanban/KanbanBoard.css` | Banner (amber) + card stale badge/archive styles |
| i18n `pl`/`en` `common.json` | `stale.*` (`banner` with `{{n}}`, `cardBadge`, `archive`) |

### Behaviour notes

- **No new endpoint** — archiving reuses the existing `PATCH .../stage` via the board's
  `onStageChange` (→ `useUpdateStage`, optimistic). The card moves to `FINISHED`.
- **Banner count is derived** from the query data each render, so after an archive the
  app is no longer `SENT` → `isStale` false → count recomputes. **No persistent
  dismissal** (recomputed on every board load), matching US-3.2.
- **Per card, no bulk.** The archive button `stopPropagation`s so it never opens details.
- **Boundary:** exactly 60 days is not stale; strictly `> 60` is (`daysSince > 60`).
- `{{n}}` is used instead of i18next's magic `count` to avoid pulling in plural-form keys.

### Tests

- `test/utils/stale.test.ts` (4) — 60d not stale / >60 stale / 59d not stale (fake clock);
  non-`SENT` never stale.
- `test/components/StaleBanner.test.tsx` (2) — shows count; renders nothing at zero.
- `test/components/ApplicationCardStale.test.tsx` (2) — stale card archives with
  `REJECTED` + `NO_RESPONSE`; fresh `SENT` card shows no archive action.
- Frontend suite: **125/125** (`npm run test:run`); `lint` + `build` green.

---

## 6. v2 status

Phases 1–6 built (frontend **120/120**, lint + build green). Phase 6 landed as the
planned `V19` backend (per-application screening answers) — see §8. The V18
`companyResearch` column was then dropped in `V20`.
Backend is **not compiled in this workspace (no JDK)**; `./mvnw test` is run on a dev
machine. **v2 is not yet released** — no CHANGELOG entry, README still omits v2 features,
app version is still `1.1.0`, no deploy. Release chores are the remaining work.

---

## 7. Phase 5 — UX consolidation (cheat-sheet hub) ✅

**Built (2026-07-02).** Dogfooding *before the first v2 release* showed the prep UI
had drifted into clutter. An earlier intermediate build (card 📋 icons + inline
editing everywhere) was superseded by the agreed **read-only + edit-in-modal** design.
No backend change.

### Decisions (agreed with user)

- **One cheat-sheet hub replaces the old answers tab.** Pick a company at the top,
  then read its prep in two collapsible bars: **🏢 About the company** (accent teal) and
  **💬 General** (accent violet). Kept the "About the company" name; renamed "Global" →
  **"General"**. This tab *is* the recruiter-call fast path — the per-card cheat icon
  was dropped.
- **Everything read-only; editing is a modal with Save** (like the app form), never
  inline. Global answers → `GlobalAnswersModal`; company prep → `CompanyQuestionsModal`
  (§8). Salaries/notes read as `-` when empty.
- **Details screen is an accordion** with icon + colour headers: **📋 Cheat sheet** (open) ·
  **ℹ️ Information** · **📄 Job description** · **📝 Notes**. The **status badge itself is
  now the change-status control** (click "Sent…"), and status + stage collapse into
  one label, e.g. **"In progress (Final interview)"**. Proposed **salary moved out of
  Information** into the cheat-sheet section as a question-style row.
- Short dashes `-` throughout; one shared visual language (`prep.css`).

### Files

| File | What it is |
|------|------------|
| `components/cheatsheet/CheatSheet.tsx` | The cheat-sheet tab: company picker + two collapsible bars (read-only) + edit-modal triggers |
| `components/prep/CollapsibleSection.tsx` | Accordion; takes `icon`, `accent` (colour — also tints the inside Q&A), a header `action` slot, and a `dataCy` hook |
| `components/prep/PrepReadonly.tsx` | `CompanyPrepReadonly` (salary + company Q&A) and `GlobalAnswersReadonly` — shared by the tab and the details accordion |
| `components/prep/GlobalAnswersModal.tsx` | Modal editor for global answers (fixed + custom, Save) |
| `components/prep/globalAnswers.ts` | Shared template logic (`FIXED_QUESTION_KEYS`, `buildItems`, …) extracted from the old page |
| `components/applications/ApplicationDetails.tsx` | Rebuilt as accordions; clickable status badge; combined status+stage label; salary read-only in the cheat-sheet section |
| `utils/salary.ts` | Extracted `formatSalary` (shared by tab + details) |
| i18n `pl`/`en` | `nav.answers` → "Cheat sheet"; new `cheatSheet.*` (sections, edit, salaryQuestion, modal titles); `details.sectionCheat`/`sectionNotes` |
| *removed* | `answers/MyAnswers.*`, `applications/CheatSheetModal.*`, `prep/CompanyNoteField.tsx` + their tests |

### Notes / deviations

- Editing switched from **debounced autosave → explicit Save modals** at the user's
  request (edit → a dialog like the add-application form → confirm).
- **Per-application custom questions in "About the company" moved to Phase 6** — first
  tried front-only, then reworked to the `V19` backend before release — see §8.

---

## 8. Phase 6 — Per-application questions in "About the company" ✅

**Built (2026-07-02).** "About the company" holds a fixed "What do you know about us?"
question **plus the user's own custom questions**, scoped to one application.

An earlier intermediate build stored the whole set as JSON in the existing
`companyResearch` TEXT field (no backend change). Because v2 is **not yet released**, that
interim was superseded — before shipping — by the planned normalized backend (`V19`), so
the persisted model is clean rather than JSON-in-a-text-column.

### Backend (`V19`, additive)
- `db/migration/V19__screening_answers_application_scope.sql` — adds
  `screening_answers.application_id BIGINT` (nullable FK → `applications(id)`
  `ON DELETE CASCADE`) + index `(user_id, application_id)`. A **NULL** `application_id`
  is a global "My answers" row (unchanged); a set value scopes the row to one application.
- `entity/ScreeningAnswer.java` — nullable `@ManyToOne Application application`
  (`@OnDelete(CASCADE)`).
- `repository/ScreeningAnswerRepository.java` — scoped finders/deletes
  (`…ApplicationIdIsNull…` for global, `…ApplicationId…` for per-app). The existing
  "all rows" `findByUserIdOrderBySortOrder` / `deleteByUserId` are **kept** — the GDPR
  export and account deletion intentionally cover both scopes.
- `service/ScreeningAnswerService.java` — global find/save now filter
  `application_id IS NULL`, so per-app rows never leak into the global set and saving one
  scope never wipes the other. New `findByUserAndApplication` / `saveForApplication` each
  verify the application belongs to the user (`existsByIdAndUserId`) before touching rows.
- `controller/ApplicationScreeningAnswerController.java` — `GET`/`PUT
  /api/applications/{id}/screening-answers`; the global `/api/screening-answers` endpoints
  are unchanged.
- Tests: `ScreeningAnswerServiceTest` updated for the scoped calls + two new cases
  (per-app scope is set on save; a foreign application is rejected).

### `companyResearch` (V18) — removed in `V20`
`V19` shipped and was verified green (backend tests + runtime save), then a **second
commit** (`V20`) dropped `applications.company_research` and everything hanging off it:
the entity field, the `ApplicationResponse` / `UserExportResponse` fields,
`updateCompanyResearch` + `PATCH .../company-research`, the
`validation.companyResearch.tooLong` i18n keys, and the `ApplicationControllerTest` cases.
Splitting the destructive drop from the feature kept each step independently verifiable.

### Frontend
- Rewired off the JSON-in-`companyResearch` approach onto the per-application endpoint:
  new `useApplicationScreeningAnswers` / `useSaveApplicationScreeningAnswers` hooks +
  `fetchApplicationScreeningAnswers` / `saveApplicationScreeningAnswers` api calls.
- `prep/CompanyQuestionsModal.tsx` and `prep/PrepReadonly.tsx` read/write per-application
  screening answers (fixed `company-knowledge` key + custom questions); the modal seeds
  its editor only once the set has loaded, so custom questions are never lost. The editor
  stays **visually identical to the global answers modal** (fixed question + add/remove
  custom, Save). `prep/companyQuestions.ts` (the JSON shim) was **deleted**;
  `FIXED_COMPANY_KEY` moved to `prep/globalAnswers.ts`.

### Verification
- Frontend **120/120** (`npm run test:run`); `lint` + `build` green; `tsc` unchanged
  (13 baseline, none in touched files).
- Backend **not compiled in this workspace (no JDK)** — `./mvnw test` runs on a dev
  machine.

### Also in this pass (cheat-sheet polish, agreed with user)
- Section edit reads **"Add/Edit"**; ⋮ delete gets **🗑️**.
- "Your salary" is read-only; general questions dropped "expected salary" (it lives in
  "About the company" now); the company question is **"What do you know about us?"**.
- Details status: **"In progress" always opens the stage picker** (so the stage can be
  changed even when already in progress); the status dialog is a **centered modal on
  desktop, bottom-sheet on mobile**.
- Readability: Q&A and Information rows as rounded cards; bigger sub-headers; custom
  question titles render black/bold; "Add question" is a filled button; each section's
  Q&A cards are tinted with the section accent (teal / violet).
- **E2E:** `cypress/e2e/cheat-sheet.cy.ts` — a stubbed happy path (pick company → read
  prep → add a company question), written language-independent via `data-cy` hooks.

