# Anyone’s Guide handover, 9 October 2026, v0.8.13

Current cumulative source is v0.8.13, built on v0.8.12. This release is a delta patch for v0.8.12. The user authorised the assistant to drive reasonable desktop layouts while preserving the mobile focus. No deployment occurred. Package and lockfile agree. See [upgrade](../UPGRADE-v0.8.13-desktop-layouts.md), [one-line update](../UPDATE-v0.8.13.txt) and [verification](verification.md).

## Current desktop decisions

Desktop starts at 1,024px and uses a frame up to 1,140px. The guide's title/note/categories/places form a reading column, with a larger sticky all-pin overview alongside. Full map still has an arrow-only Back and one category strip; the preview and full map reuse one canvas. The editor puts the optional guide note beside one sortable venue column. Desktop Add place occupies the open left area rather than covering venue controls. Home pairs its existing proposition and actions. Collection views use two-column cards, retaining data order and Explore's city grouping. First-place creation places one unchanged approved illustration beside search; selection/import remain constrained single-column forms. Desktop place details are centred dialogs with a bounded scrolling content area and visible action. No extra photos, ratings, provider, font or image was added.

All new styles are scoped to min-width 1,024px. The only markup change groups existing editor categories in one neutral wrapper. No duplicate controls or responsive component remount is introduced. Mobile/tablet visual layouts and copy remain. Browser resize retains note/category state and the map instance. A larger desktop viewport can require more existing raster tiles, but the app does not add a new map or feed.

## Product decisions to preserve

The proposition is a friend's favourite places and exact words. Keep warm, clean editorial design, optional inputs and explicit first Save. Google migration and venue photos remain paused. Do not add generic AI recommendations, ratings, mandatory onboarding, three-place targets or permission screens. Three approved English graphics stay in EN/PL, chosen once per visit. Screenshot link remains You can also start with a screenshot / Możesz też zacząć od zrzutu ekranu. Authors review places before saving, source notes are opt-in and not rewritten. Owner/guest/local recovery and sharing remain.

v0.8.12's one-line reader note, stationary author header, 200ms measured disclosure with reduced-motion support, arrow-only map Back, scrollable categories and unnumbered-street extraction remain. The supplied Gdańsk addresses yield Garncarska, Księdza Jerzego Popiełuszki 5 and Wałowa. No address is mutated, no number invented and no data refresh/backfill is added. Unsupported address formats can remain omitted. The earlier partially loaded map warning is a separate live diagnostic item.

The preview stays unchanged on list filtering. Full map inherits filters and returns note/category/scroll/focus state. Footer remains centred in document flow; full map hides it. Fixed actions clear the visible footer and conditional Netlify badge lane. Credits stay transparent and clickable. Initial visual reveal remains bounded at 2.5 seconds with usable failure recovery, and filtering/navigation do not restart loading.

## Working style, checks and setup

Preserve latest English/Polish dictionary and author text. Avoid em dashes in new system copy. Deliver a patch pack with the one-line update command. Use existing affected tests and meaningful browser checks for presentation changes; distinguish them from the full suite and real-device/live acceptance. Do not deploy or change external accounts without authorisation.

No dependency, migration, environment or hosting change in v0.8.13. The existing server-only GEMINI_API_KEY and RECOMMENDATION_IMPORT_ENABLED=true still enable screenshot extraction. No manually created Netlify function is needed. Gemini/live routing is not assumed verified.

Current verification is in verification.md. Real Android/iOS, Safari/Firefox, actual browser chrome/safe areas/keyboards, live map/search/badge, deployed Gemini/functions/rate limits and auth/sharing/recovery remain outstanding. All ten migrations, server/configuration files, i18n/shared copy, assets and dependency pins are unchanged. Nothing was deployed.
