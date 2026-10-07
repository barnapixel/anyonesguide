# Anyone’s Guide handover, 5 October 2026, v0.8.6

Continue from the complete v0.8.6 archive. Boris has not deployed v0.8.5 and wants a larger later deployment. Nothing was deployed during this work. Read [the current upgrade note](../UPGRADE-v0.8.6-city-labels-and-badge.md), [the v0.8.5 handover](anyones-guide-handover-v0.8.5.md) for import behaviour, and the retained v0.8.4 handover for broader decisions. Historical badge anchors and older onboarding guidance are superseded.

## Latest direction

Screenshot/message import remains optional, alongside immediate direct search. Photos are being considered to bring life to existing recommendations. Boris does not expect authors to upload photos at the start. Research is recorded in [the venue-photo proposal](venue-photo-proposal.md). No photo feature was authorised or implemented during this turn. Foursquare is a candidate for a small real-venue pilot, not a proven coverage recommendation. Geoapify/Wikimedia is an alternative with expected landmark strengths. Direct Google Places photos conflict with the current non-Google-map approach under the cited terms. Current Foursquare caching/crediting details still need confirmation for the chosen account.

Keep one person’s recommendations for friends, the editorial design, latest English/Polish copy and author-written words. Avoid cluttered ratings/photo discovery feeds, mandatory extra starting screens and automatic recommendations/stars. No generated venue imagery, rewriting or translation. No em dashes in system copy.

## Implemented fixes

`shared/city-names.mjs` is the country-aware exact display-alias source. Greater London becomes London for the UK, alongside eight other strings for seven other cities. Applied at destination selection and cloud/local/guest/recovery/saved data boundaries plus the Edge preview. Preserve original route slugs, IDs, selected coordinates, notes and free-text invitation context. No SQL migration. Distinct regions, boroughs and unknown names are not broadly stripped or relabelled. Top-100 live provider coverage is not claimed.

Netlify’s current official documentation provides an Off setting under Project configuration > General > Powered by Netlify badge, taking effect without redeployment. We recommend that supported setting, but did not change the external account. The enabled-badge CSS fallback replaces the overlapping v0.8.5 raised anchor with a separate conditional 104px bottom lane. Fixed controls and map framing clear the lane; no public iframe means no extra space. The private owner toolbar is unchanged. A body-child observer updates map padding for late injection/removal and viewport changes without resetting the camera. It relies on observed provider markup and still needs actual phone/browser checks.

## Verified versus outstanding

Package/lockfile 0.8.6. All ten migrations and dependency pins unchanged. 160 automated tests pass with no failures/skips; TypeScript/Vite build passes. Main/MapLibre chunk warnings remain. City read/create/recovery/metadata regressions use actual code with provider/database fixtures. Badge checks cover DOM/CSS declarations and pure map-padding calculations, not rendered browser geometry or the actual injected iframe cascade.

No live Gemini extraction, new live city API query, real venue-photo API call, authenticated hosting action or deployment. No top-100-city live audit. No new browser renderer became available. iOS/Android keyboard, footer/control/badge/popover, live map camera, screenshot/OCR quality, hosted rate limit and messaging/auth/recovery checks remain outstanding. Carry forward all v0.8.5 live acceptance work.

## Working style

Think through product behaviour first. Keep authorised implementation and researched proposals clearly separated. Preserve decisions and latest copy, report meaningful risks plainly, and distinguish local automated evidence from live/device acceptance. Deliver cumulative source with setup notes. Do not deploy, send messages or change an external account without authorisation.
