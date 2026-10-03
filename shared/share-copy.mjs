// The browser and crawler previews use the same deliberately written EN/PL copy.
const clean = value => typeof value === 'string' ? value.trim() : ''
const author = (value, locale) => {
  const name = clean(value)
  return name && name !== 'A local' ? name : locale === 'pl' ? 'Ktoś z okolicy' : 'A local'
}
export function guideTitle(authorName, city, locale = 'en') {
  const name = author(authorName, locale), destination = clean(city)
  return locale === 'pl' ? `${destination}. Poleca ${name}` : `${name}’s Guide to ${destination}`
}
export function guideDescription(authorName, city, locale = 'en', note = '') {
  const excerpt = clean(note)
  if (excerpt) return [...excerpt].slice(0, 180).join('')
  return locale === 'pl'
    ? `${clean(city)}. Miejsca, które poleca ${author(authorName, locale)}.`
    : `Places in ${clean(city)}, recommended by ${author(authorName, locale)}.`
}
export function guideShareContent(authorName, city, locale, role = 'reader') {
  const title = guideTitle(authorName, city, locale)
  const text = role === 'owner'
    ? locale === 'pl'
      ? `${clean(city)}. Tu znajdziesz moje ulubione miejsca. Miłego odkrywania!`
      : `Here are my favourite spots in ${clean(city)}. Enjoy!`
    : locale === 'pl' ? `${title}. Może Ci się przydać!` : `${title}. Thought you might like it!`
  return { title, text }
}
export function requestShareContent(name, city, locale) {
  const person = clean(name).slice(0, 80), destination = clean(city).slice(0, 120)
  const signature = person ? `\n\n${person}` : ''
  return locale === 'pl'
    ? { title: person ? `${person} prosi o Twoje rekomendacje` : 'Podziel się swoimi rekomendacjami', text: `Hej! ${destination ? `Jakie miejsca polecasz? Kierunek: ${destination}.` : 'Jakie miejsca polecasz?'}\nDodaj je tutaj. Dzięki!${signature}` }
    : { title: person ? `${person} is asking for your recommendations` : 'Share your recommendations', text: `Hey! Got any favourite spots${destination ? ` in ${destination}` : ''}?\nAdd them here for me. Thanks!${signature}` }
}
export function requestDescription(name, city, locale) {
  return locale === 'pl'
    ? `${clean(name) ? `${clean(name)} prosi o Twoje rekomendacje.` : 'Podziel się swoimi rekomendacjami.'}${clean(city) ? ` Kierunek: ${clean(city)}.` : ''} Podziel się kilkoma ulubionymi miejscami. Każda wskazówka się przyda!`
    : `${clean(name) ? `${clean(name)} would love your recommendations.` : 'Got a few favourite places to share?'}${clean(city) ? ` Destination: ${clean(city)}.` : ''} Share a few places you love. Every tip helps!`
}
export function guideShareUrl(origin, path, locale) {
  const url = new URL(path, origin)
  if (url.origin !== new URL(origin).origin) throw new Error('Guide links must stay on this site.')
  url.searchParams.set('lang', locale === 'pl' ? 'pl' : 'en')
  return url.href
}
