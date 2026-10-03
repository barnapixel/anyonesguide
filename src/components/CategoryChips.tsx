import { useI18n } from '../i18n'
import type { Category, CategoryId, Place } from '../types'

type Props = {
  active: CategoryId | 'all'
  onChange: (category: CategoryId | 'all') => void
  places: Place[]
  categories: Category[]
  showEmpty?: boolean
}

export function CategoryChips({ active, onChange, places, categories, showEmpty = false }: Props) {
  const { t, categoryLabel } = useI18n()
  const visible = [...categories]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter(category => showEmpty || category.id !== 'other' && places.some(place => place.categoryId === category.id))
  return (
    <div className="chip-row guide-chip-row" data-count={visible.length + 1} style={{ '--chip-count': visible.length + 1 } as CSSProperties} role="group" aria-label={t('guide.categories')}>
      <button className={`chip ${active === 'all' ? 'active' : ''}`} aria-pressed={active === 'all'} onClick={() => onChange('all')}>{t('category.all')}</button>
      {visible.map(category => (
        <button key={category.id} className={`chip ${active === category.id ? 'active' : ''}`} aria-pressed={active === category.id} onClick={() => onChange(category.id)}>
          {categoryLabel(category)}
        </button>
      ))}
    </div>
  )
}
import type { CSSProperties } from 'react'
