import { useEffect, useRef, useState } from 'react'

const illustrations = [
  { file: 'coffee-view-dinner', alt: 'Your go-to coffee. A view you love. That dinner spot.' },
  { file: 'brunch-museum-drinks', alt: 'Your favourite brunch. That quirky museum. Drinks you must try.' },
  { file: 'park-sandwich-show', alt: 'Your go-to park. That sandwich spot. A show worth seeing.' },
] as const

export function FirstPlaceIllustration({ choice, onReady, omit = false }: { choice: number; onReady: () => void; omit?: boolean }) {
  const illustration = illustrations[choice]
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    const img = imageRef.current
    if (!img) return
    const complete = async () => {
      try { await img.decode?.() } catch { if (active) setFailed(true) }
      if (active) onReady()
    }
    const error = () => { if (active) { setFailed(true); onReady() } }
    img.addEventListener('load', complete)
    img.addEventListener('error', error)
    if (img.complete) { if (img.naturalWidth) void complete(); else error() }
    return () => { active = false; img.removeEventListener('load', complete); img.removeEventListener('error', error) }
  }, [onReady])
  if (failed) return null
  return <img ref={imageRef} className="first-place-illustration" hidden={omit} src={`${import.meta.env.BASE_URL}illustrations/${illustration.file}.webp`} alt={illustration.alt} lang="en" width={1881} height={836} loading="eager" fetchPriority="high" decoding="async" />
}
