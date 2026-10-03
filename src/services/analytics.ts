import { appConfig } from '../config'
import { supabase } from '../lib/supabase'
import { hasAnalyticsConsent } from './analyticsPreferences'

export type AppEventName =
  | 'guide_created'
  | 'guide_shared'
  | 'guide_saved'
  | 'guide_unsaved'
  | 'guide_visibility_changed'
  | 'public_guide_opened'
  | 'venue_opened'
  | 'map_opened'
  | 'maps_handoff'
  | 'recipient_create_clicked'
  | 'explore_opened'
  | 'explore_guide_opened'
  | 'feedback_submitted'

const ANON_KEY = 'anyones-guide:session-id'
let inMemoryAnonymousId: string | undefined

function anonymousId() {
  try {
    const existing = sessionStorage.getItem(ANON_KEY)
    if (existing) return existing
    const created = crypto.randomUUID()
    sessionStorage.setItem(ANON_KEY, created)
    return created
  } catch {
    if (!inMemoryAnonymousId) inMemoryAnonymousId = crypto.randomUUID()
    return inMemoryAnonymousId
  }
}

export function trackEvent(eventName: AppEventName, guideId?: string, properties: Record<string, unknown> = {}) {
  if (!appConfig.cloudEnabled || !supabase || !hasAnalyticsConsent()) return
  void supabase.from('app_events').insert({
    event_name: eventName,
    guide_id: guideId ?? null,
    anonymous_id: anonymousId() ?? null,
    properties,
  }).then(() => undefined, () => undefined)
}

export async function submitFeedback(kind: 'feedback' | 'bug' | 'report', message: string, pagePath = window.location.pathname) {
  if (!supabase) throw new Error('Feedback is available when Supabase is configured.')
  const { error } = await supabase.from('feedback').insert({ kind, message: message.trim(), page_path: pagePath })
  if (error) throw error
  trackEvent('feedback_submitted', undefined, { kind })
}
