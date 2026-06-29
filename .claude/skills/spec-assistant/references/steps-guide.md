# Spec-assistant — Przewodnik po krokach

## Spis treści

1. [Krok 1: Rozmowa o pomyśle](#krok-1-rozmowa-o-pomyśle)
2. [Krok 2: Specyfikacja użytkowa](#krok-2-specyfikacja-użytkowa)
3. [Krok 3: User stories](#krok-3-user-stories)
4. [Krok 4: Architektura](#krok-4-architektura)
5. [Krok 5: PRD](#krok-5-prd)
6. [Krok 6: SPEC.md](#krok-6-specmd)
7. [Krok 7: Podział na taski](#krok-7-podział-na-taski)

---

## Krok 1: Rozmowa o pomyśle

**Cel:** Zrozumieć pomysł, przeanalizować go, stworzyć personę idealnego użytkownika.

**Proces:**
1. Poprosić użytkownika o opisanie pomysłu na aplikację
2. Zadawać pytania pogłębiające — plusy, minusy, czy to ma sens
3. Stworzyć personę idealnego użytkownika (imię, wiek, rola, frustracje, potrzeby)
4. Wcielić się w personę i ocenić pomysł z jej perspektywy
5. Zapisać wnioski — co zaskoczyło, co wymaga doprecyzowania

**Pytania do zadania użytkownikowi:**
- Dla kogo jest ta aplikacja?
- Jaki problem rozwiązuje?
- Dlaczego istniejące rozwiązania nie wystarczają?
- Kto jest Twoim idealnym użytkownikiem?

**Persona — struktura:**
- Kim jest (imię, wiek, rola zawodowa)
- Czym się zajmuje na co dzień
- Jakie ma frustracje związane z obecnymi narzędziami
- Czego szuka w idealnym rozwiązaniu
- Jak opisałaby swoje marzenie ("chcę X, ale z Y")

**Artefakt kroku:** Plik `01-idea.md` z opisem pomysłu, personą i wnioskami z analizy.

---

## Krok 2: Specyfikacja użytkowa

**Cel:** Spisać CO aplikacja ma robić z perspektywy użytkownika. Bez technologii — tylko funkcje.

**Zasada:** CO, nie JAK. Żadnych frameworków, języków, baz danych — to przyjdzie w kroku 4.

**Proces:**
1. Poprosić użytkownika o wylistowanie wszystkich funkcji
2. Iterować — dyskutować co zadziała, co nie, co pominięto
3. Wrócić do persony z kroku 1 — "czy to byłoby wygodne dla [persona]?"
4. Spisać zamkniętą listę funkcjonalności

**Dobry przykład:** "Organizator tworzy wydarzenie z datą, opisem, limitem miejsc i ceną biletu."
**Zły przykład:** "Frontend w Next.js z App Router, baza Postgres na Supabase..."

**Pytania do zadania:**
- Jakie są główne funkcje aplikacji?
- Co użytkownik robi po zalogowaniu?
- Jakie dane wprowadza i jakie wyniki dostaje?
- Czy są różne role użytkowników?
- Jakie powiadomienia/komunikaty dostaje użytkownik?

**Artefakt kroku:** Plik `02-functional-spec.md` z listą funkcjonalności podzielonych na moduły.

---

## Krok 3: User stories

**Cel:** Odkryć nieznane problemy, edge case'y i decyzje projektowe poprzez rozbudowane scenariusze.

**Dlaczego to najważniejszy krok:**
- Planujemy w pośpiechu i wiele rzeczy zakładamy jako "oczywiste"
- User stories wyciągają te założenia na światło dzienne
- Każda story to decyzja projektowa — jeśli jej nie podejmiesz, model zdecyduje za Ciebie

**Proces:**
1. Załadować specyfikację użytkową z kroku 2
2. Wygenerować 10-15 rozbudowanych user stories
3. Dla każdej story zadać pytania: "Jak system ma się zachować w tej sytuacji?"
4. **KLUCZOWE: Użytkownik sam pisze odpowiedzi** — nie model!
5. Zapisać odpowiedzi — to złoto projektowe
6. Opcjonalnie: kolejne rundy stories dla konkretnych modułów, ról, edge case'ów

**Kategorie stories do pokrycia:**
- Happy path — standardowe użycie
- Edge case'y — nietypowe dane, concurrent access, limity
- Błędy — co gdy coś nie zadziała
- Bezpieczeństwo / prywatność — RODO, usuwanie danych
- Role — admin, user, guest — różne perspektywy
- Skala — co gdy 100x więcej użytkowników

**Kluczowa zasada:** Model generuje pytania. Użytkownik SAMODZIELNIE pisze odpowiedzi. Nie pozwolić modelowi odpowiadać za użytkownika — to on jest architektem.

**User story vs User flow:**
- User flow = mapa ścieżki (film od A do Z)
- User story = pojedyncza potrzeba ("Jako [kto] chcę [co], żeby [po co]")
- W PRD: 3-5 kluczowych flows, do każdego user stories + acceptance criteria

**Artefakt kroku:** Plik `03-user-stories.md` z stories, pytaniami i odpowiedziami użytkownika.

---

## Krok 4: Architektura

**Cel:** Wybrać technologie, określić skalę, podjąć kluczowe decyzje techniczne.

**Proces:**
1. Określić skalę projektu:
   - Solo/MVP — tylko dla mnie, pomiń dużo rzeczy
   - Mały zespół — kilka osób, auth, basic security
   - Produkt — wielu użytkowników, bezpieczeństwo, skalowalność
2. Przedyskutować decyzje technologiczne z modelem
3. Dokumentować każdą decyzję z uzasadnieniem "dlaczego"

**Pytania do podjęcia:**
- Dlaczego właśnie taka architektura?
- Dlaczego ten język / framework?
- Czy można to uprościć?
- Co się stanie, jak projekt urośnie 10x?
- Jakie są alternatywy?

**Anty-pattern: Over-engineering.** Model proponuje full stack, microservices, Kubernetes... Dla małych projektów: "Jak to uprościć dla solo use?"

**Tip:** Po wyborze technologii poprosić o prosty prototyp (1 endpoint + 1 ekran), żeby sprawdzić, czy stack pasuje.

**Artefakt kroku:** Plik `04-architecture.md` z decyzjami technologicznymi i uzasadnieniami.

---

## Krok 5: PRD

**Cel:** Stworzyć zamknięty dokument wymagań produktu — "co ma powstać". Zamknięty = nie ma miejsca na domysły.

**7 elementów PRD:**

### 5.1 Opis produktu
Jedno zdanie: co to jest i dla kogo. Musi być konkretne — nie "platforma do wydarzeń", ale pełne zdanie z kontekstem.

### 5.2 Scope — MVP / In scope / Out of scope
- **MVP** — robimy na pewno
- **In scope** — w planie, ale nie MVP
- **Out of scope** — NIE robimy (min. 5 pozycji!)

WAŻNE: Jeśli nie powiesz modelowi czego NIE robić — model to ZROBI.

### 5.3 User flows
3-5 głównych ścieżek od A do Z, z wariantami błędów i edge case'ów.

### 5.4 User stories + acceptance criteria
Każda story w formacie: "Jako [kto] chcę [co], żeby [po co]" z konkretnymi acceptance criteria.

### 5.5 Definition of Done
Kiedy CAŁY produkt (nie story) jest gotowy? Bez DoD model będzie "ulepszał" w nieskończoność.

### 5.6 Non-functional requirements
Wymagania niefunkcjonalne: platforma, performance, bezpieczeństwo, dostępność, RODO.

### 5.7 Otwarte pytania / założenia
Wszystkie niepodjęte decyzje — spisane wprost. Bez tej sekcji AI samo podejmie te decyzje.

**Checklist walidacyjny PRD — zobacz references/checklists.md**

**Artefakt kroku:** Plik `05-prd.md` oparty na szablonie z `references/prd-template.md`.

---

## Krok 6: SPEC.md

**Cel:** Stworzyć specyfikację techniczną — "jak pracujemy". PRD = kontrakt na produkt. SPEC = regulamin pracy.

**6 filarów SPEC.md:**

### 6.1 Commands
Jak uruchomić, zbudować, testować. Konkretne komendy + wymagane wersje. Bez tego model zgaduje (npm vs pnpm, jest vs vitest).

### 6.2 Testing
Strategia testów: framework, lokalizacja, zasady mockowania, kiedy pisać testy, CI.

### 6.3 Project Structure
Mapa katalogów + reguły importów. Które foldery mogą importować z których.

### 6.4 Code Style
Prefer/Avoid listy. Konkretne zasady formatowania, nazewnictwa, patternów.

### 6.5 Git Workflow
Branche, format commitów (Conventional Commits), PR checklist.

### 6.6 Boundaries — najważniejszy filar
Trzy poziomy:
- **Always** — rób zawsze, bez pytania (min. 5 reguł)
- **Ask First** — zatrzymaj się i zapytaj (min. 5 reguł)
- **Never** — twarde zakazy (min. 5 reguł)

**Checklist walidacyjny SPEC — zobacz references/checklists.md**

**Artefakt kroku:** Plik `06-spec.md` oparty na szablonie z `references/spec-template.md`.

---

## Krok 7: Podział na taski

**Cel:** Podzielić PRD na małe, niezależne zadania i kontrolować realizację.

**Cechy dobrego taska:**
- **Mały** — jeden prompt, jeden cel
- **Testowalny** — wiadomo po czym poznać, że działa
- **Niezależny** — w miarę możliwości nie zależy od innych
- **Jednoznaczny** — model nie musi zgadywać

**Proces realizacji:**
1. Model wykonuje task
2. Ty sprawdzasz — czy działa? Czy zgodne ze SPEC?
3. Korygujesz — drobne poprawki
4. Akceptujesz — przechodzisz do następnego

**Anty-pattern:** Zlecenie 10 tasków naraz, review na końcu. Efekt: model buduje na złych fundamentach.

**Kiedy wracać do planu:**
- Nowy edge case odkryty w trakcie budowania
- Technologia nie sprawdza się w praktyce
- Scope się zmienił

**Kontekst modelu przy każdym tasku:**
- Zawsze: SPEC.md, opis aktualnego taska, co już zrobione
- W razie potrzeby: PRD, kod powiązanych modułów, wyniki testów

**Wariant iteracyjny (dla dużych projektów / milestone'ów):**

Zamiast szczegółowej listy tasków na starcie — zaplanuj ogólną kolejność implementacji w fazach. Użytkownik sam buduje szczegółowe taski iteracyjnie, faza po fazie, bo w trakcie implementacji mogą wyjść zmiany wymagające korekty planu.

Proces:
1. Razem z użytkownikiem ustal fazy implementacji (5-8 faz, logiczna kolejność)
2. Upewnij się, że kolejność faz umożliwia testowanie — np. panel admina przed multi-kursami, bo bez admina nie da się testować zarządzania kursami
3. Zapisz fazy w `07-tasks.md` ze statusami
4. Użytkownik wraca po szczegółowe taski per faza w kolejnych sesjach

**Kiedy użyć wariantu iteracyjnego:**
- Projekt jest duży (wiele faz, wiele zmian)
- To milestone/rozszerzenie istniejącego projektu, nie greenfield
- Użytkownik chce zachować elastyczność i korygować plan w trakcie

**Artefakt kroku:** Plik `07-tasks.md` z listą tasków/faz, statusami i notatkami z review.
