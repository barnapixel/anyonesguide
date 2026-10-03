import type { Category, Guide, PlaceSearchResult } from '../types'

export const categories: Category[] = [
  { id: 'eat', label: 'Eat', icon: '🍴', sortOrder: 0 },
  { id: 'coffee', label: 'Coffee', icon: '☕', sortOrder: 1 },
  { id: 'drink', label: 'Drink', icon: '🍺', sortOrder: 2 },
  { id: 'see', label: 'See', icon: '🏛️', sortOrder: 3 },
  { id: 'shop', label: 'Shop', icon: '🛒', sortOrder: 4 },
  { id: 'other', label: 'Other', icon: '•', sortOrder: 5 },
]

export const demoGuide: Guide = {
  id: 'guide-gdansk',
  slug: 'gdansk',
  city: 'Gdańsk',
  country: 'Poland',
  authorName: 'Michael',
  title: "Michael’s Gdańsk",
  intro: "The places I actually go to when I'm home. Mostly food, coffee and drinks, plus a few things worth seeing.",
  guideNote: '',
  center: { lat: 54.3513, lng: 18.6520 },
  categories,
  visibility: 'unlisted',
  isPublished: true,
  updatedAt: new Date().toISOString(),
  places: [
    {
      id: 'mandu', name: 'Mandu', subtitle: 'Pierogi · Śródmieście', address: 'Elżbietańska 4/8, Gdańsk',
      lat: 54.3541, lng: 18.6472, categoryId: 'eat',
      note: "Touristy reputation but genuinely excellent. The queue moves quickly. I'd still go."
    },
    {
      id: 'bar-turystyczny', name: 'Bar Turystyczny', subtitle: 'Polish · Old Town', address: 'Szeroka 8/10, Gdańsk',
      lat: 54.3515, lng: 18.6530, categoryId: 'eat',
      note: 'Proper old-school milk bar. Go for lunch, not atmosphere.'
    },
    {
      id: 'pellowksi', name: 'Pellowski', subtitle: 'Bakery · Śródmieście', address: 'Rajska 10, Gdańsk',
      lat: 54.3557, lng: 18.6494, categoryId: 'eat',
      note: 'Simple, excellent bakery. A local classic.'
    },
    {
      id: 'piwnica-rajcow', name: 'Piwnica Rajców', subtitle: 'Polish · Main Town', address: 'Długi Targ 44, Gdańsk',
      lat: 54.3487, lng: 18.6538, categoryId: 'eat',
      note: 'Good for a relaxed dinner right in the centre without feeling too formal.'
    },
    {
      id: 'drukarnia', name: 'Drukarnia Café', subtitle: 'Café · Old Town', address: 'Mariacka 36, Gdańsk',
      lat: 54.3502, lng: 18.6562, categoryId: 'coffee',
      note: 'My favourite coffee around the centre. The courtyard is great in summer.'
    },
    {
      id: 'leń', name: 'Leń', subtitle: 'Café · Main Town', address: 'Piwna 52/53, Gdańsk',
      lat: 54.3503, lng: 18.6520, categoryId: 'coffee',
      note: 'Tiny, friendly, and ideal for a quick coffee while walking around town.'
    },
    {
      id: 'lawendowa', name: 'Lawendowa 8', subtitle: 'Bar · Old Town', address: 'Lawendowa 8, Gdańsk',
      lat: 54.3528, lng: 18.6515, categoryId: 'drink',
      note: 'One of the easiest places to recommend for a casual beer in the evening.'
    },
    {
      id: '100cznia', name: '100cznia', subtitle: 'Food & drinks · Shipyard', address: 'Ks. Jerzego Popiełuszki 5, Gdańsk',
      lat: 54.3620, lng: 18.6507, categoryId: 'drink',
      note: 'Go on a warm evening. Food stalls, drinks, music and the shipyard all around you.'
    },
    {
      id: 'ecs', name: 'European Solidarity Centre', subtitle: 'Museum · Shipyard', address: 'pl. Solidarności 1, Gdańsk',
      lat: 54.3611, lng: 18.6496, categoryId: 'see',
      note: 'The one museum I would actively make time for. Excellent building and genuinely important history.'
    },
    {
      id: 'mariacka', name: 'Mariacka Street', subtitle: 'Walk · Old Town', address: 'Mariacka, Gdańsk',
      lat: 54.3500, lng: 18.6561, categoryId: 'see',
      note: 'Beautiful early or late in the day when it is quieter. Walk the whole street rather than stopping for a photo.'
    },
    {
      id: 'olivia', name: 'Olivia Star', subtitle: 'View · Oliwa', address: 'al. Grunwaldzka 472C, Gdańsk',
      lat: 54.4031, lng: 18.5765, categoryId: 'see',
      note: 'Worth it for the view if you are already around Oliwa; less essential if you only have a weekend.'
    },
    {
      id: 'forum', name: 'Forum Gdańsk', subtitle: 'Shopping · Śródmieście', address: 'Targ Sienny 7, Gdańsk',
      lat: 54.3499, lng: 18.6428, categoryId: 'shop',
      note: 'Useful rather than romantic. Everything in one place if you need to pick something up.'
    }
  ]
}

export const fallbackSearchResults: PlaceSearchResult[] = [
  { id: 'drukarnia', name: 'Drukarnia Café', subtitle: 'Café · Old Town', address: 'Mariacka 36, Gdańsk', lat: 54.3502, lng: 18.6562, sourceCategory: 'catering.cafe' },
  { id: 'mandu', name: 'Mandu', subtitle: 'Restaurant · Śródmieście', address: 'Elżbietańska 4/8, Gdańsk', lat: 54.3541, lng: 18.6472, sourceCategory: 'catering.restaurant' },
  { id: '100cznia', name: '100cznia', subtitle: 'Food & drinks · Shipyard', address: 'Ks. Jerzego Popiełuszki 5, Gdańsk', lat: 54.3620, lng: 18.6507, sourceCategory: 'catering.bar' },
  { id: 'ecs', name: 'European Solidarity Centre', subtitle: 'Museum · Shipyard', address: 'pl. Solidarności 1, Gdańsk', lat: 54.3611, lng: 18.6496, sourceCategory: 'entertainment.museum' },
  { id: 'lawendowa', name: 'Lawendowa 8', subtitle: 'Bar · Old Town', address: 'Lawendowa 8, Gdańsk', lat: 54.3528, lng: 18.6515, sourceCategory: 'catering.bar' },
  { id: 'piwnica-rajcow', name: 'Piwnica Rajców', subtitle: 'Restaurant · Main Town', address: 'Długi Targ 44, Gdańsk', lat: 54.3487, lng: 18.6538, sourceCategory: 'catering.restaurant' },
  { id: 'olivia', name: 'Olivia Star', subtitle: 'Attraction · Oliwa', address: 'al. Grunwaldzka 472C, Gdańsk', lat: 54.4031, lng: 18.5765, sourceCategory: 'tourism.attraction' }
]
