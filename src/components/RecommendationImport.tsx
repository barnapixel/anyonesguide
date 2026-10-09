import { useCallback, useEffect, useId, useRef, useState, type ClipboardEvent } from 'react'
import { Search, Upload, X } from 'lucide-react'
import { useI18n } from '../i18n'
import { useSearch } from '../hooks/useSearch'
import { isLivePlaceSearchEnabled, searchPlaces } from '../services/placeSearch'
import { clearImportDraft, extractRecommendations, loadImportDraft, prepareScreenshot, saveImportDraft, type ImportDraft, type ImportRow } from '../services/recommendationImport'
import type { Guide, Place, PlaceSearchResult } from '../types'

type Props = {
  guide: Guide
  scope: string
  first?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onBusyChange: (busy: boolean) => void
  onSave: (result: PlaceSearchResult, note: string) => Promise<Place>
  onDone: (place?: Place) => void
}

export function RecommendationImport({ guide, scope, first = false, open, onOpenChange, onBusyChange, onSave, onDone }: Props) {
  const { t } = useI18n()
  const Heading = first ? 'h1' : 'h2'
  const uid = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const entryRef = useRef<HTMLButtonElement>(null)
  const focusEntry = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const busyRef = useRef(false)
  const callbacks = useRef({ onSave, onBusyChange, onDone, guide })
  callbacks.current = { onSave, onBusyChange, onDone, guide }
  const [draft, setDraft] = useState<ImportDraft>(() => loadImportDraft(scope) ?? { rows: [], updatedAt: Date.now() })
  const draftRef = useRef(draft)
  const [durable, setDurable] = useState(true)
  const [textMode, setTextMode] = useState(false)
  const [text, setText] = useState('')
  const [image, setImage] = useState<{ data: string; mimeType: string } | null>(null)
  const [imagePreparing, setImagePreparing] = useState(false)
  const imageVersion = useRef(0)
  const [busy, setBusy] = useState<'reading' | 'saving' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [attempt, setAttempt] = useState(0)
  const search = useCallback((value: string, signal: AbortSignal) => searchPlaces(value, guide.center, signal), [guide.center, attempt])
  const { results, loading, failed } = useSearch(query, Boolean(open && activeId && !busy), search)
  const [lastSaved, setLastSaved] = useState<Place | undefined>()
  const mounted = useRef(true)

  const commit = (rows: ImportRow[]) => {
    const next = { rows, updatedAt: Date.now(), first }
    draftRef.current = next
    const saved = saveImportDraft(scope, next)
    if (mounted.current) { setDraft(next); setDurable(saved) }
  }
  const patch = (id: string, change: Partial<ImportRow>) => commit(draftRef.current.rows.map(row => row.id === id ? { ...row, ...change } : row))
  const setWorking = (value: 'reading' | 'saving' | null) => {
    busyRef.current = Boolean(value); setBusy(value); callbacks.current.onBusyChange(Boolean(value))
  }
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); imageVersion.current++; callbacks.current.onBusyChange(false) } }, [])
  useEffect(() => {
    if (open) headingRef.current?.focus({ preventScroll: true })
    else if (focusEntry.current) { focusEntry.current = false; entryRef.current?.focus() }
  }, [open, draft.rows.length > 0])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (busyRef.current || !durable && draftRef.current.rows.length) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [durable])
  const close = () => {
    if (busyRef.current) return
    imageVersion.current++; setImagePreparing(false); setImage(null); setText(''); setError(null)
    focusEntry.current = true; onOpenChange(false)
  }
  const acceptFile = async (file: File) => {
    if (busyRef.current) return
    const version = ++imageVersion.current
    setImagePreparing(true); setImage(null); setError(null); setTextMode(false)
    try {
      const prepared = await prepareScreenshot(file)
      if (version === imageVersion.current) setImage(prepared)
    } catch (error) { if (version === imageVersion.current) setError(error instanceof Error ? error.message : 'import.imageRead') }
    finally { if (version === imageVersion.current) setImagePreparing(false) }
  }
  const paste = (event: ClipboardEvent) => {
    const images = [...event.clipboardData.items].filter(item => item.kind === 'file' && item.type.startsWith('image/'))
    if (!images.length) return
    event.preventDefault()
    if (images.length !== 1) { setError('import.oneImage'); return }
    const file = images[0].getAsFile()
    if (file) void acceptFile(file)
  }
  const read = async () => {
    if (busyRef.current || imagePreparing || (textMode ? !text.trim() : !image)) return
    controller.current?.abort()
    const abort = new AbortController(); controller.current = abort
    const timeout = window.setTimeout(() => abort.abort(), 25000)
    setWorking('reading'); setError(null)
    try {
      const rows = await extractRecommendations(textMode ? { kind: 'text', text } : { kind: 'image', ...image! }, guide, abort.signal)
      if (abort.signal.aborted) return
      if (!rows.length) { setError('import.empty'); return }
      commit(rows.map(row => ({ ...row, id: crypto.randomUUID(), match: null, chosen: false, note: '' })))
      imageVersion.current++; setImage(null); setText(''); setActiveId(null); setQuery('')
    } catch (error) { if (mounted.current) setError(abort.signal.aborted ? 'import.failed' : error instanceof Error && error.message.startsWith('import.') ? error.message : 'import.failed') }
    finally { window.clearTimeout(timeout); if (mounted.current && controller.current === abort) setWorking(null) }
  }
  const find = (row: ImportRow) => {
    setActiveId(row.id); setQuery([row.name, row.address || row.city || guide.city].filter(Boolean).join(' ')); setError(null)
  }
  const choose = (row: ImportRow, match: PlaceSearchResult) => {
    if (row.attempted) return
    const existing = callbacks.current.guide.places.find(place => place.externalId === match.id || place.name === match.name && place.address === match.address)
    const repeated = draftRef.current.rows.find(other => other.id !== row.id && other.match?.id === match.id)
    if (existing || repeated) { setError('import.duplicate'); return }
    patch(row.id, { match, chosen: true }); setActiveId(null); setQuery(''); setError(null)
  }
  const selected = draft.rows.filter(row => row.chosen && row.match && !row.savedId)
  const savedRows = draft.rows.filter(row => row.savedId)
  const save = async () => {
    if (busyRef.current || !selected.length) return
    const pending = [...selected]
    setWorking('saving'); setError(null); setActiveId(null)
    let last: Place | undefined
    let complete = false
    try {
      // Sequential existing save paths retain idempotency and the durable note queue.
      for (const row of pending) {
        if (!mounted.current) return
        patch(row.id, { attempted: true })
        last = await callbacks.current.onSave(row.match!, row.note)
        if (mounted.current) setLastSaved(last)
        patch(row.id, { savedId: last.id, chosen: false })
      }
      if (!mounted.current) return
      clearImportDraft(scope); draftRef.current = { rows: [], updatedAt: Date.now() }; setDraft(draftRef.current)
      complete = true
    } catch (error) {
      if (mounted.current) setError(error instanceof Error && error.message.includes('100') ? 'add.limit' : error instanceof Error && error.message === 'storage' ? 'first.storageSaveError' : 'import.saveFailed')
    } finally { if (mounted.current) setWorking(null) }
    if (complete && mounted.current) callbacks.current.onDone(last)
  }
  const finish = () => {
    const place = lastSaved ?? callbacks.current.guide.places.find(place => savedRows.some(row => row.savedId === place.id))
    clearImportDraft(scope); commit([]); clearImportDraft(scope); onDone(place)
  }

  const fileInput = <input ref={fileRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" tabIndex={-1} aria-label={t('import.chooseImage')} disabled={Boolean(busy)} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void acceptFile(file) }} />

  if (!open) return <>{fileInput}<div className="import-entry">
    <button ref={entryRef} type="button" className="text-button import-entry-link" onClick={() => { onOpenChange(true); if (!draft.rows.length) fileRef.current?.click() }}><Upload size={17} aria-hidden="true" />{t(draft.rows.length ? 'import.resume' : first ? 'import.start' : 'import.add')}</button>
    {!first && <p>{t('import.sources')}</p>}
  </div></>

  return <>{fileInput}<section className="recommendation-import" onPaste={draft.rows.length ? undefined : paste} aria-busy={Boolean(busy)}>
    <div className="import-heading"><Heading ref={headingRef} tabIndex={-1}>{t(draft.rows.length ? 'import.review' : 'import.title')}</Heading><button type="button" className="icon-button" disabled={Boolean(busy)} onClick={close} aria-label={t('import.backSearch')}><X size={20} /></button></div>
    {!draft.rows.length ? <>
      <p className="import-help">{t('import.sourceHelp')}</p>
      <p className="import-small">{t('import.limitHint')}</p>
      {textMode ? <label className="import-text-label" htmlFor={`${uid}-text`}>{t('import.pasteLabel')}<textarea id={`${uid}-text`} rows={5} maxLength={12000} value={text} disabled={Boolean(busy)} onChange={event => { setText(event.target.value); setError(null) }} placeholder={t('import.pastePlaceholder')} /></label> : <>
        {image && <img className="import-image" alt={t('import.imagePreview')} src={`data:${image.mimeType};base64,${image.data}`} />}
        <button type="button" className="secondary-button import-file" disabled={Boolean(busy) || imagePreparing} onClick={() => fileRef.current?.click()}><Upload size={18} aria-hidden="true" />{t(imagePreparing ? 'import.preparing' : image ? 'import.changeImage' : 'import.chooseImage')}</button>
        <p className="import-small">{t('import.imageHelp')}</p>
      </>}
      <button type="button" className="text-button import-switch" disabled={Boolean(busy)} onClick={() => { imageVersion.current++; setImagePreparing(false); setImage(null); setTextMode(!textMode); setError(null) }}>{t(textMode ? 'import.useImage' : 'import.useText')}</button>
      <p className="import-small">{t('import.disclosure')}</p>
      <button type="button" className="primary-button import-save" disabled={Boolean(busy) || imagePreparing || (textMode ? !text.trim() : !image)} onClick={() => void read()}>{t(busy === 'reading' ? 'import.reading' : 'import.read')}</button>
    </> : <>
      <p className="import-help">{t('import.reviewHelp', { city: guide.city })}</p>
      <div className="import-rows">
        {draft.rows.map(row => <article key={row.id} className="import-row">
          <div className="import-row-heading">
            <label className="import-check"><input type="checkbox" aria-label={t('import.include', { name: row.name })} checked={row.chosen} disabled={!row.match || Boolean(row.attempted) || Boolean(row.savedId) || Boolean(busy)} onChange={event => patch(row.id, { chosen: event.target.checked })} /><span><strong>{row.match?.name || row.name}</strong><small>{row.match?.address || [row.address, row.city].filter(Boolean).join(', ')}</small></span></label>
            {row.savedId ? <span className="import-saved">{t('add.saved')}</span> : <button type="button" className="text-button" disabled={Boolean(busy)} onClick={() => activeId === row.id ? setActiveId(null) : find(row)}>{t(row.match ? 'import.edit' : 'import.find')}</button>}
          </div>
          {row.sourceNote && <p className="import-quote" title={row.sourceNote}>{row.sourceNote}</p>}
          {activeId === row.id && !row.savedId && <div className="import-row-detail">
            {row.attempted ? <p className="import-small">{t('import.finishSave')}</p> : <>
            <label className="sr-only" htmlFor={`${uid}-search`}>{t('common.search')}</label>
            <div className="search-box"><Search size={18} aria-hidden="true" /><input id={`${uid}-search`} value={query} maxLength={300} onChange={event => { setQuery(event.target.value); setError(null) }} placeholder={t('add.searchFirst', { city: guide.city })} /></div>
            {isLivePlaceSearchEnabled && <div className="search-attribution">{t('add.attribution')} <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> · © OpenStreetMap contributors</div>}
            {loading && <p role="status" className="import-small">{t('add.searching')}</p>}
            {failed && <p role="alert">{t('add.searchUnavailable')} <button type="button" className="text-button" onClick={() => setAttempt(value => value + 1)}>{t('request.retry')}</button></p>}
            {!loading && !failed && <div className="search-results import-matches">{results.map(match => <button type="button" key={match.id} onClick={() => choose(row, match)}><span><strong>{match.name}</strong><small>{match.address}</small></span></button>)}</div>}
            {!loading && !failed && query.trim().length >= 2 && !results.length && <p role="status" className="import-small">{t('import.noMatch')}</p>}
            </>}
            {row.sourceNote && <details className="import-source"><summary>{t('import.sourceText')}</summary><blockquote>{row.sourceNote}</blockquote><button type="button" className="text-button" onClick={() => patch(row.id, { note: row.sourceNote })}>{t('import.useNote')}</button></details>}
            <label className="import-note" htmlFor={`${uid}-note`}>{t('first.note')} <span>{t('add.optional')}</span><textarea id={`${uid}-note`} rows={2} maxLength={5000} value={row.note} placeholder={t('first.notePlaceholder')} onChange={event => patch(row.id, { note: event.target.value })} /></label>
            {!row.attempted && <button type="button" className="text-button import-switch" onClick={() => { commit(draftRef.current.rows.filter(other => other.id !== row.id)); setActiveId(null); setQuery(''); setError(null) }}>{t('import.remove')}</button>}
          </div>}
        </article>)}
      </div>
      <button type="button" className="primary-button import-save" disabled={Boolean(busy) || !selected.length} onClick={() => void save()}>{t(busy === 'saving' ? 'add.saving' : 'import.save', { count: selected.length })}</button>
      {savedRows.length > 0 && <button type="button" className="secondary-button import-save" disabled={Boolean(busy)} onClick={finish}>{t('creation.openGuide')}</button>}
      <button type="button" className="text-button import-switch" disabled={Boolean(busy)} onClick={() => { clearImportDraft(scope); commit([]); clearImportDraft(scope); setActiveId(null); setError(null) }}>{t('import.startOver')}</button>
      {!durable && <p className="status-message error" role="alert">{t('import.storageWarning')}</p>}
    </>}
    {busy && <p className="import-small" role="status">{t(busy === 'reading' ? 'import.reading' : 'add.saving')}</p>}
    {error && <p className="status-message error" role="alert">{t(error)}</p>}
    <button type="button" className="text-button import-switch" disabled={Boolean(busy)} onClick={close}>{t('import.backSearch')}</button>
  </section></>
}
