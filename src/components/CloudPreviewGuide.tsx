import { PageError } from './PageError'
import { useEffect, useState } from 'react'
import { getGuideById } from '../services/guideRepository'
import { useI18n } from '../i18n'
import type { Coordinates, Guide } from '../types'
import { PublicGuide } from './PublicGuide'

type Props = {
  guideId: string
  userId: string
  userLocation: Coordinates | null
  locationStatus: 'idle' | 'loading' | 'ready' | 'denied' | 'error'
  onRequestLocation: () => void
  onNavigate: (path: string) => void
}

export function CloudPreviewGuide({ guideId, userId, userLocation, locationStatus, onRequestLocation, onNavigate }: Props) {
  const { t } = useI18n()
  const [guide, setGuide] = useState<Guide | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setGuide(null); setError(null)
    getGuideById(guideId)
      .then(next => active && setGuide(next))
      .catch(() => active && setError(t('error.loadBody')))
    return () => { active = false }
  }, [guideId])

  if (error) return <PageError onNavigate={onNavigate} />
  if (!guide) return <main className="center-state"><div className="loading-dot" /><p>{t('common.loading')}</p></main>
  if (guide.ownerId !== userId) return <PageError onNavigate={onNavigate} title={t('error.owner')} />

  return <PublicGuide guide={guide} userLocation={userLocation} locationStatus={locationStatus} onRequestLocation={onRequestLocation} onNavigate={onNavigate} editPath={`/edit/${guide.id}`} topActionPath="/creator" topActionLabel={t('nav.guides')} trackUsage={false} />
}
