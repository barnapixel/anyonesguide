type Props = {
  className?: string
  compact?: boolean
}

export function BrandSignature({ className = '', compact = false }: Props) {
  return (
    <svg
      className={`brand-signature ${compact ? 'compact' : ''} ${className}`.trim()}
      viewBox="0 0 52 16"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 9.4c5.2 0 6.1-5.6 11.2-5.6 5.4 0 5.5 8.1 11.2 8.1 5.6 0 6.1-7.8 11.8-7.8 4.5 0 5.7 4.2 11.8 4.2" />
    </svg>
  )
}
