import { useCallback, useEffect, useState } from 'react'
import type { Guide, SavedGuide } from '../types'
import { isGuideSaved, listSavedGuides, removeSavedGuide, saveGuide, subscribeSavedGuides } from '../services/savedGuides'

export function useSavedGuides() {
  const [guides, setGuides] = useState<SavedGuide[]>(() => listSavedGuides())

  const refresh = useCallback(() => setGuides(listSavedGuides()), [])

  useEffect(() => subscribeSavedGuides(refresh), [refresh])

  return {
    guides,
    isSaved: (guideId: string) => guides.some(item => item.guideId === guideId),
    save: (guide: Guide) => saveGuide(guide),
    remove: (guideId: string) => removeSavedGuide(guideId),
    toggle: (guide: Guide) => {
      if (isGuideSaved(guide.id)) removeSavedGuide(guide.id)
      else saveGuide(guide)
    },
  }
}
