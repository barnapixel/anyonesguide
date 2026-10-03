import { useI18n } from '../i18n'

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n()
  return (
    <div className={`language-toggle ${compact ? 'compact' : ''}`} role="group" aria-label={t('common.language')}>
      <button className={locale === 'en' ? 'active' : ''} aria-label="English" onClick={() => setLocale('en')} aria-pressed={locale === 'en'}>EN</button>
      <span aria-hidden="true">/</span>
      <button className={locale === 'pl' ? 'active' : ''} aria-label="Polski" onClick={() => setLocale('pl')} aria-pressed={locale === 'pl'}>PL</button>
    </div>
  )
}
