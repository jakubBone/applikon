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
| 3 | Frontend: Cheat sheet modal | ⏳ Pending |
| 4 | Frontend: Board cleanup | ⏳ Pending |

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

## 4. Phases 3–4 — Frontend

⏳ Not started. To be filled in as each phase lands.
