# Anyone’s Guide handover, 9 October 2026, v0.8.10

Current cumulative source is v0.8.10, built on v0.8.9. Package and lockfile agree. A delta patch is supplied for v0.8.9; the integrated archive includes everything. No deployment occurred. See [upgrade/update commands](../UPGRADE-v0.8.10-stable-preview-and-loading.md) and [verification](verification.md).

## Current experience

Main-guide categories filter the list only. Preview always shows all guide places and does not recreate markers or refit the camera on list filtering. Full map inherits the category; filtering there still works. Return restores list/category/note/position/focus and the all-place overview. Credits are inside the preview, clickable against ivory, beside Explore map; measured translated cue width and wrapped credit height reserve camera space. Full-map credits sit at the bottom with safe-area/badge clearance; locate sits above them. Back and title panel share 44px height.

Rows contain venue name, optional author star, exact author note and a reliably identifiable street/house number. Unknown address formats are omitted. No city/postcode/country/distance/subtitle is shown in rows. Full stored addresses and detail/directions behaviour remain unchanged. No data/schema/backfill or extra provider call.

Both screens have one initial coordinated reveal. useInitialReveal limits waiting to 2500ms per screen identity. Guide content remains laid out but hidden/inert until the first fitted map frame or failure; empty guides reveal immediately. A stalled module/map reveals the guide with readable fallback, and late maps may recover without rehiding it. GuideMap lifecycle resets for a different guide ID, including same-city guides. Category changes, map expansion/return and selection never reset the page wait.

First-place content waits for the chosen image to load/decode. One eager asset, fixed random selection, English graphics in EN and PL. Error omits art immediately. Timeout reveals usable search/import and keeps late artwork omitted to avoid layout shifts. Existing first-save, optional note, draft recovery and account/guest/local flows remain. The one-line screenshot link is You can also start with a screenshot / Możesz też zacząć od zrzutu ekranu. The helper beneath the first-place entry is removed; later Add place help and screenshot/pasted-message review remain.

## Decisions and working style

The proposition remains a friend's favourite spots and exact words. Google migration and venue photos remain paused. No generic generated recommendations, ratings, mandatory onboarding, animation or three-place target. Keep optional inputs, clean editorial style and meaningful small changes. Preserve all other latest EN/PL copy and exact author-written text; avoid em dashes in new system copy. Reuse existing tests and add only meaningful cases. Distinguish verified local evidence from outstanding live/mobile checks. Deliver concrete update instructions. Do not deploy or change accounts without authorisation.

Dependencies, ten migrations, server/hosting configuration and shared invitation/sharing copy are unchanged. Existing server-only GEMINI_API_KEY and RECOMMENDATION_IMPORT_ENABLED=true are still required for production import; no new variables or manually created function. Gemini is not assumed live or verified.

## Evidence and remaining acceptance

166 automated tests and production build pass. Six reader and eighteen first-place combinations pass in actual Chromium at 320/390/768px in EN/PL with fixture data, actual MapLibre and intercepted tiles. Six additional delay/failure cases pass, including bounded waits and usable fallbacks. Screenshots were inspected. Known main/MapLibre chunk warnings remain. See verification.md for detail.

Real phones/touch/browser chrome/safe areas/keyboards, live providers/badge, Gemini/OCR, deployed functions/rate limits and live sharing/auth/recovery remain outstanding. No paid API, deployment, live migration or external account change occurred.
