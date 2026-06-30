# Applikon v2 — Implementation Plan

> Phases with a testable Definition of Done. Sources: [`01-brief.md`](01-brief.md),
> [`02-user-stories.md`](02-user-stories.md). Grounded in the v1 code
> (`spec/v1/architecture.md`). v2 runs on the v1 monolith — no new infrastructure.

**Key reuse / grounding (from the v1 code):**
- Applications already carry `status` and `appliedAt` (`@CreatedDate`); the
  frontend already loads all of them (`useApplications`) → **board cleanup is
  front-only** (stale computed client-side).
- Archiving reuses the existing `PATCH /api/applications/{id}/stage`
  (`updateApplicationStage` in `hooks/useApplications.ts`) with
  `{status: 'REJECTED', rejectionReason: 'NO_RESPONSE'}` — `EndModal.tsx` already
  uses this exact path, so no new endpoint.
- The only new backend is **"My answers"** (a new per-user resource).
- Patterns to follow: view tabs in `AppContent.tsx` (kanban/list/cv); banner
  styling from `components/notices/ServiceBanner.tsx`; user-scoped queries like
  `ApplicationRepository.findByUserId`; Flyway migration numbering continues at
  **V17** (V16 is taken by `add_salary_field`); i18n via the `common` namespace (PL/EN).

---

## Phase 1 — Backend: "My answers" resource

New per-user screening answers (fixed template + custom questions).

**Build**
- `entity/ScreeningAnswer.java` — `id`, `user` (`@ManyToOne`), `questionKey`
  (nullable; stable key for fixed questions), `label` (nullable; used for custom),
  `answer` (TEXT, `@Size(max = 1000)`), `custom` (boolean), `sortOrder` (int),
  audit timestamps.
- `repository/ScreeningAnswerRepository.java` — `findByUserIdOrderBySortOrder`,
  `deleteByUserId`.
- `dto/ScreeningAnswerRequest.java` / `ScreeningAnswerResponse.java` (records).
- `service/ScreeningAnswerService.java` — `findByUser`, `save` (replace-all upsert
  for the user's set; simplest for autosave at this scale).
- `controller/ScreeningAnswerController.java` — `/api/screening-answers`:
  `GET` (list, current user) · `PUT` (save full set).
- `db/migration/V17__screening_answers.sql` — table `screening_answers`, FK
  `user_id → users(id) ON DELETE CASCADE`.
- RODO consistency: include screening answers in `UserExportService` and ensure
  they are removed in `UserService.deleteAccount` (cascade covers it; verify).

**Tests (JUnit + H2)**
- save then fetch returns the set for the user; ordering preserved.
- multi-user isolation: user A never sees user B's answers.
- answer > 1000 chars → 400.
- account deletion / export include screening answers.

**DoD**
- `GET`/`PUT /api/screening-answers` work, scoped to the JWT user.
- `./mvnw test` green.

**Checklist**
- [x] Entity `ScreeningAnswer` + `ScreeningAnswerRepository`
- [x] DTOs + `ScreeningAnswerService` (replace-all upsert; custom with blank label dropped)
- [x] Controller `GET`/`PUT /api/screening-answers` (JWT-scoped)
- [x] Migration `V17__screening_answers.sql` (FK `ON DELETE CASCADE`)
- [x] RODO: export + account deletion include screening answers
- [x] i18n validation message (PL/EN)
- [x] Tests green (`./mvnw test`)

---

## Phase 2 — Frontend: "My answers" page

Covers US-1.1 / 1.2 / 1.3.

**Build**
- `types/domain.ts` — `ScreeningAnswer` + request shape.
- `services/api.ts` — `fetchScreeningAnswers`, `saveScreeningAnswers`.
- `hooks/useScreeningAnswers.ts` — React Query query + mutation; **debounced
  autosave** on edit.
- New view **`answers`** in `AppContent.tsx` (a new view tab next to
  kanban/list/cv) → `components/answers/MyAnswers.tsx`.
- Fixed template (5 questions, labels via i18n keys): about-me · why-changing ·
  company-knowledge · project · expected-salary. Each is a
  plain-text field, **max 1000 chars** with a counter. *"company-knowledge" is
  per-company — its field is a prep reminder in v2.*
- Add / remove **custom** questions (label + answer); fixed ones not removable.
- **Empty state**: placeholder + **"Fill in your answers"** action.
- i18n: PL/EN strings + the 5 fixed labels (`common` namespace).

**Tests (vitest)**
- renders fixed template; typing triggers debounced save.
- add/remove custom question; empty custom label not saved.
- 1000-char cap + counter.

**DoD**
- User can fill, edit (autosave), and add/remove custom questions; reload shows
  saved content. `npm run test:run` + `npm run lint` green.

**Checklist**
- [ ] `types/domain.ts` + `services/api.ts` (`fetchScreeningAnswers`, `saveScreeningAnswers`)
- [ ] `hooks/useScreeningAnswers.ts` (query + mutation, debounced autosave)
- [ ] `answers` view in `AppContent.tsx` + `components/answers/MyAnswers.tsx`
- [ ] Fixed template (5 questions) + add/remove custom questions
- [ ] Empty state + 1000-char cap with counter
- [ ] i18n PL/EN (strings + 5 fixed labels)
- [ ] Tests + lint green

---

## Phase 3 — Frontend: Cheat sheet modal

Covers US-2.1. Depends on Phase 1/2 (reads "My answers").

**Build**
- `components/applications/CheatSheetModal.tsx` — opened by a **"Cheat sheet"**
  button in the `ApplicationDetails` header.
- Composes (no AI, no new data):
  1. **proposed salary for this application** — from the loaded application
     (`salary` / `salaryMin`–`salaryMax` + `currency` + `salaryType`); when none
     present → **"—"**.
  2. **"My answers"** (read view) via `useScreeningAnswers`, with an **edit link**
     that switches to the `answers` view.
- Empty "My answers" → placeholder + **"Fill in your answers"** link.
- Modal closes on button / outside click / Esc. Available for **any** status
  (works in `ApplicationDetails`, incl. finished).
- i18n PL/EN.

**Tests (vitest)**
- composes salary + answers; missing salary shows "—"; empty answers shows the
  placeholder + link; opens/closes.

**DoD**
- One click opens the cheat sheet for any application with proposed salary + "My
  answers" on one screen. Tests + lint green.

**Checklist**
- [ ] `components/applications/CheatSheetModal.tsx` + "Cheat sheet" button in `ApplicationDetails`
- [ ] Composes proposed salary (`—` when none) + "My answers" read view with edit link
- [ ] Empty answers → placeholder + "Fill in your answers" link
- [ ] Closes on button / outside click / Esc; available for any status
- [ ] i18n PL/EN
- [ ] Tests + lint green

---

## Phase 4 — Frontend: Board cleanup

Covers US-3.1 / 3.2. Front-only.

**Build**
- `utils/stale.ts` — `isStale(app)` = `status === 'SENT' && daysSince(appliedAt)
  > 60`.
- Stale **banner** at the top of the board (follow `ServiceBanner.tsx` styling)
  shown on load when ≥1 stale app, stating the count.
- On `ApplicationCard.tsx`: a stale indicator + **one-click archive** action →
  `updateApplicationStage({ status: 'REJECTED', rejectionReason: 'NO_RESPONSE' })`
  (reused hook). **Per card** — no bulk.
- After archiving, the card moves to `FINISHED` and the banner count recomputes
  (derived from query data; no persistent dismissal).
- i18n PL/EN.

**Tests (vitest)**
- `isStale` boundary: 60 days = not stale, > 60 = stale; non-`SENT` never stale.
- banner shows correct count and hides at zero.
- archive action calls `updateStage` with `REJECTED` + `NO_RESPONSE`.

**DoD**
- Stale apps (>60 days in `SENT`) get a banner + one-click archive that moves them
  to `FINISHED` as `NO_RESPONSE`. Tests + lint green.

**Checklist**
- [ ] `utils/stale.ts` — `isStale(app)` (`SENT` && >60 days)
- [ ] Stale banner on board load (count; hides at zero)
- [ ] Per-card stale indicator + one-click archive (`REJECTED` + `NO_RESPONSE`)
- [ ] Banner count recomputes after archive (no persistent dismissal)
- [ ] i18n PL/EN
- [ ] Tests + lint green

---

## Cross-cutting Definition of Done (whole version)

- [ ] All success criteria in `01-brief.md` §5 met.
- [ ] All new UI strings exist in PL **and** EN.
- [ ] Backend `./mvnw test` and frontend `npm run test:run` + `npm run build` green
  (matches CI).
- [ ] No new dependency, module split, or infrastructure introduced.
- [ ] One optional Cypress E2E happy path: fill "My answers" → open an application's
  cheat sheet → see them composed with the proposed salary.

---

## Suggested commit sequence (Conventional Commits)

1. `feat(backend): add screening answers resource (entity, repo, service, API, V17)`
2. `feat(frontend): add "My answers" screening template page`
3. `feat(frontend): add per-application cheat sheet modal`
4. `feat(frontend): add board cleanup for stale applications`
