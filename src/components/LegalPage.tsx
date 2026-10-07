import { appConfig } from '../config'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '../i18n'
import { hasAnalyticsConsent, setAnalyticsConsent } from '../services/analyticsPreferences'
import { BrandLockup } from './BrandLockup'
import { LanguageToggle } from './LanguageToggle'

type Section = { heading: string; body: string }

const copy = {
  en: {
    privacy: {
      title: 'Privacy',
      intro: 'A simple account of how Anyone’s Guide handles information during the closed beta. Last updated 4 October 2026.',
      sections: [
        { heading: 'Who runs this?', body: 'Anyone’s Guide is an independent beta project. You can reach its operator through the Feedback page. ' },
        { heading: 'What we use', body: 'If you create guides, Supabase Auth handles your email or Google sign-in; we store your display name, public handle, guide cities, places and notes. Feedback submissions contain your message, page path and, if signed in, your account ID. An Unlisted or Public guide shows the author name, city and recommendations to anyone with its link. Public guides can also appear in Explore; Draft guides are visible only to their creator.' },
        { heading: 'Your device and location', body: 'Saved Guides, language choice and pending guide edits are kept in this browser. Pending edits are removed after saving to your account; Saved Guides are shortcuts, not offline copies. Authentication uses browser storage to keep you signed in. We ask for location only when you tap Locate. It is used in your browser for the map and distances; displaying nearby map tiles can reveal the map area to the tile provider. We do not store your precise location in our guide database.' },
        { heading: 'Requests and unfinished guides', body: 'New request links use a random invitation ID. We store the optional requester name, city and language; signed-in invitations are associated with the requester’s account and keep the approved public name from when the invitation was made. Anyone with the link can read its name and city. Older links can still contain these details directly. Stored invitations remain available until removed; account-linked invitations are removed with the account. An invited person can build a private draft in browser storage before signing in. When they choose to sign in, a private copy is stored in Supabase so the sign-in link can restore it in another browser. This copy requires a random recovery key, expires after seven days, and is cleared after the guide is saved to an account. Expired copies are removed during cleanup. A small claim receipt remains with your account to prevent duplicate saves; it is removed if the account is deleted. A finished response starts as Unlisted and is sent by its author; we do not automatically send it to the person asking.' },
        { heading: 'Screenshots and pasted recommendations', body: 'If you choose import, we send the screenshot or pasted text and guide city to Google Gemini to extract visible place names and source text. Geoapify then receives the names or addresses you search to match venues. We do not store the original image or message in our database or application logs. The extraction request uses stateless processing; Google handles submitted data under its API terms. Pending extracted places, matches and edited notes stay in this browser with a seven-day expiry, or until you finish or discard the review. Expired reviews are removed when you next open the app. You confirm what to save, and only those selected places and your notes enter the guide. Crop or remove private information before submitting.' },
        { heading: 'Usage analytics', body: 'If you allow it below, we record basic actions such as opening a guide or map, saving a guide and sharing. Events can include a random identifier for the current browser session, a guide ID, event details and a time. They are used to understand and improve the beta, not for advertising. Analytics is off until you choose to allow it, and you can switch it off here at any time. Switching off stops future events; ask us to remove earlier records where we can identify them.' },
        { heading: 'Providers and other links', body: 'Netlify hosts the site; Supabase provides sign-in and stores guides, feedback and optional analytics. Geoapify provides place search and map tiles where configured, with OpenStreetMap tiles as a fallback. Choosing Google sign-in or opening Google Maps takes you to Google. Those providers can receive technical request information, such as an IP address, under their own terms. We do not sell guide or analytics data. Short-lived request counters help limit repeated writes; they are removed during maintenance.' },
        { heading: 'Why, how long and your choices', body: 'Guides and account details remain while your account is active; feedback and analytics are reviewed during the beta and removed when no longer needed. You can remove a Saved Guide in this browser, change guide visibility, or contact us to request access, correction or deletion of account and feedback data. Depending on where you live, other privacy rights may apply. UK users can also complain to the Information Commissioner’s Office.' },
      ] as Section[],
      choice: 'Help improve the beta with optional usage analytics',
      enabled: 'Analytics on. Turn off',
      disabled: 'Analytics off. Turn on',
      saveError: 'This browser could not save your choice. Analytics remains off.',
      contact: 'Contact us about privacy',
    },
    terms: {
      title: 'Beta terms',
      intro: 'A few ground rules for using Anyone’s Guide during its closed beta. Last updated 30 September 2026.',
      sections: [
        { heading: 'What the beta does', body: 'Anyone’s Guide lets invited people create personal city guides and share them by link. Features may change, pause or have bugs while we test them. Reading a shared guide and building an invited draft do not require an account. Saving and sharing your guide require sign-in.' },
        { heading: 'Your guides', body: 'Only add recommendations, names and notes you have the right to share. Do not post private information about other people, unlawful material, spam or misleading content. You keep your rights in what you write and allow us to store and display it as needed to run the guide service. An Unlisted guide can be opened by anyone with its link; Public guides may also appear in Explore. You control visibility from your editor.' },
        { heading: 'Recommendations', body: 'Guides are personal opinions from their authors. Places, opening hours and access can change. Check important details yourself before travelling or spending money. External map, sign-in and search services have their own terms.' },
        { heading: 'Accounts, reports and changes', body: 'Keep your sign-in access secure. Use Feedback to report a problem, request help with your account or ask us to remove content. We may remove content or suspend access if needed to protect people or the beta. We may update these terms and will show a new date here when we do. Nothing here limits rights you have under applicable consumer law.' },
      ] as Section[],
      contact: 'Ask a question or report a problem',
    },
  },
  pl: {
    privacy: {
      title: 'Prywatność',
      intro: 'Proste wyjaśnienie, jak Anyone’s Guide przetwarza dane podczas zamkniętej bety. Ostatnia aktualizacja: 4 października 2026 r.',
      sections: [
        { heading: 'Kto prowadzi serwis?', body: 'Anyone’s Guide to niezależny projekt w fazie beta. Z operatorem możesz skontaktować się przez stronę Uwagi. ' },
        { heading: 'Jakie dane wykorzystujemy?', body: 'Jeśli tworzysz przewodniki, Supabase Auth obsługuje logowanie e-mailem lub przez Google. Przechowujemy nazwę wyświetlaną, publiczny identyfikator, miasta, miejsca i opisy w przewodnikach. Zgłoszenia zawierają treść, adres strony oraz identyfikator konta, jeśli jesteś zalogowany(-a). Przewodnik Niepubliczny lub Publiczny pokazuje autora, miasto i rekomendacje każdemu, kto ma link. Przewodniki Publiczne mogą pojawiać się w Odkrywaj; Szkice widzi tylko autor.' },
        { heading: 'Twoje urządzenie i lokalizacja', body: 'Zapisane przewodniki, wybór języka i oczekujące zmiany zostają w tej przeglądarce. Oczekujące zmiany usuwamy po zapisaniu na koncie. Zapisane przewodniki są skrótami, nie kopiami do czytania bez internetu. Dane logowania są przechowywane w przeglądarce, aby utrzymać sesję. O lokalizację prosimy tylko po naciśnięciu przycisku lokalizacji. Jest używana w przeglądarce do mapy i odległości; pobieranie pobliskich kafelków może ujawnić dostawcy mapy oglądany obszar. Nie zapisujemy dokładnej lokalizacji w bazie przewodników.' },
        { heading: 'Prośby i niedokończone przewodniki', body: 'Nowe linki z prośbą używają losowego identyfikatora zaproszenia. Zapisujemy opcjonalne imię, miasto i język. Zaproszenia zalogowanych osób są powiązane z ich kontem i zachowują zatwierdzoną publiczną nazwę z chwili utworzenia. Każda osoba z linkiem może przeczytać imię i miasto. Starsze linki nadal mogą zawierać te dane bezpośrednio. Zapisane zaproszenia są dostępne do chwili usunięcia; zaproszenia powiązane z kontem usuwamy wraz z kontem. Zaproszona osoba może stworzyć prywatny szkic w pamięci przeglądarki przed logowaniem. Po wybraniu logowania zapisujemy prywatną kopię w Supabase, aby link logowania mógł przywrócić szkic w innej przeglądarce. Kopia wymaga losowego klucza, wygasa po siedmiu dniach i jest usuwana po zapisaniu przewodnika na koncie. Wygasłe kopie usuwamy podczas porządkowania danych. Na koncie pozostaje krótki zapis ukończenia, który zapobiega tworzeniu duplikatów; usuwamy go wraz z kontem. Gotowa odpowiedź jest początkowo Niepubliczna i wysyła ją autor; nie wysyłamy jej automatycznie do osoby proszącej.' },
        { heading: 'Zrzuty ekranu i wklejone rekomendacje', body: 'Gdy wybierzesz import, wysyłamy zrzut lub wklejony tekst oraz miasto do Google Gemini, żeby odczytać nazwy miejsc i fragmenty materiału. Geoapify otrzymuje nazwy lub adresy wyszukiwane przy dopasowywaniu miejsc. Nie zapisujemy oryginalnego obrazu ani wiadomości w bazie lub dziennikach aplikacji. Żądanie nie tworzy zapisanej rozmowy; Google przetwarza dane zgodnie z warunkami swojego API. Odczytane miejsca, dopasowania i edytowane notatki zostają w przeglądarce z terminem ważności siedmiu dni lub do ukończenia albo odrzucenia wyboru. Wygasłe dane usuwamy przy kolejnym otwarciu aplikacji. Ty potwierdzasz, co zapisać. Tylko wybrane miejsca i Twoje notatki trafiają do przewodnika. Przed wysłaniem wytnij lub usuń prywatne informacje.' },
        { heading: 'Statystyki korzystania', body: 'Jeśli wyrazisz zgodę poniżej, zapisujemy podstawowe działania, np. otwarcie przewodnika lub mapy, zapisanie i udostępnienie. Zdarzenie może zawierać losowy identyfikator bieżącej sesji, identyfikator przewodnika, szczegóły i czas. Używamy ich do ulepszania bety, nie do reklam. Statystyki są wyłączone do chwili Twojej zgody; możesz ją wycofać tutaj. Wyłączenie zatrzymuje przyszłe zdarzenia. Możesz poprosić o usunięcie wcześniejszych danych, jeśli uda się je zidentyfikować.' },
        { heading: 'Dostawcy i inne strony', body: 'Netlify udostępnia stronę; Supabase obsługuje logowanie i przechowuje przewodniki, zgłoszenia oraz opcjonalne statystyki. Geoapify dostarcza wyszukiwarkę miejsc i kafelki mapy, jeśli jest skonfigurowany; zapasowo używamy kafelków OpenStreetMap. Logowanie przez Google lub otwarcie Google Maps przenosi do Google. Dostawcy mogą otrzymać techniczne dane żądania, np. adres IP, zgodnie ze swoimi zasadami. Nie sprzedajemy danych przewodników ani statystyk. Krótkotrwałe liczniki ograniczają powtarzające się zapisy; usuwamy je podczas porządkowania danych.' },
        { heading: 'Cel, czas i Twoje prawa', body: 'Dane konta i przewodników przechowujemy, gdy konto jest aktywne; zgłoszenia i statystyki przeglądamy podczas bety i usuwamy, gdy nie są już potrzebne. Możesz usunąć zapisany przewodnik z przeglądarki, zmienić widoczność przewodnika lub poprosić o dostęp, poprawienie bądź usunięcie danych konta i zgłoszeń. W zależności od miejsca zamieszkania mogą przysługiwać Ci także inne prawa. Osoby w Wielkiej Brytanii mogą złożyć skargę do Information Commissioner’s Office.' },
      ] as Section[],
      choice: 'Pomóż ulepszyć betę dzięki opcjonalnym statystykom',
      enabled: 'Statystyki włączone. Wyłącz',
      disabled: 'Statystyki wyłączone. Włącz',
      saveError: 'Nie udało się zapisać wyboru w tej przeglądarce. Statystyki pozostają wyłączone.',
      contact: 'Kontakt w sprawie prywatności',
    },
    terms: {
      title: 'Zasady bety',
      intro: 'Kilka zasad korzystania z Anyone’s Guide podczas zamkniętej bety. Ostatnia aktualizacja: 30 września 2026 r.',
      sections: [
        { heading: 'Czym jest beta?', body: 'Anyone’s Guide pozwala zaproszonym osobom tworzyć osobiste przewodniki po miastach i udostępniać je linkiem. Podczas testów funkcje mogą się zmieniać, działać z przerwami lub zawierać błędy. Czytanie przewodnika i tworzenie szkicu po zaproszeniu nie wymaga konta. Zapisanie i udostępnienie własnego przewodnika wymaga logowania.' },
        { heading: 'Twoje przewodniki', body: 'Dodawaj tylko rekomendacje, nazwy i opisy, które możesz udostępniać. Nie publikuj cudzych danych prywatnych, treści niezgodnych z prawem, spamu ani treści wprowadzających w błąd. Zachowujesz prawa do napisanych treści i pozwalasz nam przechowywać je oraz wyświetlać w zakresie potrzebnym do działania usługi. Przewodnik Niepubliczny może otworzyć każda osoba z linkiem; Publiczny może też pojawić się w Przeglądaj. Widoczność ustawiasz w edytorze.' },
        { heading: 'Rekomendacje', body: 'Przewodniki zawierają osobiste opinie autorów. Miejsca, godziny otwarcia i dostępność mogą się zmieniać. Przed podróżą lub wydatkiem sprawdź ważne informacje samodzielnie. Zewnętrzne usługi map, logowania i wyszukiwania mają własne zasady.' },
        { heading: 'Konta, zgłoszenia i zmiany', body: 'Dbaj o bezpieczeństwo dostępu do konta. Przez stronę Uwagi możesz zgłosić problem, poprosić o pomoc z kontem lub usunięcie treści. Możemy usunąć treści albo zawiesić dostęp, gdy jest to potrzebne dla bezpieczeństwa osób lub bety. Możemy zmienić te zasady i podamy tutaj nową datę. Te zasady nie ograniczają praw przysługujących Ci na mocy obowiązujących przepisów konsumenckich.' },
      ] as Section[],
      contact: 'Zadaj pytanie lub zgłoś problem',
    },
  },
}

export function LegalPage({ kind, onNavigate }: { kind: 'privacy' | 'terms'; onNavigate: (path: string) => void }) {
  const { locale, t } = useI18n()
  const [allowed, setAllowed] = useState(hasAnalyticsConsent)
  const [choiceError, setChoiceError] = useState(false)
  const content = copy[locale][kind]

  const toggleAnalytics = () => {
    const success = setAnalyticsConsent(!allowed)
    setAllowed(hasAnalyticsConsent())
    setChoiceError(!success)
  }

  return <main className="legal-shell">
    <header className="simple-page-header">
      <BrandLockup compact onClick={() => onNavigate('/')} />
      <div className="simple-page-header-spacer" aria-hidden="true" />
      <div className="simple-page-actions">
        <button className="icon-button compact-nav-back" onClick={() => onNavigate('/')} aria-label={t('common.back')}><ArrowLeft size={20} /></button>
        <LanguageToggle compact />
      </div>
    </header>
    <article className="legal-content">
      <h1>{content.title}</h1>
      <p className="legal-intro">{content.intro}</p>
      {content.sections.map(section => <section key={section.heading}><h2>{section.heading}</h2><p>{section.heading === copy[locale].privacy.sections[0].heading && appConfig.privacyOperator ? `${appConfig.privacyOperator}. ` : ''}{section.body}</p></section>)}
      {kind === 'privacy' && <section className="analytics-choice">
        <h2>{copy[locale].privacy.choice}</h2>
        <button type="button" className="secondary-button" aria-pressed={allowed} onClick={toggleAnalytics}>{allowed ? copy[locale].privacy.enabled : copy[locale].privacy.disabled}</button>
        {choiceError && <p role="alert">{copy[locale].privacy.saveError}</p>}
      </section>}
      {kind === 'privacy' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(appConfig.privacyEmail) ? <a className="text-button legal-contact" href={`mailto:${appConfig.privacyEmail}`}>{content.contact}</a> : <button className="text-button legal-contact" onClick={() => onNavigate('/feedback')}>{content.contact}</button>}
    </article>
  </main>
}
