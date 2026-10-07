import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, Search, X } from 'lucide-react'
import { appConfig } from '../config'
import { useSearch } from '../hooks/useSearch'
import { useI18n } from '../i18n'
import { isLivePlaceSearchEnabled, searchPlaces } from '../services/placeSearch'
import { clearFirstPlaceDraft, loadFirstPlaceDraft, saveFirstPlaceDraft, type FirstPlaceDraft } from '../services/firstPlaceDraft'
import type { Guide, Place, PlaceSearchResult } from '../types'
import { RecommendationImport } from './RecommendationImport'
import { loadImportDraft } from '../services/recommendationImport'

type Props = {
  guide: Guide
  scope: string
  context?: string
  localOnly?: boolean
  storageUnavailable?: boolean
  onBack: () => Promise<void> | void
  onSave: (result: PlaceSearchResult, note: string) => Promise<Place>
  onSaved: (place: Place) => void
}

export function FirstPlace({ guide, scope, context, localOnly = false, storageUnavailable = false, onBack, onSave, onSaved }: Props) {
  const { t } = useI18n()
  const [draft, setDraft] = useState<FirstPlaceDraft>(() => loadFirstPlaceDraft(scope) ?? { query: '', selected: null, note: '', updatedAt: Date.now() })
  const draftRef = useRef(draft)
  const [durable, setDurable] = useState(() => !storageUnavailable && saveFirstPlaceDraft(scope, draft))
  const durableRef = useRef(durable)
  durableRef.current = durable
  const [saving, setSaving] = useState(false)
  const [importOpen, setImportOpen] = useState(() => Boolean(loadImportDraft(scope)?.rows.length))
  const [importBusy, setImportBusy] = useState(false)
  const importBusyRef = useRef(false)
  const savingRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [searchAttempt, setSearchAttempt] = useState(0)
  const screenRef = useRef<HTMLElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const focusSearch = useRef(false)
  const search = useCallback((query: string, signal: AbortSignal) => searchPlaces(query, guide.center, signal), [guide.center, searchAttempt])
  const { results, loading, failed } = useSearch(draft.query, !draft.selected && !saving, search)

  const update = (patch: Partial<FirstPlaceDraft>) => {
    const next = { ...draftRef.current, ...patch, updatedAt: Date.now() }
    draftRef.current = next
    setDraft(next)
    setDurable(saveFirstPlaceDraft(scope, next))
    setError(null)
  }
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      const current = draftRef.current
      if (!durableRef.current && (current.query || current.selected || current.note)) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])
  useLayoutEffect(() => {
    if (draft.selected) {
      titleRef.current?.focus({ preventScroll: true })
      screenRef.current?.scrollIntoView?.({ block: 'start', behavior: 'instant' as ScrollBehavior })
    } else if (focusSearch.current) {
      focusSearch.current = false
      inputRef.current?.focus()
    }
  }, [draft.selected?.id])

  const back = async () => {
    if (savingRef.current || importBusyRef.current) return
    try { await onBack() } catch { setError('save.error') }
  }

  const choose = (result: PlaceSearchResult) => {
    inputRef.current?.blur()
    update({ selected: result, note: draft.selected?.id === result.id ? draft.note : '' })
  }
  const save = async () => {
    const pending = draftRef.current
    if (!pending.selected || savingRef.current) return
    savingRef.current = true; setSaving(true); setError(null)
    try {
      const place = await onSave(pending.selected, pending.note)
      clearFirstPlaceDraft(scope)
      onSaved(place)
    } catch (caught) {
      setError(caught instanceof Error && caught.message === 'storage' ? 'first.storageSaveError' : 'first.saveError')
    } finally { savingRef.current = false; setSaving(false) }
  }

  return <main ref={screenRef} className="editor-shell first-place-screen">
    <header className="editor-topbar first-place-topbar">
      <button type="button" className="icon-button" onClick={() => void back()} disabled={saving || importBusy} aria-label={t('common.back')}><ArrowLeft size={20} /></button>
      <div className="editor-title"><strong>{guide.city}</strong>{context && <span className="first-place-context">{context}</span>}</div>
    </header>
    <section className="first-place-body">
      {!importOpen && <h1>{t('first.question')}</h1>}
      {!draft.selected && !importOpen && <><p className="first-place-examples">{t('first.examples')}</p><p className="first-place-reassurance">{t('first.reassurance')}</p></>}
      {!draft.selected ? <>
        {!importOpen && <>
        <div className="search-box">
          <Search size={19} aria-hidden="true" />
          <input ref={inputRef} type="text" inputMode="search" enterKeyHint="search" maxLength={300} value={draft.query} aria-label={t('common.search')} placeholder={t('add.searchFirst', { city: guide.city })} onChange={event => update({ query: event.target.value })} />
          {draft.query && <button type="button" className="icon-button" onClick={() => update({ query: '' })} aria-label={t('common.clear')}><X size={17} /></button>}
        </div>
        {isLivePlaceSearchEnabled && <div className="search-attribution">{t('add.attribution')} <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> · © OpenStreetMap contributors</div>}
        {!isLivePlaceSearchEnabled && <div className="config-warning compact">{appConfig.cloudEnabled ? t('add.searchNotConfigured') : t('add.demo')}</div>}
        {loading && <p className="search-status" role="status">{t('add.searching')}</p>}
        {failed && <div className="status-message error" role="alert">{t('add.searchUnavailable')} <button type="button" className="text-button" onClick={() => setSearchAttempt(value => value + 1)}>{t('request.retry')}</button></div>}
        {!loading && !failed && results.length > 0 && <div className="search-results" aria-label={t('first.results')}>
          {results.map(result => <button type="button" key={`${result.id}-${result.lat}`} onClick={() => choose(result)}><span><strong>{result.name}</strong><small>{result.address}</small></span></button>)}
        </div>}
        {!loading && !failed && draft.query.trim().length >= 2 && !results.length && <p className="search-status" role="status">{t('add.noMatches')}</p>}
        {error && <p className="status-message error" role="alert">{t(error)}</p>}
        </>}
        <RecommendationImport guide={guide} scope={scope} first open={importOpen} onOpenChange={setImportOpen} onBusyChange={value => { importBusyRef.current = value; setImportBusy(value) }} onSave={onSave} onDone={place => { if (place) { clearFirstPlaceDraft(scope); onSaved(place) } else setImportOpen(false) }} />
      </> : <>
        <article className="first-place-selected">
          <div className="first-place-selected-heading">
            <h2 ref={titleRef} tabIndex={-1}>{draft.selected.name}</h2>
            <button type="button" className="text-button first-place-change" disabled={saving} aria-label={t('first.changePlace')} onClick={() => { focusSearch.current = true; update({ selected: null }) }}>{t('first.change')}</button>
          </div>
          <p className="first-place-address">{draft.selected.address}</p>
          <label htmlFor="first-place-note">{t('first.note')} <span>{t('add.optional')}</span></label>
          <textarea id="first-place-note" rows={2} maxLength={5000} value={draft.note} disabled={saving} placeholder={t('first.notePlaceholder')} onChange={event => update({ note: event.target.value })} />
        </article>
        {error && <p className="status-message error" role="alert">{t(error)}</p>}
        <button type="button" className="primary-button first-place-save" disabled={saving} onClick={() => void save()}>{t(saving ? 'add.saving' : error ? 'first.retrySave' : 'first.savePlace')}</button>
        {saving && <p className="sr-only" role="status">{t('first.savingHelp')}</p>}
      </>}
      {(!durable || storageUnavailable) && <p className="status-message error" role="alert">{t('first.storageWarning')}</p>}
      {localOnly && durable && !storageUnavailable && <p className="first-place-privacy">{t('first.localDraft')}</p>}
    </section>
  </main>
}
