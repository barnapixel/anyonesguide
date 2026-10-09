import { FirstPlace } from './FirstPlace'
import { loadImportDraft } from '../services/recommendationImport'
import { loadFirstPlaceDraft } from '../services/firstPlaceDraft'
import { AuthorStar } from './AuthorStar'
import { categoryPromptKey, editorCategory } from '../utils/category'
import { orderCategoryPlaces } from '../utils/guideEditing'
import { SaveFeedback } from './SaveFeedback'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { ArrowDown, ArrowLeft, ArrowUp, ChevronDown, GripVertical, MoreHorizontal, Share2, Trash2 } from 'lucide-react'
import { CategoryChips } from './CategoryChips'
import { trackEvent } from '../services/analytics'
import { guideShareContent, guideShareUrl, shareUrl } from '../utils/share'
import { useI18n } from '../i18n'
import type { CategoryId, Guide, GuideVisibility, Place, PlaceSearchResult } from '../types'

const NOTE_SOFT_LIMIT = 200

type Props = {
  guide: Guide
  initialCategory?: string
  addedPlaceId?: string
  firstPlaceContext?: string
  onSaveFirstPlace: (result: PlaceSearchResult, note: string) => Promise<Place>
  onNavigate: (path: string) => void
  onUpdatePlace: (id: string, patch: Partial<Place>) => void
  onUpdateGuideNote: (note: string) => void
  onFlushGuideNote?: () => Promise<void>
  storageUnavailable?: boolean
  guideNoteSaveStatus?: 'idle' | 'saving' | 'saved' | 'error'
  onRemovePlace: (id: string) => void
  onMovePlace: (id: string, direction: -1 | 1) => void
  onReorderPlace: (id: string, targetId: string) => void
  onUpdateVisibility?: (visibility: GuideVisibility) => Promise<void> | void
  backPath: string
  previewPath: string
  publicPath: string
  addPath: string
  saveError?: string | null
  guestMode?: boolean
  shareLabel?: string
  onShare?: () => Promise<void>
  contextBanner?: ReactNode
}

type DragPreview = {
  placeId: string
  name: string
  subtitle?: string
  left: number
  top: number
  width: number
  offsetY: number
}

export function Editor({ guide, onNavigate, onUpdatePlace, onUpdateGuideNote, onFlushGuideNote, guideNoteSaveStatus, storageUnavailable, onRemovePlace, onMovePlace, onReorderPlace, onUpdateVisibility, backPath, previewPath, publicPath, addPath, saveError, guestMode = false, shareLabel, onShare, contextBanner, initialCategory, addedPlaceId, firstPlaceContext, onSaveFirstPlace }: Props) {
  const { t, locale, categoryLabel } = useI18n()
  const [category, setCategory] = useState<CategoryId | 'all'>(() => editorCategory(guide.categories, initialCategory, !guide.places.length))
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [visibilityOpen, setVisibilityOpen] = useState(false)
  const [visibilityBusy, setVisibilityBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null)
  const shareBusy = useRef(false)
  const [sharing, setSharing] = useState(false)
  const draggingIdRef = useRef<string | null>(null)
  const dragCategoryRef = useRef<CategoryId | null>(null)
  const dragStarRef = useRef(false)
  const lastDragTargetRef = useRef<string | null>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const editorRef = useRef<HTMLElement | null>(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const empty = guide.places.length === 0
  const firstPlaceScope = `${guestMode ? 'guest' : guide.ownerId ? 'owner:' + guide.ownerId : 'local'}:${guide.id}`
  const [starting, setStarting] = useState(() => {
    const pending = loadImportDraft(firstPlaceScope)
    return empty || Boolean(loadFirstPlaceDraft(firstPlaceScope)?.selected) || Boolean(pending?.first && pending.rows.some(row => row.attempted && row.chosen && !row.savedId))
  })
  const [firstSavedId, setFirstSavedId] = useState<string | undefined>()
  const focusPlaceId = firstSavedId ?? addedPlaceId
  useEffect(() => {
    if (empty) { setStarting(true); setFirstSavedId(undefined); setNotice(null) }
  }, [empty])
  useEffect(() => {
    if (!firstSavedId && (empty || initialCategory !== undefined)) setCategory(editorCategory(guide.categories, initialCategory, empty))
  }, [guide.id, empty, initialCategory, firstSavedId])
  useLayoutEffect(() => {
    if (!focusPlaceId || !guide.places.some(place => place.id === focusPlaceId)) return
    const row = [...(editorRef.current?.querySelectorAll<HTMLElement>('.editor-row') ?? [])].find(element => element.dataset.placeId === focusPlaceId)
    const title = row?.querySelector<HTMLElement>('.editor-place-title-row > strong')
    title?.focus({ preventScroll: true })
    title?.scrollIntoView?.({ block: 'center', behavior: 'instant' as ScrollBehavior })
  }, [focusPlaceId, starting])
  const previousRectsRef = useRef(new Map<string, DOMRect>())

  const filtered = useMemo(() => category === 'all' ? guide.places : guide.places.filter(place => place.categoryId === category), [guide.places, category])
  const grouped = [...guide.categories]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(item => ({ ...item, places: orderCategoryPlaces(filtered.filter(place => place.categoryId === item.id)) }))
    .filter(group => group.places.length > 0)

  useEffect(() => {
    if (!openMenu && !visibilityOpen) return
    const dismiss = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Element && (target.closest('.row-menu-wrap') || target.closest('.visibility-menu-wrap'))) return
      setOpenMenu(null)
      setVisibilityOpen(false)
    }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { if (openMenu) { const row = [...document.querySelectorAll<HTMLElement>('.editor-row')].find(el => el.dataset.placeId === openMenu); row?.querySelector<HTMLElement>('.row-menu-wrap > button')?.focus() } else document.querySelector<HTMLElement>('.editor-visibility-button')?.focus(); setOpenMenu(null); setVisibilityOpen(false) } }
    document.addEventListener('keydown', escape)
    document.addEventListener('pointerdown', dismiss)
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape) }
  }, [openMenu, visibilityOpen])

  useLayoutEffect(() => {
    if (!previousRectsRef.current.size || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rows = document.querySelectorAll<HTMLElement>('.editor-row[data-place-id]')
    rows.forEach(row => {
      const id = row.dataset.placeId
      if (!id || id === draggingIdRef.current) return
      const previous = previousRectsRef.current.get(id)
      if (!previous) return
      const next = row.getBoundingClientRect()
      const deltaY = previous.top - next.top
      if (Math.abs(deltaY) < 1) return
      row.animate(
        [{ transform: `translateY(${deltaY}px)` }, { transform: 'translateY(0)' }],
        { duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' },
      )
    })
    previousRectsRef.current.clear()
  }, [guide.places])

  const captureRowPositions = () => {
    const next = new Map<string, DOMRect>()
    document.querySelectorAll<HTMLElement>('.editor-row[data-place-id]').forEach(row => {
      if (row.dataset.placeId) next.set(row.dataset.placeId, row.getBoundingClientRect())
    })
    previousRectsRef.current = next
  }

  const share = async () => {
    if (shareBusy.current || !guide.places.length) return
    shareBusy.current = true; setSharing(true); setNotice(null)
    let ready = false
    try {
    await onFlushGuideNote?.()
    ready = true
    if (onShare) { await onShare(); return }
    if (guide.visibility === 'draft') {
      setNotice(t('creator.draftShare'))
      return
    }
    const url = guideShareUrl(window.location.origin, publicPath, locale)
    const result = await shareUrl({ ...guideShareContent(guide.authorName, guide.city, locale, 'owner'), url })
    if (result === 'copied') setNotice(t('creator.linkCopied'))
    if (result && result !== 'cancelled') trackEvent('guide_shared', guide.id, { source: 'editor', method: result })
    } catch { setNotice(t(ready ? 'request.shareError' : 'save.error')) } finally { shareBusy.current = false; setSharing(false) }
  }

  const navigateAfterNoteSave = async (path: string) => {
    try { await onFlushGuideNote?.(); onNavigate(path) }
    catch { /* Keep the note visible so the author can retry. */ }
  }

  const changeVisibility = async (visibility: GuideVisibility) => {
    if (!onUpdateVisibility || visibility === guide.visibility) { setVisibilityOpen(false); return }
    setVisibilityBusy(true); setNotice(null)
    try {
      await onUpdateVisibility(visibility)
      trackEvent('guide_visibility_changed', guide.id, { visibility })
      setVisibilityOpen(false)
    } catch {
      setNotice(t('error.visibility'))
    } finally {
      setVisibilityBusy(false)
    }
  }

  const finishDrag = useCallback(() => {
    draggingIdRef.current = null
    dragCategoryRef.current = null
    lastDragTargetRef.current = null
    activePointerIdRef.current = null
    setDraggingId(null)
    setDragPreview(null)
    previousRectsRef.current.clear()
  }, [])

  const moveDrag = useCallback((event: PointerEvent) => {
    const activeId = draggingIdRef.current
    if (!activeId || activePointerIdRef.current !== event.pointerId) return
    event.preventDefault()
    setDragPreview(current => current ? { ...current, top: event.clientY - current.offsetY } : current)

    const edge = 90
    if (event.clientY < edge) window.scrollBy({ top: -10, behavior: 'auto' })
    else if (event.clientY > window.innerHeight - edge) window.scrollBy({ top: 10, behavior: 'auto' })

    const element = document.elementFromPoint(event.clientX, event.clientY)
    const row = element instanceof Element ? element.closest<HTMLElement>('.editor-row[data-place-id]') : null
    const targetId = row?.dataset.placeId
    const targetCategory = row?.dataset.categoryId as CategoryId | undefined
    if (!targetId || targetId === activeId || targetCategory !== dragCategoryRef.current || (row?.dataset.starred === 'true') !== dragStarRef.current || targetId === lastDragTargetRef.current) return

    captureRowPositions()
    onReorderPlace(activeId, targetId)
    lastDragTargetRef.current = targetId
  }, [onReorderPlace])

  useEffect(() => {
    if (!draggingId) return

    const end = (event: PointerEvent) => {
      if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) return
      finishDrag()
    }
    const cancel = () => finishDrag()
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') finishDrag() }
    const visibility = () => { if (document.visibilityState !== 'visible') finishDrag() }

    window.addEventListener('pointermove', moveDrag, { passive: false })
    window.addEventListener('pointerup', end, true)
    window.addEventListener('pointercancel', end, true)
    window.addEventListener('blur', cancel)
    window.addEventListener('keydown', escape)
    document.addEventListener('visibilitychange', visibility)

    return () => {
      window.removeEventListener('pointermove', moveDrag)
      window.removeEventListener('pointerup', end, true)
      window.removeEventListener('pointercancel', end, true)
      window.removeEventListener('blur', cancel)
      window.removeEventListener('keydown', escape)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [draggingId, finishDrag, moveDrag])

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, place: Place) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const row = event.currentTarget.closest<HTMLElement>('.editor-row')
    if (!row) return
    event.preventDefault()
    event.stopPropagation()
    const rect = row.getBoundingClientRect()
    activePointerIdRef.current = event.pointerId
    draggingIdRef.current = place.id
    dragCategoryRef.current = place.categoryId
    dragStarRef.current = Boolean(place.isStarred)
    lastDragTargetRef.current = place.id
    setDraggingId(place.id)
    setDragPreview({ placeId: place.id, name: place.name, subtitle: place.subtitle, left: rect.left, top: rect.top, width: rect.width, offsetY: event.clientY - rect.top })
    setOpenMenu(null)
  }

  const beginPlaceSearch = () => {
    const params = new URLSearchParams({ return: 'guide' })
    if (category !== 'all') params.set('category', category)
    else if (!filtered.length && emptyCategory) params.set('category', emptyCategory.id)
    void navigateAfterNoteSave(`${addPath}?${params}`)
  }
  const emptyCategory = guide.categories.find(item => item.id === category)
    ?? guide.categories.find(item => item.id === 'eat') ?? guide.categories[0]
  const guideNote = <details className="editor-guide-note" open={noteOpen} onToggle={event => setNoteOpen(event.currentTarget.open)}>
    <summary className="editor-guide-note-heading">
      <span className="editor-guide-note-copy">
        <strong>{t('editor.guideNoteLabel')}</strong>
        <small className="editor-guide-note-preview" aria-hidden={Boolean(guide.guideNote.trim())}>{guide.guideNote.trim() ? guide.guideNote : t('editor.guideNotePlaceholder')}</small>
      </span>
      <span className="editor-guide-note-meta">{!guide.guideNote.trim() && t('editor.guideNoteOptional')} <ChevronDown size={15} aria-hidden="true" /></span>
    </summary>
    <div className="editor-guide-note-content">
      <label className="sr-only" htmlFor="guide-note">{t('editor.guideNoteLabel')}</label>
      <p id="guide-note-help">{t('editor.guideNoteHelp')}</p>
      <textarea id="guide-note" aria-describedby="guide-note-help" rows={3} value={guide.guideNote} maxLength={guestMode ? 10000 : undefined} onChange={event => onUpdateGuideNote(event.target.value)} placeholder={t('editor.guideNotePlaceholder')} />
    </div>
  </details>

  const visibilityOptions: Array<{ value: GuideVisibility; label: string; help: string }> = [
    { value: 'draft', label: t('status.draft'), help: t('visibility.draftHelp') },
    { value: 'unlisted', label: t('status.unlisted'), help: t('visibility.unlistedHelp') },
    { value: 'public', label: t('status.public'), help: t('visibility.publicHelp') },
  ]

  if (starting) return <FirstPlace
    guide={guide}
    scope={firstPlaceScope}
    context={firstPlaceContext}
    localOnly={guestMode || !guide.ownerId}
    storageUnavailable={storageUnavailable}
    onBack={async () => { await onFlushGuideNote?.(); onNavigate(backPath) }}
    onSave={onSaveFirstPlace}
    onSaved={place => {
      setCategory('all')
      setFirstSavedId(place.id)
      setNotice(t(guestMode || !guide.ownerId ? 'first.localSaved' : 'first.saved'))
      setStarting(false)
    }}
  />

  return (
    <main ref={editorRef} className={`editor-shell ${draggingId ? 'is-dragging' : ''}`}>
      <header className="editor-topbar">
        <button className="icon-button" onClick={() => void navigateAfterNoteSave(backPath)} aria-label={t('common.back')}><ArrowLeft size={20} /></button>
        <div className="editor-title">
          <strong>{guide.city}</strong>
          {guestMode ? <span className="guest-draft-status">{t('request.privateDraft')}</span> : <div className="visibility-menu-wrap">
            <button className={`editor-visibility-button visibility-${guide.visibility}`} onClick={() => setVisibilityOpen(current => !current)} disabled={visibilityBusy} aria-expanded={visibilityOpen}>
              {t(`status.${guide.visibility}`)} <i /><ChevronDown size={12} />
            </button>
            {visibilityOpen && (
              <div className="visibility-menu">
                <strong>{t('visibility.title')}</strong>
                {visibilityOptions.map(option => (
                  <button key={option.value} className={guide.visibility === option.value ? 'active' : ''} onClick={() => void changeVisibility(option.value)}>
                    <span><b>{option.label}</b><small>{option.help}</small></span>
                    {guide.visibility === option.value && <i />}
                  </button>
                ))}
              </div>
            )}
          </div>}
        </div>
        <div className="editor-top-actions">
          <button className="small-pill" disabled={empty} onClick={() => void navigateAfterNoteSave(previewPath)}>{t('editor.preview')}</button>
          <button className="small-pill" disabled={sharing || empty} aria-describedby={guestMode && !guide.places.length ? "finish-help" : undefined} onClick={() => void share()}><Share2 size={14} /> {shareLabel || t('editor.share')}</button>
        </div>
      </header>
      {contextBanner}
      {guestMode && !guide.places.length && <p className="finish-help" id="finish-help">{t('request.finishHelp')}</p>}
      <SaveFeedback status={guideNoteSaveStatus} onRetry={onFlushGuideNote} storageUnavailable={storageUnavailable} />
      <div className="editor-chips"><CategoryChips active={category} onChange={setCategory} places={guide.places} categories={guide.categories} showEmpty /></div>
      {(saveError || notice) && <div role={notice && !saveError ? 'status' : 'alert'} className={`editor-save-error ${notice && !saveError ? 'notice' : ''}`}>{saveError ?? notice}</div>}
      <section className="editor-body">
        {!empty && guideNote}
        <div className="editor-places">
        {!filtered.length && <div className="editor-category">
          {emptyCategory && <h2>{categoryLabel(emptyCategory)}</h2>}
          <div className="editor-empty-prompt">
            <p className="editor-empty-question">{t(categoryPromptKey(emptyCategory?.id ?? 'other'))}</p>
            {empty && <p className="editor-empty-hint">{t('creation.startEnough')}</p>}
            <button className="primary-button" onClick={beginPlaceSearch}>{t('creation.findPlace')}</button>
          </div>
        </div>}
        {grouped.map(group => (
          <div className="editor-category" key={group.id}>
            <h2>{categoryLabel(group)} <span>· {group.places.length}</span></h2>
            {group.places.map(place => {
              const noteOver = place.note.length > NOTE_SOFT_LIMIT
              return (
                <article className={`editor-row ${draggingId === place.id ? 'drag-source' : ''}`} key={place.id} data-place-id={place.id} data-category-id={place.categoryId} data-starred={Boolean(place.isStarred)}>
                  <button className="drag-handle" type="button" aria-label={t('editor.reorder', { name: place.name })} title={t('editor.drag')} onPointerDown={event => startDrag(event, place)}>
                    <GripVertical size={17} />
                  </button>
                  <div className="editor-place-copy">
                    <div className="editor-place-title-row"><strong tabIndex={-1}>{place.name}</strong><AuthorStar place={place} disabled={Boolean(draggingId)} onChange={isStarred => { onUpdatePlace(place.id, { isStarred }); }} /></div>
                    <span className="editor-place-subtitle">{place.subtitle || categoryLabel(group)}</span>
                    <textarea value={place.note} rows={3} maxLength={guestMode ? 5000 : undefined} placeholder={t('editor.notePlaceholder')} onChange={event => onUpdatePlace(place.id, { note: event.target.value })} aria-label={t('editor.noteLabel', { name: place.name })} />
                    <span className={`note-guidance ${noteOver ? 'over' : ''}`}>{place.note.length} / {NOTE_SOFT_LIMIT}</span>
                  </div>
                  <div className="row-menu-wrap">
                    <button className="icon-button" onClick={() => setOpenMenu(openMenu === place.id ? null : place.id)} aria-expanded={openMenu === place.id} aria-label={t('editor.options', { name: place.name })}><MoreHorizontal size={19} /></button>
                    {openMenu === place.id && (
                      <div className="row-menu">
                        <label>{t('editor.category')} <ChevronDown size={13} /></label>
                        <select aria-label={t('editor.category')} value={place.categoryId} onChange={event => { onUpdatePlace(place.id, { categoryId: event.target.value as CategoryId }); setOpenMenu(null) }}>
                          {guide.categories.map(item => <option value={item.id} key={item.id}>{categoryLabel(item)}</option>)}
                        </select>
                        <button disabled={group.places.filter(p => Boolean(p.isStarred) === Boolean(place.isStarred))[0]?.id === place.id} onClick={() => { onMovePlace(place.id, -1); setOpenMenu(null) }}><ArrowUp size={15} /> {t('editor.moveUp')}</button>
                        <button disabled={group.places.filter(p => Boolean(p.isStarred) === Boolean(place.isStarred)).at(-1)?.id === place.id} onClick={() => { onMovePlace(place.id, 1); setOpenMenu(null) }}><ArrowDown size={15} /> {t('editor.moveDown')}</button>
                        <button className="danger" onClick={() => { onRemovePlace(place.id); setOpenMenu(null) }}><Trash2 size={15} /> {t('editor.remove')}</button>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ))}
        </div>
      </section>
      {filtered.length > 0 && <button className="floating-add" onClick={beginPlaceSearch}>{t('editor.addPlace')}</button>}
      {dragPreview && (
        <div className="drag-preview" style={{ left: dragPreview.left, top: dragPreview.top, width: dragPreview.width }} aria-hidden="true">
          <GripVertical size={17} /><div><strong>{dragPreview.name}</strong>{dragPreview.subtitle && <span>{dragPreview.subtitle}</span>}</div>
        </div>
      )}
    </main>
  )
}
