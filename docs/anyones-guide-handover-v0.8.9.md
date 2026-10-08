# Anyone’s Guide handover, 8 October 2026, v0.8.9

Continue from the complete cumulative v0.8.9 source built on verified v0.8.8. Package and lockfile are 0.8.9. See [the upgrade and update command](../UPGRADE-v0.8.9-personal-start-and-guide.md) and [verification](verification.md). Nothing has been deployed.

## Current state

The shared FirstPlace screen shows the unchanged question, a randomly chosen illustrated map, unchanged reassurance, direct search and optional screenshot import. All three approved assets are locally hosted in public/illustrations. Artwork is losslessly encoded; source pixel equality was checked. English labels are intentionally reused for Polish. The chosen image stays fixed through search, language changes, selection/Change and import review during the component visit. Artwork and reassurance hide during selection or import review. Existing explicit first save, notes, owner/guest/local stores and recovery remain unchanged.

PublicGuide has a smaller serif title and tighter top spacing, optional exact author note, compact map, categories, quieter existing star legend and recommendations. Total place count is removed; Save guide and category counts remain. Existing title wording and all EN/PL dictionaries remain unchanged. PlaceRow shortens only exact known city/country suffixes with recognised numeric postcodes, falls back safely for unknown address formats, and keeps full stored addresses for PlaceSheet/directions.

GuideMap sets camera padding once before fitBounds. Local MapLibre source confirmed fitBounds adds explicit padding to existing edge padding, which caused the preview to zoom out excessively. Preview still includes all filtered pins, refits after category/container changes, disables gestures and selectable pins, and retains clickable attribution below the image. Same-map expansion, full-map controls, contextual shortcut, note/category/scroll/focus restoration, dialog Escape and conditional badge clearance remain.

## Product and working decisions

The value is a friend's selection, exact words and favourite spots. Keep it encouraging and personal without recreating Google's depth. Google migration and venue photos remain paused proposals. Do not add mandatory onboarding, suggested generic venues, ratings, generated author notes, first-save animation or a three-place completion target. Screenshot/message import stays optional beside search.

Preserve Boris's latest English/Polish interface copy and exact author text. English illustrations in Polish are explicitly approved. Avoid em dashes in new system copy. Make small changes that serve the core proposition, use existing tests and add only meaningful cases. Distinguish local verification from live/mobile acceptance. Deliver cumulative source and concrete update instructions. Do not deploy or change external accounts without authorisation.

Dependencies, all ten migrations, configuration, server handlers and shared invitation/sharing copy are unchanged. No new environment variables are introduced. Production Gemini is not assumed live: it still needs the existing GEMINI_API_KEY and RECOMMENDATION_IMPORT_ENABLED=true in Netlify for the same source deploy. Function source/configuration are included; no manual function creation.

## Verification and next acceptance

164 automated cases pass with no failures or skips, including existing first-save/import/cloud/guest/recovery, reader interaction and disposable database coverage. One table-driven address case was added; existing interaction cases were updated to verify illustration stability and removal of total count. Production compilation passes with retained main/MapLibre size warnings. Six reader and eighteen first-place combinations pass in local Chromium at 320/390/768px in EN/PL, including actual MapLibre with intercepted tiles, all graphics, stable choice, explicit save and return state. Map-chunk failure also passes. Screenshots were inspected. These are simulated desktop viewports and fixture services, not phones or live providers. See verification.md for detail.

Real phones, touch/browser chrome/safe areas/keyboards, live maps/search/provider badge, Gemini/OCR, deployed functions/rate limits and live auth/sharing/recovery remain outstanding. No paid API, deployment, live migration or external account change occurred.
