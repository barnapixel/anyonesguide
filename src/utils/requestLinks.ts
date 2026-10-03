import type { Locale } from '../types'

export type GuideInvitation = { id?: string; shortCode?: string; name: string; city: string; locale: Locale }

export const invitationIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const invitationCodePattern = /^[A-Za-z0-9_-]{12}$/

export function invitationPath(id: string, shortCode?: string) {
  if (!invitationIdPattern.test(id)) throw new Error('Invalid invitation ID.')
  if (shortCode !== undefined && !invitationCodePattern.test(shortCode)) throw new Error('Invalid invitation code.')
  return `/request/${shortCode ?? id}`
}

export function isStoredInvitation(value: unknown): value is GuideInvitation & { id: string } {
  if (!value || typeof value !== 'object') return false
  const invitation = value as GuideInvitation
  return typeof invitation.id === 'string' && invitationIdPattern.test(invitation.id)
    && (invitation.shortCode === undefined || (typeof invitation.shortCode === 'string' && invitationCodePattern.test(invitation.shortCode)))
    && typeof invitation.name === 'string' && invitation.name.length <= 80
    && typeof invitation.city === 'string' && invitation.city.length <= 120
    && (invitation.locale === 'en' || invitation.locale === 'pl')
}

export function readInvitation(search: string): GuideInvitation {
  const params = new URLSearchParams(search)
  return {
    name: (params.get('name') ?? '').trim().slice(0, 80),
    city: (params.get('city') ?? '').trim().slice(0, 120),
    locale: params.get('lang') === 'pl' ? 'pl' : 'en',
  }
}

export function requestPath(name: string, city: string, locale: Locale) {
  const params = new URLSearchParams({ name: name.trim().slice(0, 80), lang: locale })
  if (city.trim()) params.set('city', city.trim().slice(0, 120))
  return `/request?${params}`
}

export { requestShareContent } from '../../shared/share-copy.mjs'

export function authReturnUrl(origin: string, path = '/creator') {
  const url = new URL(path, origin)
  if (url.origin !== origin || !['/creator', '/finish-request'].includes(url.pathname)) {
    throw new Error('Invalid sign-in return path.')
  }
  url.hash = ''
  return url.href
}
