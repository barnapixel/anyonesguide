import { Star } from 'lucide-react'
import { distanceMeters, formatDistance } from '../utils/distance'
import { useI18n } from '../i18n'
import type { Category, Coordinates, Place } from '../types'
import { compactPlaceLocation } from '../utils/placeLocation'

type Props = {
  place: Place
  category?: Category
  city?: string
  country?: string
  userLocation: Coordinates | null
  onClick: () => void
}

export function PlaceRow({ place, category, city, country, userLocation, onClick }: Props) {
  const { categoryLabel, t, locale } = useI18n()
  const distance = userLocation ? formatDistance(distanceMeters(userLocation, { lat: place.lat, lng: place.lng }), locale) : null
  return (
    <button className="place-row" onClick={onClick}>
      <span className="place-copy">
        <span className="place-title">{place.name}{place.isStarred && <span className="author-pick-icon" role="img" aria-label={t('star.label')}><Star size={16} fill="currentColor" aria-hidden="true" /></span>}</span>
        {place.note && <span className="place-note">{place.note}</span>}
        <span className="place-meta">{compactPlaceLocation(place, city, country) || (category ? categoryLabel(category) : '')}{distance ? ` · ${distance} ${t('place.away')}` : ''}</span>
      </span>
    </button>
  )
}
