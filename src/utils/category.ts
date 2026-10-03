import type { Category, CategoryId } from '../types'

export function guessCategory(sourceCategory?: string, name = ''): CategoryId {
  const raw = `${sourceCategory ?? ''} ${name}`.toLowerCase()
  if (/cafe|coffee|tea|bakery/.test(raw)) return 'coffee'
  if (/bar|pub|wine|beer|nightclub/.test(raw)) return 'drink'
  if (/restaurant|food|catering|fast_food|ice_cream/.test(raw)) return 'eat'
  if (/museum|tourism|attraction|monument|gallery|park|viewpoint|theatre|cinema/.test(raw)) return 'see'
  if (/shop|commercial|retail|market|mall/.test(raw)) return 'shop'
  return 'other'
}


export function editorCategory(categories: Category[], requested?: string, empty = false): CategoryId | 'all' {
  if (requested === 'all' || categories.some(category => category.id === requested)) return requested!
  if (!empty) return 'all'
  return categories.find(category => category.id === 'eat')?.id
    ?? [...categories].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.id ?? 'all'
}

export function categoryPromptKey(category: CategoryId): string {
  const prompts: Record<string, string> = { eat: 'creation.promptEat', coffee: 'creation.promptCoffee', drink: 'creation.promptDrink',
    see: 'creation.promptSee', shop: 'creation.promptShop', stay: 'creation.promptStay' }
  return Object.hasOwn(prompts, category) ? prompts[category] : 'creation.promptOther'
}
