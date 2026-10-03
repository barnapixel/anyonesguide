import { useI18n } from '../i18n'

type Props = { onNavigate?: (path: string) => void; title?: string; body?: string }

export function PageError({ onNavigate, title, body }: Props) {
  const { t } = useI18n()
  return (
    <main className="center-state">
      <h1>{title || t('error.loadTitle')}</h1>
      <p>{body || t('error.pageBody')}</p>
      {onNavigate
        ? <button className="secondary-button compact-button" onClick={() => onNavigate('/')}>{t('guide.home')}</button>
        : <a className="secondary-button compact-button" href="/">{t('guide.home')}</a>}
    </main>
  )
}
