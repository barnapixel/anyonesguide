import { ExternalLink, MapPin, Star, X } from 'lucide-react'
import { distanceMeters, formatDistance } from '../utils/distance'
import { mapsUrl } from '../utils/maps'
import { trackEvent } from '../services/analytics'
import { useI18n } from '../i18n'
import { AccessibleDialog } from './AccessibleDialog'
import type { Category, Coordinates, Place } from '../types'
export function PlaceSheet({ place, category, userLocation, onClose, guideId }: { place: Place; category?: Category; userLocation: Coordinates | null; onClose: () => void; guideId?: string }) {
  const { t, locale, categoryLabel } = useI18n()
  const distance = userLocation ? formatDistance(distanceMeters(userLocation, place), locale) : null
  return <AccessibleDialog className="sheet-backdrop" labelledBy="place-sheet-title" onClose={onClose}>
    <section className="place-sheet">
      <div className="sheet-handle" />
      <div className="sheet-titlebar"><h2 id="place-sheet-title">{place.name}</h2><button className="icon-button sheet-close" onClick={onClose} aria-label={t('common.close')}><X size={20} /></button></div>
      <div className="sheet-scroll">
        {place.isStarred && <p className="sheet-author-pick"><Star size={15} fill="currentColor" aria-hidden="true" />{t('star.label')}</p>}
        <div className="sheet-meta">{category ? categoryLabel(category) : place.subtitle}{distance ? ` · ${distance} ${t('place.away')}` : ''}</div>
        {place.note && <p className="sheet-note">“{place.note}”</p>}
        <div className="address-row"><MapPin size={18} /><span>{place.address}</span></div>
      </div>
      <a className="primary-button" href={mapsUrl(place)} target="_blank" rel="noreferrer" onClick={() => { if (guideId) trackEvent('maps_handoff', guideId, { placeId: place.id }) }}>{t('place.openMaps')} <ExternalLink size={17} /></a>
    </section>
  </AccessibleDialog>
}
