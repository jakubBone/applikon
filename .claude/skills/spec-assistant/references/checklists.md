# Checklisty walidacyjne PAF

## Checklist PRD — czy jest "zamknięty"

- [ ] Czy **opis produktu** (1 zdanie) jasno mówi co to jest i dla kogo?
- [ ] Czy **out of scope** ma co najmniej 5 pozycji?
- [ ] Czy każdy **user flow** ma opisane warianty błędów?
- [ ] Czy każda **user story** ma acceptance criteria?
- [ ] Czy istnieje **Definition of Done**?
- [ ] Czy **NFR** pokrywają platformę, performance i bezpieczeństwo?
- [ ] Czy wszystkie **niepodjęte decyzje** są w sekcji "Otwarte pytania"?

Jeśli na którekolwiek pytanie odpowiedź brzmi "nie" — model będzie zgadywał.

## Checklist SPEC.md — czy jest "zamknięty"

- [ ] Czy **Commands** mają dokładne komendy + wersje?
- [ ] Czy **Testing** mówi kiedy, jak i gdzie pisać testy?
- [ ] Czy **Structure** ma mapę katalogów + reguły importów?
- [ ] Czy **Code Style** ma min. 5-10 konkretnych zasad?
- [ ] Czy **Git Workflow** opisuje commity, branche i PR?
- [ ] Czy **Boundaries** mają min. 5/5/5 w trzech poziomach?

Jeśli na którekolwiek pytanie odpowiedź brzmi "nie" — model sam wymyśli odpowiedź.

## Checklist User Stories — czy wystarczająco pokryte

- [ ] Czy pokryto **happy path** dla głównych funkcji?
- [ ] Czy są stories dla **edge case'ów** (concurrent access, limity, dziwne dane)?
- [ ] Czy są stories dla **błędów** (co gdy coś nie zadziała)?
- [ ] Czy są stories dla **bezpieczeństwa/prywatności** (RODO, usuwanie danych)?
- [ ] Czy pokryto **różne role** (admin, user, guest)?
- [ ] Czy użytkownik **sam napisał odpowiedzi** na pytania (a nie model)?

## Checklist Task — czy dobrze podzielony

- [ ] Czy task jest **mały** (jeden prompt, jeden cel)?
- [ ] Czy jest **testowalny** (wiadomo po czym poznać sukces)?
- [ ] Czy jest **niezależny** (nie zależy od niedokończonych tasków)?
- [ ] Czy jest **jednoznaczny** (model nie musi zgadywać)?
