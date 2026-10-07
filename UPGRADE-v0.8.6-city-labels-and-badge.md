# v0.8.6: city labels and public badge controls

Complete cumulative source over the undeployed v0.8.5 release. Package and lockfile are 0.8.6. Dependencies, all ten SQL migrations, English/Polish interface copy, screenshot importer and Gemini Function are unchanged. No deployment or hosting/account setting was changed.

## City labels

A shared, exact, country-aware alias table cleans city-shaped administrative names. Greater London in the UK becomes London. The initial table also covers City of Edinburgh, City of Glasgow, Dublin City, Ville de Paris, Hlavní město Praha, Budapest főváros, Miasto stołeczne Warszawa and m.st. Warszawa. Native spelling is retained where it is part of the source alias.

The same labels apply to existing cloud editor/public guides, Your guides/Explore, saved browser shortcuts, old guest drafts and recovery, local guides, new destination choices and initial HTML share metadata. Existing shared slugs and IDs stay unchanged, including /greater-london URLs. Stored cloud rows are not migrated or rewritten. Source coordinates, fallback IDs and provider IDs stay attached to the selected result. The provider’s original city name is carried separately into normal guide creation so display cleanup preserves the previous slug and duplicate-protection behaviour. Author-written guide notes, place notes and invitation city text remain exact.

Aliases do not strip words globally. City of London, Greater Manchester, Greater Sudbury, New York City, Kansas City, Ho Chi Minh City and unknown destinations retain their names. Suburb/county/state results continue to be excluded from city choices. The table fixes known labels; it is not a claim that 100 cities have been checked against the live provider.

## Preferred badge fix

Netlify documents a supported switch, including for Free-plan projects:

1. Open the project in Netlify.
2. Select **Project configuration > General > Powered by Netlify badge**.
3. Choose **Off** and save.

Netlify says this takes effect on the next request without a redeploy. Per-browser Hide only hides it on that browser/domain and can expire on iOS; the project switch removes it for all visitors. We did not access or change that setting.

Official reference: [Powered by Netlify badge](https://docs.netlify.com/manage/projects/powered-by-netlify-badge/).

## If you keep the badge on

The v0.8.5 64px-raised badge anchor could overlap the floating Add place action. It is replaced by a bottom-right, safe-area-aware badge lane. While the observed public iframe `nl-badge-frame` is present, 104px is reserved beneath the app and added to fixed Add place, List/Map, map credits and location-control offsets. Map camera padding also accounts for the lane; late injection/removal updates padding without another fit or zoom. When the frame is absent or dismissed, normal layout returns. The private owner toolbar is untouched.

The badge’s z-index is below primary fixed controls and native modal dialogs. Netlify still owns the iframe’s internal contents, dimensions and promotion popover. The CSS is a fallback for currently observed markup, not a documented positioning API. Keeping the badge off avoids these dependencies and saves mobile screen space.

## Integration and verification

Merge the folder contents into your existing source project, preserving local credentials, Git metadata and project settings. No new SQL, dependencies, auth redirects or environment variables are added by v0.8.6. Since v0.8.5 is still undeployed, use [its server setup](UPGRADE-v0.8.5-screenshot-import.md) for the screenshot Function: server-only GEMINI_API_KEY and RECOMMENDATION_IMPORT_ENABLED=true. Deploy the source project, not only dist.

```sh
npm ci
npm test
npm run build
```

160 automated cases pass. TypeScript/Vite build passes. Main and MapLibre chunk-size warnings remain. Badge cases verify CSS/DOM declarations and conditional activation, not actual browser rectangles, keyboard behaviour or provider popovers. City, Supabase and Gemini networking in automated tests uses fixtures.

## Outstanding acceptance before the larger deployment

1. Open the existing London guide as owner and recipient in EN/PL. It should say London throughout, while its original shared URL and exact notes still work. Check Your guides, Saved Guides, Explore if public, and messaging metadata/cache refresh.
2. Search London/Greater London/qualified London and the listed city aliases with the actual Geoapify key. Confirm the correct place, country and center; verify legitimate names such as City of London and Greater Sudbury remain distinct. Expand the exact table only from observed problematic results.
3. If the badge is switched off, check a fresh browser to confirm it is absent and the original footer/List/Map geometry returns. No extra bottom lane should remain.
4. If kept on, check Android Chrome and iPhone Safari at 320/360/390px, portrait and landscape, short and long pages, first search, import review, keyboard, Add place, guide list/map, credits, location button and open/closed place/profile dialogs. Verify late injection, dismissal and the open promotion popover. Do not treat automated CSS assertions as this acceptance.
5. Complete all live Gemini, provider matching, guest auth/recovery, function routing/rate-limit and sharing checks in the v0.8.5 note. They have not been verified live.

Venue photos are a separate [proposal](docs/venue-photo-proposal.md), not an enabled feature in this release.
