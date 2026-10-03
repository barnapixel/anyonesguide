import { RotateCcw, Share2 } from 'lucide-react'
import type { Guide } from '../types'
import { BrandLockup } from './BrandLockup'
import { GuideTile } from './GuideTile'
import { LanguageToggle } from './LanguageToggle'
import { useI18n } from '../i18n'
import { guideShareContent, guideShareUrl, shareUrl } from '../utils/share'

type Props = { guide: Guide; onNavigate: (path: string) => void; onReset: () => void }

export function CreatorHome({ guide, onNavigate, onReset }: Props) {
  const { t, locale, placeCountLabel } = useI18n()
  const share = async () => { await shareUrl({ ...guideShareContent(guide.authorName, guide.city, locale, 'owner'), url: guideShareUrl(window.location.origin, '/', locale) }) }
  return (
    <main className="creator-shell">
      <header className="creator-header">
        <BrandLockup compact onClick={() => onNavigate('/')} />
        <div className="creator-header-actions"><LanguageToggle compact /><div className="avatar-button">M</div></div>
      </header>
      <section className="creator-content">
        <h1>{t('creator.title')}</h1>
        <p className="subtle">{t('creator.subtitle')}</p>
        <div className="config-warning">{t('demo.body')}</div>
        <article className="guide-card">
          <button className="guide-card-main" onClick={() => onNavigate('/edit/gdansk')}>
            <GuideTile city={guide.city} />
            <span className="guide-card-copy"><strong>{guide.city}</strong><span>{guide.places.length} {placeCountLabel(guide.places.length)}</span><span>{t('demo.stored')}</span></span>
          </button>
          <button className="guide-card-share" onClick={() => void share()}><Share2 size={18} /><span>{t('creator.share')}</span></button>
        </article>
      </section>
      <div className="creator-actions">
        <button className="primary-button" onClick={() => onNavigate('/edit/gdansk')}>{t('demo.edit')}</button>
        <button className="text-button" onClick={onReset}><RotateCcw size={15} /> {t('demo.reset')}</button>
      </div>
    </main>
  )
}
