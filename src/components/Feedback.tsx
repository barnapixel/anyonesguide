import { useState, type FormEvent } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { submitFeedback } from '../services/analytics'
import { useI18n } from '../i18n'
import { LanguageToggle } from './LanguageToggle'
import { BrandLockup } from './BrandLockup'

type Props = { onNavigate: (path: string) => void }

export function Feedback({ onNavigate }: Props) {
  const { t } = useI18n()
  const [kind, setKind] = useState<'feedback' | 'bug' | 'report'>('feedback')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || message.trim().length < 3) return
    setBusy(true); setError(null)
    try {
      await submitFeedback(kind, message)
      setDone(true)
      setMessage('')
    } catch {
      setError(t('error.feedback'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="feedback-shell">
      <header className="simple-page-header">
        <BrandLockup compact />
        <div className="simple-page-header-spacer" aria-hidden="true" />
        <div className="simple-page-actions">
          <button className="icon-button compact-nav-back" onClick={() => onNavigate('/')} aria-label={t('common.back')}><ArrowLeft size={20} /></button>
          <LanguageToggle compact />
        </div>
      </header>
      <section className="feedback-card">
        <h1>{t('feedback.title')}</h1>
        <p>{t('feedback.subtitle')}</p>
        {done ? (
          <div className="feedback-success"><Check size={20} /><strong>{t('feedback.thanks')}</strong></div>
        ) : (
          <form onSubmit={submit}>
            <label>{t('feedback.type')}
              <select value={kind} onChange={event => setKind(event.target.value as typeof kind)}>
                <option value="feedback">{t('feedback.feedback')}</option>
                <option value="bug">{t('feedback.bug')}</option>
                <option value="report">{t('feedback.report')}</option>
              </select>
            </label>
            <label>{t('feedback.message')}
              <textarea value={message} onChange={event => setMessage(event.target.value)} placeholder={t('feedback.placeholder')} rows={7} maxLength={3000} />
            </label>
            <button className="primary-button" type="submit" disabled={busy || message.trim().length < 3}>{busy ? '…' : t('feedback.send')}</button>
            {error && <div className="status-message error" role="alert">{error}</div>}
          </form>
        )}
      </section>
    </main>
  )
}
