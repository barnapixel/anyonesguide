export type CategoryId = string
export type GuideVisibility = 'draft' | 'unlisted' | 'public'
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
export type Locale = 'en' | 'pl'

export type Category = {
  id: CategoryId
  label: string
  icon: string
  sortOrder: number
}

export type Place = {
  id: string
  guidePlaceId?: string
  externalId?: string
  provider?: string
  name: string
  subtitle?: string
  address: string
  lat: number
  lng: number
  categoryId: CategoryId
  note: string
  sortOrder?: number
  isStarred?: boolean
}

export type Guide = {
  id: string
  ownerId?: string
  profileSlug?: string
  slug: string
  city: string
  country: string
  authorName: string
  title: string
  intro: string
  guideNote: string
  center: { lat: number; lng: number }
  categories: Category[]
  places: Place[]
  visibility: GuideVisibility
  isPublished: boolean
  updatedAt: string
}

export type GuideSummary = {
  id: string
  slug: string
  city: string
  country: string
  intro: string
  visibility: GuideVisibility
  isPublished: boolean
  placeCount: number
  updatedAt: string
}

export type ExploreGuideSummary = GuideSummary & {
  authorName: string
  profileSlug: string
}

export type SavedGuide = {
  guideId: string
  profileSlug: string
  guideSlug: string
  city: string
  country: string
  authorName: string
  intro: string
  placeCount: number
  savedAt: string
}

export type Profile = {
  id: string
  displayName: string
  slug: string
  onboardingComplete: boolean
}

export type Coordinates = {
  lat: number
  lng: number
}

export type PlaceSearchResult = {
  id: string
  name: string
  subtitle: string
  address: string
  lat: number
  lng: number
  sourceCategory?: string
  provider?: string
}

export type DestinationSearchResult = {
  id: string
  city: string
  // Preserve the provider name for existing slug/duplicate behaviour when the
  // user-facing label is an administrative-name alias.
  sourceCity?: string
  country: string
  lat: number
  lng: number
}
