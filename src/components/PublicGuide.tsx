import { orderCategoryPlaces } from '../utils/guideEditing'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Bookmark, BookmarkCheck, Check, BookOpen, ChevronDown, List, Map as MapIcon, Pencil } from 'lucide-react'
import { CategoryChips } from './CategoryChips'
import { PlaceRow } from './PlaceRow'
import { PlaceSheet } from './PlaceSheet'
import { BrandLockup } from './BrandLockup'
import { LanguageToggle } from './LanguageToggle'
import { trackEvent } from '../services/analytics'
import { useI18n } from '../i18n'
import { useSavedGuides } from '../hooks/useSavedGuides'
import { guideTitle, guideDescription } from '../utils/share'
import type { CategoryId, Coordinates, Guide, Place } from '../types'

const LazyGuideMap = lazy(() => import('./GuideMap').then(module => ({ default: module.GuideMap })))

type Props = {
  guide: Guide
  userLocation: Coordinates | null
  locationStatus: 'idle' | 'loading' | 'ready' | 'denied' | 'error'
  onRequestLocation: () => void
  onNavigate: (path: string) => void
  editPath?: string
  topActionPath?: string
  topActionLabel?: string
  recipientCreateAction?: boolean
  trackUsage?: boolean
  allowSave?: boolean
  finishAction?: boolean
  titleOverride?: string
}

export function PublicGuide({ guide, userLocation, locationStatus, onRequestLocation, onNavigate, editPath, topActionPath, topActionLabel, recipientCreateAction = false, trackUsage = true, allowSave = false, finishAction = false, titleOverride }: Props) {
  const { t, locale, categoryLabel, placeCountLabel } = useI18n()
  const [mode, setMode] = useState<'list' | 'map'>('list')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [saveError, setSaveError] = useState(false)
  const savedGuides = useSavedGuides()

  useEffect(() => { setSaveError(false); setMode('list'); setCategory('all'); setSelectedPlace(null) }, [guide.id])

  useEffect(() => {
    document.title = `${titleOverride || guideTitle(guide.authorName, guide.city, locale)}. Anyone’s Guide`
    const description = guideDescription(guide.authorName, guide.city, locale, guide.guideNote || guide.intro)
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = description
    return () => { document.title = 'Anyone’s Guide' }
  }, [guide, locale, titleOverride])

  const filtered = useMemo(() => category === 'all' ? guide.places : guide.places.filter(place => place.categoryId === category), [guide.places, category])
  const grouped = [...guide.categories]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => ({ ...item, places: orderCategoryPlaces(filtered.filter(place => place.categoryId === item.id)) }))
    .filter(group => group.places.length > 0)

  const selectedCategory = selectedPlace ? guide.categories.find(item => item.id === selectedPlace.categoryId) : undefined
  const publicTitle = titleOverride || guideTitle(guide.authorName, guide.city, locale)
  const saved = savedGuides.isSaved(guide.id)

  const toggleSaved = () => {
    if (!allowSave || !guide.profileSlug) return
    try {
      if (saved) {
        savedGuides.remove(guide.id)
        if (trackUsage) trackEvent('guide_unsaved', guide.id)
      } else {
        savedGuides.save(guide)
        if (trackUsage) trackEvent('guide_saved', guide.id)
      }
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }

  const openPlace = (place: Place) => {
    setSelectedPlace(place)
    if (trackUsage) trackEvent('venue_opened', guide.id, { placeId: place.id, source: mode })
  }

  const switchMode = (next: 'list' | 'map') => {
    setMode(next)
    if (trackUsage && next === 'map' && mode !== 'map') trackEvent('map_opened', guide.id)
  }

  const navigateTopAction = () => {
    if (!topActionPath) return
    if (trackUsage && recipientCreateAction) trackEvent('recipient_create_clicked', guide.id)
    onNavigate(topActionPath)
  }

  return (
    <main className={`public-shell ${mode === 'map' ? 'map-screen' : ''}`}>
      <div className="site-masthead-wrap">
        <nav className="site-masthead" aria-label={t('common.navigation')}>
          <BrandLockup className="site-brand-lockup" compact onClick={() => onNavigate('/')} ariaLabel={t('common.home')} />
          <div className="site-actions">
            <LanguageToggle compact />
            {editPath && <button className="site-action site-action-secondary" onClick={() => onNavigate(editPath)} aria-label={t('nav.edit')} title={t('nav.edit')}><Pencil size={15} /><span>{t('nav.edit')}</span></button>}
            {topActionPath && topActionLabel && <button className={`site-action site-action-guides ${finishAction ? "finish-action" : ""}`} disabled={finishAction && !guide.places.length} onClick={navigateTopAction} aria-label={topActionLabel} title={topActionLabel}><>{finishAction ? <Check size={15} /> : <BookOpen size={15} />}<span>{topActionLabel}</span></></button>}
          </div>
        </nav>
      </div>

      <header className="guide-hero">
        <h1>{publicTitle}</h1>
        {guide.intro && <p>{guide.intro}</p>}
        <div className="guide-meta-row">
          <div className="place-count">{guide.places.length} {placeCountLabel(guide.places.length)}</div>
          {allowSave && guide.profileSlug && (
            <button className={`save-guide-button ${saved ? 'saved' : ''}`} onClick={toggleSaved} aria-pressed={saved}>
              {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              <span>{saved ? t('saved.saved') : t('saved.save')}</span>
            </button>
          )}
        </div>
        {saveError && <p className="saved-action-error" role="alert">{t('saved.storageError')}</p>}
        <CategoryChips active={category} onChange={setCategory} places={guide.places} categories={guide.categories} />
      </header>

      {mode === 'list' ? (
        <section className="guide-list">
          {guide.guideNote.trim() && (
            <details className="guide-note-card" key={guide.id}>
              <summary>
                <span className="guide-note-summary-copy">
                  <strong>{t('guide.fromAuthor', { name: guide.authorName })}</strong>
                  <span className="guide-note-excerpt">{guide.guideNote.trim()}</span>
                </span>
                <span className="guide-note-expand">{t('guide.readNote')} <ChevronDown size={16} /></span>
              </summary>
              <p>{guide.guideNote.trim()}</p>
            </details>
          )}
          {filtered.some(p => p.isStarred) && <p className="author-picks-key"><span className="copy-emote" aria-hidden="true">🔥</span><span>{t('star.legend')}</span></p>}
          {grouped.map(group => (
            <div className="category-section" key={group.id}>
              <h2>{categoryLabel(group)} <span>· {group.places.length}</span></h2>
              <div className="place-list">
                {group.places.map(place => <PlaceRow key={place.id} place={place} category={group} userLocation={userLocation} onClick={() => openPlace(place)} />)}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <>
          <Suspense fallback={<div className="map-wrap map-loading"><div className="loading-dot" /></div>}>
            <LazyGuideMap guide={guide} places={filtered} selectedPlace={selectedPlace} onSelectPlace={openPlace} userLocation={userLocation} locationStatus={locationStatus} onRequestLocation={onRequestLocation} />
          </Suspense>
          <div className="map-toolbar">
            <div className="map-toolbar-title">{publicTitle}</div>
            <CategoryChips active={category} onChange={setCategory} places={guide.places} categories={guide.categories} />
          </div>
        </>
      )}

      <nav className={`mode-switch ${mode === 'map' ? 'map-mode' : ''}`} aria-label={t('guide.view')}>
        <button className={mode === 'list' ? 'active' : ''} aria-pressed={mode === 'list'} onClick={() => switchMode('list')}><List size={17} /> {t('guide.list')}</button>
        <button className={mode === 'map' ? 'active' : ''} aria-pressed={mode === 'map'} onClick={() => switchMode('map')}><MapIcon size={17} /> {t('guide.map')}</button>
      </nav>
      {selectedPlace && <PlaceSheet place={selectedPlace} category={selectedCategory} userLocation={userLocation} onClose={() => setSelectedPlace(null)} guideId={trackUsage ? guide.id : undefined} />}
    </main>
  )
}
