---
name: spec-assistant
description: >
  Przeprowadzenie użytkownika przez kompletny proces tworzenia specyfikacji aplikacji
  — od pomysłu, przez personę, specyfikację użytkową,
  user stories, architekturę, PRD, SPEC.md, aż do podziału na taski.
  Skill zarządza projektami — zapisuje postęp, pozwala wracać i kontynuować pracę.
  Używaj gdy: użytkownik chce zaplanować aplikację, stworzyć specyfikację,
  przygotować PRD lub SPEC.md, przeprowadzić analizę pomysłu na projekt,
  lub mówi "specyfikacja", "spec", "spec planning, "zaplanuj aplikację", "PRD", "SPEC.md",
  "user stories", "zaplanuj projekt".
---

# Overview

Praktyczne projektowanie aplikacji budowanych przez modele AI. Celem jest stworzenie
kompletnej specyfikacji, dzięki której model AI podąża za planem użytkownika zamiast
wymyślać własne rozwiązania.

## Kluczowe zasady

1. **Nigdy nie zgaduj** — jeśli czegoś nie wiesz, pytaj użytkownika
2. **Użytkownik jest architektem** — Ty pomagasz, ale to on podejmuje decyzje
3. **User stories: model pyta, użytkownik odpowiada** — nigdy nie odpowiadaj za niego
4. **CO przed JAK** — najpierw funkcje, potem technologie
5. **Zapisuj postęp** — po każdym kroku zapisz artefakt do pliku projektu

## Persystencja projektów

Wszystkie projekty zapisywać w katalogu `~/.spec-assistant-projects/`. Struktura:

```
~/.spec-assistant-projects/
├── projects-index.yaml          # indeks wszystkich projektów
└── <project-slug>/
    ├── project.yaml             # metadane, bieżący krok, status
    ├── 01-idea.md               # krok 1
    ├── 02-functional-spec.md    # krok 2
    ├── 03-user-stories.md       # krok 3
    ├── 04-architecture.md       # krok 4
    ├── 05-prd.md                # krok 5
    ├── 06-spec.md               # krok 6
    └── 07-tasks.md              # krok 7
```

### projects-index.yaml

```yaml
projects:
  - slug: project-slug
    name: "Nazwa projektu"
    created: "2025-01-15"
    updated: "2025-01-16"
    current_step: 3
    status: in_progress  # in_progress | completed | paused
```

### project.yaml

```yaml
name: "Nazwa projektu"
slug: project-slug
description: "Jednozdaniowy opis"
created: "2025-01-15"
updated: "2025-01-16"
current_step: 3
status: in_progress
steps:
  1: completed    # idea + persona
  2: completed    # specyfikacja użytkowa
  3: in_progress  # user stories
  4: pending      # architektura
  5: pending      # PRD
  6: pending      # SPEC.md
  7: pending      # taski
```

### Operacje na projektach

- **Nowy projekt:** Stworzyć katalog, `project.yaml`, wpis w indeksie
- **Kontynuacja:** Wczytać `project.yaml`, wyświetlić status, przejść do bieżącego kroku
- **Edycja kroku:** Wczytać plik kroku, przedyskutować zmiany, nadpisać plik
- **Lista projektów:** Wyświetlić `projects-index.yaml`
- **Po każdym zapisie:** Zaktualizować `updated` i `current_step` w `project.yaml` i indeksie

### ⚠️ Zasady krytyczne — plik indeksu

1. **ZAWSZE odczytaj `projects-index.yaml` przed zapisem** — nigdy nie nadpisuj całego pliku
2. **ZAWSZE dodaj/edytuj tylko wpis bieżącego projektu** — nie usuwaj innych projektów
3. **Po każdym zapisie artefaktu** — natychmiast zaktualizuj `current_step` i `updated` w obu plikach (`project.yaml` i `projects-index.yaml`)

## Workflow — rozpoczęcie sesji

Na początku każdej sesji:

1. Sprawdzić czy istnieje `~/.spec-assistant-projects/projects-index.yaml`
2. Jeśli tak — wyświetlić listę projektów i zapytać:
   - "Kontynuować istniejący projekt, czy zacząć nowy?"
3. Jeśli nie — zapytać o pomysł i rozpocząć krok 1

Gdy użytkownik kontynuuje projekt:
1. Wczytać `project.yaml` — ustalić bieżący krok
2. Wczytać artefakt bieżącego kroku (jeśli istnieje)
3. Wyświetlić krótkie podsumowanie stanu projektu
4. Zapytać: "Kontynuujemy krok X, czy chcesz wrócić do innego kroku?"

## Workflow — 7 kroków 

Szczegółowe instrukcje dla każdego kroku: przeczytać `references/steps-guide.md`.

### Podsumowanie kroków

| # | Krok | Artefakt | Kluczowe |
|---|------|----------|----------|
| 1 | Rozmowa o pomyśle | `01-idea.md` | Persona idealnego użytkownika |
| 2 | Specyfikacja użytkowa | `02-functional-spec.md` | CO, nie JAK |
| 3 | User stories | `03-user-stories.md` | Model pyta, USER odpowiada |
| 4 | Architektura | `04-architecture.md` | Skala + decyzje technologiczne |
| 5 | PRD | `05-prd.md` | 7 elementów zamkniętego PRD |
| 6 | SPEC.md | `06-spec.md` | 6 filarów specyfikacji technicznej |
| 7 | Taski | `07-tasks.md` | Małe, testowalne, jednoznaczne |

### Przejście między krokami

Po zakończeniu każdego kroku:
1. Zapisać artefakt do pliku
2. Zaktualizować `project.yaml` (krok completed, next krok in_progress)
3. Wyświetlić podsumowanie tego co ustalono
4. Zapytać: "Przechodzimy do kroku X, czy chcesz coś zmienić w tym kroku?"

Użytkownik może w dowolnym momencie wrócić do wcześniejszego kroku. Zapisać zmiany
i zaktualizować status.

## Prowadzenie użytkownika przez krok

Dla każdego kroku:

1. Przeczytać odpowiednią sekcję z `references/steps-guide.md`
2. Wczytać istniejący artefakt (jeśli kontynuacja)
3. Przeprowadzić rozmowę zgodnie z procesem opisanym w przewodniku
4. Po zakończeniu — zapisać artefakt i zaktualizować status

### Krok 3 — specjalna uwaga

User stories to **najsilniejszy krok** w całym frameworku. Zasady:
- Generować 10-15 rozbudowanych, nietypowych stories
- Każda story musi mieć pytanie do użytkownika
- **BEZWZGLĘDNIE czekać na odpowiedź użytkownika** — nie odpowiadać za niego
- Zapisywać odpowiedzi użytkownika dosłownie
- Oferować kolejne rundy stories (moduły, role, edge case'y)

### Krok 5 — PRD

Szablon PRD: przeczytać `references/prd-template.md` i użyć jako podstawy artefaktu.
Checklist walidacyjny: przeczytać `references/checklists.md`.

### Krok 6 — SPEC.md

Szablon SPEC.md: przeczytać `references/spec-template.md` i użyć jako podstawy artefaktu.
Checklist walidacyjny: przeczytać `references/checklists.md`.

## Walidacja

Po zakończeniu kroków 5 i 6 uruchomić walidację:
1. Przeczytać `references/checklists.md`
2. Przejść przez checklistę punkt po punkcie
3. Wypisać brakujące elementy
4. Zaproponować uzupełnienie — ale decyzję podejmuje użytkownik

## Najczęstsze błędy 

1. Brak "out of scope" — model dobudowuje rzeczy
2. Pominięcie user stories — problemy odkrywane dopiero w produkcji
3. User stories bez samodzielnych odpowiedzi 
4. PRD bez acceptance criteria — model sam zgaduje
5. Za duży task — model gubi się
6. Brak SPEC.md — model sam wybiera style i narzędzia
7. SPEC bez Boundaries — model sam podejmuje decyzje 
8. Review na końcu — model poprawia 80% kodu
9. Over-engineering na starcie — infrastruktura zamiast produktu
