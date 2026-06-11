const CONTACT_EMAIL = 'applikon1990@gmail.com'
// Date the current policy version took effect — update manually when the policy changes
const EFFECTIVE_DATE = '2026-05-11'

export const privacyPolicyPl = `
# Polityka prywatności Applikon

**Obowiązuje od: ${EFFECTIVE_DATE}**

## 1. Kim jestem?

Administratorem Twoich danych osobowych w aplikacji **Applikon** jest Jakub Bone, twórca projektu, dostępny pod adresem **${CONTACT_EMAIL}**.

Applikon jest darmowym projektem portfolio prezentującym moje umiejętności programistyczne. Nie prowadzę działalności zarobkowej w oparciu o tę aplikację ani nie sprzedaję danych.

## 2. Jakie dane zbieram?

Zbieram minimalny zakres danych niezbędnych do działania aplikacji:

**Dane konta (z Twojego profilu Google):**
- Adres email
- Imię i nazwisko (wyświetlane w Twoim profilu Google)
- Identyfikator Google (techniczne ID, nie widoczne nigdzie publicznie)

**Dane generowane przez Ciebie w aplikacji:**
- Dodane przez Ciebie aplikacje o pracę (firma, stanowisko, link do oferty, stawka, status, notatki itd.)
- Linki do Twoich CV hostowanych na zewnętrznych serwisach (np. Google Drive)
- Notatki dołączone do aplikacji

**Czego NIE zbieram:**
- **Plików CV** -od wersji 07 aplikacja nie przyjmuje uploadu plików. Możesz jedynie wkleić link do CV hostowanego na własnym koncie (Google Drive, Dropbox itp.). Treść Twojego CV nigdy nie trafia na mój serwer.
- Danych o lokalizacji, zachowaniu, reklamowych cookies, trackerów.

## 3. Po co mi te dane?

- **Adres email i identyfikator Google** -do zalogowania Cię i rozpoznania przy kolejnych wizytach
- **Imię** -żeby wyświetlić powitanie i spersonalizować interfejs
- **Dane o Twoich aplikacjach o pracę** -bo to jest główna funkcja aplikacji: tracker procesu rekrutacyjnego

**Podstawa prawna:** art. 6 ust. 1 lit. b RODO -wykonanie umowy (świadczenie usługi na Twoją prośbę, po zaakceptowaniu niniejszej polityki).

## 4. Jak długo przechowuję Twoje dane?

- **Dopóki korzystasz z konta** -dopóki się logujesz i dodajesz dane
- **Maksymalnie 12 miesięcy od ostatniej aktywności** -konta nieaktywne dłużej niż rok są automatycznie usuwane (wraz ze wszystkimi Twoimi danymi)
- **Natychmiast po usunięciu konta** -jeśli sam usuniesz konto w ustawieniach, wszystkie Twoje dane znikają z bazy i z dysku w ciągu kilku sekund

## 5. Komu przekazuję Twoje dane?

**Nikomu.** Dane są przechowywane wyłącznie w infrastrukturze aplikacji. Nie sprzedaję, nie udostępniam ani nie przekazuję danych osobom trzecim w celach marketingowych ani żadnych innych.

Logowanie obsługuje Google (OAuth 2.0) -przy pierwszym logowaniu Google przekazuje mi Twój email i imię. Poza tym nie ma innych integracji z zewnętrznymi serwisami.

## 6. Jakie masz prawa?

Zgodnie z RODO masz prawo do:

- **Dostępu do danych** -możesz zobaczyć co o Tobie przechowuję (przez UI aplikacji lub na prośbę mailową)
- **Sprostowania** -jeśli któreś dane są nieprawidłowe (imię, email -aktualizuj je w profilu Google)
- **Usunięcia** ("prawo do bycia zapomnianym") -jednym kliknięciem w ustawieniach aplikacji
- **Ograniczenia przetwarzania** -możesz poprosić, żebym przestał wykorzystywać Twoje dane
- **Wniesienia sprzeciwu** -możesz sprzeciwić się przetwarzaniu
- **Przenoszenia danych** -na prośbę mailową mogę wyeksportować Twoje dane w formacie JSON
- **Cofnięcia zgody** -możesz cofnąć zgodę w każdej chwili (skutkuje usunięciem konta)
- **Wniesienia skargi do organu nadzorczego** -Prezes Urzędu Ochrony Danych Osobowych (UODO), ul. Stawki 2, 00-193 Warszawa

## 7. Ciasteczka (cookies)

Aplikacja używa **wyłącznie cookies technicznych** niezbędnych do działania:

- \`refresh_token\` (httpOnly, secure) -utrzymuje Twoją sesję między wizytami

**Nie używam** żadnych cookies marketingowych, analitycznych, reklamowych ani trackerów zewnętrznych.

## 8. Bezpieczeństwo

- Komunikacja między Twoją przeglądarką a serwerem odbywa się przez HTTPS
- Hasła nie są przechowywane -logujesz się przez Google (OAuth 2.0)
- Tokeny sesyjne są trzymane w cookies httpOnly (niedostępne dla JavaScriptu)
- Baza danych jest zabezpieczona przed dostępem z zewnątrz

**Ważne:** ta aplikacja to projekt portfolio, nie produkt komercyjny. Nie mogę zagwarantować poziomu zabezpieczeń na poziomie banku.

## 9. Zmiany polityki

Jeśli zaktualizuję niniejszą politykę, opublikuję nową wersję na tej samej stronie. Znacząca zmiana skutkuje wyświetleniem nowego ekranu akceptacji przy następnym logowaniu.

## 10. Kontakt

W sprawach związanych z danymi osobowymi pisz na: **${CONTACT_EMAIL}**
`

export const privacyPolicyEn = `
# Applikon Privacy Policy

**Effective date: ${EFFECTIVE_DATE}**

## 1. Who am I?

The data controller for your personal data in the **Applikon** application is Jakub Bone, the project creator, reachable at **${CONTACT_EMAIL}**.

Applikon is a free portfolio project showcasing my programming skills. I do not run a commercial business based on this application, nor do I sell any data.

## 2. What data do I collect?

I collect the minimum data necessary for the application to work:

**Account data (from your Google profile):**
- Email address
- Name (as displayed in your Google profile)
- Google identifier (technical ID, not visible publicly)

**Data you generate in the application:**
- Job applications you add (company, position, link, salary, status, notes, etc.)
- Links to your CVs hosted on external services (e.g. Google Drive)
- Notes attached to applications

**What I do NOT collect:**
- **CV files** -since version 07, the application does not accept file uploads. You can only paste a link to a CV hosted on your own account (Google Drive, Dropbox, etc.). The contents of your CV never reach my server.
- Location data, behavioral tracking, advertising cookies.

## 3. Why do I need this data?

- **Email and Google ID** -to log you in and recognize you on subsequent visits
- **Name** -to display a greeting and personalize the interface
- **Job application data** -because that is the main function of the app: a recruitment process tracker

**Legal basis:** GDPR Article 6(1)(b) -performance of a contract (providing the service at your request, after you accept this policy).

## 4. How long do I keep your data?

- **As long as you use your account** -while you log in and add data
- **Maximum 12 months from last activity** -accounts inactive for over a year are automatically deleted (together with all your data)
- **Immediately after account deletion** -if you delete your account in settings, all your data is removed from the database and disk within seconds

## 5. Who do I share your data with?

**Nobody.** Data is stored only within the application infrastructure. I do not sell, share, or transfer data to third parties for marketing or any other purposes.

Authentication is handled by Google (OAuth 2.0) -on first login, Google provides me with your email and name. There are no other integrations with external services.

## 6. Your rights

Under GDPR you have the right to:

- **Access your data** -see what I store about you (via the application UI or upon email request)
- **Rectification** -correct inaccurate data (name, email -update in your Google profile)
- **Erasure** ("right to be forgotten") -one click in application settings
- **Restrict processing** -ask me to stop using your data
- **Object to processing**
- **Data portability** -upon email request, I can export your data in JSON format
- **Withdraw consent** -at any time (this results in account deletion)
- **Lodge a complaint with a supervisory authority** -the Polish Data Protection Authority (UODO), ul. Stawki 2, 00-193 Warsaw, Poland

## 7. Cookies

The application uses **only technical cookies** necessary for operation:

- \`refresh_token\` (httpOnly, secure) -maintains your session between visits

**I do not use** any marketing, analytics, advertising cookies, or external trackers.

## 8. Security

- Communication between your browser and the server uses HTTPS
- No passwords are stored -you log in via Google (OAuth 2.0)
- Session tokens are kept in httpOnly cookies (inaccessible to JavaScript)
- The database is protected from external access

**Important:** this is a portfolio project, not a commercial product. I cannot guarantee bank-level security.

## 9. Policy changes

If I update this policy, I will publish a new version on the same page. A significant change will trigger a new acceptance screen on your next login.

## 10. Contact

For matters related to personal data, write to: **${CONTACT_EMAIL}**
`
