import { orderCategoryPlaces } from '../utils/guideEditing'
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Bookmark, BookmarkCheck, Check, BookOpen, ArrowLeft, Expand, Map as MapIcon, Pencil } from 'lucide-react'
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
import { useInitialReveal } from '../hooks/useInitialReveal'
import { InitialScreenLoading } from './InitialScreenLoading'
import { GuideNote } from './GuideNote'

function UnavailableGuideMap({ variant, onInitialReady }: { variant?: 'preview' | 'full'; onInitialReady?: () => void }) {
  const { t } = useI18n()
  useEffect(() => { onInitialReady?.() }, [onInitialReady])
  return <div className={`map-wrap ${variant === 'preview' ? 'map-preview' : ''}`}><div className="map-message map-error">{t('guide.mapError')}</div></div>
}

// A failed map chunk must not replace an otherwise readable guide.
const LazyGuideMap = lazy<typeof import('./GuideMap').GuideMap>(() => import('./GuideMap')
  .then(module => ({ default: module.GuideMap }))
  .catch(() => ({ default: UnavailableGuideMap })))

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
  const { t, locale, categoryLabel } = useI18n()
  const [mode, setMode] = useState<'list' | 'map'>('list')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [saveError, setSaveError] = useState(false)
  const savedGuides = useSavedGuides()
  const previewRef = useRef<HTMLElement | null>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const readingPosition = useRef(0)
  const readingGuide = useRef(guide.id)
  const mapOpener = useRef<HTMLElement | null>(null)
  const wasMap = useRef(false)
  const [showMapShortcut, setShowMapShortcut] = useState(false)
  const { revealed, waitExpired, release } = useInitialReveal(guide.id, guide.places.length > 0)

  const revealCategory = (chip: HTMLElement | null) => {
    const group = toolbarRef.current?.querySelector<HTMLElement>('.guide-chip-row')
    if (!group || !chip || !group.contains(chip)) return
    const bounds = group.getBoundingClientRect(), button = chip.getBoundingClientRect()
    if (button.left < bounds.left) group.scrollLeft += button.left - bounds.left - 3
    else if (button.right > bounds.right) group.scrollLeft += button.right - bounds.right + 3
  }

  useLayoutEffect(() => {
    if (mode !== 'map') return
    // Scroll only the category strip, leaving Back and page position fixed.
    revealCategory(toolbarRef.current?.querySelector<HTMLElement>('.chip.active') ?? null)
  }, [mode, category, locale])

  useLayoutEffect(() => {
    if (mode === 'list' && wasMap.current && readingGuide.current === guide.id) {
      window.scrollTo({ top: readingPosition.current, behavior: 'instant' })
      const opener = mapOpener.current?.isConnected ? mapOpener.current : document.querySelector<HTMLElement>(mapOpener.current?.classList.contains('map-shortcut') ? '.map-shortcut' : '.map-preview-open')
      opener?.focus({ preventScroll: true })
    }
    wasMap.current = mode === 'map'
  }, [mode, guide.id])

  useEffect(() => {
    if (mode !== 'list' || !previewRef.current) return
    const preview = previewRef.current
    const update = () => setShowMapShortcut(preview.getBoundingClientRect().bottom <= 0)
    update()
    const observer = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(update) : null
    observer?.observe(preview)
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { observer?.disconnect(); window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [mode, guide.id, guide.places.length > 0, revealed])

  useEffect(() => {
    if (mode !== 'map' || selectedPlace) return
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setMode('list') }
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [mode, selectedPlace])

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

  const openPlace = useCallback((place: Place) => {
    setSelectedPlace(place)
    if (trackUsage) trackEvent('venue_opened', guide.id, { placeId: place.id, source: mode })
  }, [trackUsage, guide.id, mode])

  const switchMode = (next: 'list' | 'map') => {
    if (next === 'map' && mode !== 'map') {
      readingGuide.current = guide.id
      readingPosition.current = window.scrollY
      mapOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    }
    setMode(next)
    if (trackUsage && next === 'map' && mode !== 'map') trackEvent('map_opened', guide.id)
  }

  const navigateTopAction = () => {
    if (!topActionPath) return
    if (trackUsage && recipientCreateAction) trackEvent('recipient_create_clicked', guide.id)
    onNavigate(topActionPath)
  }

  return (
    <main className={`public-shell ${mode === 'map' ? 'map-screen' : ''}`} aria-busy={!revealed}>
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

      {!revealed && <InitialScreenLoading />}
      <div className={`guide-content ${!revealed ? 'visual-pending' : ''}`} inert={!revealed} aria-hidden={!revealed}>
      <header className="guide-hero">
        <h1>{publicTitle}</h1>
          {guide.guideNote.trim() && <GuideNote key={guide.id} authorName={guide.authorName} note={guide.guideNote} />}
        {guide.intro && <p>{guide.intro}</p>}
        {allowSave && guide.profileSlug && <div className="guide-meta-row">
            <button className={`save-guide-button ${saved ? 'saved' : ''}`} onClick={toggleSaved} aria-pressed={saved}>
              {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              <span>{saved ? t('saved.saved') : t('saved.save')}</span>
            </button>
        </div>}
        {saveError && <p className="saved-action-error" role="alert">{t('saved.storageError')}</p>}
      </header>

      {guide.places.length > 0 && (
        <section ref={previewRef} className={`guide-map-section ${mode === 'map' ? 'is-full-map' : ''}`} aria-label={t('guide.map')}>
          <Suspense fallback={waitExpired ? <UnavailableGuideMap variant={mode === 'list' ? 'preview' : 'full'} /> : <div className={`map-wrap map-loading ${mode === 'list' ? 'map-preview' : ''}`} role="status" aria-label={t('common.loading')}><div className="loading-dot" /></div>}>
            <LazyGuideMap guide={guide} places={mode === 'list' ? guide.places : filtered} selectedPlace={mode === 'map' ? selectedPlace : null} onSelectPlace={openPlace} userLocation={userLocation} locationStatus={locationStatus} onRequestLocation={onRequestLocation} variant={mode === 'list' ? 'preview' : 'full'} onInitialReady={release} initialWaitExpired={waitExpired} />
          </Suspense>
          {mode === 'list' && <button className="map-preview-open" onClick={() => switchMode('map')} aria-label={t('guide.exploreMap')}><span className="map-preview-cue">{t('guide.exploreMap')} <Expand size={14} /></span></button>}
        </section>
      )}

      <div className="guide-filters" hidden={mode === 'map'}>
        <CategoryChips active={category} onChange={setCategory} places={guide.places} categories={guide.categories} />
      </div>

      <section className="guide-list" hidden={mode === 'map'}>
          {filtered.some(p => p.isStarred) && <p className="author-picks-key"><span className="copy-emote" aria-hidden="true">🔥</span><span>{t('star.legend')}</span></p>}
          {grouped.map(group => (
            <div className="category-section" key={group.id}>
              <h2>{categoryLabel(group)} <span>· {group.places.length}</span></h2>
              <div className="place-list">
                {group.places.map(place => <PlaceRow key={place.id} place={place} category={group} city={guide.city} country={guide.country} userLocation={userLocation} onClick={() => openPlace(place)} />)}
              </div>
            </div>
          ))}
      </section>

      {mode === 'map' && (
        <div ref={toolbarRef} className="map-toolbar" onFocusCapture={event => revealCategory(event.target.closest<HTMLElement>('.chip'))}>
          <button className="map-back" autoFocus aria-label={t('guide.backToGuide')} title={t('guide.backToGuide')} onClick={() => switchMode('list')}><ArrowLeft size={20} aria-hidden="true" /></button>
          <CategoryChips active={category} onChange={setCategory} places={guide.places} categories={guide.categories} />
        </div>
      )}
      {mode === 'list' && showMapShortcut && guide.places.length > 0 && <button className="map-shortcut" onClick={() => switchMode('map')}><MapIcon size={17} />{t('guide.map')}</button>}
      {selectedPlace && <PlaceSheet place={selectedPlace} category={selectedCategory} userLocation={userLocation} onClose={() => setSelectedPlace(null)} guideId={trackUsage ? guide.id : undefined} />}
      </div>
    </main>
  )
}
