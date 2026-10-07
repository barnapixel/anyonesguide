import { requireSupabase } from '../lib/supabase'
import { guestSnapshotBytes, isGuestDraft, withGuestCityName, type GuestDraft } from './guestDrafts'
import { invitationCodePattern, invitationIdPattern, isStoredInvitation, type GuideInvitation } from '../utils/requestLinks'

export async function createInvitation(creationKey: string, name: string, city: string, locale: 'en' | 'pl'): Promise<GuideInvitation & { id: string }> {
  if (!invitationIdPattern.test(creationKey)) throw new Error('Invalid creation key.')
  const { data, error } = await requireSupabase().rpc('create_guide_invitation', {
    p_creation_key: creationKey, p_name: name.trim(), p_city: city.trim(), p_locale: locale,
  })
  if (error) throw error
  if (!isStoredInvitation(data)) throw new Error('Invalid invitation response.')
  return data
}

export async function readStoredInvitation(id: string): Promise<(GuideInvitation & { id: string }) | null> {
  const isUuid = invitationIdPattern.test(id)
  if (!isUuid && !invitationCodePattern.test(id)) return null
  const reference = isUuid ? id.toLowerCase() : id
  const { data, error } = await requireSupabase().rpc(
    isUuid ? 'read_guide_invitation' : 'read_guide_invitation_by_code',
    isUuid ? { p_id: reference } : { p_code: reference },
  )
  if (error) throw error
  if (data === null) return null
  if (!isStoredInvitation(data) || (isUuid ? data.id !== reference : data.shortCode !== reference)) throw new Error('Invalid invitation response.')
  return data
}

export async function prepareGuestDraft(draft: GuestDraft) {
  if (!isGuestDraft(draft) || !draft.guide.places.length) throw new Error('INVALID_DRAFT')
  if (guestSnapshotBytes(draft) > 200000) throw new Error('SNAPSHOT_TOO_LARGE')
  const { error } = await requireSupabase().rpc('save_guest_guide', { p_id: draft.id, p_key: draft.key, p_payload: draft })
  if (error) throw error
}

export async function recoverGuestDraft(id: string, key: string): Promise<{ draft: GuestDraft | null; guideId: string | null }> {
  const { data, error } = await requireSupabase().rpc('read_guest_guide', { p_id: id, p_key: key })
  if (error) throw error
  if (data?.guideId) return { draft: null, guideId: data.guideId }
  if (!isGuestDraft(data?.draft) || data.draft.id !== id || data.draft.key !== key) throw new Error('Draft unavailable or expired.')
  return { draft: withGuestCityName(data.draft), guideId: null }
}

export async function claimGuestDraft(id: string, key: string): Promise<string> {
  const { data, error } = await requireSupabase().rpc('claim_guest_guide', { p_id: id, p_key: key })
  if (error) throw error
  if (typeof data !== 'string') throw new Error('Could not create your guide link.')
  return data
}
