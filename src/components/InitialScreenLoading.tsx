import { useI18n } from '../i18n'

export function InitialScreenLoading() {
  const { t } = useI18n()
  return <div className="initial-screen-loading" role="status" aria-label={t('common.loading')}><div className="loading-dot" /></div>
}
