// Exact, country-aware display aliases for city-shaped administrative names.
// Do not strip administrative words globally: Greater Sudbury, City of London
// and Greater Manchester are real, distinct destinations. Never change IDs,
// coordinates, route slugs or author-written text here.
const key = value => value.normalize('NFKD').replace(/\p{M}/gu, '').replace(/ł/gi, 'l').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const countries = new Map()
for (const code of ['GB', 'IE', 'FR', 'CZ', 'HU', 'PL']) {
  countries.set(key(code), code)
  for (const locale of ['en', 'pl']) {
    try { countries.set(key(new Intl.DisplayNames([locale], { type: 'region' }).of(code)), code) } catch { /* Country codes remain usable. */ }
  }
}
for (const name of ['UK', 'Great Britain', 'England', 'Scotland', 'GBR']) countries.set(key(name), 'GB')

const aliases = new Map([
  ['GB', 'Greater London', 'London'],
  ['GB', 'City of Edinburgh', 'Edinburgh'],
  ['GB', 'City of Glasgow', 'Glasgow'],
  ['IE', 'Dublin City', 'Dublin'],
  ['FR', 'Ville de Paris', 'Paris'],
  ['CZ', 'Hlavní město Praha', 'Praha'],
  ['HU', 'Budapest főváros', 'Budapest'],
  ['PL', 'Miasto stołeczne Warszawa', 'Warszawa'],
  ['PL', 'm.st. Warszawa', 'Warszawa'],
].map(([country, name, city]) => [`${country}|${key(name)}`, city]))

export function displayCityName(city, country) {
  if (typeof city !== 'string' || typeof country !== 'string') return city
  const code = countries.get(key(country))
  return aliases.get(`${code}|${key(city)}`) || city
}
