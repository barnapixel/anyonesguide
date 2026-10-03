const CHOICE_KEY = 'anyones-guide:analytics-choice:v1'
const SESSION_KEY = 'anyones-guide:session-id'

export function hasAnalyticsConsent() {
  try { return window.localStorage.getItem(CHOICE_KEY) === 'yes' }
  catch { return false }
}

export function setAnalyticsConsent(enabled: boolean) {
  try {
    window.localStorage.setItem(CHOICE_KEY, enabled ? 'yes' : 'no')
    if (!enabled) {
      try { window.sessionStorage.removeItem(SESSION_KEY) } catch { /* Session storage may be blocked. */ }
    }
    return true
  } catch {
    // If a choice cannot be stored, analytics stays off.
    return false
  }
}
