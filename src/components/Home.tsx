import { BrandLockup } from './BrandLockup'
import { LanguageToggle } from './LanguageToggle'
import { useI18n } from '../i18n'

type Props = {
  onNavigate: (path: string) => void
  signedIn: boolean
  exploreEnabled?: boolean
}

export function Home({ onNavigate, signedIn: _signedIn, exploreEnabled = true }: Props) {
  const { t } = useI18n()
  return (
    <main className="home-shell">
      <header className="home-header">
        <BrandLockup compact />
        <div className="home-header-actions">
          <LanguageToggle compact />
        </div>
      </header>
      <section className="home-hero">
        <div className="home-eyebrow">{t('home.eyebrow')}</div>
        <h1>{t('home.title')}</h1>
        <p>{t('home.body')}</p>
        <div className="home-entry-grid">
          <button className="home-entry primary" onClick={() => onNavigate('/creator')}>{t('home.yourGuides')}</button>
          <button className="home-entry" onClick={() => onNavigate('/saved')}>{t('home.savedGuides')}</button>
          {exploreEnabled && <button className="home-entry" onClick={() => onNavigate('/explore')}>{t('home.publicGuides')}</button>}
          <button className="home-entry request" onClick={() => onNavigate('/ask')}>{t('request.askTitle')}</button>
        </div>
      </section>
    </main>
  )
}
