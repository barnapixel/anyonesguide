export { guideTitle, guideDescription, guideShareContent, guideShareUrl } from '../../shared/share-copy.mjs'

export async function shareUrl({ title, text, url }: { title: string; text?: string; url: string }) {
  // One payload avoids platform-specific joins between separate text/URL fields.
  const message = `${(text || title).trim()}\n\n${url.trim()}`
  if (navigator.share) {
    try {
      await navigator.share({ text: message })
      return 'shared' as const
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled' as const
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(message)
      return 'copied' as const
    } catch { /* Try the selection fallback when Clipboard API access is blocked. */ }
  }

  const textarea = document.createElement('textarea')
  textarea.value = message
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  let copied = false
  try { copied = document.execCommand('copy') }
  finally { textarea.remove() }
  if (!copied) throw new Error('Could not copy the guide message.')
  return 'copied' as const
}
