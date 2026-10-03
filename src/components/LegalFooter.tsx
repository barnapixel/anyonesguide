import { useI18n } from '../i18n'

export function LegalFooter({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { t } = useI18n()

  return <footer className="legal-footer">
    <button type="button" onClick={() => onNavigate('/explore')}>{t('nav.explore')}</button>
    <span aria-hidden="true">·</span>
    <button type="button" onClick={() => onNavigate('/feedback')}>{t('nav.feedback')}</button>
    <span aria-hidden="true">·</span>
    <button type="button" onClick={() => onNavigate('/privacy')}>{t('legal.privacy')}</button>
    <span aria-hidden="true">·</span>
    <button type="button" onClick={() => onNavigate('/terms')}>{t('legal.terms')}</button>
  </footer>
}
