import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react'
import { listPublicGuides } from '../services/guideRepository'
import { trackEvent } from '../services/analytics'
import type { ExploreGuideSummary } from '../types'
import { useI18n } from '../i18n'
import { BrandLockup } from './BrandLockup'
import { GuideTile } from './GuideTile'
import { LanguageToggle } from './LanguageToggle'

type Props = { onNavigate: (path: string) => void; signedIn: boolean }

export function Explore({ onNavigate, signedIn }: Props) {
  const { t, placeCountLabel } = useI18n()
  const [retry, setRetry] = useState(0)
  const [guides, setGuides] = useState<ExploreGuideSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    trackEvent('explore_opened')
    let active = true
    setLoading(true); setError(null)
    listPublicGuides()
      .then(result => active && setGuides(result))
      .catch(() => active && setError(t('error.loadBody')))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [retry])

  const groups = useMemo(() => {
    const map = new Map<string, ExploreGuideSummary[]>()
    for (const guide of guides) {
      const key = `${guide.city}|${guide.country}`
      map.set(key, [...(map.get(key) ?? []), guide])
    }
    return [...map.entries()].map(([key, items]) => ({ key, city: items[0].city, country: items[0].country, items }))
  }, [guides])

  return (
    <main className="explore-shell">
      <header className="explore-header">
        <BrandLockup className="site-brand-lockup" compact onClick={() => onNavigate('/')} />
        <div className="explore-header-spacer" aria-hidden="true" />
        <div className="explore-actions">
          <button className="icon-button compact-nav-back" onClick={() => onNavigate('/')} aria-label={t('common.back')}><ArrowLeft size={20} /></button>
          <LanguageToggle compact />
          <button className="site-action" onClick={() => onNavigate('/creator')} aria-label={signedIn ? t('nav.guides') : t('nav.create')} title={signedIn ? t('nav.guides') : t('nav.create')}><BookOpen size={15} /><span>{signedIn ? t('nav.guides') : t('nav.create')}</span></button>
        </div>
      </header>
      <section className="explore-content">
        <h1>{t('explore.title')}</h1>
        <p className="explore-intro">{t('explore.subtitle')}</p>
        {loading && <div className="center-inline"><div className="loading-dot" />{t('common.loading')}</div>}
        {error && <div className="status-message error" role="alert">{t('error.loadBody')} <button className="text-button" onClick={() => setRetry(v => v + 1)}>{t('request.retry')}</button></div>}
        {!loading && !error && groups.length === 0 && <div className="empty-guides"><strong>{t('explore.empty')}</strong><span>{t('explore.emptyBody')}</span></div>}
        {groups.map(group => (
          <section className="explore-city" key={group.key}>
            <div className="explore-city-heading"><h2>{group.city}</h2><span>{group.country}</span></div>
            <div className="explore-guide-list">
              {group.items.map(guide => (
                <button key={guide.id} className="explore-guide-card" onClick={() => { trackEvent('explore_guide_opened', guide.id); onNavigate(`/${guide.profileSlug}/${guide.slug}`) }}>
                  <GuideTile city={guide.city} compact />
                  <span className="explore-guide-copy">
                    <strong>{t('explore.by', { name: guide.authorName })}</strong>
                    <span>{guide.placeCount} {placeCountLabel(guide.placeCount)}</span>
                    {guide.intro && <span className="explore-guide-intro">{guide.intro}</span>}
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          </section>
        ))}
      </section>
    </main>
  )
}
