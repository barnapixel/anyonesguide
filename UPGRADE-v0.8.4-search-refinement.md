# Anyone's Guide v0.8.4: first-place and city-search refinement

Apply this patch on top of your current v0.8.4 inline first-place/editor version. The package version stays 0.8.4. It includes the three screenshot fixes together.

## Apply

Merge the archive contents into the project root, preserving the src/ and tests/ folders. Replace the included existing files and add src/services/destinationSuggestions.ts and the two new test files. Do not replace your .env.local or remove unrelated files. No dependency installation or Supabase migration is required for this patch.

Run npm test and npm run build from the project root.

## Changes

- The selected first-place card has a short Change / Zmień action beside the place name. The accessible label still explains what changes. The main question stays visible; examples disappear after selection. The redundant sentence below Save is removed. Saving feedback remains available to screen readers, and the guest privacy line remains.
- Text-only first-place search suggestions use one full-width column. Names wrap normally and addresses can use two lines. The icon-and-text layout in the normal Add places screen is preserved. Provider attribution stays below the input.
- City suggestions validate coordinates and exclude subdivisions before showing destinations. Duplicate city names, including accent/case variants, collapse into one suggestion. The actual city/town name takes precedence over a parent municipality label. Country labels remain visible.
- Partial names retain up to six distinct suggestions. A complete ambiguous name uses Geoapify forward geocoding to obtain its ranked city matches; country and region qualifiers also use this lookup. There is no city-specific list or browser-location bias. Paris is shown once; Paris, Canada or Paris Canada can select the Canadian namesake. Country qualifiers also accept Polish labels, such as Kanada, when country codes are supplied.
- A second provider request is made only when resolution is needed. The existing debounce and cancellation remain. If optional ranking fails, valid deduplicated autocomplete suggestions remain available; an initial search failure still shows an error. The user always selects a destination explicitly.

Your latest uploaded i18n.tsx remains the copy base, with the previously agreed shorter guide-note questions retained. This patch adds only first.change in EN/PL. Your other custom copy is preserved.

## Validation

131 automated tests pass, including city duplicates, parent municipalities, homonyms, country/region/Polish qualifiers, partial and multiword names, invalid coordinates, failed requests, cancellation, first-save retries and existing recommendation protection. TypeScript and the production build pass. The existing large map-bundle warning remains.

The layout regression test checks the computed grid rules and preservation of the normal icon results. It does not substitute for a real mobile viewport check. Live provider responses and the Android keyboard were not tested in this environment.

On your configured deployment, briefly check Paris, Paris Canada, Paris, Ontario, Gdansk and New York. On mobile, search Brasserie Dubillot, select it, use Change, then select and Save. Confirm the first place opens in the normal editor with All selected and the note intact.

## Included files

src/components/FirstPlace.tsx
src/styles.css
src/i18n.tsx
src/services/placeSearch.ts
src/services/destinationSuggestions.ts
tests/editor-start.test.mjs
tests/destination-search.test.mjs
tests/search-layout.test.mjs
UPGRADE-v0.8.4-search-refinement.md
