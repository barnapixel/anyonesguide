import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useI18n } from '../i18n'

export function GuideNote({ authorName, note }: { authorName: string; note: string }) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [height, setHeight] = useState(20.25)
  const textRef = useRef<HTMLParagraphElement | null>(null)
  const bodyId = useId()

  useLayoutEffect(() => {
    const text = textRef.current
    if (!text) return
    const measure = () => {
      // The reader stays mounted while the full map hides its introduction.
      // Keep the measured height and expansion state until it is visible again.
      if (!text.getClientRects().length) return
      const lineHeight = Number.parseFloat(window.getComputedStyle(text).lineHeight) || 20.25
      setHeight(expanded ? Math.max(lineHeight, text.scrollHeight, text.getBoundingClientRect().height) : lineHeight)
    }
    measure()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    observer?.observe(text)
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure) }
  }, [expanded, note])

  useEffect(() => {
    if (!animating) return
    // Also settle short notes, interrupted transitions and hidden map returns.
    const timer = window.setTimeout(() => setAnimating(false), 240)
    return () => window.clearTimeout(timer)
  }, [animating, expanded])

  const toggle = () => {
    setAnimating(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    setExpanded(value => !value)
  }
  return (
    <div className="guide-note-card" data-expanded={expanded} data-animating={animating}>
      <button className="guide-note-toggle" type="button" aria-expanded={expanded} aria-controls={bodyId} onClick={toggle}>
        <strong>{t('guide.fromAuthor', { name: authorName })}</strong>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <div className="guide-note-body">
        <div className="guide-note-reveal" style={{ height }} onTransitionEnd={event => { if (event.target === event.currentTarget && event.propertyName === 'height') setAnimating(false) }}>
          <p ref={textRef} className="guide-note-excerpt" id={bodyId}>{note.trim()}</p>
        </div>
      </div>
    </div>
  )
}
