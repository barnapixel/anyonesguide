import { useRef, useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { BrandLockup } from './BrandLockup'
import { LanguageToggle } from './LanguageToggle'
import { useI18n } from '../i18n'

type Props = {
  onBack: () => void
  onGoogle: () => Promise<void>
  onMagicLink: (email: string) => Promise<void>
  heading?: string
  body?: string
  successMessage?: string
}

export function Login({ onBack, onGoogle, onMagicLink, heading, body, successMessage }: Props) {
  const { t } = useI18n()
  const submitting = useRef(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const google = async () => {
    if (submitting.current) return
    submitting.current = true; setBusy(true); setError(null)
    try { await onGoogle() } catch (caught) { setError(caught instanceof Error && caught.message === 'SNAPSHOT_TOO_LARGE' ? 'request.tooLarge' : 'error.auth') } finally { submitting.current = false; setBusy(false) }
  }

  const emailLogin = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim() || submitting.current) return
    submitting.current = true
    setBusy(true); setError(null); setMessage(null)
    try {
      await onMagicLink(email.trim())
      setMessage(successMessage || t('auth.checkEmail'))
    } catch (caught) {
      setError(caught instanceof Error && caught.message === 'SNAPSHOT_TOO_LARGE' ? 'request.tooLarge' : 'error.auth')
    } finally {
      submitting.current = false; setBusy(false)
    }
  }

  return (
    <main className="auth-shell">
      <header className="auth-topbar">
        <BrandLockup compact />
        <div className="auth-topbar-actions">
          <button className="icon-button compact-nav-back" onClick={onBack} aria-label={t('common.back')}><ArrowLeft size={20} /></button>
          <LanguageToggle compact />
        </div>
      </header>
      <section className="auth-card">
        <h1>{heading || t('auth.title')}</h1>
        <p>{body || t('auth.body')}</p>
        <button className="primary-button" onClick={google} disabled={busy}>{t('auth.google')}</button>
        <div className="auth-divider"><span>{t('auth.or')}</span></div>
        <form onSubmit={emailLogin}>
          <label htmlFor="sign-in-email">{t('auth.email')}</label>
          <div className="auth-email"><input id="sign-in-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></div>
          <button className="secondary-button" type="submit" disabled={busy || !email.trim()}>{t('auth.emailCta')}</button>
        </form>
        {message && <div className="status-message success" role="status">{message}</div>}
        {error && <div className="status-message error" role="alert">{t(error)}</div>}
      </section>
    </main>
  )
}
