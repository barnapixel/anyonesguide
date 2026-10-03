import { PageError } from './PageError'
import { useSearch } from '../hooks/useSearch'
import { useEffect, useRef, useState } from 'react'
import { LogOut, Pencil, Search, Share2, X } from 'lucide-react'
import { appConfig } from '../config'
import { createGuide, getMyProfile, listMyGuides } from '../services/guideRepository'
import { searchDestinations } from '../services/placeSearch'
import { trackEvent } from '../services/analytics'
import { guideShareContent, guideShareUrl, shareUrl } from '../utils/share'
import { useI18n } from '../i18n'
import type { DestinationSearchResult, GuideSummary, Profile } from '../types'
import { BrandLockup } from './BrandLockup'
import { GuideTile } from './GuideTile'
import { LanguageToggle } from './LanguageToggle'
import { ProfileIdentity } from './ProfileIdentity'

type Props = {
  userId: string
  suggestedDisplayName?: string
  onNavigate: (path: string) => void
  onSignOut: () => Promise<void>
}

export function CloudCreatorHome({ userId, suggestedDisplayName = '', onNavigate, onSignOut }: Props) {
  const { t, locale, placeCountLabel } = useI18n()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [guides, setGuides] = useState<GuideSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [query, setQuery] = useState('')
  const { results, loading: searching, failed } = useSearch(query, creating && appConfig.geoapifyEnabled, searchDestinations)
  const createRef = useRef(false)
  const [createBusy, setCreateBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true); setError(null)
    Promise.all([getMyProfile(userId), listMyGuides(userId)])
      .then(([nextProfile, nextGuides]) => {
        if (!active) return
        setProfile(nextProfile)
        setGuides(nextGuides)
      })
      .catch(() => active && setError('load'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [userId])

  const chooseDestination = async (destination: DestinationSearchResult) => {
    if (createRef.current) return
    createRef.current = true; setCreateBusy(true); setError(null)
    try {
      const guide = await createGuide(userId, destination)
      trackEvent('guide_created', guide.id, { city: guide.city })
      onNavigate(`/edit/${guide.id}`)
    } catch (caught) {
      const message = String((caught as { message?: string }).message ?? '')
      setError(message.includes('duplicate') || message.includes('unique') ? t('error.duplicate', { city: destination.city }) : t('error.create'))
    } finally { createRef.current = false; setCreateBusy(false) }
  }

  const shareGuide = async (guide: GuideSummary) => {
    setNotice(null)
    if (!profile) return
    if (guide.visibility === 'draft') {
      setNotice(t('creator.draftShare'))
      return
    }
    const url = guideShareUrl(window.location.origin, `/${encodeURIComponent(profile.slug)}/${encodeURIComponent(guide.slug)}`, locale)
    try {
      const result = await shareUrl({ ...guideShareContent(profile.displayName, guide.city, locale, 'owner'), url })
      if (result === 'copied') setNotice(t('creator.linkCopied'))
      if (result !== 'cancelled') trackEvent('guide_shared', guide.id, { source: 'creator_home', method: result })
    } catch {
      setNotice(t('request.shareError'))
    }
  }

  const visibilityLabel = (guide: GuideSummary) => t(`status.${guide.visibility}`)

  if (loading) return <main className="center-state"><div className="loading-dot" /><p>{t('common.loading')}</p></main>
  if (!profile) return <PageError onNavigate={onNavigate} />

  if (!profile.onboardingComplete) {
    return (
      <ProfileIdentity
        profile={profile}
        suggestedDisplayName={suggestedDisplayName}
        onSaved={updated => setProfile(updated)}
      />
    )
  }

  return (
    <main className="creator-shell">
      <header className="creator-header">
        <BrandLockup compact onClick={() => onNavigate('/')} />
        <div className="creator-header-actions">
          <LanguageToggle compact />
          <button className="creator-profile-button" onClick={() => setEditingProfile(true)} aria-label={t('profile.edit')}>
            <span>{profile.displayName}</span><Pencil size={13} />
          </button>
          <button className="icon-button" onClick={() => void onSignOut().catch(() => setError(t('error.signOut')))} aria-label={t('profile.signOut')}><LogOut size={18} /></button>
        </div>
      </header>
      <section className="creator-content">
        <h1>{t('creator.title')}</h1>
        <p className="subtle">{t('creator.subtitle')}</p>
        {error && <div className="status-message error creator-error">{error === 'load' ? t('error.loadBody') : error}</div>}
        {notice && <div className="status-message success creator-notice">{notice}</div>}

        <div className="guide-card-list">
          {guides.map(guide => (
            <article className="guide-card" key={guide.id}>
              <button className="guide-card-main" onClick={() => onNavigate(`/edit/${guide.id}`)}>
                <GuideTile city={guide.city} />
                <span className="guide-card-copy">
                  <strong>{guide.city}</strong>
                  <span>{guide.placeCount} {placeCountLabel(guide.placeCount)}</span>
                  <span className={`visibility-text visibility-${guide.visibility}`}>{visibilityLabel(guide)}</span>
                </span>
              </button>
              <button className="guide-card-share" onClick={() => void shareGuide(guide)} aria-label={`${t('creator.share')} ${guide.city}`}><Share2 size={18} /><span>{t('creator.share')}</span></button>
            </article>
          ))}
        </div>

        {!guides.length && <div className="empty-guides"><strong>{t('creator.noGuides')}</strong><span>{t('creator.noGuidesBody')}</span></div>}

        {creating && (
          <section className="new-guide-panel">
            <div className="new-guide-title"><div><strong>{t('creator.newGuide')}</strong><span>{t('creator.where')}</span></div><button className="icon-button" onClick={() => { setCreating(false); setQuery('') }} aria-label={t('common.close')}><X size={19} /></button></div>
            {!appConfig.geoapifyEnabled ? (
              <div className="config-warning">{t('add.searchNotConfigured')}</div>
            ) : (
              <>
                <div className="search-box">
                  <Search size={19} />
                  <input disabled={createBusy} aria-label={t('creator.searchCity')} ref={inputRef} autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder={t('creator.searchCity')} />
                  {query && <button onClick={() => setQuery('')} aria-label={t('common.clear')}><X size={17} /></button>}
                </div>
                {failed && <p role="alert">{t('add.searchUnavailable')}</p>}
                {!searching && !failed && query.trim().length >= 2 && !results.length && <p className="search-status">{t('add.noMatches')}</p>}
                {searching && <div className="search-status">{t('add.searching')}</div>}
                {!searching && results.length > 0 && <div className="destination-results">
                  {results.map(result => <button disabled={createBusy} key={result.id} onClick={() => void chooseDestination(result)}><strong>{result.city}</strong><span>{result.country}</span></button>)}
                </div>}
              </>
            )}
          </section>
        )}

      </section>
      {!creating && <div className="creator-actions"><button className="primary-button" onClick={() => { setCreating(true); window.setTimeout(() => inputRef.current?.focus(), 0) }}>{t('creator.newGuide')}</button></div>}

      {editingProfile && (
        <ProfileIdentity
          profile={profile}
          suggestedDisplayName={suggestedDisplayName}
          dismissible
          onClose={() => setEditingProfile(false)}
          onSaved={updated => { setProfile(updated); setEditingProfile(false) }}
        />
      )}
    </main>
  )
}
