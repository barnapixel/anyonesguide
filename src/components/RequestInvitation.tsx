import { useEffect, useRef, useState } from 'react'
import { BrandLockup } from './BrandLockup'
import { LanguageToggle } from './LanguageToggle'
import { DestinationPicker } from './DestinationPicker'
import { PageError } from './PageError'
import type { DestinationSearchResult } from '../types'
import { useI18n } from '../i18n'
import { categories } from '../data/demo'
import { createGuestDraft, findInvitationDraft, saveGuestDraft } from '../services/guestDrafts'
import { readStoredInvitation } from '../services/requestRepository'
import { readInvitation, requestShareContent, type GuideInvitation } from '../utils/requestLinks'

type InvitationState = { status: 'loading' } | { status: 'missing' } | { status: 'error' } | { status: 'ready'; invitation: GuideInvitation }

export function RequestInvitation({ invitationId, search, onNavigate }: { invitationId?: string; search: string; onNavigate: (path: string) => void }) {
  const { t } = useI18n()
  const [state, setState] = useState<InvitationState>({ status: 'loading' })
  useEffect(() => {
    let active = true
    if (!invitationId) {
      setState({ status: 'ready', invitation: readInvitation(search) })
      return
    }
    setState({ status: 'loading' })
    void readStoredInvitation(invitationId).then(invitation => {
      if (active) setState(invitation ? { status: 'ready', invitation } : { status: 'missing' })
    }).catch(() => { if (active) setState({ status: 'error' }) })
    return () => { active = false }
  }, [invitationId, search])
  if (state.status === 'loading') return <main className="center-state" role="status"><div className="loading-dot" /><p>{t('common.loading')}</p></main>
  if (state.status === 'missing') return <PageError onNavigate={onNavigate} title={t('request.invitationMissing')} body={t('request.invitationMissingBody')} />
  if (state.status === 'error') return <PageError onNavigate={onNavigate} title={t('request.invitationLoadError')} body={t('error.pageBody')} />
  return <InvitationContent key={state.invitation.id ?? search} invitation={state.invitation} hasLocaleHint={Boolean(state.invitation.id) || new URLSearchParams(search).has('lang')} onNavigate={onNavigate} />
}

function InvitationContent({ invitation, hasLocaleHint, onNavigate }: { invitation: GuideInvitation; hasLocaleHint: boolean; onNavigate: (path: string) => void }) {
  const { t, locale, setLocale } = useI18n()
  const name = invitation.name || t('request.friend')
  const existingDraft = findInvitationDraft(name, invitation.city, undefined, invitation.id)
  const starting = useRef(false)
  const start = (destination: DestinationSearchResult) => {
    if (starting.current) return
    starting.current = true
    const draft = findInvitationDraft(name, invitation.city, undefined, invitation.id)
      ?? createGuestDraft(destination, name, invitation.city, categories, invitation.id, !invitation.name)
    saveGuestDraft(draft)
    onNavigate(`/respond/${draft.id}`)
  }
  const title = requestShareContent(invitation.name, invitation.city, locale).title
  useEffect(() => { if (hasLocaleHint) setLocale(invitation.locale) }, [hasLocaleHint, invitation.locale, setLocale])
  useEffect(() => {
    document.title = `${title}. Anyone’s Guide`
    return () => { document.title = 'Anyone’s Guide' }
  }, [title])
  return <main className="request-shell">
    <header className="simple-page-header"><BrandLockup compact onClick={() => onNavigate('/')} /><div className="simple-page-header-spacer" /><LanguageToggle compact /></header>
    <section className="request-content">
      <div className="home-eyebrow">{t('request.invitationEyebrow')}</div>
      <h1>{title}</h1>
      <p className="request-intro">{t('request.invitationBody')}</p>
      {invitation.city && <p className="request-city-hint">{t('request.requestedCity', { city: invitation.city })}</p>}
      {existingDraft && <div className="request-card request-resume"><h2>{existingDraft.guide.city}</h2><p>{t('request.placeSummary', { count: existingDraft.guide.places.length })}</p><button className="secondary-button" onClick={() => onNavigate(`/respond/${existingDraft.id}`)}>{t('request.resume')}</button></div>}
      {!existingDraft && <div className="request-card">{invitation.destination
        ? <><p className="request-selected-destination">{invitation.destination.city} · {invitation.destination.country}</p><button type="button" className="primary-button" onClick={() => start(invitation.destination!)}>{t('request.addRecommendations')}</button></>
        : <DestinationPicker key={invitation.city} initialQuery={invitation.city} onPick={start} />}
        <p className="request-small">{t('request.noAccountYet')}</p></div>}
    </section>
  </main>
}
