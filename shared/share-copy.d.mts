type Locale = 'en' | 'pl'
export function guideTitle(authorName: string, city: string, locale?: Locale): string
export function guideDescription(authorName: string, city: string, locale?: Locale, note?: string): string
export function guideShareContent(authorName: string, city: string, locale: Locale, role?: 'owner' | 'reader'): { title: string; text: string }
export function requestShareContent(name: string, city: string, locale: Locale): { title: string; text: string }
export function requestDescription(name: string, city: string, locale: Locale): string
export function guideShareUrl(origin: string, path: string, locale: Locale): string
