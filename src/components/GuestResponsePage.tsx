import { PageError } from './PageError'
import { useGuestGuideStore } from '../hooks/useGuestGuideStore'
import { useI18n } from '../i18n'
import { Editor } from './Editor'
import { AddPlaces } from './AddPlaces'
import { PublicGuide } from './PublicGuide'
import type { Coordinates } from '../types'

type Props = {
  draftId: string
  guidedStart?: boolean
  search?: string
  mode: 'edit' | 'add' | 'preview'
  onNavigate: (path: string) => void
  userLocation: Coordinates | null
  locationStatus: 'idle' | 'loading' | 'ready' | 'denied' | 'error'
  onRequestLocation: () => void
}
export function GuestResponsePage({ draftId, mode, onNavigate, guidedStart = false, userLocation, locationStatus, onRequestLocation, search = '' }: Props) {
  const params = new URLSearchParams(search)
  const selectedCategory = params.get('category') ?? undefined
  const store = useGuestGuideStore(draftId)
  const { t } = useI18n()
  const draft = store.draft
  if (!draft) return <PageError onNavigate={onNavigate} title={t('request.missingTitle')} body={t('request.missingBody')} />
  const path = `/respond/${draft.id}`
  const banner = <div className="request-draft-banner"><strong>{t(draft.requesterAnonymous ? 'request.invitationEyebrow' : 'request.forName', { name: draft.requesterName })}</strong><span>{t(store.storageError ? 'request.storageWarning' : 'request.savedLocally')}</span></div>
  if (mode === 'add') return <AddPlaces categoryId={selectedCategory} returnToGuide={params.get('return') === 'guide'} guidedStart={guidedStart} previewPath={`${path}/preview`} finishPath={`${path}/finish`} guide={draft.guide} onNavigate={onNavigate} backPath={path} onAddSearchResult={store.addSearchResult} onUpdatePlace={store.updatePlace} contextBanner={banner} noteLimit={5000} />
  if (mode === 'preview') return <PublicGuide guide={{ ...draft.guide, authorName: t('request.authorYou') }} titleOverride={t('request.previewTitle', { city: draft.guide.city })} userLocation={userLocation} locationStatus={locationStatus} onRequestLocation={onRequestLocation} onNavigate={onNavigate} editPath={path} topActionPath={`${path}/finish`} finishAction topActionLabel={t('request.finishAction')} trackUsage={false} />
  return <Editor onSaveFirstPlace={store.saveFirstPlace} firstPlaceContext={t(draft.requesterAnonymous ? 'request.invitationEyebrow' : 'request.forName', { name: draft.requesterName })} initialCategory={selectedCategory} addedPlaceId={params.get('added') ?? undefined} storageUnavailable={store.storageError} guide={draft.guide} onNavigate={onNavigate} onUpdatePlace={store.updatePlace} onUpdateGuideNote={store.updateGuideNote} onRemovePlace={store.removePlace} onMovePlace={store.movePlace} onReorderPlace={store.reorderPlace} backPath="/" previewPath={`${path}/preview`} publicPath="" addPath={`${path}/add`} guestMode shareLabel={t('request.finishAction')} onShare={async () => onNavigate(`${path}/finish`)} contextBanner={banner} />
}
