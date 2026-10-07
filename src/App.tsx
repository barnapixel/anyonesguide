import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { flushActiveGuideSaves } from './services/guideSaves'
import { safeDecode, normalizePath } from './utils/routes'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Home } from './components/Home'
import { LegalFooter } from './components/LegalFooter'
import { appConfig } from './config'
import { useAuth } from './hooks/useAuth'
import { useGuideStore } from './hooks/useGuideStore'
import { useUserLocation } from './hooks/useUserLocation'
import { useI18n } from './i18n'

const AddPlaces = lazy(() => import('./components/AddPlaces').then(module => ({ default: module.AddPlaces })))
const CloudCreatorHome = lazy(() => import('./components/CloudCreatorHome').then(module => ({ default: module.CloudCreatorHome })))
const CloudEditorPage = lazy(() => import('./components/CloudEditorPage').then(module => ({ default: module.CloudEditorPage })))
const CloudPreviewGuide = lazy(() => import('./components/CloudPreviewGuide').then(module => ({ default: module.CloudPreviewGuide })))
const CloudPublicGuide = lazy(() => import('./components/CloudPublicGuide').then(module => ({ default: module.CloudPublicGuide })))
const CreatorHome = lazy(() => import('./components/CreatorHome').then(module => ({ default: module.CreatorHome })))
const Editor = lazy(() => import('./components/Editor').then(module => ({ default: module.Editor })))
const Explore = lazy(() => import('./components/Explore').then(module => ({ default: module.Explore })))
const Feedback = lazy(() => import('./components/Feedback').then(module => ({ default: module.Feedback })))
const Login = lazy(() => import('./components/Login').then(module => ({ default: module.Login })))
const LegalPage = lazy(() => import('./components/LegalPage').then(module => ({ default: module.LegalPage })))
const PublicGuide = lazy(() => import('./components/PublicGuide').then(module => ({ default: module.PublicGuide })))
const SavedGuides = lazy(() => import('./components/SavedGuides').then(module => ({ default: module.SavedGuides })))
const AskForGuide = lazy(() => import('./components/AskForGuide').then(module => ({ default: module.AskForGuide })))
const RequestInvitation = lazy(() => import('./components/RequestInvitation').then(module => ({ default: module.RequestInvitation })))
const GuestResponsePage = lazy(() => import('./components/GuestResponsePage').then(module => ({ default: module.GuestResponsePage })))
const FinishRequestPage = lazy(() => import('./components/FinishRequestPage').then(module => ({ default: module.FinishRequestPage })))

function RouteFallback() {
  const { t } = useI18n()
  return <main className="center-state" role="status"><div className="loading-dot" /><p>{t('common.loading')}</p></main>
}

export default function App() {
  const [route, setRoute] = useState(() => ({ path: normalizePath(window.location.pathname), search: window.location.search }))
  const routeRef = useRef(route)
  routeRef.current = route
  const navigationRevision = useRef(0)
  const [navigationError, setNavigationError] = useState(false)
  const { path, search } = route
  const localStore = useGuideStore()
  const { location, status, requestLocation } = useUserLocation()
  const auth = useAuth()
  const { t } = useI18n()

  useEffect(() => {
    const onPopState = () => {
      const next = { path: normalizePath(window.location.pathname), search: window.location.search }, revision = ++navigationRevision.current
      void flushActiveGuideSaves(auth.user?.id).then(() => {
        if (revision === navigationRevision.current) { setNavigationError(false); setRoute(next) }
      }).catch(() => {
        if (revision !== navigationRevision.current) return
        window.history.replaceState({}, '', routeRef.current.path + routeRef.current.search); setNavigationError(true)
      })
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [auth.user?.id])

  const navigate = useCallback((next: string, replace = false) => {
    const url = new URL(next, window.location.origin)
    if (url.origin !== window.location.origin) return
    const revision = ++navigationRevision.current
    void flushActiveGuideSaves(auth.user?.id).then(() => {
      if (revision !== navigationRevision.current) return
      window.history[replace ? 'replaceState' : 'pushState']({}, '', url.pathname + url.search)
      setNavigationError(false); setRoute({ path: normalizePath(url.pathname), search: url.search })
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }).catch(() => { if (revision === navigationRevision.current) setNavigationError(true) })
  }, [auth.user?.id])

  useEffect(() => {
    const focus = () => {
      const active = document.activeElement
      if (active instanceof HTMLElement && active.matches('input,textarea,select,[contenteditable="true"]')) return
      const heading = document.querySelector<HTMLElement>('main h1, main .editor-title strong, main .add-topbar strong')
      if (!heading) return
      heading.tabIndex = -1; heading.focus({ preventScroll: true }); observer.disconnect()
    }
    const observer = new MutationObserver(focus)
    observer.observe(document.getElementById('root')!, { childList: true, subtree: true })
    const timer = setTimeout(focus, 0), stop = setTimeout(() => observer.disconnect(), 1500)
    return () => { clearTimeout(timer); clearTimeout(stop); observer.disconnect() }
  }, [path])

  const missing = <main className="center-state"><h1>{t('guide.notFound')}</h1><p>{t('guide.notFoundBody')}</p><button className="secondary-button compact-button" onClick={() => navigate('/')}>{t('guide.home')}</button></main>
  const content = (() => {
    if (safeDecode(path) === null) return missing
    if (path === '/feedback') return <Feedback onNavigate={navigate} />
    if (path === '/privacy' || path === '/terms') return <LegalPage kind={path === '/privacy' ? 'privacy' : 'terms'} onNavigate={navigate} />
    if (path === '/ask') return <AskForGuide onNavigate={navigate} />
    if (path === '/request') return <RequestInvitation search={search} onNavigate={navigate} />
    const invitationMatch = path.match(/^\/request\/([^/]+)$/)
    if (invitationMatch) return <RequestInvitation key={invitationMatch[1]} invitationId={invitationMatch[1]} search={search} onNavigate={navigate} />
    if (path === '/finish-request') return <FinishRequestPage search={search} onNavigate={navigate} />
    const responseMatch = path.match(/^\/respond\/([0-9a-f-]{36})(?:\/(add|preview|finish))?$/i)
    if (responseMatch) {
      const draftId = responseMatch[1]
      if (responseMatch[2] === 'finish') return <FinishRequestPage draftId={draftId} search={search} onNavigate={navigate} />
      return <GuestResponsePage search={search} key={draftId} draftId={draftId} guidedStart={new URLSearchParams(search).get('start') === '1'} mode={responseMatch[2] === 'add' ? 'add' : responseMatch[2] === 'preview' ? 'preview' : 'edit'} onNavigate={navigate} userLocation={location} locationStatus={status} onRequestLocation={requestLocation} />
    }
    if (!appConfig.cloudEnabled) {
      if (path === '/saved') return <SavedGuides onNavigate={navigate} />
      if (path === '/creator') return <CreatorHome guide={localStore.guide} onNavigate={navigate} onReset={localStore.resetGuide} />
      if (path === '/edit/gdansk') return <Editor onSaveFirstPlace={localStore.saveFirstPlace} initialCategory={new URLSearchParams(search).get('category') ?? undefined} addedPlaceId={new URLSearchParams(search).get('added') ?? undefined} guide={localStore.guide} onNavigate={navigate} onUpdatePlace={localStore.updatePlace} onUpdateGuideNote={localStore.updateGuideNote} onRemovePlace={localStore.removePlace} onMovePlace={localStore.movePlace} onReorderPlace={localStore.reorderPlace} onUpdateVisibility={async visibility => localStore.setVisibility(visibility)} backPath="/creator" previewPath="/" publicPath="/" addPath="/edit/gdansk/add" />
      if (path === '/edit/gdansk/add') return <AddPlaces categoryId={new URLSearchParams(search).get('category') ?? undefined} returnToGuide={new URLSearchParams(search).get('return') === 'guide'} guide={localStore.guide} onNavigate={navigate} backPath="/edit/gdansk" onImportSave={localStore.saveFirstPlace} onAddSearchResult={localStore.addSearchResult} onUpdatePlace={localStore.updatePlace} />
      if (path !== '/') return missing
      return <PublicGuide guide={localStore.guide} userLocation={location} locationStatus={status} onRequestLocation={requestLocation} onNavigate={navigate} editPath="/edit/gdansk" topActionPath="/creator" topActionLabel={t('nav.guides')} />
    }

    const editAddMatch = path.match(/^\/edit\/([^/]+)\/add$/)
    const editMatch = path.match(/^\/edit\/([^/]+)$/)
    const previewMatch = path.match(/^\/preview\/([^/]+)$/)
    const publicMatch = path.match(/^\/([^/]+)\/([^/]+)$/)

    if (path === '/explore') return <Explore onNavigate={navigate} signedIn={Boolean(auth.user)} />
    if (path === '/saved') return <SavedGuides onNavigate={navigate} />
    if (path === '/feedback') return <Feedback onNavigate={navigate} />

    if (path === '/login' || path === '/creator' && !auth.loading && !auth.user) {
      return <Login onBack={() => navigate('/')} onGoogle={auth.signInWithGoogle} onMagicLink={auth.sendMagicLink} />
    }

    if (path === '/creator') {
      if (auth.loading || !auth.user) return <RouteFallback />
      return <CloudCreatorHome userId={auth.user.id} suggestedDisplayName={String(auth.user.user_metadata?.full_name ?? auth.user.user_metadata?.name ?? '').trim()} onNavigate={navigate} onSignOut={async () => { await auth.signOut(); navigate('/') }} />
    }

    if (previewMatch) {
      if (auth.loading) return <RouteFallback />
      if (!auth.user) return <Login onBack={() => navigate('/')} onGoogle={auth.signInWithGoogle} onMagicLink={auth.sendMagicLink} />
      return <CloudPreviewGuide key={previewMatch[1]} guideId={decodeURIComponent(previewMatch[1])} userId={auth.user.id} userLocation={location} locationStatus={status} onRequestLocation={requestLocation} onNavigate={navigate} />
    }

    if (editAddMatch || editMatch) {
      if (auth.loading) return <RouteFallback />
      if (!auth.user) return <Login onBack={() => navigate('/')} onGoogle={auth.signInWithGoogle} onMagicLink={auth.sendMagicLink} />
      const guideId = decodeURIComponent((editAddMatch ?? editMatch)![1])
      return <CloudEditorPage search={search} key={`${auth.user.id}:${guideId}`} guideId={guideId} userId={auth.user.id} guidedStart={new URLSearchParams(search).get('start') === '1'} mode={editAddMatch ? 'add' : 'edit'} onNavigate={navigate} />
    }

    if (publicMatch && !['creator', 'login', 'edit', 'preview', 'explore', 'feedback'].includes(publicMatch[1])) {
      return <CloudPublicGuide key={`${publicMatch[1]}:${publicMatch[2]}`} profileSlug={decodeURIComponent(publicMatch[1])} guideSlug={decodeURIComponent(publicMatch[2])} localeHint={new URLSearchParams(search).get('lang') ?? undefined} userLocation={location} locationStatus={status} onRequestLocation={requestLocation} onNavigate={navigate} viewerUserId={auth.user?.id} viewerResolved={!auth.loading} />
    }

    if (path !== '/') return missing
    return <Home onNavigate={navigate} signedIn={Boolean(auth.user)} exploreEnabled />
  })()

  return <>
    {(navigationError || auth.error) && <div className="route-notice" role="alert">{t(navigationError ? 'save.error' : 'error.auth')}</div>}
    <RouteErrorBoundary key={path}><Suspense fallback={<RouteFallback />}>{content}</Suspense></RouteErrorBoundary>
    <LegalFooter onNavigate={navigate} />
  </>
}
