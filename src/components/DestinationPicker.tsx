import { useSearch } from '../hooks/useSearch'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { searchDestinations } from '../services/placeSearch'
import { appConfig } from '../config'
import { useI18n } from '../i18n'
import type { DestinationSearchResult } from '../types'

export function DestinationPicker({ initialQuery = '', onPick }: { initialQuery?: string; onPick: (destination: DestinationSearchResult) => void }) {
  const { t } = useI18n()
  const [query, setQuery] = useState(initialQuery)
  const { results, loading, failed } = useSearch(query, appConfig.geoapifyEnabled, searchDestinations)
  return <div className="request-destination">
    <label htmlFor="request-destination">{t('request.chooseCity')}</label>
    <div className="search-box"><Search size={18} /><input id="request-destination" value={query} onChange={event => setQuery(event.target.value)} placeholder={t('creator.searchCity')} autoComplete="off" maxLength={120} /></div>
    {!appConfig.geoapifyEnabled && <p className="status-message error">{t('add.searchNotConfigured')}</p>}
    {failed && <p className="status-message error" role="alert">{t('add.searchUnavailable')}</p>}
    {loading && <p className="search-status">{t('add.searching')}</p>}
    {!loading && !failed && query.trim().length >= 2 && appConfig.geoapifyEnabled && results.length === 0 && <p className="search-status">{t('add.noMatches')}</p>}
    {results.length > 0 && <div className="destination-results">{results.map(result => <button key={result.id} onClick={() => onPick(result)}><strong>{result.city}</strong><span>{result.country}</span></button>)}</div>}
  </div>
}
