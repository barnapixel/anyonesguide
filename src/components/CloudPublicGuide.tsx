import { PageError } from './PageError'
import { useEffect, useRef, useState } from 'react'
import { getPublicGuide } from '../services/guideRepository'
import { trackEvent } from '../services/analytics'
import { listSavedGuides, removeSavedGuide } from '../services/savedGuides'
import { useI18n } from '../i18n'
import type { Coordinates, Guide } from '../types'
import { PublicGuide } from './PublicGuide'

type Props = {
  profileSlug: string
  localeHint?: string
  guideSlug: string
  userLocation: Coordinates | null
  locationStatus: 'idle' | 'loading' | 'ready' | 'denied' | 'error'
  onRequestLocation: () => void
  onNavigate: (path: string) => void
  viewerUserId?: string
  viewerResolved?: boolean
}

export function CloudPublicGuide({ profileSlug, guideSlug, userLocation, locationStatus, onRequestLocation, onNavigate, viewerUserId, viewerResolved = true, localeHint }: Props) {
  const { t, setLocale } = useI18n()
  useEffect(() => { if (localeHint === 'en' || localeHint === 'pl') setLocale(localeHint) }, [localeHint, setLocale])
  const [guide, setGuide] = useState<Guide | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shortcutError, setShortcutError] = useState(false)
  const [shortcutRemoved, setShortcutRemoved] = useState(false)
  const trackedOpenRef = useRef<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true); setError(null); setGuide(null); setShortcutError(false); setShortcutRemoved(false)
    getPublicGuide(profileSlug, guideSlug)
      .then(next => {
        if (!active) return
        setGuide(next)
      })
      .catch(() => active && setError(t('error.loadBody')))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [profileSlug, guideSlug])

  useEffect(() => {
    if (!guide || !viewerResolved || guide.ownerId === viewerUserId || trackedOpenRef.current === guide.id) return
    trackedOpenRef.current = guide.id
    trackEvent('public_guide_opened', guide.id, { profileSlug, guideSlug })
  }, [guide, guideSlug, profileSlug, viewerResolved, viewerUserId])

  if (loading) return <main className="center-state"><div className="loading-dot" /><p>{t('common.loading')}</p></main>
  if (error) return <PageError onNavigate={onNavigate} />
  if (!guide) {
    const shortcut = !shortcutRemoved && listSavedGuides().find(item => item.profileSlug === profileSlug && item.guideSlug === guideSlug)
    const removeShortcut = () => {
      if (!shortcut) return
      try {
        removeSavedGuide(shortcut.guideId)
        setShortcutRemoved(true)
        setShortcutError(false)
      } catch {
        setShortcutError(true)
      }
    }
    return <main className="center-state">
      <h1>{shortcut ? t('saved.unavailableTitle') : t('guide.notFound')}</h1>
      <p>{shortcut ? t('saved.unavailableBody') : shortcutRemoved ? t('saved.removed') : t('guide.notFoundBody')}</p>
      {shortcutError && <p className="saved-action-error" role="alert">{t('saved.storageError')}</p>}
      {shortcut && <button className="secondary-button" onClick={removeShortcut}>{t('saved.remove')}</button>}
      <button className="secondary-button" onClick={() => onNavigate(shortcut || shortcutRemoved ? '/saved' : '/')}>{shortcut || shortcutRemoved ? t('saved.viewSaved') : t('guide.home')}</button>
    </main>
  }

  const isOwner = Boolean(viewerUserId && guide.ownerId === viewerUserId)
  return (
    <PublicGuide
      guide={guide}
      userLocation={userLocation}
      locationStatus={locationStatus}
      onRequestLocation={onRequestLocation}
      onNavigate={onNavigate}
      editPath={isOwner ? `/edit/${guide.id}` : undefined}
      topActionPath="/creator"
      topActionLabel={viewerUserId ? t('nav.guides') : t('nav.create')}
      recipientCreateAction={viewerResolved && !viewerUserId}
      trackUsage={viewerResolved && !isOwner}
      allowSave={!isOwner}
    />
  )
}
