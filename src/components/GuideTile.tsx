const tones = ['tile-sand', 'tile-rose', 'tile-sage', 'tile-clay']

function toneFor(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0
  return tones[Math.abs(hash) % tones.length]
}

export function GuideTile({ city, compact = false }: { city: string; compact?: boolean }) {
  const initial = city.trim().charAt(0).toLocaleUpperCase() || '•'
  return (
    <div className={`guide-tile ${toneFor(city)} ${compact ? 'compact' : ''}`} aria-hidden="true">
      <span>{initial}</span>
      <i />
    </div>
  )
}
