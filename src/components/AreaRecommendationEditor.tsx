import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ArrowLeft, MapPin, Minus, Plus, Search, X } from 'lucide-react'
import { AttributionControl, Map, Marker } from 'maplibre-gl'
import { getGuideMapStyle } from './GuideMap'
import { createPlaceMarkerElement } from '../utils/mapMarkers'
import { AccessibleDialog } from './AccessibleDialog'
import { useSearch } from '../hooks/useSearch'
import { useI18n } from '../i18n'
import { areaSearchResult, clearAreaDraft, loadAreaDraft, saveAreaDraft, searchMapLocations, suggestAreaNames, type AreaDraft } from '../services/areaRecommendations'
import type { Coordinates, Guide, Place, PlaceSearchResult } from '../types'

type Props = {
  guide: Guide
  scope: string
  existing?: Place
  onClose: () => void
  onSave: (result: PlaceSearchResult, note: string) => Promise<unknown>
  onSaved?: (place: Place) => void
}
export function AreaRecommendationEditor({ guide, scope, existing, onClose, onSave, onSaved }: Props) {
  const { t, locale } = useI18n()
  const uid = useId(), draftScope = `${scope}:${existing?.id ?? 'new'}`
  const [draft, setDraft] = useState<AreaDraft>(() => loadAreaDraft(draftScope) ?? {
    id: existing?.externalId && /^[0-9a-f-]{36}$/i.test(existing.externalId) ? existing.externalId : crypto.randomUUID(),
    point: existing ? { lat: existing.lat, lng: existing.lng } : guide.center,
    name: existing?.name ?? '', note: existing?.note ?? '', kind: existing?.recommendationKind === 'street' ? 'street' : 'area',
    confirmed: Boolean(existing), nameEdited: Boolean(existing), updatedAt: Date.now(),
  })
  const latest = useRef(draft); latest.current = draft
  const [durable, setDurable] = useState(true)
  const [stage, setStage] = useState<'map' | 'details'>(draft.confirmed ? 'details' : 'map')
  const stageRef = useRef(stage); stageRef.current = stage
  const [query, setQuery] = useState('')
  const mapContainer = useRef<HTMLDivElement>(null), mapRef = useRef<Map | null>(null)
  const [mapReady, setMapReady] = useState(false), [mapFailed, setMapFailed] = useState(false), [mapAttempt, setMapAttempt] = useState(0)
  const [saving, setSaving] = useState(false), busy = useRef(false)
  const [error, setError] = useState(false), [lookupFailed, setLookupFailed] = useState(false), [looking, setLooking] = useState(false)
  const [suggestions, setSuggestions] = useState({ area: '', street: '' })
  const pendingLookup = useRef<AbortController | null>(null)
  const search = useCallback((value: string, signal: AbortSignal) => searchMapLocations(value, guide.center, signal), [guide.center])
  const { results, loading, failed } = useSearch(query, stage === 'map', search)
  const update = (patch: Partial<AreaDraft>) => setDraft(current => ({ ...current, ...patch, updatedAt: Date.now() }))
  const close = () => { if (!busy.current) onClose() }
  useEffect(() => { setDurable(saveAreaDraft(draftScope, draft)) }, [draftScope, draft])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (busy.current || !durable && (latest.current.name || latest.current.note)) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [durable])
  useEffect(() => () => pendingLookup.current?.abort(), [])
  useEffect(() => {
    if (!mapContainer.current) return
    let map: Map, active = true
    const markers: Marker[] = []
    setMapReady(false); setMapFailed(false)
    const timer = window.setTimeout(() => { if (active) setMapFailed(true) }, 8000)
    try {
      map = new Map({ container: mapContainer.current, style: getGuideMapStyle(), center: [latest.current.point.lng, latest.current.point.lat], zoom: existing ? 15 : 13, attributionControl: false })
      mapRef.current = map
      map.addControl(new AttributionControl({ compact: false }), 'bottom-left')
      map.on('load', () => { if (active) { clearTimeout(timer); setMapReady(true); setMapFailed(false); map.resize() } })
      map.on('error', () => { if (active) setMapFailed(true) })
      map.on('moveend', () => {
        if (!active || busy.current || stageRef.current !== 'map') return
        const center = map.getCenter()
        update({ point: { lat: center.lat, lng: center.lng }, confirmed: false })
      })
      for (const place of guide.places) {
        if (place.id === existing?.id) continue
        const pin = createPlaceMarkerElement(place, false, () => { map.easeTo({ center: [place.lng, place.lat], duration: 0 }) }, t('star.label'))
        pin.tabIndex = -1
        markers.push(new Marker({ element: pin }).setLngLat([place.lng, place.lat]).addTo(map))
      }
    } catch { clearTimeout(timer); setMapFailed(true) }
    return () => { active = false; clearTimeout(timer); markers.forEach(m => m.remove()); mapRef.current?.remove(); mapRef.current = null }
  }, [mapAttempt])
  useEffect(() => {
    if (stage === 'map') { const timer = window.setTimeout(() => mapRef.current?.resize(), 0); return () => clearTimeout(timer) }
  }, [stage])
  const confirm = () => {
    const map = mapRef.current
    if (!map || !mapReady || busy.current) return
    const center = map.getCenter(), point = { lat: center.lat, lng: center.lng }
    stageRef.current = 'details'; update({ point, confirmed: true }); setStage('details'); setQuery(''); setError(false)
    pendingLookup.current?.abort()
    const controller = new AbortController(); pendingLookup.current = controller
    const timer = window.setTimeout(() => controller.abort(), 6000)
    setLooking(true); setLookupFailed(false); setSuggestions({ area: '', street: '' })
    void suggestAreaNames(point, locale, controller.signal).then(names => {
      if (controller.signal.aborted) return
      setSuggestions(names)
      setDraft(current => ({ ...current, name: current.nameEdited ? current.name : names[current.kind], updatedAt: Date.now() }))
    }).catch(() => { if (pendingLookup.current === controller) setLookupFailed(true) }).finally(() => {
      clearTimeout(timer); if (pendingLookup.current === controller) setLooking(false)
    })
  }
  const save = async () => {
    if (busy.current || !latest.current.name.trim() || !latest.current.confirmed) return
    busy.current = true; pendingLookup.current?.abort(); setLooking(false); setSaving(true); setError(false)
    try {
      const checkpoint = { ...latest.current, attempted: true, updatedAt: Date.now() }; latest.current = checkpoint
      setDraft(checkpoint); setDurable(saveAreaDraft(draftScope, checkpoint))
      const place = await onSave(areaSearchResult(checkpoint), checkpoint.note)
      clearAreaDraft(draftScope)
      if (place && typeof place === 'object' && 'id' in place) onSaved?.(place as Place)
      onClose()
    } catch { setError(true) } finally { busy.current = false; setSaving(false) }
  }
  const adjust = () => { pendingLookup.current?.abort(); setLooking(false); stageRef.current = 'map'; setStage('map') }
  return <AccessibleDialog className="area-editor-dialog" labelledBy={uid} onClose={close}>
    <div className="area-editor">
      <header className="add-topbar"><button type="button" className="icon-button" disabled={saving} aria-label={t('common.back')} onClick={stage === 'details' ? adjust : close}><ArrowLeft size={20} /></button><strong id={uid}>{t(stage === 'map' ? 'area.chooseSpot' : 'area.details')}</strong><button type="button" className="icon-button" disabled={saving} aria-label={t('common.close')} onClick={close}><X size={20} /></button></header>
      <div className="area-map-step" hidden={stage !== 'map'}>
        <div className="area-map-search"><div className="search-box"><Search size={18} /><input aria-label={t('area.search')} placeholder={t('area.search')} value={query} maxLength={300} onChange={e => setQuery(e.target.value)} /></div>
          {loading && <p role="status">{t('add.searching')}</p>}{failed && <p role="alert">{t('add.searchUnavailable')}</p>}
          {results.length > 0 && <div className="search-results">{results.map(r => <button key={r.id} type="button" onClick={() => { mapRef.current?.easeTo({ center: [r.lng,r.lat], zoom: 15, duration: 0 }); setQuery('') }}><span><strong>{r.name}</strong><small>{r.address}</small></span></button>)}</div>}
        </div>
        <div className="area-map-container"><div className="area-map-canvas" ref={mapContainer} aria-label={t('area.mapLabel')} /><div className="area-fixed-pin" aria-hidden="true"><MapPin size={28} /></div><p className="area-map-instruction">{t('area.moveMap')}</p><div className="area-zoom"><button className="icon-button" type="button" aria-label={t('area.zoomIn')} onClick={() => mapRef.current?.zoomIn()}><Plus /></button><button className="icon-button" type="button" aria-label={t('area.zoomOut')} onClick={() => mapRef.current?.zoomOut()}><Minus /></button></div></div>
        <div className="area-map-actions"><p>{t('area.startHelp')}</p>{mapFailed && <p role="alert">{t('guide.mapError')} <button className="text-button" type="button" onClick={() => setMapAttempt(n => n + 1)}>{t('request.retry')}</button></p>}<button className="primary-button" type="button" disabled={!mapReady} onClick={confirm}>{t('area.useSpot')}</button></div>
      </div>
      {stage === 'details' && <form className="area-details" onSubmit={event => { event.preventDefault(); void save() }}>
        <button type="button" className="text-button" disabled={saving} onClick={adjust}>{t('area.adjustPin')}</button>
        <label htmlFor={`${uid}-name`}>{t('area.name')}</label><input id={`${uid}-name`} autoFocus required maxLength={300} value={draft.name} disabled={saving} onChange={e => update({ name: e.target.value, nameEdited: true })} />
        {looking && <p className="area-help" role="status">{t('area.naming')}</p>}
        {(lookupFailed || !looking && !suggestions[draft.kind] && !existing) && <p className="area-help">{t('area.manualName')}</p>}
        <fieldset disabled={saving}><legend>{t('area.type')}</legend><div className="area-type-options">{(['area','street'] as const).map(kind => <button type="button" key={kind} aria-pressed={draft.kind === kind} className={draft.kind === kind ? 'active' : ''} onClick={() => update({ kind, ...(!draft.nameEdited ? { name: suggestions[kind] } : {}) })}>{t('area.' + kind)}</button>)}</div></fieldset>
        {suggestions[draft.kind] && draft.name !== suggestions[draft.kind] && <button className="text-button" type="button" disabled={saving} onClick={() => update({ name: suggestions[draft.kind], nameEdited: false })}>{t('area.useName', { name: suggestions[draft.kind] })}</button>}
        <label htmlFor={`${uid}-note`}>{t('area.note')}</label><textarea id={`${uid}-note`} rows={4} maxLength={5000} value={draft.note} disabled={saving} placeholder={t('area.notePlaceholder')} onChange={e => update({ note: e.target.value })} />
        <p className="area-help">{t('area.sectionHelp')}</p>
        {!durable && <p role="alert">{t('first.storageWarning')}</p>}{error && <p role="alert">{t('first.saveError')}</p>}
        <button className="primary-button" type="submit" disabled={saving || !draft.name.trim()}>{t(saving ? 'add.saving' : 'area.save')}</button>
      </form>}
    </div>
  </AccessibleDialog>
}
