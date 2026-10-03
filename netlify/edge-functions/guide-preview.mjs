import { guideTitle, guideDescription, requestShareContent, requestDescription } from '../../shared/share-copy.mjs'

// Shared routes have metadata in their initial HTML, for every user agent.
// This also covers messaging crawlers whose user-agent names may change.
// The publishable key respects Supabase's public RLS policies: drafts stay private.
export const config = { path: '/*' }

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character])

function replaceMeta(html, attribute, name, content) {
  const escaped = escapeHtml(content)
  const pattern = new RegExp(`<meta\\s+${attribute}="${name}"\\s+content="[^"]*"\\s*/?>`, 'i')
  const tag = `<meta ${attribute}="${name}" content="${escaped}" />`
  return pattern.test(html) ? html.replace(pattern, () => tag) : html.replace('</head>', () => `    ${tag}\n  </head>`)
}

export function renderGuidePreview(html, { author, city, url, locale = 'en', note = '' }) {
  const title = guideTitle(author, city, locale)
  const description = guideDescription(author, city, locale, note)
  let result = html.replace(/<title>[^<]*<\/title>/i, () => `<title>${escapeHtml(title)}. Anyone’s Guide</title>`)
  for (const [attribute, key, value] of [
    ['name', 'description', description],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:type', 'article'],
    ['property', 'og:url', url],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
  ]) result = replaceMeta(result, attribute, key, value)
  return renderImageMetadata(result, url, locale, 'guide')
}

export function renderRequestPreview(html, { name, city, locale, url }) {
  const { title } = requestShareContent(name, city, locale)
  const description = requestDescription(name, city, locale)
  let result = html.replace(/<title>[^<]*<\/title>/i, () => `<title>${escapeHtml(title)}. Anyone’s Guide</title>`)
  for (const [attribute, key, value] of [
    ['name', 'description', description], ['property', 'og:title', title],
    ['property', 'og:description', description], ['property', 'og:type', 'website'],
    ['property', 'og:url', url], ['name', 'twitter:title', title], ['name', 'twitter:description', description],
  ]) result = replaceMeta(result, attribute, key, value)
  return renderImageMetadata(result, url, locale, 'request')
}

function renderImageMetadata(html, url, locale, kind) {
  const language = locale === 'pl' ? 'pl' : 'en'
  const image = new URL(`/social/${kind}-${language}-v083.png`, url).href
  const alt = language === 'pl'
    ? kind === 'request' ? 'Anyone’s Guide. Podziel się ulubionymi miejscami.' : 'Anyone’s Guide. Miejsca polecane przez znajomych.'
    : kind === 'request' ? 'Anyone’s Guide. Share your favourite places.' : 'Anyone’s Guide. Places recommended by friends.'
  let result = html.replace(/<html\s+lang="[^"]*"/i, `<html lang="${language}"`)
  for (const [attribute, key, value] of [
    ['property', 'og:site_name', 'Anyone’s Guide'],
    ['property', 'og:locale', language === 'pl' ? 'pl_PL' : 'en_GB'],
    ['property', 'og:image', image], ['property', 'og:image:type', 'image/png'],
    ['property', 'og:image:width', '1200'], ['property', 'og:image:height', '630'],
    ['property', 'og:image:alt', alt], ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:image', image], ['name', 'twitter:image:alt', alt],
  ]) result = replaceMeta(result, attribute, key, value)
  return result
}

async function previewResponse(context, render) {
  const response = await context.next()
  if (!response.headers.get('content-type')?.includes('text/html')) return response
  const html = render(await response.text())
  const headers = new Headers(response.headers)
  for (const header of ['content-length', 'content-encoding', 'etag']) headers.delete(header)
  headers.set('cache-control', 'no-store')
  return new Response(html, { status: response.status, statusText: response.statusText, headers })
}

async function getRows(baseUrl, key, table, filters) {
  const url = new URL(`/rest/v1/${table}`, baseUrl)
  url.search = new URLSearchParams({ ...filters, limit: '1' }).toString()
  const response = await fetch(url, {
    headers: { apikey: key, accept: 'application/json' },
    signal: AbortSignal.timeout(3000),
  })
  if (!response.ok) throw new Error(`Preview lookup failed: ${response.status}`)
  return response.json()
}

export default async function guidePreview(request, context) {
  if (request.method !== 'GET') return
  const requestUrl = new URL(request.url)
  if (requestUrl.pathname === '/') {
    const locale = requestUrl.searchParams.get('lang') === 'pl' ? 'pl' : 'en'
    const canonical = new URL('/', request.url).href
    const description = locale === 'pl'
      ? 'Osobiste polecenia od ludzi, którym ufasz.'
      : 'Personal city recommendations from people you trust.'
    return previewResponse(context, html => {
      let result = replaceMeta(html, 'property', 'og:url', canonical)
      result = replaceMeta(result, 'property', 'og:description', description)
      result = replaceMeta(result, 'name', 'description', description)
      return renderImageMetadata(result, canonical, locale, 'guide')
    })
  }
  if (requestUrl.pathname === '/request') {
    const name = (requestUrl.searchParams.get('name') || '').trim().slice(0, 80)
    const city = (requestUrl.searchParams.get('city') || '').trim().slice(0, 120)
    const locale = requestUrl.searchParams.get('lang') === 'pl' ? 'pl' : 'en'
    return previewResponse(context, html => renderRequestPreview(html, { name, city, locale, url: request.url }))
  }
  const invitationMatch = requestUrl.pathname.match(/^\/request\/([^/]+)\/?$/)
  if (requestUrl.pathname.startsWith('/request/')) {
    if (!invitationMatch) return
    const reference = invitationMatch[1]
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reference)
    if (!isUuid && !/^[A-Za-z0-9_-]{12}$/.test(reference)) return
    const baseUrl = Netlify.env.get('VITE_SUPABASE_URL')
    const key = Netlify.env.get('VITE_SUPABASE_PUBLISHABLE_KEY') || Netlify.env.get('VITE_SUPABASE_ANON_KEY')
    if (!baseUrl || !key) return
    try {
      const rpc = isUuid ? 'read_guide_invitation' : 'read_guide_invitation_by_code'
      const response = await fetch(new URL(`/rest/v1/rpc/${rpc}`, baseUrl), {
        method: 'POST', headers: { apikey: key, 'content-type': 'application/json' },
        body: JSON.stringify(isUuid ? { p_id: reference.toLowerCase() } : { p_code: reference }),
        signal: AbortSignal.timeout(3000),
      })
      if (!response.ok) return
      const invitation = await response.json()
      if (!invitation || typeof invitation.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invitation.id)
        || (isUuid ? invitation.id !== reference.toLowerCase() : invitation.shortCode !== reference)
        || (invitation.shortCode !== undefined && (typeof invitation.shortCode !== 'string' || !/^[A-Za-z0-9_-]{12}$/.test(invitation.shortCode)))
        || typeof invitation.name !== 'string' || invitation.name.length > 80
        || typeof invitation.city !== 'string' || invitation.city.length > 120 || !['en','pl'].includes(invitation.locale)) return
      // Preserve the shared address as its card identity. Query fields cannot spoof it.
      const canonical = new URL(request.url)
      canonical.pathname = `/request/${isUuid ? invitation.id : reference}`
      canonical.search = ''; canonical.hash = ''
      return previewResponse(context, html => renderRequestPreview(html, { ...invitation, url: canonical.href }))
    } catch { return }
  }
  const segments = requestUrl.pathname.split('/').filter(Boolean)
  if (segments.length !== 2 || segments.some(segment => !/^[a-z0-9-]{1,80}$/i.test(segment))) return
  const [profileSlug, guideSlug] = segments
  if (['edit', 'preview', 'login', 'creator', 'explore', 'feedback', 'respond', 'request'].includes(profileSlug)) return

  const baseUrl = Netlify.env.get('VITE_SUPABASE_URL')
  const key = Netlify.env.get('VITE_SUPABASE_PUBLISHABLE_KEY') || Netlify.env.get('VITE_SUPABASE_ANON_KEY')
  if (!baseUrl || !key) return

  let profile, guide
  try {
    const response = await fetch(new URL('/rest/v1/rpc/resolve_public_profile', baseUrl), {
      method: 'POST', headers: { apikey: key, 'content-type': 'application/json' },
      body: JSON.stringify({ p_slug: profileSlug }), signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) return
    profile = await response.json()
    if (!profile) return
    ;[guide] = await getRows(baseUrl, key, 'guides', {
      select: 'city,guide_note,intro', owner_id: `eq.${profile.id}`, slug: `eq.${guideSlug}`,
      visibility: 'in.(unlisted,public)',
    })
    if (!guide?.city) return
  } catch {
    // If the preview lookup is unavailable, let the ordinary app response through.
    return
  }

  return previewResponse(context, html => renderGuidePreview(html, {
    author: profile.display_name,
    city: guide.city,
    url: request.url,
    locale: requestUrl.searchParams.get('lang') === 'pl' ? 'pl' : 'en',
    note: guide.guide_note || guide.intro || '',
  }))
}
