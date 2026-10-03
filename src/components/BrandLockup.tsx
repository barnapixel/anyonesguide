import { BrandSignature } from './BrandSignature'

type Props = {
  className?: string
  compact?: boolean
  onClick?: () => void
  ariaLabel?: string
}

function Wordmark() {
  return (
    <span className="brand-wordmark" aria-hidden="true">
      <span>Anyone’s</span>
      <span>Guide</span>
    </span>
  )
}

export function BrandLockup({ className = '', compact = false, onClick, ariaLabel = 'Anyone’s Guide' }: Props) {
  const classes = `${onClick ? 'brand-lockup brand-button' : 'brand-lockup'} ${compact ? 'brand-lockup-compact' : ''} ${className}`.trim()
  const content = <><Wordmark /><BrandSignature compact={compact} /></>

  if (onClick) {
    return <button type="button" className={classes} onClick={onClick} aria-label={ariaLabel}>{content}</button>
  }

  return <div className={classes} aria-label={ariaLabel}>{content}</div>
}
