import { useLayoutEffect, useRef } from 'react'
import { Star } from 'lucide-react'
import { useI18n } from '../i18n'
import type { Place } from '../types'

export function AuthorStar({ place, onChange, disabled = false }: { place: Place; onChange: (isStarred: boolean) => void; disabled?: boolean }) {
  const { t } = useI18n()
  const button = useRef<HTMLButtonElement | null>(null)
  const moveFrom = useRef<{ row: HTMLElement | null; top: number; scrollY: number; buttonTop: number } | null>(null)
  const animations = useRef<Animation[]>([])
  useLayoutEffect(() => () => { animations.current.forEach(animation => animation.cancel()) }, [])
  useLayoutEffect(() => {
    const previous = moveFrom.current
    const target = button.current
    if (!previous || !target) return
    moveFrom.current = null
    target.focus({ preventScroll: true })
    const row = previous.row
    if (!row) return // The recent-add card does not reorder its place.
    const delta = previous.top + previous.scrollY - row.getBoundingClientRect().top - window.scrollY
    if (Math.abs(delta) < 1) return

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const headerBottom = row.closest('.editor-shell')?.querySelector('.editor-topbar')?.getBoundingClientRect().bottom ?? 0
    const visibleTop = Math.max(headerBottom, window.visualViewport?.offsetTop ?? 0) + 16
    const visibleBottom = (window.visualViewport?.offsetTop ?? 0) + (window.visualViewport?.height ?? window.innerHeight) - 100
    const rect = target.getBoundingClientRect()
    const inView = rect.top >= visibleTop && rect.bottom <= visibleBottom
    if (!inView) {
      // Follow the actual place, without an abrupt jump or a row flying across screens.
      target.scrollIntoView?.({ block: 'center', inline: 'nearest', behavior: reduceMotion ? 'instant' as ScrollBehavior : 'smooth' })
    }
    if (reduceMotion || typeof row.animate !== 'function') return

    // Animate only short, visible moves. Long moves use the native smooth scroll.
    if (inView && previous.buttonTop >= visibleTop && previous.buttonTop <= visibleBottom && Math.abs(delta) <= 240) {
      animations.current.push(row.animate(
        [{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }],
        { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' },
      ))
    }
    const highlight = getComputedStyle(row).getPropertyValue('--accent-soft').trim() || '#f5e5de'
    const background = getComputedStyle(row).backgroundColor
    animations.current.push(row.animate(
      [{ backgroundColor: highlight }, { backgroundColor: highlight, offset: .65 }, { backgroundColor: background }],
      { duration: 1400, easing: 'ease-out' },
    ))
  }, [place.isStarred])
  return <button ref={button} type="button" className={`author-star-button ${place.isStarred ? 'active' : ''}`}
    aria-pressed={Boolean(place.isStarred)} disabled={disabled}
    aria-label={t(place.isStarred ? 'star.remove' : 'star.add', { name: place.name })}
    title={t('star.label')} onClick={() => {
      animations.current.forEach(animation => animation.cancel())
      animations.current = []
      const row = button.current?.closest<HTMLElement>('.editor-row') ?? null
      moveFrom.current = { row, top: row?.getBoundingClientRect().top ?? 0, scrollY: window.scrollY, buttonTop: button.current?.getBoundingClientRect().top ?? 0 }
      onChange(!place.isStarred)
    }}>
    <Star size={18} fill={place.isStarred ? 'currentColor' : 'none'} aria-hidden="true" />
  </button>
}
