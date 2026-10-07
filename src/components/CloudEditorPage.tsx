import { PageError } from './PageError'
import { useI18n } from '../i18n'
import { AddPlaces } from './AddPlaces'
import { Editor } from './Editor'
import { useCloudGuideStore } from '../hooks/useCloudGuideStore'

type Props = {
  guideId: string
  userId: string
  guidedStart?: boolean
  search?: string
  mode: 'edit' | 'add'
  onNavigate: (path: string) => void
}

export function CloudEditorPage({ guideId, userId, mode, onNavigate, guidedStart = false, search = '' }: Props) {
  const params = new URLSearchParams(search)
  const selectedCategory = params.get('category') ?? undefined
  const { t } = useI18n()
  const store = useCloudGuideStore(guideId, userId)
  if (store.loading) return <main className="center-state"><div className="loading-dot" /><p>{t('common.loading')}</p></main>
  if (!store.guide) return <PageError onNavigate={onNavigate} />
  if (store.guide.ownerId !== userId) return <PageError onNavigate={onNavigate} title={t('error.owner')} />

  const publicPath = store.guide.profileSlug ? `/${store.guide.profileSlug}/${store.guide.slug}` : '/'
  const previewPath = `/preview/${store.guide.id}`
  const editPath = `/edit/${store.guide.id}`

  if (mode === 'add') {
    return <AddPlaces categoryId={selectedCategory} returnToGuide={params.get('return') === 'guide'} guidedStart={guidedStart} previewPath={previewPath} guide={store.guide} onNavigate={onNavigate} onFlush={store.flushAll} saveStatus={store.saveStatus} storageUnavailable={store.storageUnavailable} backPath={editPath} onImportSave={store.saveFirstPlace} onAddSearchResult={store.addSearchResult} onUpdatePlace={store.updatePlace} saveStatusByPlaceId={store.saveStatusByPlaceId} />
  }

  return <Editor onSaveFirstPlace={store.saveFirstPlace} initialCategory={selectedCategory} addedPlaceId={params.get('added') ?? undefined} guide={store.guide} onNavigate={onNavigate} onUpdatePlace={store.updatePlace} onUpdateGuideNote={store.updateGuideNote} onFlushGuideNote={store.flushGuideNote} guideNoteSaveStatus={store.saveStatus} storageUnavailable={store.storageUnavailable} onRemovePlace={store.removePlace} onMovePlace={store.movePlace} onReorderPlace={store.reorderPlace} onUpdateVisibility={store.setVisibility} backPath="/creator" previewPath={previewPath} publicPath={publicPath} addPath={`${editPath}/add`} saveError={null} />
}
