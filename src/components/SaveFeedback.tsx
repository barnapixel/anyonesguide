import { useI18n } from '../i18n'
import type { SaveStatus } from '../types'
export function SaveFeedback({ status, onRetry, storageUnavailable = false }: { status?: SaveStatus; onRetry?: () => Promise<void>; storageUnavailable?: boolean }) {
  const { t } = useI18n()
  if (!status || status === 'idle') return null
  return <div className={`save-feedback ${status}`}>
    <span role={status === 'error' ? 'alert' : 'status'}>{t(`save.${status}`)}</span>
    {status === 'error' && onRetry && <button className="text-button" onClick={() => void onRetry().catch(() => {})}>{t('request.retry')}</button>}
    {storageUnavailable && <p role="alert">{t('save.storage')}</p>}
  </div>
}
