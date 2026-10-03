import { BookmarkCheck, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useSavedGuides } from '../hooks/useSavedGuides'
import { useI18n } from '../i18n'
import { BrandLockup } from './BrandLockup'
import { GuideTile } from './GuideTile'
import { LanguageToggle } from './LanguageToggle'

type Props = { onNavigate: (path: string) => void }

export function SavedGuides({ onNavigate }: Props) {
  const { t, placeCountLabel } = useI18n()
  const { guides, remove } = useSavedGuides()
  const [removeError, setRemoveError] = useState(false)

  const removeGuide = (guideId: string) => {
    try {
      remove(guideId)
      setRemoveError(false)
    } catch {
      setRemoveError(true)
    }
  }

  return (
    <main className="saved-shell">
      <header className="simple-page-header saved-header">
        <BrandLockup className="site-brand-lockup" compact onClick={() => onNavigate('/')} />
        <div className="simple-page-header-spacer" aria-hidden="true" />
        <div className="simple-page-actions"><LanguageToggle compact /></div>
      </header>

      <section className="saved-content">
        <h1>{t('saved.title')}</h1>
        <p className="saved-intro">{t('saved.subtitle')}</p>
        {removeError && <p className="saved-action-error" role="alert">{t('saved.storageError')}</p>}

        {guides.length > 0 ? (
          <div className="saved-guide-list">
            {guides.map(guide => (
              <article className="saved-guide-card" key={guide.guideId}>
                <button className="saved-guide-main" onClick={() => onNavigate(`/${guide.profileSlug}/${guide.guideSlug}`)}>
                  <GuideTile city={guide.city} compact />
                  <span className="saved-guide-copy">
                    <strong>{guide.authorName}’s {guide.city}</strong>
                    <span>{guide.placeCount} {placeCountLabel(guide.placeCount)} · {guide.country}</span>
                    {guide.intro && <span className="saved-guide-intro">{guide.intro}</span>}
                  </span>
                  <ChevronRight size={18} />
                </button>
                <button className="saved-guide-remove" onClick={() => removeGuide(guide.guideId)} aria-label={`${t('saved.remove')} ${guide.city}`}>
                  <BookmarkCheck size={18} />
                  <span>{t('saved.saved')}</span>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-guides saved-empty">
            <strong>{t('saved.empty')}</strong>
            <span>{t('saved.emptyBody')}</span>
            <button className="secondary-button" onClick={() => onNavigate('/explore')}>{t('home.publicGuides')}</button>
          </div>
        )}

        <p className="saved-device-note">{t('saved.deviceNote')}</p>
      </section>
    </main>
  )
}
