import { useLayoutEffect, useRef, type ReactNode } from 'react'
export function AccessibleDialog({ children, className, labelledBy, onClose, enabled = true }: { children: ReactNode; className: string; labelledBy: string; onClose: () => void; enabled?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useLayoutEffect(() => {
    if (!enabled || !ref.current) return
    const dialog = ref.current, opener = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow
    dialog.showModal(); document.body.style.overflow = 'hidden'
    dialog.querySelector<HTMLElement>('input,button,a[href],select,textarea')?.focus()
    return () => { dialog.close(); document.body.style.overflow = overflow; if (opener?.isConnected) opener.focus() }
  }, [enabled])
  if (!enabled) return <div className={className}>{children}</div>
  return <dialog ref={ref} className={`accessible-dialog ${className}`} aria-labelledby={labelledBy} onCancel={e => { e.preventDefault(); onClose() }} onClick={e => { if (e.target === e.currentTarget) onClose() }} onKeyDown={e => {
    if (e.key !== 'Tab') return
    const controls = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(el => el.getClientRects().length)
    const first = controls[0], last = controls.at(-1)
    if (!first) { e.preventDefault(); return }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }}>{children}</dialog>
}
