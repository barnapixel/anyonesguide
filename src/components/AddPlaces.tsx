import { categoryPromptKey } from '../utils/category'
import { AuthorStar } from './AuthorStar'
import { useSearch } from '../hooks/useSearch'
import { SaveFeedback } from './SaveFeedback'
import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, Check, Search, X } from 'lucide-react'
import { appConfig } from '../config'
import { isLivePlaceSearchEnabled, searchPlaces } from '../services/placeSearch'
import { useI18n } from '../i18n'
import type { CategoryId, Guide, Place, PlaceSearchResult, SaveStatus } from '../types'

const NOTE_SOFT_LIMIT = 200

type Props = {
  guide: Guide
  categoryId?: CategoryId
  returnToGuide?: boolean
  guidedStart?: boolean
  previewPath?: string
  finishPath?: string
  onNavigate: (path: string) => void
  backPath: string
  onAddSearchResult: (result: PlaceSearchResult, categoryId?: CategoryId) => Promise<Place>
  onUpdatePlace: (id: string, patch: Partial<Place>) => void
  saveStatusByPlaceId?: Record<string, SaveStatus>
  contextBanner?: ReactNode
  onFlush?: () => Promise<void>
  saveStatus?: SaveStatus
  storageUnavailable?: boolean
  noteLimit?: number
}

export function AddPlaces({ guide, onNavigate, backPath, onAddSearchResult, onUpdatePlace, saveStatusByPlaceId, contextBanner, noteLimit, onFlush, saveStatus, storageUnavailable, guidedStart = false, previewPath, finishPath, categoryId, returnToGuide = false }: Props) {
  const { t, categoryLabel } = useI18n()
  const selectedCategory = guide.categories.find(category => category.id === categoryId)?.id
  const returnPath = (place?: Place) => {
    const url = new URL(backPath, window.location.origin)
    if (place) { url.searchParams.set('category', place.categoryId); url.searchParams.set('added', place.id) }
    else if (selectedCategory) url.searchParams.set('category', selectedCategory)
    return url.pathname + url.search
  }
  const [query, setQuery] = useState('')
  const search = useCallback((value: string, signal: AbortSignal) => searchPlaces(value, guide.center, signal), [guide.center])
  const { results, loading, failed } = useSearch(query, true, search)
  const addingRef = useRef(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentId, setRecentId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const recent = recentId ? guide.places.find(place => place.id === recentId) ?? null : null
  const recentCategory = recent ? guide.categories.find(item => item.id === recent.categoryId) : null
  const recentSaveStatus: SaveStatus = recent ? (saveStatusByPlaceId?.[recent.id] ?? 'saved') : 'idle'
  const showRecent = Boolean(recent && query.trim().length === 0)

  const leave = async (path = returnPath()) => { if (addingRef.current) return; try { await onFlush?.(); onNavigate(path) } catch { /* SaveFeedback retains the retry path. */ } }

  const choose = async (result: PlaceSearchResult) => {
    if (addingRef.current) return
    addingRef.current = true; setAdding(true); setError(null)
    try {
      const place = await onAddSearchResult(result, selectedCategory)
      setRecentId(place.id)
      setQuery('')
      inputRef.current?.blur()
      if (returnToGuide) { await onFlush?.(); onNavigate(returnPath(place)) }
    } catch (caught) {
      setError(caught instanceof Error && caught.message.includes('100') ? 'add.limit' : 'add.failed')
    } finally {
      addingRef.current = false; setAdding(false)
    }
  }

  const saveLabel = recentSaveStatus === 'saving'
    ? t('add.saving')
    : recentSaveStatus === 'error'
      ? t('add.saveError')
      : t('add.saved')

  return (
    <main className="add-shell">
      <header className="add-topbar">
        <button className="icon-button" disabled={adding} onClick={() => void leave()} aria-label={t('common.back')}><ArrowLeft size={20} /></button>
        <strong>{t('add.title')}</strong>
        <button className="icon-button" disabled={adding} onClick={() => void leave()} aria-label={t('common.close')}><X size={20} /></button>
      </header>
      {contextBanner}
      <SaveFeedback status={saveStatus} onRetry={onFlush} storageUnavailable={storageUnavailable} />
      <section className="add-content">
        {selectedCategory && <p className="creation-hint">{t(categoryPromptKey(selectedCategory))}</p>}
        {!selectedCategory && guidedStart && guide.places.length < 3 && <p className="creation-hint">{t(guide.places.length ? 'creation.smallGuide' : 'creation.firstPlace')}</p>}
        <div className="search-box">
          <Search size={19} />
          <input aria-label={t('common.search')} ref={inputRef} autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder={t(recent ? 'add.searchAnother' : 'add.searchFirst', { city: guide.city })} disabled={adding} />
          {query && <button onClick={() => setQuery('')} aria-label={t('common.clear')}><X size={17} /></button>}
        </div>
        {(!guidedStart || guide.places.length >= 3) && <p className="search-hint">{t('add.searchHint', { city: guide.city })}</p>}
        {isLivePlaceSearchEnabled && <div className="search-attribution">{t('add.attribution')} <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> · © OpenStreetMap contributors</div>}
        {!isLivePlaceSearchEnabled && <div className="config-warning compact">{appConfig.cloudEnabled ? t('add.searchNotConfigured') : t('add.demo')}</div>}
        {(error || failed) && <div className="status-message error" role="alert">{t(error || 'add.searchUnavailable')}</div>}
        {(loading || adding) && <div className="search-status">{adding ? t('add.adding') : t('add.searching')}</div>}
        {!loading && !adding && results.length > 0 && (
          <div className="search-results">
            {results.map(result => (
              <button key={`${result.id}-${result.lat}`} onClick={() => void choose(result)}>
                <span className="result-icon">⌖</span>
                <span><strong>{result.name}</strong><small>{result.address}</small></span>
              </button>
            ))}
          </div>
        )}
        {!loading && !adding && !error && !failed && query.trim().length >= 2 && results.length === 0 && <div className="search-status">{t('add.noMatches')}</div>}

        {showRecent && recent && (
          <section className="recent-card">
            <div className="recent-success"><Check size={17} /> {t('add.added', { category: recentCategory ? categoryLabel(recentCategory) : t('add.yourGuide') })}</div>
            <div className="recent-title-row"><h2>{recent.name}</h2><AuthorStar place={recent} onChange={isStarred => onUpdatePlace(recent.id, { isStarred })} /></div>
            <p>{recent.address}</p>
            <label>{t('editor.category')}
              <select value={recent.categoryId} onChange={event => onUpdatePlace(recent.id, { categoryId: event.target.value as CategoryId })}>
                {guide.categories.map(item => <option key={item.id} value={item.id}>{categoryLabel(item)}</option>)}
              </select>
            </label>
            <label>{t('add.note')} <span>({t('add.optional')})</span>
              <textarea value={recent.note} maxLength={noteLimit} placeholder={t('add.notePlaceholder')} onChange={event => onUpdatePlace(recent.id, { note: event.target.value })} />
              <small className={`add-note-guidance ${recent.note.length > NOTE_SOFT_LIMIT ? 'over' : ''}`}>{recent.note.length} / {NOTE_SOFT_LIMIT}</small>
            </label>
            <div className={`autosave-status ${recentSaveStatus === 'error' ? 'error' : ''}`} aria-live="polite">
              {recentSaveStatus !== 'saving' && recentSaveStatus !== 'error' && <Check size={14} />}
              {saveLabel}
            </div>
            {guidedStart && guide.places.length >= 2 && guide.places.length < 4 && !guide.places.some(p => p.isStarred) && <p className="creation-hint">{t('creation.starHint')}</p>}
            {guidedStart && guide.places.length > 0 && <div className="creation-actions">
              {previewPath && <button className="secondary-button" onClick={() => void leave(previewPath)}>{t('editor.preview')}</button>}
              <button className="primary-button" onClick={() => void leave(finishPath || backPath)}>{t(finishPath ? 'request.finishAction' : 'creation.openGuide')}</button>
            </div>}
            {returnToGuide && <button className="secondary-button" onClick={() => void leave(returnPath(recent))}>{t('creation.openGuide')}</button>}
            <div className="recent-footer">{t('add.autoSaved')}</div>
          </section>
        )}
      </section>
    </main>
  )
}
