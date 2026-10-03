import type { GuideEdit } from './guideSaves'
import { requireSupabase } from '../lib/supabase'
import type { DestinationSearchResult, ExploreGuideSummary, Guide, GuideSummary, GuideVisibility, Place, PlaceSearchResult, Profile } from '../types'

type GuideRow = {
  id: string
  owner_id: string
  city: string
  country: string
  slug: string
  intro: string | null
  guide_note: string | null
  is_published: boolean
  visibility: GuideVisibility
  center_lat: number
  center_lng: number
  updated_at: string
}

type ProfileRow = { id: string; display_name: string; slug: string; onboarding_completed: boolean }

type CategoryRow = { key: string; label: string; icon: string; sort_order: number }

type PlaceRow = {
  id: string
  provider: string
  provider_place_id: string | null
  name: string
  subtitle: string | null
  address: string
  city: string | null
  lat: number
  lng: number
}

type GuidePlaceRow = {
  id: string
  category_key: string
  note: string | null
  sort_order: number
  is_starred: boolean
  place_id: string
  places: PlaceRow | PlaceRow[] | null
}

export function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'guide'
}

function toProfile(row: ProfileRow): Profile {
  return { id: row.id, displayName: row.display_name, slug: row.slug, onboardingComplete: row.onboarding_completed }
}

async function hydrateGuide(row: GuideRow, profile?: ProfileRow | null): Promise<Guide> {
  const client = requireSupabase()
  const [{ data: categoryRows, error: categoryError }, { data: guidePlaceRows, error: placesError }] = await Promise.all([
    client.from('guide_categories').select('key,label,icon,sort_order').eq('guide_id', row.id).order('sort_order'),
    client.from('guide_places').select('id,category_key,note,sort_order,is_starred,place_id,places(id,provider,provider_place_id,name,subtitle,address,city,lat,lng)').eq('guide_id', row.id).order('sort_order'),
  ])
  if (categoryError) throw categoryError
  if (placesError) throw placesError

  let owner = profile
  if (!owner) {
    const { data, error } = await client.from('profiles').select('id,display_name,slug,onboarding_completed').eq('id', row.owner_id).single()
    if (error) throw error
    owner = data as ProfileRow
  }

  const categories = ((categoryRows ?? []) as CategoryRow[]).map(category => ({
    id: category.key,
    label: category.label,
    icon: category.icon,
    sortOrder: category.sort_order,
  }))

  const places = ((guidePlaceRows ?? []) as GuidePlaceRow[]).flatMap<Place>(item => {
    const rawPlace = Array.isArray(item.places) ? item.places[0] : item.places
    if (!rawPlace) return []
    return [{
      id: rawPlace.id,
      guidePlaceId: item.id,
      externalId: rawPlace.provider_place_id ?? undefined,
      provider: rawPlace.provider,
      name: rawPlace.name,
      subtitle: rawPlace.subtitle ?? undefined,
      address: rawPlace.address,
      lat: Number(rawPlace.lat),
      lng: Number(rawPlace.lng),
      categoryId: item.category_key,
      note: item.note ?? '',
      sortOrder: item.sort_order,
      isStarred: item.is_starred === true,
    }]
  })

  const publicName = owner.display_name.trim() || 'A local'

  return {
    id: row.id,
    ownerId: row.owner_id,
    profileSlug: owner.slug,
    slug: row.slug,
    city: row.city,
    country: row.country,
    authorName: publicName,
    title: `${publicName}’s ${row.city}`,
    intro: row.intro ?? '',
    guideNote: row.guide_note ?? '',
    center: { lat: Number(row.center_lat), lng: Number(row.center_lng) },
    categories,
    places,
    visibility: row.visibility ?? (row.is_published ? 'unlisted' : 'draft'),
    isPublished: row.visibility ? row.visibility !== 'draft' : row.is_published,
    updatedAt: row.updated_at,
  }
}

export async function getMyProfile(userId: string): Promise<Profile> {
  const client = requireSupabase()
  const { data, error } = await client.from('profiles').select('id,display_name,slug,onboarding_completed').eq('id', userId).single()
  if (error) throw error
  return toProfile(data as ProfileRow)
}

export async function listMyGuides(userId: string): Promise<GuideSummary[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('guides')
    .select('id,slug,city,country,intro,is_published,visibility,updated_at')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error

  const rows = (data ?? []) as Array<Omit<GuideRow, 'owner_id' | 'center_lat' | 'center_lng'>>
  if (!rows.length) return []
  const ids = rows.map(row => row.id)
  const { data: guidePlaces, error: countError } = await client.from('guide_places').select('guide_id').in('guide_id', ids)
  if (countError) throw countError
  const counts = new Map<string, number>()
  for (const item of guidePlaces ?? []) counts.set(item.guide_id as string, (counts.get(item.guide_id as string) ?? 0) + 1)

  return rows.map(row => ({
    id: row.id,
    slug: row.slug,
    city: row.city,
    country: row.country,
    intro: row.intro ?? '',
    visibility: row.visibility ?? (row.is_published ? 'unlisted' : 'draft'),
    isPublished: row.visibility ? row.visibility !== 'draft' : row.is_published,
    placeCount: counts.get(row.id) ?? 0,
    updatedAt: row.updated_at,
  }))
}

export async function createGuide(ownerId: string, destination: DestinationSearchResult): Promise<Guide> {
  const client = requireSupabase()
  const slug = slugify(destination.city)
  const { data, error } = await client.from('guides').insert({
    owner_id: ownerId,
    city: destination.city,
    country: destination.country,
    slug,
    intro: '',
    visibility: 'unlisted',
    center_lat: destination.lat,
    center_lng: destination.lng,
  }).select('*').single()
  if (error) throw error
  return hydrateGuide(data as GuideRow)
}

export async function getGuideById(guideId: string): Promise<Guide> {
  const client = requireSupabase()
  const { data, error } = await client.from('guides').select('*').eq('id', guideId).single()
  if (error) throw error
  return hydrateGuide(data as GuideRow)
}

export async function getPublicGuide(profileSlug: string, guideSlug: string): Promise<Guide | null> {
  const client = requireSupabase()

  const { data: profile, error: profileError } = await client.rpc('resolve_public_profile', { p_slug: profileSlug })
  if (profileError) throw profileError
  if (!profile) return null

  const { data, error } = await client
    .from('guides')
    .select('*')
    .eq('owner_id', profile.id)
    .eq('slug', guideSlug)
    .in('visibility', ['unlisted', 'public'])
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return hydrateGuide(data as GuideRow, profile)
}

export function normalizeProfileHandle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export async function isProfileHandleAvailable(handle: string, _userId: string): Promise<boolean> {
  const { data, error } = await requireSupabase().rpc('is_profile_handle_available', { p_slug: normalizeProfileHandle(handle) })
  if (error) throw error
  return data === true
}

export async function updateProfileIdentity(displayName: string, handle: string): Promise<Profile> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('update_profile_identity', {
    p_display_name: displayName,
    p_slug: normalizeProfileHandle(handle),
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error('Profile update returned no data.')
  return toProfile(row as ProfileRow)
}


export async function updateGuideVisibility(guideId: string, visibility: GuideVisibility) {
  const client = requireSupabase()
  const { error } = await client.from('guides').update({ visibility }).eq('id', guideId)
  if (error) throw error
}

export async function listPublicGuides(): Promise<ExploreGuideSummary[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('guides')
    .select('id,owner_id,slug,city,country,intro,is_published,visibility,updated_at')
    .eq('visibility', 'public')
    .order('updated_at', { ascending: false })
    .limit(100)
  if (error) throw error

  const rows = (data ?? []) as Array<Pick<GuideRow, 'id' | 'owner_id' | 'slug' | 'city' | 'country' | 'intro' | 'is_published' | 'visibility' | 'updated_at'>>
  if (!rows.length) return []

  const ownerIds = [...new Set(rows.map(row => row.owner_id))]
  const ids = rows.map(row => row.id)

  const [{ data: profiles, error: profileError }, { data: guidePlaces, error: countError }] = await Promise.all([
    client.from('profiles').select('id,display_name,slug,onboarding_completed').in('id', ownerIds),
    client.from('guide_places').select('guide_id').in('guide_id', ids),
  ])
  if (profileError) throw profileError
  if (countError) throw countError

  const profileMap = new Map(((profiles ?? []) as ProfileRow[]).map(profile => [profile.id, profile]))
  const counts = new Map<string, number>()
  for (const item of guidePlaces ?? []) counts.set(item.guide_id as string, (counts.get(item.guide_id as string) ?? 0) + 1)

  return rows.flatMap(row => {
    const profile = profileMap.get(row.owner_id)
    if (!profile || !profile.onboarding_completed) return []
    return [{
      id: row.id,
      slug: row.slug,
      city: row.city,
      country: row.country,
      intro: row.intro ?? '',
      visibility: row.visibility,
      isPublished: row.visibility !== 'draft',
      placeCount: counts.get(row.id) ?? 0,
      updatedAt: row.updated_at,
      authorName: profile.display_name.trim() || 'A local',
      profileSlug: profile.slug,
    }]
  })
}

export async function persistGuideEdits(guideId: string, edits: GuideEdit[]) {
  const changes: { guideNote?: string; places: Record<string, unknown>[] } = { places: [] }
  for (const edit of edits) {
    if (edit.kind === 'guideNote') changes.guideNote = edit.value
    else changes.places.push({ id: edit.linkId, ...(edit.note !== undefined ? { note: edit.note } : {}), ...(edit.categoryId !== undefined ? { categoryId: edit.categoryId } : {}), ...(edit.sortOrder !== undefined ? { sortOrder: edit.sortOrder } : {}), ...(edit.isStarred !== undefined ? { isStarred: edit.isStarred } : {}), ...(edit.remove ? { remove: true } : {}) })
  }
  const { error } = await requireSupabase().rpc('save_guide_edits', { p_guide_id: guideId, p_changes: changes })
  if (error) throw error
}
export async function addPlaceToGuide(guide: Guide, result: PlaceSearchResult, categoryId = 'other'): Promise<Place> {
  const { data, error } = await requireSupabase().rpc('add_guide_place', { p_guide_id: guide.id, p_place: { provider: result.provider ?? 'geoapify', externalId: result.id, name: result.name, subtitle: result.subtitle, address: result.address, lat: result.lat, lng: result.lng, categoryId } })
  if (error) throw error
  const p = data.place as PlaceRow, link = data.link
  return { id: p.id, guidePlaceId: link.id, externalId: p.provider_place_id ?? undefined, provider: p.provider, name: p.name, subtitle: p.subtitle ?? undefined, address: p.address, lat: Number(p.lat), lng: Number(p.lng), categoryId: link.category_key, note: link.note, sortOrder: link.sort_order, isStarred: link.is_starred === true }
}
