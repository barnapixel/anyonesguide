import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Share2 } from 'lucide-react'
import { BrandLockup } from './BrandLockup'
import { LanguageToggle } from './LanguageToggle'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n'
import { appConfig } from '../config'
import { getMyProfile } from '../services/guideRepository'
import { createInvitation } from '../services/requestRepository'
import { invitationPath, requestShareContent, type GuideInvitation } from '../utils/requestLinks'
import { shareUrl } from '../utils/share'

type PendingInvitation = { signature: string; key: string; record?: GuideInvitation & { id: string } }

export function AskForGuide({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { user, loading } = useAuth()
  const { t, locale } = useI18n()
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [resolvedUser, setResolvedUser] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const pendingRef = useRef<PendingInvitation | null>(null)
  const generation = useRef(0)
  useEffect(() => {
    let active = true
    generation.current++
    pendingRef.current = null
    setName(''); setNotice(''); setError(''); setResolvedUser(null)
    if (!user) return
    void getMyProfile(user.id).then(profile => {
      if (active) { setName(profile.onboardingComplete ? profile.displayName : ''); setResolvedUser(user.id) }
    }).catch(() => { if (active) { setResolvedUser(user.id); setError(t('request.profileUnavailable')) } })
    return () => { active = false; generation.current++ }
  }, [user?.id])
  const disabled = busy || loading || Boolean(user && resolvedUser !== user.id) || !appConfig.cloudEnabled
  const ensureInvitation = async () => {
    const signature = JSON.stringify([user?.id ?? null, name.trim(), city.trim(), locale])
    if (pendingRef.current?.signature !== signature) pendingRef.current = { signature, key: crypto.randomUUID() }
    const pending = pendingRef.current!
    if (!pending.record) pending.record = await createInvitation(pending.key, name, city, locale)
    return pending.record
  }
  const run = async (preview: boolean) => {
    if (disabled || busyRef.current) return
    busyRef.current = true; setBusy(true); setNotice(''); setError('')
    const current = generation.current
    let sharing = false
    try {
      const invitation = await ensureInvitation()
      if (current !== generation.current) return
      const path = invitationPath(invitation.id, invitation.shortCode)
      if (preview) { onNavigate(path); return }
      sharing = true
      const result = await shareUrl({ ...requestShareContent(invitation.name, invitation.city, invitation.locale), url: window.location.origin + path })
      if (current === generation.current && result !== 'cancelled') setNotice(t(result === 'copied' ? 'request.copied' : 'request.invitationShared'))
    } catch { if (current === generation.current) setError(t(sharing ? 'request.shareError' : 'request.invitationCreateError')) }
    finally { busyRef.current = false; setBusy(false) }
  }
  const share = (event: FormEvent) => { event.preventDefault(); void run(false) }
  return <main className="request-shell">
    <header className="simple-page-header"><BrandLockup compact onClick={() => onNavigate('/')} /><div className="simple-page-header-spacer" /><div className="simple-page-actions"><button className="icon-button" onClick={() => onNavigate('/')} aria-label={t('common.back')}><ArrowLeft size={20} /></button><LanguageToggle compact /></div></header>
    <section className="request-content">
      <h1>{t('request.askTitle')}</h1><p className="request-intro">{t('request.askBody')}</p>
      <form className="request-card request-form" onSubmit={share}>
        <label htmlFor="request-name">{t(user ? 'request.publicName' : 'request.nameOptional')}</label><input id="request-name" value={name} readOnly={Boolean(user)} disabled={busy} onChange={event => setName(event.target.value)} maxLength={80} autoComplete="given-name" placeholder={t('request.namePlaceholder')} aria-describedby="request-name-help" />
        <p id="request-name-help" className="request-small">{t(user ? 'request.publicNameHelp' : 'request.anonymousHelp')}</p>
        <label htmlFor="request-city">{t('request.cityOptional')}</label><input id="request-city" value={city} disabled={busy} onChange={event => setCity(event.target.value)} maxLength={120} placeholder={t('request.cityPlaceholder')} />
        <p className="request-share-preview">{requestShareContent(name, city, locale).title}</p>
        {!appConfig.cloudEnabled && <p className="request-small">{t('request.invitationUnavailable')}</p>}
        <button className="primary-button" type="submit" disabled={disabled}><Share2 size={17} />{t(busy ? 'request.preparingInvitation' : 'request.shareInvitation')}</button>
        <button className="text-button" type="button" disabled={disabled} onClick={() => void run(true)}>{t('request.openInvitation')}</button>
        {notice && <p className="status-message success" role="status">{notice}</p>}{error && <p className="status-message error" role="alert">{error}</p>}
      </form>
    </section>
  </main>
}
