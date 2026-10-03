import { PageError } from './PageError'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Share2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n'
import { clearGuestDraft, loadGuestDraft, saveGuestDraft, type GuestDraft } from '../services/guestDrafts'
import { claimGuestDraft, prepareGuestDraft, recoverGuestDraft } from '../services/requestRepository'
import { getGuideById, getMyProfile } from '../services/guideRepository'
import { guideShareContent, guideShareUrl, shareUrl } from '../utils/share'
import { BrandLockup } from './BrandLockup'
import { LanguageToggle } from './LanguageToggle'
import { Login } from './Login'
import { ProfileIdentity } from './ProfileIdentity'
import type { Guide, Profile } from '../types'

export function FinishRequestPage({ draftId, search, onNavigate }: { draftId?: string; search: string; onNavigate: (path: string, replace?: boolean) => void }) {
  const auth = useAuth()
  const { t, locale, setLocale } = useI18n()
  const params = new URLSearchParams(search)
  const id = draftId || params.get('draft') || ''
  const local = id ? loadGuestDraft(id) : null
  const key = params.get('key') || local?.key || ''
  const guideId = params.get('guide') || ''
  const [draft, setDraft] = useState<GuestDraft | null>(local)
  const [guide, setGuide] = useState<Guide | null>(null)
  const [publishedRecipient, setPublishedRecipient] = useState<{ name: string; anonymous: boolean } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const busyRef = useRef(false)
  const [storageWarning, setStorageWarning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [retry, setRetry] = useState(0)
  const failure = (caught: unknown, fallback: string) => {
    const e = caught as { message?: string; code?: string }
    if (e.message === 'SNAPSHOT_TOO_LARGE') return t('request.tooLarge')
    if (e.message === 'WRONG_ACCOUNT') return t('request.wrongAccount')
    if (e.code === '42501' || e.message?.includes('expired') || e.message === 'Draft unavailable.') return t('request.expired')
    return t(fallback)
  }
  const clearRecoveryKey = () => { const url = new URL(window.location.href); url.searchParams.delete('key'); window.history.replaceState({}, '', url.pathname + url.search) }
  const requesterName = draft?.requesterName || publishedRecipient?.name || params.get('name')?.slice(0, 80) || t('request.friend')
  const requesterAnonymous = draft?.requesterAnonymous ?? publishedRecipient?.anonymous ?? (params.get('anonymous') === '1')

  useEffect(() => { const lang = new URLSearchParams(search).get('lang'); if (lang === 'pl' || lang === 'en') setLocale(lang) }, [search, setLocale])
  useEffect(() => {
    if (auth.loading) return
    let active = true
    setLoading(true); setError(''); setGuide(null); setProfile(null); setDraft(local); setPublishedRecipient(null)
    const load = async () => {
      const nextProfile = auth.user ? await getMyProfile(auth.user.id) : null
      let nextDraft = local
      let nextGuide: Guide | null = null
      if (guideId) {
        if (!auth.user) throw new Error('Sign in to reopen your saved guide.')
        nextGuide = await getGuideById(guideId)
      } else if (!nextDraft) {
        if (!id || !key) throw new Error('Draft unavailable.')
        const recovered = await recoverGuestDraft(id, key)
        nextDraft = recovered.draft
        if (nextDraft && active) { const durable = saveGuestDraft(nextDraft); setStorageWarning(!durable); if (durable) clearRecoveryKey() }
        if (recovered.guideId) nextGuide = await getGuideById(recovered.guideId)
      }
      if (nextGuide && nextGuide.ownerId !== auth.user?.id) throw new Error('WRONG_ACCOUNT')
      if (active) { if (nextDraft && params.has('key')) { const durable = saveGuestDraft(nextDraft); setStorageWarning(!durable); if (durable) clearRecoveryKey() } setProfile(nextProfile); setDraft(nextDraft); setGuide(nextGuide) }
    }
    void load().catch(caught => { if (active) setError(failure(caught, 'error.loadBody')) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [auth.loading, auth.user?.id, id, key, guideId, retry])

  const back = () => onNavigate(draft ? `/respond/${draft.id}` : '/creator')
  const beforeSignIn = async () => {
    if (!draft) throw new Error(t('request.recoverError'))
    await prepareGuestDraft(draft)
    return `/finish-request?${new URLSearchParams({ draft: draft.id, key: draft.key, lang: locale, ...(draft.requesterAnonymous ? { anonymous: '1' } : { name: draft.requesterName }) })}`
  }
  const publish = async () => {
    if (!draft || busyRef.current) return
    busyRef.current = true; setBusy(true); setError('')
    try {
      await prepareGuestDraft(draft)
      const savedId = await claimGuestDraft(draft.id, draft.key)
      // Keep the local copy until the new cloud guide can be read successfully.
      const savedGuide = await getGuideById(savedId)
      clearGuestDraft(draft.id)
      setPublishedRecipient({ name: draft.requesterName, anonymous: Boolean(draft.requesterAnonymous) })
      setGuide(savedGuide); setDraft(null)
      onNavigate(`/finish-request?${new URLSearchParams({ guide: savedId, lang: locale, ...(draft.requesterAnonymous ? { anonymous: '1' } : { name: draft.requesterName }) })}`, true)
    } catch (caught) { setError(failure(caught, 'request.publishError')) }
    finally { busyRef.current = false; setBusy(false) }
  }
  const send = async () => {
    if (!guide || !guide.profileSlug || busyRef.current) return
    busyRef.current = true; setBusy(true)
    setError(''); setNotice('')
    const { title } = guideShareContent(guide.authorName, guide.city, locale, 'owner')
    try {
      const result = await shareUrl({ title, text: t(requesterAnonymous ? 'request.responseAnonymous' : 'request.responseText', { title, city: guide.city, name: requesterName }), url: guideShareUrl(window.location.origin, `/${encodeURIComponent(guide.profileSlug)}/${encodeURIComponent(guide.slug)}`, locale) })
      if (result !== 'cancelled') setNotice(t(result === 'copied' ? 'request.copied' : 'request.guideShared'))
    } catch { setError(t('request.shareError')) } finally { busyRef.current = false; setBusy(false) }
  }

  if (loading || auth.loading) return <main className="center-state"><div className="loading-dot" /><p>{t('common.loading')}</p></main>
  if (!auth.user && guideId) {
    const returnPath = `/finish-request?${new URLSearchParams({ guide: guideId, lang: locale, ...(requesterAnonymous ? { anonymous: '1' } : { name: requesterName }) })}`
    return <Login onBack={() => onNavigate('/')} heading={t('request.reopenTitle')} body={t('request.reopenBody')} onGoogle={() => auth.signInWithGoogle(returnPath)} onMagicLink={email => auth.sendMagicLink(email, returnPath)} />
  }
  if (!draft && !guide) return <PageError onNavigate={onNavigate} title={t('request.missingTitle')} body={error || t('request.missingBody')} />
  if (draft && !draft.guide.places.length) return <main className="center-state"><h1>{t('request.addFirst')}</h1><p>{t('request.addFirstBody')}</p><button className="primary-button compact-button" onClick={back}>{t('nav.edit')}</button></main>
  if (!auth.user && draft) return <Login onBack={back} heading={t(requesterAnonymous ? 'request.signInAnonymous' : 'request.signInTitle', { name: requesterName })} body={t('request.signInBody')} successMessage={t('request.checkEmail')} onGoogle={async () => auth.signInWithGoogle(await beforeSignIn())} onMagicLink={async email => auth.sendMagicLink(email, await beforeSignIn())} />
  if (profile && !profile.onboardingComplete && !guide) return <ProfileIdentity profile={profile} suggestedDisplayName={String(auth.user?.user_metadata?.full_name ?? auth.user?.user_metadata?.name ?? '').trim()} onSaved={setProfile} />
  return <main className="request-shell">
    <header className="simple-page-header"><BrandLockup compact onClick={() => onNavigate('/')} /><div className="simple-page-header-spacer" /><div className="simple-page-actions"><button className="icon-button" onClick={back} aria-label={t('common.back')}><ArrowLeft size={20} /></button><LanguageToggle compact /></div></header>
    <section className="request-content">
      <h1>{t(guide?.visibility === 'draft' ? 'request.previewTitle' : guide ? 'request.linkReady' : requesterAnonymous ? 'request.finishAnonymous' : 'request.finishTitle', { name: requesterName, city: guide?.city ?? '' })}{guide && guide.visibility !== 'draft' && <> <span aria-hidden="true">✨</span></>}</h1>
      <p className="request-intro">{t(guide ? requesterAnonymous ? 'request.sendBodyAnonymous' : 'request.sendBody' : 'request.finishBody', { name: requesterName })}</p>
      {storageWarning && <p role="alert">{t('request.storageWarning')}</p>}
      <div className="request-card">
        <h2>{guide?.city || draft?.guide.city}</h2><p>{t('request.placeSummary', { count: guide?.places.length ?? draft?.guide.places.length ?? 0 })}</p>
        {!guide && <p className="request-small">{t('request.unlistedHint')}</p>}
        {guide?.visibility === 'draft' && <p className="status-message error">{t('request.guideNowPrivate')}</p>}
        {error && <p className="status-message error" role="alert">{error}</p>}{error && !profile && <button className="text-button" onClick={() => setRetry(value => value + 1)}>{t('request.retry')}</button>}{notice && <p className="status-message success" role="status">{notice}</p>}
        {guide ? <><button className="primary-button" onClick={() => void send()} disabled={busy || guide.visibility === 'draft'}><Share2 size={17} />{t(requesterAnonymous ? 'request.sendAnonymous' : 'request.sendTo', { name: requesterName })}</button><button className="secondary-button" onClick={() => onNavigate(`/edit/${guide.id}`)}>{t('nav.edit')}</button><button className="text-button" onClick={() => onNavigate('/creator')}>{t('nav.guides')}</button></> : <button className="primary-button" onClick={() => void publish()} disabled={busy || !profile?.onboardingComplete}>{t(busy ? 'request.creatingLink' : 'request.createLink')}</button>}
      </div>
    </section>
  </main>
}
