const illustrations = [
  { file: 'coffee-view-dinner', alt: 'Your go-to coffee. A view you love. That dinner spot.' },
  { file: 'brunch-museum-drinks', alt: 'Your favourite brunch. That quirky museum. Drinks you must try.' },
  { file: 'park-sandwich-show', alt: 'Your go-to park. That sandwich spot. A show worth seeing.' },
] as const

export function FirstPlaceIllustration({ choice }: { choice: number }) {
  const illustration = illustrations[choice]
  return <img className="first-place-illustration" src={`${import.meta.env.BASE_URL}illustrations/${illustration.file}.webp`} alt={illustration.alt} lang="en" width={1881} height={836} decoding="async" />
}
