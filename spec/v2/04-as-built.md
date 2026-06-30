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
| 2 | Frontend: "My answers" page | ⏳ Pending |
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

## 3. Phases 2–4 — Frontend

⏳ Not started. To be filled in as each phase lands.
