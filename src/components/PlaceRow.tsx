import { Star } from 'lucide-react'
import { useI18n } from '../i18n'
import type { Category, Coordinates, Place } from '../types'
import { placeStreet } from '../utils/placeLocation'

type Props = {
  place: Place
  category?: Category
  city?: string
  country?: string
  userLocation: Coordinates | null
  onClick: () => void
}

export function PlaceRow({ place, city, country, onClick }: Props) {
  const { t } = useI18n()
  const street = placeStreet(place, city, country)
  return (
    <button className="place-row" onClick={onClick}>
      <span className="place-copy">
        <span className="place-title">{place.name}{place.isStarred && <span className="author-pick-icon" role="img" aria-label={t('star.label')}><Star size={16} fill="currentColor" aria-hidden="true" /></span>}</span>
        {place.note && <span className="place-note">{place.note}</span>}
        {street && <span className="place-meta">{street}</span>}
      </span>
    </button>
  )
}
