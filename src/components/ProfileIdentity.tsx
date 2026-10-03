import { AccessibleDialog } from './AccessibleDialog'
import { useEffect, useMemo, useState } from 'react'
import { Check, LoaderCircle, X } from 'lucide-react'
import { isProfileHandleAvailable, normalizeProfileHandle, updateProfileIdentity } from '../services/guideRepository'
import { useI18n } from '../i18n'
import type { Profile } from '../types'
import { BrandLockup } from './BrandLockup'
import { LanguageToggle } from './LanguageToggle'

const RESERVED_HANDLES = new Set(['creator', 'login', 'edit', 'preview', 'explore', 'feedback', 'guide', 'guides', 'admin', 'api', 'auth', 'settings', 'account', 'about', 'help', 'ask', 'request', 'respond', 'finish-request'])

function sanitizeHandleDraft(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
    .slice(0, 40)
}

type Availability = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid'

type Props = {
  profile: Profile
  suggestedDisplayName?: string
  dismissible?: boolean
  onSaved: (profile: Profile) => void
  onClose?: () => void
}

export function ProfileIdentity({ profile, suggestedDisplayName = '', dismissible = false, onSaved, onClose }: Props) {
  const { t } = useI18n()
  const initialName = profile.onboardingComplete ? profile.displayName : (suggestedDisplayName || profile.displayName)
  const [displayName, setDisplayName] = useState(initialName)
  const [handle, setHandle] = useState(profile.slug)
  const [availability, setAvailability] = useState<Availability>('idle')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cleanHandle = useMemo(() => normalizeProfileHandle(handle), [handle])
  const handleChanged = cleanHandle !== profile.slug
  const isReserved = RESERVED_HANDLES.has(cleanHandle)
  const localHandleValid = cleanHandle.length >= 3 && cleanHandle.length <= 40 && !isReserved

  useEffect(() => {
    if (!localHandleValid) {
      setAvailability('invalid')
      return
    }
    if (!handleChanged) {
      setAvailability('available')
      return
    }

    let active = true
    setAvailability('checking')
    const timer = window.setTimeout(async () => {
      try {
        const available = await isProfileHandleAvailable(cleanHandle, profile.id)
        if (active) setAvailability(available ? 'available' : 'unavailable')
      } catch {
        if (active) setAvailability('idle')
      }
    }, 320)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [cleanHandle, handleChanged, localHandleValid, profile.id])

  const save = async () => {
    if (busy) return
    const name = displayName.trim()
    if (!name) {
      setError('profile.nameRequired')
      return
    }
    if (!localHandleValid || availability === 'unavailable' || availability === 'checking') return

    setBusy(true)
    setError(null)
    try {
      const updated = await updateProfileIdentity(name, cleanHandle)
      onSaved(updated)
    } catch (caught) {
      const message = String((caught as { message?: string }).message ?? '')
      setError(message.includes('already taken') || message.includes('duplicate') ? 'profile.taken' : 'error.profile')
    } finally {
      setBusy(false)
    }
  }

  const handleMessage = (() => {
    if (isReserved) return t('profile.reserved')
    if (cleanHandle.length > 0 && cleanHandle.length < 3) return t('profile.min3')
    if (availability === 'checking') return t('profile.checking')
    if (availability === 'unavailable') return t('profile.taken')
    if (availability === 'available' && handleChanged) return t('profile.available')
    return t('profile.randomHelp')
  })()

  return (
    <AccessibleDialog className={dismissible ? 'profile-overlay' : 'profile-onboarding-shell'} enabled={dismissible} labelledBy="profile-title" onClose={() => onClose?.()}>
      {!dismissible && (
        <header className="profile-onboarding-topbar">
          <BrandLockup compact />
          <LanguageToggle compact />
        </header>
      )}
      <section className="profile-card">
        {dismissible && <button className="icon-button profile-close" onClick={onClose} aria-label={t('profile.close')}><X size={19} /></button>}
        {dismissible && <div className="profile-language"><LanguageToggle compact /></div>}
        {dismissible && <BrandLockup className="profile-brand" />}
        <div className="profile-eyebrow">{profile.onboardingComplete ? t('profile.yourProfile') : t('profile.welcome')}</div>
        <h1 id="profile-title">{profile.onboardingComplete ? t('profile.editTitle') : t('profile.setupTitle')}</h1>
        <p className="profile-intro">{t('profile.intro')}</p>

        <div className="profile-fields">
          <label className="profile-field">
            <span>{t('profile.nameLabel')}</span>
            <input
              value={displayName}
              onChange={event => setDisplayName(event.target.value)}
              placeholder="Boris"
              maxLength={80}
              autoFocus={!displayName}
              autoComplete="name"
            />
            <small>{t('profile.nameHelp')}</small>
          </label>

          <label className="profile-field">
            <span>{t('profile.linkLabel')}</span>
            <div className="handle-input">
              <span className="handle-prefix">anyones.guide/</span>
              <input
                value={handle}
                onChange={event => setHandle(sanitizeHandleDraft(event.target.value))}
                onBlur={() => setHandle(cleanHandle)}
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                aria-describedby="handle-help"
              />
            </div>
            <small id="handle-help" className={`handle-help ${availability === 'unavailable' || availability === 'invalid' ? 'error' : availability === 'available' && handleChanged ? 'available' : ''}`}>
              {availability === 'checking' && <LoaderCircle size={12} className="spin" />}
              {availability === 'available' && handleChanged && <Check size={12} />}
              {handleMessage}
            </small>
          </label>
        </div>

        {profile.onboardingComplete && handleChanged && <div className="profile-alias-note">{t('profile.aliasHelp')}</div>}
        {error && <div className="status-message error" role="alert">{t(error)}</div>}

        <button
          className="primary-button profile-save"
          onClick={() => void save()}
          disabled={busy || !displayName.trim() || !localHandleValid || availability === 'checking' || availability === 'unavailable'}
        >
          {busy ? t('profile.saving') : profile.onboardingComplete ? t('profile.save') : t('profile.continue')}
        </button>
      </section>
    </AccessibleDialog>
  )
}
