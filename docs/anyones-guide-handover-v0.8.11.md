# Anyone’s Guide handover, 9 October 2026, v0.8.11

Current source is v0.8.11, based on v0.8.10. Package and lockfile agree. User requested only the delta patch pack. Apply it to v0.8.10 using `UPDATE-v0.8.11.txt`. No deployment occurred. See [upgrade](../UPGRADE-v0.8.11-footer-note-and-addresses.md) and [verification](verification.md).

## Current experience

The footer remains centred in page flow, at the bottom of short pages and after long content, with no old guide-specific selector offset or raised shadow. The footer component measures its position/height and publishes clearance for fixed Map/Add actions only while visible. Resize/scroll/visual-viewport resize and root/footer size changes update the clearance. Full map hides the footer. The existing badge lane reserves space only when the observed public Netlify frame exists; no account setting is changed.

Map attribution is transparent in both views, preserves all links/text and avoids the Explore cue. A light text halo supports contrast. Full map uses an accessible 44px arrow-only Back button, no guide-title pill, then categories. Camera clearance derives from actual toolbar geometry so wrapped labels remain clear of pins.

The personal note is one exact paragraph beneath a stable author/chevron button. Collapsed body shows two lines; expansion happens below the same header. Text clicks do not toggle the card. Native button keyboard operation and disclosure ARIA are present. Map return retains the expanded state, filter, scroll and focus. Another guide starts collapsed.

List filters still affect only the list. The preview always shows all pins without recreating markers or refitting on filters. Full map inherits the filter and can change it. Returning restores the all-place overview. Rows show venue name, star if present, exact author note and identifiable street/house number. Updated extraction accepts common Polish/international numbered formats and city/address variations. New search results retain structured street and house number in the existing subtitle field; full formatted addresses remain unchanged. No backfill or new request/migration. Actual raw addresses for the three missing Gdańsk rows were not supplied, so existing-record live acceptance remains necessary.

Initial visual readiness is still bounded at 2500ms per screen identity. Errors release usable content. List filtering and map navigation never restart the screen loader. Three approved English graphics remain unchanged in both languages, with one stable random choice per creation visit. First-place screenshot link remains You can also start with a screenshot / Możesz też zacząć od zrzutu ekranu. All other latest EN/PL copy and explicit save/review/recovery paths are unchanged.

## Decisions and working style

The proposition is a friend's favourite places and exact words. Google migration and venue photos remain paused. Avoid generic generated recommendations, ratings, mandatory onboarding, animations and three-place targets. Keep optional inputs, clean editorial design and meaningful small changes. Preserve latest EN/PL copy and exact author text. Avoid em dashes in new system copy. Reuse tests; add only meaningful cases. Distinguish verified automated/browser evidence from outstanding live/phone checks. Provide concrete one-line update instructions. Never deploy or change accounts without authorisation.

Dependencies, ten migrations, server/hosting configuration, privacy terms and invitation/sharing copy are unchanged. Existing server-only GEMINI_API_KEY and RECOMMENDATION_IMPORT_ENABLED=true are still needed for production import; no manually created Netlify function or new variable is required. Gemini is not assumed verified.

## Verification

See verification.md for this release's checks and limitations. Remaining acceptance includes real phones, live Geoapify data/tiles and the actual badge, specific old Gdańsk addresses, Gemini/OCR, deployed function routing/rate limits and live auth/sharing/recovery. No paid API, deployment, migration or account mutation occurred.
