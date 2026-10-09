import { useEffect, useRef } from 'react'
import { useI18n } from '../i18n'

export function LegalFooter({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { t } = useI18n()
  const footerRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const footer = footerRef.current
    const root = document.getElementById('root')
    if (!footer || !root) return
    let frame = 0
    // Fixed actions move above the visible footer. The footer itself always
    // stays in document flow, including on short pages and wrapped PL labels.
    const update = () => {
      const rect = footer.getBoundingClientRect()
      const visible = rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0
      const bottom = visible ? Math.ceil(window.innerHeight - rect.top + 12) : 0
      root.style.setProperty('--footer-control-bottom', `${bottom}px`)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(() => { frame = 0; update() })
    }
    update()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null
    observer?.observe(footer)
    observer?.observe(root)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('resize', schedule)
    return () => {
      observer?.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
      root.style.removeProperty('--footer-control-bottom')
    }
  }, [])

  return <footer ref={footerRef} className="legal-footer">
    <button type="button" onClick={() => onNavigate('/explore')}>{t('nav.explore')}</button>
    <span aria-hidden="true">·</span>
    <button type="button" onClick={() => onNavigate('/feedback')}>{t('nav.feedback')}</button>
    <span aria-hidden="true">·</span>
    <button type="button" onClick={() => onNavigate('/privacy')}>{t('legal.privacy')}</button>
    <span aria-hidden="true">·</span>
    <button type="button" onClick={() => onNavigate('/terms')}>{t('legal.terms')}</button>
  </footer>
}
